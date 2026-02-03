import express from 'express';
import { z } from 'zod';
import { analyzeWeakTopics } from '../services/generator.js';

const router = express.Router();

// In-memory storage for now (can be replaced with database)
const progressStore = new Map();
const quizResultsStore = new Map(); // Store quiz results by subject/topic

// Schema for saving progress
const ProgressSchema = z.object({
  documentId: z.string().uuid(),
  type: z.enum(['quiz', 'flashcard']),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  metadata: z.object({
    timeSpent: z.number().optional(), // seconds
    difficulty: z.string().optional(),
    wrongAnswers: z.array(z.number()).optional(),
    topic: z.string().optional(),
    subjectId: z.string().optional(),
  }).optional(),
});

// Schema for quiz results (for weak topic analysis)
const QuizResultSchema = z.object({
  subjectId: z.string(),
  topic: z.string(),
  score: z.number().min(0).max(100),
  questionsTotal: z.number().int().min(1),
  questionsCorrect: z.number().int().min(0),
  timeSpent: z.number().optional(),
  wrongQuestions: z.array(z.string()).optional(),
});

/**
 * POST /api/progress/save - Save study progress
 */
router.post('/save', async (req, res, next) => {
  try {
    const data = ProgressSchema.parse(req.body);
    
    const progressEntry = {
      ...data,
      timestamp: new Date().toISOString(),
      id: `${data.documentId}_${data.type}_${Date.now()}`,
    };

    // Store progress
    if (!progressStore.has(data.documentId)) {
      progressStore.set(data.documentId, []);
    }
    progressStore.get(data.documentId).push(progressEntry);

    console.log(`💾 Progress saved: ${data.type} - ${data.score}/${data.total}`);

    res.json({
      success: true,
      message: 'Progress saved successfully',
      data: progressEntry,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { message: 'Invalid progress data', details: error.errors },
      });
    }
    next(error);
  }
});

/**
 * POST /api/progress/quiz-result - Save quiz result for weak topic analysis
 */
router.post('/quiz-result', async (req, res, next) => {
  try {
    const data = QuizResultSchema.parse(req.body);
    
    const key = `${data.subjectId}_${data.topic}`;
    if (!quizResultsStore.has(key)) {
      quizResultsStore.set(key, []);
    }
    
    const result = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    
    quizResultsStore.get(key).push(result);
    
    console.log(`📊 Quiz result saved: ${data.topic} - ${data.score}%`);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { message: 'Invalid quiz result data', details: error.errors },
      });
    }
    next(error);
  }
});

/**
 * POST /api/progress/weak-topics - Analyze weak topics from quiz scores
 */
router.post('/weak-topics', async (req, res, next) => {
  try {
    const { subjectId, topics } = req.body;
    
    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({
        error: { message: 'Topics array is required' }
      });
    }
    
    // Gather quiz results for each topic
    const quizScores = [];
    for (const topic of topics) {
      const key = subjectId ? `${subjectId}_${topic}` : null;
      const results = key ? quizResultsStore.get(key) || [] : [];
      
      if (results.length > 0) {
        const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
        const totalAttempts = results.length;
        
        quizScores.push({
          topic,
          averageScore: Math.round(avgScore),
          attempts: totalAttempts,
          lastAttempt: results[results.length - 1].timestamp,
          trend: calculateTrend(results),
        });
      } else {
        quizScores.push({
          topic,
          averageScore: null,
          attempts: 0,
          lastAttempt: null,
          trend: 'unknown',
        });
      }
    }
    
    // Use AI to analyze weak topics
    const analysis = await analyzeWeakTopics(quizScores);
    
    res.json({
      success: true,
      data: {
        quizScores,
        analysis,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/subject/:subjectId - Get progress for a subject
 */
router.get('/subject/:subjectId', async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    
    // Gather all quiz results for this subject
    const results = [];
    for (const [key, value] of quizResultsStore.entries()) {
      if (key.startsWith(subjectId)) {
        results.push(...value);
      }
    }
    
    // Calculate topic-wise performance
    const topicPerformance = {};
    for (const result of results) {
      if (!topicPerformance[result.topic]) {
        topicPerformance[result.topic] = {
          scores: [],
          totalTime: 0,
        };
      }
      topicPerformance[result.topic].scores.push(result.score);
      topicPerformance[result.topic].totalTime += result.timeSpent || 0;
    }
    
    const summary = Object.entries(topicPerformance).map(([topic, data]) => ({
      topic,
      averageScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      attempts: data.scores.length,
      totalTimeMinutes: Math.round(data.totalTime / 60),
      mastery: getMasteryLevel(data.scores),
    }));
    
    res.json({
      success: true,
      data: {
        subjectId,
        totalQuizzes: results.length,
        topicPerformance: summary,
        recentResults: results.slice(-5).reverse(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/:documentId - Get all progress for a document
 */
router.get('/:documentId', async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const progress = progressStore.get(documentId) || [];

    // Calculate statistics
    const quizProgress = progress.filter(p => p.type === 'quiz');
    const flashcardProgress = progress.filter(p => p.type === 'flashcard');

    const stats = {
      documentId,
      totalSessions: progress.length,
      quiz: {
        sessions: quizProgress.length,
        averageScore: quizProgress.length > 0
          ? (quizProgress.reduce((sum, p) => sum + (p.score / p.total), 0) / quizProgress.length * 100).toFixed(1)
          : 0,
        totalQuestions: quizProgress.reduce((sum, p) => sum + p.total, 0),
        correctAnswers: quizProgress.reduce((sum, p) => sum + p.score, 0),
      },
      flashcard: {
        sessions: flashcardProgress.length,
        totalCards: flashcardProgress.reduce((sum, p) => sum + p.total, 0),
        knownCards: flashcardProgress.reduce((sum, p) => sum + p.score, 0),
      },
      history: progress.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ).slice(0, 10), // Last 10 sessions
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/stats/overall - Get overall statistics across all documents
 */
router.get('/stats/overall', async (req, res, next) => {
  try {
    let allProgress = [];
    for (const progress of progressStore.values()) {
      allProgress = allProgress.concat(progress);
    }

    const totalQuizzes = allProgress.filter(p => p.type === 'quiz').length;
    const totalFlashcards = allProgress.filter(p => p.type === 'flashcard').length;
    const totalTimeSpent = allProgress.reduce((sum, p) => 
      sum + (p.metadata?.timeSpent || 0), 0
    );

    const stats = {
      totalDocuments: progressStore.size,
      totalSessions: allProgress.length,
      totalQuizzes,
      totalFlashcards,
      totalTimeSpent: Math.round(totalTimeSpent / 60), // minutes
      recentActivity: allProgress
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5),
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/progress/:documentId - Clear progress for a document
 */
router.delete('/:documentId', async (req, res, next) => {
  try {
    const { documentId } = req.params;
    
    if (progressStore.has(documentId)) {
      progressStore.delete(documentId);
      console.log(`🗑️  Progress cleared for document: ${documentId}`);
      res.json({ success: true, message: 'Progress cleared successfully' });
    } else {
      res.status(404).json({ error: { message: 'Document not found' } });
    }
  } catch (error) {
    next(error);
  }
});

// Helper function to calculate trend
function calculateTrend(results) {
  if (results.length < 2) return 'stable';
  
  const recent = results.slice(-3);
  const scores = recent.map(r => r.score);
  
  const avgRecent = scores.reduce((a, b) => a + b, 0) / scores.length;
  const avgOlder = results.slice(0, -3).reduce((sum, r) => sum + r.score, 0) / Math.max(results.length - 3, 1);
  
  if (avgRecent > avgOlder + 10) return 'improving';
  if (avgRecent < avgOlder - 10) return 'declining';
  return 'stable';
}

// Helper function to get mastery level
function getMasteryLevel(scores) {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 90) return 'mastered';
  if (avg >= 70) return 'proficient';
  if (avg >= 50) return 'learning';
  return 'needs-practice';
}

export default router;
