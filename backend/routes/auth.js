import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken, requireSuperAdmin, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });

/* ================= REGISTER ================= */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    const byEmail = await User.findOne({ email });
    const byUsername = await User.findOne({ username });
    if (byEmail || byUsername) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ username, email, password, firstName, lastName });
    await user.save();

    const token = generateToken(user.data._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

/* ================= LOGIN ================= */
router.post('/login', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ message: 'Account is deactivated' });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    /* removed this ================= FIXED 2FA LOGIC ================= */
  
    /* ================= END ================= */

    await User.updateById(user._id, { lastLogin: new Date() });

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

/* ================= GOOGLE LOGIN ================= */
router.post('/google', async (req, res) => {
  try {
    const { email, googleId, firstName, lastName, username } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Missing Google credentials' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const newUser = new User({
        email,
        username,
        firstName,
        lastName,
        authProvider: 'google',
        googleId
      });
      await newUser.save();
      user = await User.findById(newUser.data._id);
    } else if (!user.googleId) {
      user = await User.updateById(user._id, {
        googleId,
        authProvider: 'google'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    /* removed this. SAME FIXED 2FA LOGIC */


    user = await User.updateById(user._id, { lastLogin: new Date() });

    const token = generateToken(user._id);

    res.json({
      message: 'Google auth successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

/* ================= PROFILE ================= */
router.get('/profile', authenticateToken, async (req, res) => {
  res.json({ user: req.user.toJSON() });
});

/* ================= GET USERS ================= */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ users: users.map(u => u.toJSON()) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get users' });
  }
});

/* ================= CREATE ADMIN ================= */
router.post('/create-admin', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    const adminUser = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: 'admin'
    });

    await adminUser.save();

    res.status(201).json({
      message: 'Admin created successfully',
      user: adminUser.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create admin' });
  }
});
/* ========= RESET SUPERADMIN PASSWORD ===== 
router.get('/reset-superadmin', async (req, res) => {
  try {
    const user = await User.findOne({ email: 'superadmin@gmail.com' });

    if (!user) {
      return res.status(404).json({ message: 'Superadmin not found' });

    }

    await User.updateById(user._id, {
      password: "NewStrongPassword@123"
    });

    res.json({ message: 'Password reset successful' });
  } catch (err){
    console.error(err);
    res.status(500).json({ message: 'Error resetting password' });
  }
});
*/

/* for creating new superadmin account */
/* ===== CREATE DEFAULT SUPERADMIN ===== */
router.get('/create-default-superadmin', async (req, res) => {
  try {

    // check if already exists
    const existing = await User.findOne({
      email: 'superadmin@checkwize.com'
    });

    if (existing) {
      return res.json({
        message: 'Superadmin already exists'
      });
    }

    // create superadmin
    const user = new User({
      username: 'superadmin',
      email: 'superadmin@checkwize.com',
      password: 'NewStrongPassword@123',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      isActive: true
    });

    await user.save();

    res.json({
      message: 'Default superadmin created successfully'
    });

  } catch (error) {
    console.error('Create superadmin error:', error);

    res.status(500).json({
      message: 'Failed creating superadmin'
    });
  }
});

/* =========== DELETE USER ===========*/
router.delete('/users/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
 try {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if(!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (user.role === 'super_admin'){
  return res.status(403).json({ message: 'cannot delete super admin'})
 }
  await User.findByIdAndDelete(userId);
  res.json({ message: 'User deleted successfully' });
} catch (error) {
  console.error('Delete user error:', error);
  res.status(500).json({ message: 'Failed to delete user' });
 } 
 
});

export default router;
