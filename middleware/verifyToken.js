const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If no token, still continue but req.user will be undefined
      // Some routes may not require authentication
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify and decode token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Attach user info to request
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        restaurantId: decoded.restaurantId
      };
      
      next();
    } catch (err) {
      // Invalid token
      return res.status(401).json({ error: 'Invalid Token.' });
    }
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = verifyToken;
