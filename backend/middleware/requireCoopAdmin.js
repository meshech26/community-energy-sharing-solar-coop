const requireCoopAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication is required.' });
  }

  if (req.user.isCoopAdmin !== true) {
    return res.status(403).json({ message: 'Co-op Administrator permission is required.' });
  }

  return next();
};

module.exports = requireCoopAdmin;
