const mongoose = require('mongoose');
const User = require('../models/User');

// Shared authentication middleware with role header support
exports.protect = async (req, res, next) => {
  try {
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
      householdId: user.householdId,
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
exports.admin = (req, res, next) => {
  if (req.user && req.user.isCoopAdmin) {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Not authorized as cooperative admin' });
  }
};
