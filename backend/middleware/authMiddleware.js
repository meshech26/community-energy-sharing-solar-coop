const User = require('../models/User');

// Shared authentication middleware with role header support
exports.protect = async (req, res, next) => {
  try {
    const roleHeader = req.headers['x-user-role'];
    const emailHeader = req.headers['x-user-email'];
    const isAdmin = roleHeader === 'admin' || emailHeader === 'admin@solarcoop.com';

    const targetEmail = isAdmin ? 'admin@solarcoop.com' : (emailHeader || 'user@solarcoop.com');
    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      user = await User.findOne({ isCoopAdmin: isAdmin });
    }
    if (!user) {
      user = await User.findOne();
    }
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found in database. Please run seed script.' });
    }
    
    req.user = {
      id: user._id,
      householdId: user.householdId,
      isCoopAdmin: user.isCoopAdmin,
      email: user.email,
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
