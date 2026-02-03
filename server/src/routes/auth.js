import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// File path for persistent user storage
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// In-memory user store (synced with file)
const users = new Map();

// Load users from file on startup
async function loadUsers() {
  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
    
    // Try to read existing users file
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    const usersArray = JSON.parse(data);
    
    // Populate Map
    usersArray.forEach(user => {
      users.set(user.email, user);
    });
    
    console.log(`✅ Loaded ${users.size} users from storage`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📝 No existing users file, starting fresh');
    } else {
      console.error('⚠️ Error loading users:', error.message);
    }
  }
}

// Save users to file
async function saveUsers() {
  try {
    const usersArray = Array.from(users.values());
    await fs.writeFile(USERS_FILE, JSON.stringify(usersArray, null, 2));
    console.log(`💾 Saved ${users.size} users to storage`);
  } catch (error) {
    console.error('⚠️ Error saving users:', error.message);
  }
}

// Initialize users on module load
loadUsers();

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: { message: 'Invalid email format' }
      });
    }

    // Validate name length
    if (name.trim().length < 2) {
      return res.status(400).json({
        error: { message: 'Name must be at least 2 characters' }
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: { message: 'Password must be at least 6 characters' }
      });
    }

    // Check if user already exists (case-insensitive email)
    const normalizedEmail = email.toLowerCase().trim();
    if (users.has(normalizedEmail)) {
      return res.status(400).json({
        error: { message: 'User with this email already exists' }
      });
    }

    // Hash password with salt rounds 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      name: name.trim(),
      password: hashedPassword,
      role: 'student', // Default role
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    users.set(normalizedEmail, user);

    // Save to persistent storage
    await saveUsers();

    // Generate JWT with appropriate expiry
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie with security flags
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    console.log(`✅ New user signed up: ${normalizedEmail} (student)`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
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

    // Normalize email for lookup
    const normalizedEmail = email.toLowerCase().trim();

    // DEBUG: Log current users in memory
    console.log(`🔍 Login attempt for: ${normalizedEmail}`);
    console.log(`📊 Total users in memory: ${users.size}`);
    console.log(`👥 Registered emails:`, Array.from(users.keys()));

    // Find user
    const user = users.get(normalizedEmail);
    if (!user) {
      console.log(`❌ User not found: ${normalizedEmail}`);
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
    
    // Save updated user data
    await saveUsers();

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    console.log(`✅ User logged in: ${normalizedEmail} (${user.role})`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          lastLogin: user.lastLogin,
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
    
    // Check token expiry
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({
        error: { message: 'Token expired' }
      });
    }

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
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { message: 'Token expired, please login again' }
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: { message: 'Invalid token' }
      });
    }

    res.status(401).json({
      error: { message: 'Authentication failed' }
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
    
    // Save updated user data
    await saveUsers();

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
