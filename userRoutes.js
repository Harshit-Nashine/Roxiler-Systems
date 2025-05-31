const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

// Middleware to verify JWT token for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user; // attach decoded user info to req
    next();
  });
};

// GET all users (protected route example)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Only admin users can list all users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: admin only' });
    }

    const users = await User.findAll({
      attributes: { exclude: ['password'] }, // exclude password hash
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// GET user by id (protected route)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid user ID' });

    // Allow user to get own data or admin to get anyone's data
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// PUT update user info (protected)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid user ID' });

    // Only admin or user himself can update user info
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { name, address, role } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent non-admin from changing roles
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can change role' });
    }

    user.name = name || user.name;
    user.address = address || user.address;
    if (role) user.role = role;

    await user.save();

    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// DELETE user (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete users' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid user ID' });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

module.exports = router;
