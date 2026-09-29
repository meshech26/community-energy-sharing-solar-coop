// Small single-process development limiter. Production multi-instance hosting
// should enforce a shared limit at its reverse proxy as well.
const entries = new Map();
module.exports = (req, res, next) => {
  const now = Date.now();
  for (const [key, entry] of entries) if (entry.until <= now) entries.delete(key);
  const key = req.ip;
  if (!entries.has(key)) {
    if (entries.size >= 10000) return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    entries.set(key, { count: 0, until: now + 15 * 60 * 1000 });
  }
  const entry = entries.get(key);
  if (++entry.count > 30) return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  return next();
};
