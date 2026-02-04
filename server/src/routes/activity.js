import express from 'express';
import jwt from 'jsonwebtoken';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../services/storage.js';
import * as schema from '../db/schema.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to get user from token
async function getUserFromToken(req) {
    const token = req.cookies?.auth_token;
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const [user] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, decoded.userId))
            .limit(1);
        return user;
    } catch {
        return null;
    }
}

/**
 * POST /api/activity/track - Track user activity (heartbeat)
 * Increments totalSeconds for the current user and today's date
 */
router.post('/track', async (req, res, next) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return res.status(401).json({ error: { message: 'Not authenticated' } });
        }

        const { seconds = 60 } = req.body; // Default 1 minute
        const today = new Date().toISOString().split('T')[0];

        // Try to find activity record for today
        const [existingActivity] = await db
            .select()
            .from(schema.userActivity)
            .where(and(
                eq(schema.userActivity.userId, user.id),
                eq(schema.userActivity.date, today)
            ))
            .limit(1);

        if (existingActivity) {
            // Update existing record
            await db
                .update(schema.userActivity)
                .set({
                    totalSeconds: existingActivity.totalSeconds + seconds,
                    updatedAt: new Date()
                })
                .where(eq(schema.userActivity.id, existingActivity.id));
        } else {
            // Create new record for today
            await db
                .insert(schema.userActivity)
                .values({
                    userId: user.id,
                    date: today,
                    totalSeconds: seconds
                });
        }

        res.json({ success: true, message: 'Activity tracked' });
    } catch (error) {
        console.error('Track activity error:', error);
        next(error);
    }
});

/**
 * GET /api/activity/stats - Get activity stats for heatmap
 */
router.get('/stats', async (req, res, next) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return res.status(401).json({ error: { message: 'Not authenticated' } });
        }

        // Get all activity records for the user
        const activities = await db
            .select({
                date: schema.userActivity.date,
                totalSeconds: schema.userActivity.totalSeconds
            })
            .from(schema.userActivity)
            .where(eq(schema.userActivity.userId, user.id));

        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('Get activity stats error:', error);
        next(error);
    }
});

export default router;
