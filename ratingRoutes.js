const express = require('express');
const router = express.Router();
const Rating = require('../models/rating');
const Store = require('../models/store');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

// Middleware to verify JWT token and set req.user
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// GET all ratings (public)
router.get('/', async (req, res) => {
  try {
    // Include associated User and Store data for better info
    const ratings = await Rating.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Store, attributes: ['id', 'name'] }
      ],
    });
    res.json(ratings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch ratings' });
  }
});

// GET rating by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const rating = await Rating.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'name'] },
        { model: Store, attributes: ['id', 'name'] }
      ],
    });
    if (!rating) return res.status(404).json({ message: 'Rating not found' });
    res.json(rating);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch rating' });
  }
});

// POST create a new rating (authenticated users only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { storeId, score, comment } = req.body;

    // Basic validation
    if (!storeId || !score) {
      return res.status(400).json({ message: 'storeId and score are required' });
    }
    if (score < 1 || score > 5) {
      return res.status(400).json({ message: 'Score must be between 1 and 5' });
    }

    // Optional: Verify store exists
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const newRating = await Rating.create({
      storeId,
      userId: req.user.id,
      score,
      comment: comment || '',
    });

    res.status(201).json(newRating);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create rating' });
  }
});

// PUT update rating by ID (only owner or admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const rating = await Rating.findByPk(req.params.id);
    if (!rating) return res.status(404).json({ message: 'Rating not found' });

    // Only rating owner or admin can update
    if (rating.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this rating' });
    }

    const { score, comment } = req.body;
    if (score !== undefined) {
      if (score < 1 || score > 5) {
        return res.status(400).json({ message: 'Score must be between 1 and 5' });
      }
      rating.score = score;
    }
    if (comment !== undefined) {
      rating.comment = comment;
    }

    await rating.save();
    res.json(rating);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update rating' });
  }
});

// DELETE rating by ID (only owner or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const rating = await Rating.findByPk(req.params.id);
    if (!rating) return res.status(404).json({ message: 'Rating not found' });

    // Only rating owner or admin can delete
    if (rating.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this rating' });
    }

    await rating.destroy();
    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete rating' });
  }
});

module.exports = router;
