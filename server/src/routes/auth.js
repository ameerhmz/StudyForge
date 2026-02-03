import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { eq, or } from 'drizzle-orm';
import { db } from '../services/storage.js';
import * as schema from '../db/schema.js';

const router = express.Router();

// Teacher access code (store in .env in production)
const TEACHER_ACCESS_CODE = process.env.TEACHER_ACCESS_CODE || 'TEACH2024';

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Google OAuth client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Helper to generate JWT and set cookie
function generateTokenAndSetCookie(res, user) {
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

  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  return token;
}

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

    // Check if user already exists in database
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({
        error: { message: 'User with this email already exists' }
      });
    }

    // Hash password with salt rounds 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const [newUser] = await db
      .insert(schema.users)
      .values({
        email: normalizedEmail,
        name: name.trim(),
        password: hashedPassword,
        authProvider: 'email',
        role: 'student',
        lastLogin: new Date(),
      })
      .returning();

    // Generate JWT and set cookie
    generateTokenAndSetCookie(res, newUser);

    console.log(`✅ New user signed up: ${normalizedEmail} (student)`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt,
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

    console.log(`🔍 Login attempt for: ${normalizedEmail}`);

    // Find user in database
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      console.log(`❌ User not found: ${normalizedEmail}`);
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    // Check if this is a Google-only account (no password)
    if (!user.password && user.authProvider === 'google') {
      return res.status(401).json({
        error: { message: 'This account uses Google Sign-In. Please use "Continue with Google" instead.' }
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    // Update last login
    await db
      .update(schema.users)
      .set({ lastLogin: new Date() })
      .where(eq(schema.users.id, user.id));

    // Generate JWT and set cookie
    generateTokenAndSetCookie(res, user);

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
          avatarUrl: user.avatarUrl,
          lastLogin: new Date().toISOString(),
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
router.get('/me', async (req, res) => {
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

    // Get user from database
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, decoded.userId))
      .limit(1);

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

    // Get user from database
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, decoded.userId))
      .limit(1);

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

    // Upgrade to teacher in database
    const [updatedUser] = await db
      .update(schema.users)
      .set({ 
        role: 'teacher',
        upgradedAt: new Date()
      })
      .where(eq(schema.users.id, user.id))
      .returning();

    // Generate new JWT with updated role
    const newToken = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(`🎓 User upgraded to teacher: ${updatedUser.email}`);

    res.json({
      success: true,
      message: 'Successfully upgraded to teacher',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        },
      },
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    next(error);
  }
});

/**
 * POST /api/auth/google - Google OAuth login/signup
 */
router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        error: { message: 'Google credential is required' }
      });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        error: { message: 'Google OAuth not configured on server' }
      });
    }

    // Verify the Google token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError);
      return res.status(401).json({
        error: { message: 'Invalid Google credential' }
      });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        error: { message: 'Email not provided by Google' }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists (by googleId or email)
    let [existingUser] = await db
      .select()
      .from(schema.users)
      .where(or(
        eq(schema.users.googleId, googleId),
        eq(schema.users.email, normalizedEmail)
      ))
      .limit(1);

    let user;
    let isNewUser = false;

    if (existingUser) {
      // User exists - update last login and possibly link Google ID
      const updateData = { lastLogin: new Date() };
      
      // If user signed up with email but now logging in with Google, link accounts
      if (!existingUser.googleId && existingUser.authProvider === 'email') {
        updateData.googleId = googleId;
        updateData.authProvider = 'google'; // Now they can use either
        if (picture && !existingUser.avatarUrl) {
          updateData.avatarUrl = picture;
        }
        console.log(`🔗 Linked Google account to existing user: ${normalizedEmail}`);
      }

      [user] = await db
        .update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, existingUser.id))
        .returning();
    } else {
      // Create new user with Google
      isNewUser = true;
      [user] = await db
        .insert(schema.users)
        .values({
          email: normalizedEmail,
          name: name || email.split('@')[0],
          googleId,
          authProvider: 'google',
          avatarUrl: picture,
          role: 'student',
          lastLogin: new Date(),
        })
        .returning();
      
      console.log(`✅ New Google user signed up: ${normalizedEmail}`);
    }

    // Generate JWT and set cookie
    generateTokenAndSetCookie(res, user);

    console.log(`✅ Google auth successful: ${user.email} (${user.role})`);

    res.json({
      success: true,
      message: isNewUser ? 'Account created with Google' : 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          authProvider: user.authProvider,
          createdAt: user.createdAt,
        },
        isNewUser,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    next(error);
  }
});

export default router;
