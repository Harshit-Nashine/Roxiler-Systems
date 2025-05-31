// middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'mysecretkey'; // ✅ Change this to a secure secret in production

// ✅ Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    req.user = user; // 👤 Attaching user payload to request
    next();
  });
}

// ✅ Middleware to allow access only to specific roles
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
};
