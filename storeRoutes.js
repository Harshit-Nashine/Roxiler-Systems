const express = require('express');
const router = express.Router();
const Store = require('../models/store');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

// Middleware to verify JWT and attach user info to req.user
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

// GET all stores (public)
router.get('/', async (req, res) => {
  try {
    const stores = await Store.findAll();
    res.json(stores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch stores' });
  }
});

// GET store by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });
    res.json(store);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch store' });
  }
});

// POST create a new store (only for authenticated storeowner or admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!['storeowner', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create store' });
    }
    const { name, location, description } = req.body;
    if (!name || !location) {
      return res.status(400).json({ message: 'Name and location are required' });
    }

    const newStore = await Store.create({
      name,
      location,
      description,
      userId: req.user.id, // owner of store
    });
    res.status(201).json(newStore);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create store' });
  }
});

// PUT update store by ID (only storeowner of the store or admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });

    // Only store owner or admin can update
    if (store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this store' });
    }

    const { name, location, description } = req.body;
    if (name) store.name = name;
    if (location) store.location = location;
    if (description) store.description = description;

    await store.save();
    res.json(store);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update store' });
  }
});

// DELETE store by ID (only storeowner of the store or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });

    // Only store owner or admin can delete
    if (store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this store' });
    }

    await store.destroy();
    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete store' });
  }
});

module.exports = router;
