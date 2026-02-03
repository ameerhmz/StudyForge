import express from 'express';
import { z } from 'zod';

const router = express.Router();

// In-memory storage (will be replaced with database later)
const studentsStore = new Map(); // studentId -> student data
const enrollmentsStore = new Map(); // teacherId -> [studentIds]
const progressData = new Map(); // studentId -> progress history

/**
 * GET /api/teacher/students - Get all students enrolled with this teacher
 */
router.get('/students', async (req, res, next) => {
  try {
    // For now, return all students (add teacherId filtering later with auth)
    const teacherId = req.query.teacherId || 'teacher-1';
    const studentIds = enrollmentsStore.get(teacherId) || [];
    
    const students = studentIds.map(id => {
      const student = studentsStore.get(id);
      const progress = progressData.get(id) || {};
      
      return {
        id,
        ...student,
        stats: calculateStudentStats(id, progress),
      };
    });

    res.json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/teacher/student/:studentId - Get detailed info for one student
 */
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = studentsStore.get(studentId);
    
    if (!student) {
      return res.status(404).json({ error: { message: 'Student not found' } });
    }

    const progress = progressData.get(studentId) || {};
    const detailedStats = calculateDetailedStats(studentId, progress);

    res.json({
      success: true,
      data: {
        ...student,
        stats: detailedStats,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/teacher/analytics - Get class-wide analytics
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const teacherId = req.query.teacherId || 'teacher-1';
    const studentIds = enrollmentsStore.get(teacherId) || [];
    
    // Aggregate analytics across all students
    const analytics = {
      totalStudents: studentIds.length,
      activeStudents: 0,
      averageProgress: 0,
      totalQuizzes: 0,
      averageScore: 0,
      weakTopics: [],
      strongTopics: [],
      subjectDistribution: {},
      engagementTrend: [],
    };

    let totalProgress = 0;
    let totalQuizScore = 0;
    let totalQuizCount = 0;
    const topicScores = new Map(); // topic -> [scores]
    const subjectCounts = new Map();

    for (const studentId of studentIds) {
      const progress = progressData.get(studentId) || {};
      const student = studentsStore.get(studentId);
      
      // Activity check (studied in last 7 days)
      if (student?.lastActive && isRecentlyActive(student.lastActive)) {
        analytics.activeStudents++;
      }

      // Progress metrics
      if (progress.subjects) {
        totalProgress += calculateProgressPercentage(progress.subjects);
        
        // Subject distribution
        Object.keys(progress.subjects).forEach(subject => {
          subjectCounts.set(subject, (subjectCounts.get(subject) || 0) + 1);
        });
      }

      // Quiz scores
      if (progress.quizzes) {
        progress.quizzes.forEach(quiz => {
          totalQuizCount++;
          totalQuizScore += quiz.score;
          
          // Track topic performance
          if (quiz.topic) {
            if (!topicScores.has(quiz.topic)) {
              topicScores.set(quiz.topic, []);
            }
            topicScores.get(quiz.topic).push(quiz.score);
          }
        });
      }
    }

    // Calculate averages
    if (studentIds.length > 0) {
      analytics.averageProgress = Math.round(totalProgress / studentIds.length);
    }
    
    if (totalQuizCount > 0) {
      analytics.averageScore = Math.round(totalQuizScore / totalQuizCount);
      analytics.totalQuizzes = totalQuizCount;
    }

    // Identify weak and strong topics
    const topicPerformance = [];
    for (const [topic, scores] of topicScores.entries()) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      topicPerformance.push({ topic, avgScore, attempts: scores.length });
    }
    
    topicPerformance.sort((a, b) => a.avgScore - b.avgScore);
    analytics.weakTopics = topicPerformance.slice(0, 5);
    analytics.strongTopics = topicPerformance.slice(-5).reverse();

    // Subject distribution
    analytics.subjectDistribution = Object.fromEntries(subjectCounts);

    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/teacher/enroll - Enroll a student (for testing)
 */
router.post('/enroll', async (req, res, next) => {
  try {
    const { teacherId = 'teacher-1', studentId, studentName, studentEmail } = req.body;
    
    // Create/update student
    studentsStore.set(studentId, {
      id: studentId,
      name: studentName,
      email: studentEmail,
      enrolledAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });

    // Add to teacher's enrollment
    if (!enrollmentsStore.has(teacherId)) {
      enrollmentsStore.set(teacherId, []);
    }
    const students = enrollmentsStore.get(teacherId);
    if (!students.includes(studentId)) {
      students.push(studentId);
    }

    console.log(`✅ Enrolled student ${studentName} (${studentId}) with teacher ${teacherId}`);

    res.json({
      success: true,
      message: 'Student enrolled successfully',
      data: { studentId, teacherId },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/teacher/update-progress - Update student progress (called by student app)
 */
router.post('/update-progress', async (req, res, next) => {
  try {
    const { studentId, type, data } = req.body;
    
    if (!progressData.has(studentId)) {
      progressData.set(studentId, {
        subjects: {},
        quizzes: [],
        studyTime: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    const progress = progressData.get(studentId);

    if (type === 'quiz') {
      progress.quizzes.push({
        ...data,
        timestamp: new Date().toISOString(),
      });
    } else if (type === 'subject') {
      progress.subjects[data.subjectId] = {
        ...(progress.subjects[data.subjectId] || {}),
        ...data,
        lastStudied: new Date().toISOString(),
      };
    } else if (type === 'study-time') {
      progress.studyTime += data.minutes || 0;
    }

    progress.lastUpdated = new Date().toISOString();

    // Update student last active
    const student = studentsStore.get(studentId);
    if (student) {
      student.lastActive = new Date().toISOString();
    }

    res.json({ success: true, message: 'Progress updated' });
  } catch (error) {
    next(error);
  }
});

// Helper functions
function calculateStudentStats(studentId, progress) {
  const quizzes = progress.quizzes || [];
  const subjects = Object.keys(progress.subjects || {}).length;
  
  let totalScore = 0;
  let quizCount = 0;
  
  quizzes.forEach(q => {
    totalScore += q.score || 0;
    quizCount++;
  });

  return {
    subjects,
    quizzesTaken: quizCount,
    averageScore: quizCount > 0 ? Math.round(totalScore / quizCount) : 0,
    studyTime: progress.studyTime || 0,
    lastActive: progress.lastUpdated || null,
  };
}

function calculateDetailedStats(studentId, progress) {
  const stats = calculateStudentStats(studentId, progress);
  
  // Add detailed breakdown
  stats.subjectProgress = Object.entries(progress.subjects || {}).map(([id, data]) => ({
    subjectId: id,
    subjectName: data.name || id,
    topicsCompleted: data.topicsCompleted || 0,
    totalTopics: data.totalTopics || 0,
    lastStudied: data.lastStudied,
  }));

  // Recent quizzes
  stats.recentQuizzes = (progress.quizzes || [])
    .slice(-10)
    .reverse()
    .map(q => ({
      topic: q.topic,
      score: q.score,
      timestamp: q.timestamp,
    }));

  // Weak topics for this student
  const topicScores = new Map();
  (progress.quizzes || []).forEach(quiz => {
    if (quiz.topic) {
      if (!topicScores.has(quiz.topic)) {
        topicScores.set(quiz.topic, []);
      }
      topicScores.get(quiz.topic).push(quiz.score);
    }
  });

  stats.weakTopics = Array.from(topicScores.entries())
    .map(([topic, scores]) => ({
      topic,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      attempts: scores.length,
    }))
    .filter(t => t.avgScore < 70)
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 5);

  return stats;
}

function calculateProgressPercentage(subjects) {
  let total = 0;
  let count = 0;
  
  Object.values(subjects).forEach(subject => {
    if (subject.totalTopics > 0) {
      total += (subject.topicsCompleted / subject.totalTopics) * 100;
      count++;
    }
  });

  return count > 0 ? total / count : 0;
}

function isRecentlyActive(lastActiveDate) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return new Date(lastActiveDate) > sevenDaysAgo;
}

export default router;
