// API Key authentication middleware
export const authenticateApiKey = (req, res, next) => {
  const providedKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY;

  if (!providedKey) {
    return res.status(401).json({
      error: { message: 'API key required', code: 'MISSING_API_KEY' }
    });
  }

  if (providedKey !== validKey) {
    return res.status(401).json({
      error: { message: 'Invalid API key', code: 'INVALID_API_KEY' }
    });
  }

  next();
};

// Optional: Rate limiting for authenticated requests
export const authenticatedLimiter = (req, res, next) => {
  // Higher limits for authenticated requests
  const authenticatedLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit authenticated requests to 1000 per windowMs
    message: 'Too many authenticated requests, please try again later.'
  });
  authenticatedLimiter(req, res, next);
};