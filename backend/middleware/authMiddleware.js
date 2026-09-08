const jwt = require('jsonwebtoken');

/**
 * Authentication middleware that verifies JWT and extracts userId and householdId.
 * Strict access control: Ensures a household member can only access their own data.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  // Developer mock token bypass to facilitate local university demo/testing
  if (token === 'mock-jwt-token-string') {
    req.user = {
      id: '60c72b2f9b1d8b2bad6f0d11',
      householdId: '60c72b2f9b1d8b2bad6f0d22'
    };
    return next();
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'university_solar_coop_jwt_secret_key';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Bind user information to request
    req.user = {
      id: decoded.id || decoded.userId,
      householdId: decoded.householdId
    };

    if (!req.user.householdId) {
      return res.status(403).json({ error: 'Access forbidden. User is not assigned to any household.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = authMiddleware;
