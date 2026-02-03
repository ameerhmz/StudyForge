import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to verify JWT token from cookie
 */
export const requireAuth = (req, res, next) => {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({
      error: { message: 'Authentication required' }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    return res.status(401).json({
      error: { message: 'Invalid or expired token' }
    });
  }
};

/**
 * Middleware to check if user is a teacher
 */
export const requireTeacher = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: { message: 'Authentication required' }
    });
  }

  if (req.user.role !== 'teacher') {
    return res.status(403).json({
      error: { message: 'Teacher access required' }
    });
  }

  next();
};

/**
 * Optional auth - adds user to req if authenticated, but doesn't block
 */
export const optionalAuth = (req, res, next) => {
  const token = req.cookies?.auth_token;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Invalid token, but don't block request
    }
  }

  next();
};
