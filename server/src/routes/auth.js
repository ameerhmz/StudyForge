import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

// In-memory user store (replace with database later)
const users = new Map();

// Teacher access code (store in .env in production)
const TEACHER_ACCESS_CODE = process.env.TEACHER_ACCESS_CODE || 'TEACH2024';

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * POST /api/auth/signup - Register new user (default: student)
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: { message: 'Email, password, and name are required' }
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: { message: 'Password must be at least 6 characters' }
      });
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(400).json({
        error: { message: 'User with this email already exists' }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: crypto.randomUUID(),
      email,
      name,
      password: hashedPassword,
      role: 'student', // Default role
      createdAt: new Date().toISOString(),
    };

    users.set(email, user);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log(`✅ New user signed up: ${email} (student)`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    next(error);
  }
});

/**
 * POST /api/auth/login - Login user
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'Email and password are required' }
      });
    }

    // Find user
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(`✅ User logged in: ${email} (${user.role})`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

/**
 * POST /api/auth/logout - Logout user
 */
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me - Get current user
 */
router.get('/me', (req, res) => {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({
      error: { message: 'Not authenticated' }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.email);

    if (!user) {
      return res.status(401).json({
        error: { message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(401).json({
      error: { message: 'Invalid or expired token' }
    });
  }
});

/**
 * POST /api/auth/upgrade-to-teacher - Upgrade student to teacher
 */
router.post('/upgrade-to-teacher', async (req, res, next) => {
  try {
    const { code } = req.body;
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({
        error: { message: 'Not authenticated' }
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.email);

    if (!user) {
      return res.status(401).json({
        error: { message: 'User not found' }
      });
    }

    if (user.role === 'teacher') {
      return res.status(400).json({
        error: { message: 'You are already a teacher' }
      });
    }

    // Verify teacher access code
    if (code !== TEACHER_ACCESS_CODE) {
      return res.status(403).json({
        error: { message: 'Invalid teacher access code' }
      });
    }

    // Upgrade to teacher
    user.role = 'teacher';
    user.upgradedAt = new Date().toISOString();

    // Generate new JWT with updated role
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(`🎓 User upgraded to teacher: ${user.email}`);

    res.json({
      success: true,
      message: 'Successfully upgraded to teacher',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    next(error);
  }
});

export default router;
