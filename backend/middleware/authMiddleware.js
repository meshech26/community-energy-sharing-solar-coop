const jwt = require('jsonwebtoken');

const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication token is required.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: 'Authentication is not configured.' });
    }

    const token = authorization.slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'The authenticated user no longer exists.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication token has expired.' });
    }

    return res.status(401).json({ message: 'Authentication token is invalid.' });
  }
};

module.exports = requireAuth;
