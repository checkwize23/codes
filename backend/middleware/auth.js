import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Middleware to check if user is super admin
export const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

// Middleware to check if user is admin or super admin
export const requireAdmin = (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Middleware to check if user can access specific user data
export const canAccessUser = (req, res, next) => {
  const targetUserId = req.params.userId || req.body.userId;
  
  // Super admin can access any user
  if (req.user.role === 'super_admin') {
    return next();
  }
  
  // Admin can access users but not other admins or super admins
  if (req.user.role === 'admin') {
    // This will be checked in the route handler
    return next();
  }
  
  // Regular users can only access their own data
  if (req.user._id.toString() === targetUserId) {
    return next();
  }
  
  return res.status(403).json({ message: 'Access denied' });
};