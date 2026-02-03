import express from 'express';
import jwt from 'jsonwebtoken';
import { eq, and, desc } from 'drizzle-orm';
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
 * GET /api/subjects - Get all subjects for current user
 */
router.get('/', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const userSubjects = await db
      .select()
      .from(schema.subjects)
      .where(eq(schema.subjects.userId, user.id))
      .orderBy(desc(schema.subjects.createdAt));

    // Format subjects for frontend
    const formattedSubjects = userSubjects.map(subject => {
      // Extract topics from syllabusData if available
      let topics = [];
      if (subject.syllabusData?.units) {
        subject.syllabusData.units.forEach((unit, unitIndex) => {
          (unit.topics || []).forEach((topic, topicIndex) => {
            topics.push({
              id: `${subject.id}-${unitIndex}-${topicIndex}`,
              name: topic.title || topic.name || topic,
              title: topic.title || topic.name || topic,
              description: topic.description || '',
              difficulty: topic.difficulty || 'medium',
              status: 'not_started',
            });
          });
        });
      }

      return {
        ...subject,
        emoji: subject.icon || '📚',
        gradient: 'from-blue-500 to-blue-600',
        content: subject.description,
        topics,
      };
    });

    res.json({
      success: true,
      data: formattedSubjects,
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    next(error);
  }
});

/**
 * GET /api/subjects/:id - Get a single subject with details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const [subject] = await db
      .select()
      .from(schema.subjects)
      .where(and(
        eq(schema.subjects.id, req.params.id),
        eq(schema.subjects.userId, user.id)
      ))
      .limit(1);

    if (!subject) {
      return res.status(404).json({ error: { message: 'Subject not found' } });
    }

    // Get topics for this subject
    const subjectTopics = await db
      .select()
      .from(schema.topics)
      .where(eq(schema.topics.subjectId, subject.id))
      .orderBy(schema.topics.unitIndex, schema.topics.topicIndex);

    // Transform topics to match frontend format
    const formattedTopics = subjectTopics.map(t => ({
      id: t.id,
      name: t.title,
      title: t.title,
      description: t.description,
      difficulty: t.difficulty,
      status: t.status,
      estimatedMinutes: t.estimatedMinutes,
      unitIndex: t.unitIndex,
      topicIndex: t.topicIndex,
      completedAt: t.completedAt,
      createdAt: t.createdAt,
    }));

    // Get quizzes for this subject
    const subjectQuizzes = await db
      .select()
      .from(schema.quizzes)
      .where(eq(schema.quizzes.subjectId, subject.id))
      .orderBy(desc(schema.quizzes.createdAt));

    // Get flashcard decks for this subject
    const subjectFlashcardDecks = await db
      .select()
      .from(schema.flashcardDecks)
      .where(eq(schema.flashcardDecks.subjectId, subject.id))
      .orderBy(desc(schema.flashcardDecks.createdAt));

    // Also include topics from syllabusData if no topics in database
    let topics = formattedTopics;
    if (topics.length === 0 && subject.syllabusData?.units) {
      topics = [];
      subject.syllabusData.units.forEach((unit, unitIndex) => {
        (unit.topics || []).forEach((topic, topicIndex) => {
          topics.push({
            id: `${subject.id}-${unitIndex}-${topicIndex}`,
            name: topic.title || topic.name || topic,
            title: topic.title || topic.name || topic,
            description: topic.description || '',
            difficulty: topic.difficulty || 'medium',
            status: 'not_started',
            unitIndex,
            topicIndex,
          });
        });
      });
    }

    res.json({
      success: true,
      data: {
        ...subject,
        emoji: subject.icon,
        gradient: `from-blue-500 to-blue-600`, // Default gradient
        topics,
        quizzes: subjectQuizzes,
        flashcardDecks: subjectFlashcardDecks,
      },
    });
  } catch (error) {
    console.error('Get subject error:', error);
    next(error);
  }
});

/**
 * POST /api/subjects - Create a new subject
 */
router.post('/', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const { name, description, color, icon, documentId, syllabusData } = req.body;

    if (!name) {
      return res.status(400).json({ error: { message: 'Subject name is required' } });
    }

    // Count total topics from syllabus if provided
    let totalTopics = 0;
    if (syllabusData?.units) {
      syllabusData.units.forEach(unit => {
        totalTopics += unit.topics?.length || 0;
      });
    }

    const [newSubject] = await db
      .insert(schema.subjects)
      .values({
        userId: user.id,
        name,
        description,
        color: color || '#3B82F6',
        icon: icon || '📚',
        documentId,
        syllabusData,
        totalTopics,
        completedTopics: 0,
      })
      .returning();

    // If syllabus data provided, create topics
    if (syllabusData?.units) {
      const topicsToInsert = [];
      syllabusData.units.forEach((unit, unitIndex) => {
        (unit.topics || []).forEach((topic, topicIndex) => {
          topicsToInsert.push({
            subjectId: newSubject.id,
            unitIndex,
            topicIndex,
            title: topic.title || topic.name || topic,
            description: topic.description || '',
            difficulty: topic.difficulty || 'medium',
            estimatedMinutes: topic.estimatedMinutes || 30,
            status: 'not_started',
          });
        });
      });

      if (topicsToInsert.length > 0) {
        await db.insert(schema.topics).values(topicsToInsert);
      }
    }

    console.log(`📚 New subject created: ${name} for user ${user.email}`);

    res.status(201).json({
      success: true,
      data: newSubject,
    });
  } catch (error) {
    console.error('Create subject error:', error);
    next(error);
  }
});

/**
 * PATCH /api/subjects/:id - Update a subject
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const { name, description, color, icon, completedTopics } = req.body;

    // Verify ownership
    const [existingSubject] = await db
      .select()
      .from(schema.subjects)
      .where(and(
        eq(schema.subjects.id, req.params.id),
        eq(schema.subjects.userId, user.id)
      ))
      .limit(1);

    if (!existingSubject) {
      return res.status(404).json({ error: { message: 'Subject not found' } });
    }

    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (completedTopics !== undefined) updateData.completedTopics = completedTopics;

    const [updatedSubject] = await db
      .update(schema.subjects)
      .set(updateData)
      .where(eq(schema.subjects.id, req.params.id))
      .returning();

    res.json({
      success: true,
      data: updatedSubject,
    });
  } catch (error) {
    console.error('Update subject error:', error);
    next(error);
  }
});

/**
 * DELETE /api/subjects/:id - Delete a subject
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    // Verify ownership
    const [existingSubject] = await db
      .select()
      .from(schema.subjects)
      .where(and(
        eq(schema.subjects.id, req.params.id),
        eq(schema.subjects.userId, user.id)
      ))
      .limit(1);

    if (!existingSubject) {
      return res.status(404).json({ error: { message: 'Subject not found' } });
    }

    await db
      .delete(schema.subjects)
      .where(eq(schema.subjects.id, req.params.id));

    console.log(`🗑️ Subject deleted: ${existingSubject.name}`);

    res.json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    next(error);
  }
});

/**
 * PATCH /api/subjects/:subjectId/topics/:topicId - Update topic status
 * Supports both UUID topic IDs and synthetic IDs (subjectId-unitIndex-topicIndex)
 */
router.patch('/:subjectId/topics/:topicId', async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const { status } = req.body;
    const { subjectId, topicId } = req.params;

    // Verify subject ownership
    const [subject] = await db
      .select()
      .from(schema.subjects)
      .where(and(
        eq(schema.subjects.id, subjectId),
        eq(schema.subjects.userId, user.id)
      ))
      .limit(1);

    if (!subject) {
      return res.status(404).json({ error: { message: 'Subject not found' } });
    }

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    let updatedTopic = null;

    // Check if topicId is a synthetic ID (format: subjectId-unitIndex-topicIndex)
    const syntheticIdMatch = topicId.match(/^(.+)-(\d+)-(\d+)$/);
    
    if (syntheticIdMatch) {
      // It's a synthetic ID - try to find topic by unitIndex and topicIndex
      const unitIndex = parseInt(syntheticIdMatch[2], 10);
      const topicIndex = parseInt(syntheticIdMatch[3], 10);

      // First, try to find existing topic in database
      const [existingTopic] = await db
        .select()
        .from(schema.topics)
        .where(and(
          eq(schema.topics.subjectId, subjectId),
          eq(schema.topics.unitIndex, unitIndex),
          eq(schema.topics.topicIndex, topicIndex)
        ))
        .limit(1);

      if (existingTopic) {
        // Update existing topic
        [updatedTopic] = await db
          .update(schema.topics)
          .set(updateData)
          .where(eq(schema.topics.id, existingTopic.id))
          .returning();
      } else {
        // Topic doesn't exist in DB - create it from syllabusData
        if (subject.syllabusData?.units?.[unitIndex]?.topics?.[topicIndex]) {
          const topicData = subject.syllabusData.units[unitIndex].topics[topicIndex];
          [updatedTopic] = await db
            .insert(schema.topics)
            .values({
              subjectId,
              unitIndex,
              topicIndex,
              title: topicData.title || topicData.name || topicData,
              description: topicData.description || '',
              difficulty: topicData.difficulty || 'medium',
              estimatedMinutes: topicData.estimatedMinutes || 30,
              ...updateData,
            })
            .returning();
        }
      }
    } else {
      // It's a UUID - try direct lookup
      [updatedTopic] = await db
        .update(schema.topics)
        .set(updateData)
        .where(and(
          eq(schema.topics.id, topicId),
          eq(schema.topics.subjectId, subjectId)
        ))
        .returning();
    }

    if (!updatedTopic) {
      return res.status(404).json({ error: { message: 'Topic not found' } });
    }

    // Update completed topics count
    const completedCount = await db
      .select()
      .from(schema.topics)
      .where(and(
        eq(schema.topics.subjectId, subjectId),
        eq(schema.topics.status, 'completed')
      ));

    await db
      .update(schema.subjects)
      .set({ completedTopics: completedCount.length })
      .where(eq(schema.subjects.id, subjectId));

    res.json({
      success: true,
      data: updatedTopic,
    });
  } catch (error) {
    console.error('Update topic error:', error);
    next(error);
  }
});

export default router;
