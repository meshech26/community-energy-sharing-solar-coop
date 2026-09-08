/**
 * Centralized Express Error Handling Middleware
 */
const errorMiddleware = (err, req, res, next) => {
  console.error(`[SERVER ERROR]`, err);

  // Mongoose Validation Error (e.g. limit is negative or percentage > 100)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  // Mongoose Cast Error (e.g. invalid ObjectId format for householdId or alertId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }

  // Custom HTTP status code if set, otherwise default to 500
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorMiddleware;
