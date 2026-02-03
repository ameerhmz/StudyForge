import express from 'express';
import jwt from 'jsonwebtoken';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
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
 * GET /api/analytics/summary - Get overall analytics summary
 */
router.get('/summary', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    // Get subjects count
    const subjectsResult = await db
      .select({ count: sql`count(*)` })
      .from(schema.subjects)
      .where(eq(schema.subjects.userId, user.id));

    // Get completed topics count
    const topicsResult = await db
      .select({ 
        total: sql`count(*)`,
        completed: sql`count(*) filter (where ${schema.topics.status} = 'completed')`
      })
      .from(schema.topics)
      .innerJoin(schema.subjects, eq(schema.topics.subjectId, schema.subjects.id))
      .where(eq(schema.subjects.userId, user.id));

    // Get quiz stats
    const quizResults = await db
      .select({
        count: sql`count(*)`,
        avgScore: sql`avg(${schema.quizResults.percentage})`
      })
      .from(schema.quizResults)
      .where(eq(schema.quizResults.userId, user.id));

    // Get weak topics
    const weakTopicsResult = await db
      .select()
      .from(schema.weakTopics)
      .where(and(
        eq(schema.weakTopics.userId, user.id),
        eq(schema.weakTopics.isResolved, false)
      ))
      .orderBy(desc(schema.weakTopics.incorrectCount))
      .limit(10);

    res.json({
      success: true,
      data: {
        subjectsCount: parseInt(subjectsResult[0]?.count || 0),
        topicsTotal: parseInt(topicsResult[0]?.total || 0),
        topicsCompleted: parseInt(topicsResult[0]?.completed || 0),
        quizzesCompleted: parseInt(quizResults[0]?.count || 0),
        averageScore: Math.round(parseFloat(quizResults[0]?.avgScore || 0)),
        weakTopicsCount: weakTopicsResult.length,
        weakTopics: weakTopicsResult.map(t => ({
          id: t.id,
          topicName: t.topicName,
          subjectId: t.subjectId,
          incorrectCount: t.incorrectCount,
          lastIncorrect: t.lastIncorrect
        }))
      }
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    next(error);
  }
});

/**
 * GET /api/analytics/quiz-history - Get quiz performance history
 */
router.get('/quiz-history', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const limit = parseInt(req.query.limit) || 20;

    const results = await db
      .select({
        id: schema.quizResults.id,
        score: schema.quizResults.score,
        total: schema.quizResults.totalQuestions,
        percentage: schema.quizResults.percentage,
        timeTaken: schema.quizResults.timeTaken,
        createdAt: schema.quizResults.createdAt,
        quizTitle: schema.quizzes.title,
        subjectId: schema.quizzes.subjectId,
        subjectName: schema.subjects.name
      })
      .from(schema.quizResults)
      .innerJoin(schema.quizzes, eq(schema.quizResults.quizId, schema.quizzes.id))
      .leftJoin(schema.subjects, eq(schema.quizzes.subjectId, schema.subjects.id))
      .where(eq(schema.quizResults.userId, user.id))
      .orderBy(desc(schema.quizResults.createdAt))
      .limit(limit);

    res.json({
      success: true,
      data: results.map(r => ({
        ...r,
        date: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Quiz history error:', error);
    next(error);
  }
});

/**
 * GET /api/analytics/subject-progress - Get progress by subject
 */
router.get('/subject-progress', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const subjects = await db
      .select({
        id: schema.subjects.id,
        name: schema.subjects.name,
        icon: schema.subjects.icon,
        totalTopics: schema.subjects.totalTopics,
        completedTopics: schema.subjects.completedTopics
      })
      .from(schema.subjects)
      .where(eq(schema.subjects.userId, user.id));

    // Get topic counts per subject
    const progress = await Promise.all(subjects.map(async (subject) => {
      const topicStats = await db
        .select({
          total: sql`count(*)`,
          completed: sql`count(*) filter (where ${schema.topics.status} = 'completed')`
        })
        .from(schema.topics)
        .where(eq(schema.topics.subjectId, subject.id));

      // Get quiz average for this subject
      const quizStats = await db
        .select({
          avgScore: sql`avg(${schema.quizResults.percentage})`
        })
        .from(schema.quizResults)
        .innerJoin(schema.quizzes, eq(schema.quizResults.quizId, schema.quizzes.id))
        .where(eq(schema.quizzes.subjectId, subject.id));

      return {
        id: subject.id,
        name: subject.name,
        icon: subject.icon || '📚',
        totalTopics: parseInt(topicStats[0]?.total || subject.totalTopics || 0),
        completedTopics: parseInt(topicStats[0]?.completed || subject.completedTopics || 0),
        averageQuizScore: Math.round(parseFloat(quizStats[0]?.avgScore || 0)),
        percentage: topicStats[0]?.total > 0 
          ? Math.round((parseInt(topicStats[0]?.completed || 0) / parseInt(topicStats[0]?.total)) * 100)
          : 0
      };
    }));

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Subject progress error:', error);
    next(error);
  }
});

/**
 * POST /api/analytics/weak-topic - Record a weak topic
 */
router.post('/weak-topic', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const { subjectId, topicId, topicName } = req.body;

    if (!subjectId || !topicName) {
      return res.status(400).json({ error: { message: 'Subject ID and topic name are required' } });
    }

    // Check if weak topic already exists
    const existing = await db
      .select()
      .from(schema.weakTopics)
      .where(and(
        eq(schema.weakTopics.userId, user.id),
        eq(schema.weakTopics.subjectId, subjectId),
        eq(schema.weakTopics.topicName, topicName)
      ))
      .limit(1);

    let result;
    if (existing.length > 0) {
      // Increment count
      [result] = await db
        .update(schema.weakTopics)
        .set({
          incorrectCount: sql`${schema.weakTopics.incorrectCount} + 1`,
          lastIncorrect: new Date(),
          isResolved: false
        })
        .where(eq(schema.weakTopics.id, existing[0].id))
        .returning();
    } else {
      // Create new weak topic
      [result] = await db
        .insert(schema.weakTopics)
        .values({
          userId: user.id,
          subjectId,
          topicId,
          topicName,
          incorrectCount: 1,
          lastIncorrect: new Date()
        })
        .returning();
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Record weak topic error:', error);
    next(error);
  }
});

/**
 * POST /api/analytics/weak-topic/:id/resolve - Mark a weak topic as resolved
 */
router.post('/weak-topic/:id/resolve', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const [result] = await db
      .update(schema.weakTopics)
      .set({ isResolved: true })
      .where(and(
        eq(schema.weakTopics.id, req.params.id),
        eq(schema.weakTopics.userId, user.id)
      ))
      .returning();

    if (!result) {
      return res.status(404).json({ error: { message: 'Weak topic not found' } });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Resolve weak topic error:', error);
    next(error);
  }
});

/**
 * GET /api/analytics/study-sessions - Get recent study sessions
 */
router.get('/study-sessions', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await db
      .select({
        id: schema.studySessions.id,
        activityType: schema.studySessions.activityType,
        durationMinutes: schema.studySessions.durationMinutes,
        startedAt: schema.studySessions.startedAt,
        subjectName: schema.subjects.name
      })
      .from(schema.studySessions)
      .leftJoin(schema.subjects, eq(schema.studySessions.subjectId, schema.subjects.id))
      .where(and(
        eq(schema.studySessions.userId, user.id),
        gte(schema.studySessions.startedAt, startDate)
      ))
      .orderBy(desc(schema.studySessions.startedAt));

    // Group by day
    const byDay = {};
    sessions.forEach(session => {
      const day = new Date(session.startedAt).toLocaleDateString('en-US', { weekday: 'short' });
      if (!byDay[day]) byDay[day] = { activities: 0, minutes: 0 };
      byDay[day].activities += 1;
      byDay[day].minutes += session.durationMinutes || 0;
    });

    res.json({
      success: true,
      data: {
        sessions,
        byDay
      }
    });
  } catch (error) {
    console.error('Study sessions error:', error);
    next(error);
  }
});

export default router;
