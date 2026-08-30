const User = require('../models/User');

// Shared JWT authentication middleware
exports.protect = async (req, res, next) => {
  try {
    // For prototyping, bypass JWT and grab a real user from DB
    const dummyUser = await User.findOne({ email: 'user@solarcoop.com' });
    if (!dummyUser) {
      return res.status(401).json({ success: false, error: 'Dummy user not found. Please run seed script.' });
    }
    
    req.user = {
      id: dummyUser._id,
      householdId: dummyUser.householdId,
      isCoopAdmin: dummyUser.isCoopAdmin
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

// Admin middleware
exports.admin = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Not authorized as admin' });
  }
};
