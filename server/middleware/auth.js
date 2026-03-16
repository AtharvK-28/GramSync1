/**
 * GramSync — Auth Middleware
 * JWT verification for protected routes.
 * In DEMO_MODE, accepts any token.
 */

const jwt = require('jsonwebtoken');

const DEMO_MODE  = process.env.DEMO_MODE === 'true';
const JWT_SECRET = process.env.JWT_SECRET || 'gramsync_dev_secret';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];

  if (DEMO_MODE) {
    // In demo mode, accept any token and set a mock merchant
    req.merchant = {
      id:    'merchant_demo_001',
      phone: '0000000000',
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.merchant = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;