const jwt = require('jsonwebtoken');

// Shared JWT authentication middleware
exports.protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    // Usually verified with a shared secret
    // For this context, we assume token has { userId, householdId, role }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // Attach to request
    req.user = {
      id: decoded.userId,
      householdId: decoded.householdId,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

// Admin middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'COOP_ADMIN') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Not authorized as admin' });
  }
};
