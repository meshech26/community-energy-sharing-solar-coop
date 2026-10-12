const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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

// Shared authentication middleware with role header support
const protect = async (req, res, next) => {
  try {
    // If authorization bearer token is present, allow JWT auth
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') && process.env.JWT_SECRET) {
      try {
        const token = req.headers.authorization.slice(7).trim();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (user) {
          req.user = {
            id: user._id,
            householdId: user.householdId || user.household,
            isCoopAdmin: user.isCoopAdmin,
            email: user.email,
            name: user.name,
          };
          return next();
        }
      } catch (e) {
        // Fallback to role header check below
      }
    }

    const roleHeader = req.headers['x-user-role'];
    const emailHeader = req.headers['x-user-email'];
    const nameHeader = req.headers['x-user-name'];
    const isAdmin = roleHeader === 'admin' || emailHeader === 'admin@solarcoop.com';

    const targetEmail = isAdmin ? 'admin@solarcoop.com' : (emailHeader || 'user@solarcoop.com');
    let user = await User.findOne({ email: targetEmail });
    
    // If not found and a specific email was provided, auto-create the member
    if (!user && targetEmail && targetEmail !== 'user@solarcoop.com') {
      const defaultName = isAdmin ? 'Co-op Admin' : (nameHeader || targetEmail.split('@')[0]);
      user = await User.create({
        name: defaultName,
        email: targetEmail,
        password: 'password123',
        isCoopAdmin: isAdmin,
        householdId: new mongoose.Types.ObjectId()
      });
    }

    if (!user) {
      user = await User.findOne({ isCoopAdmin: isAdmin });
    }
    if (!user) {
      user = await User.findOne();
    }
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found in database. Please run seed script.' });
    }

    // Sync member name if requested or replace legacy 'Regular User'
    if (nameHeader && user.name !== nameHeader) {
      user.name = nameHeader;
      await user.save();
    } else if (user.name === 'Regular User') {
      user.name = 'Kavindi Perera';
      await user.save();
    }
    
    req.user = {
      id: user._id,
      householdId: user.householdId || user.household,
      isCoopAdmin: user.isCoopAdmin,
      email: user.email,
      name: user.name,
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.isCoopAdmin) {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Not authorized as cooperative admin' });
  }
};

requireAuth.protect = protect;
requireAuth.admin = admin;
requireAuth.requireAuth = requireAuth;

module.exports = requireAuth;
