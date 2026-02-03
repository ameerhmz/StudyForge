import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, BookOpen, Award, Clock, TrendingUp,
  AlertTriangle, Target, Calendar, Loader2, BarChart3
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function StudentDetailView() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/teacher/student/${studentId}`);
      if (response.ok) {
        const result = await response.json();
        setStudent(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch student details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-400 bg-green-900/30 border-green-700';
    if (score >= 60) return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
    return 'text-red-400 bg-red-900/30 border-red-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Student not found</p>
          <Link to="/teacher" className="text-blue-400 hover:text-blue-300">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-blue-950/10" />
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-purple-500/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/teacher')}
            className="p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {student.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{student.name || 'Student'}</h1>
              <p className="text-xs text-gray-500">{student.email || 'No email'}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <p className="text-xs text-gray-500">Subjects</p>
            </div>
            <p className="text-2xl font-bold text-white">{student.stats.subjects}</p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <p className="text-xs text-gray-500">Quizzes</p>
            </div>
            <p className="text-2xl font-bold text-white">{student.stats.quizzesTaken}</p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-green-400" />
              <p className="text-xs text-gray-500">Avg Score</p>
            </div>
            <p className="text-2xl font-bold text-white">{student.stats.averageScore}%</p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <p className="text-xs text-gray-500">Study Time</p>
            </div>
            <p className="text-2xl font-bold text-white">{Math.round(student.stats.studyTime / 60)}h</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Subject Progress */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Subject Progress
            </h3>
            {student.stats.subjectProgress?.length > 0 ? (
              <div className="space-y-3">
                {student.stats.subjectProgress.map((subject, i) => (
                  <div key={i} className="p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 font-medium">{subject.subjectName}</span>
                      <span className="text-xs text-gray-500">
                        {subject.topicsCompleted}/{subject.totalTopics} topics
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ 
                          width: `${subject.totalTopics > 0 ? (subject.topicsCompleted / subject.totalTopics) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    {subject.lastStudied && (
                      <p className="text-xs text-gray-600 mt-1">
                        Last studied: {new Date(subject.lastStudied).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No subject progress yet</p>
            )}
          </div>

          {/* Weak Topics */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Weak Topics
            </h3>
            {student.stats.weakTopics?.length > 0 ? (
              <div className="space-y-2">
                {student.stats.weakTopics.map((topic, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-800/30">
                    <div>
                      <p className="text-gray-300 font-medium">{topic.topic}</p>
                      <p className="text-xs text-gray-500">{topic.attempts} attempts</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(topic.avgScore)}`}>
                      {topic.avgScore}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No weak topics identified</p>
                <p className="text-gray-600 text-sm mt-1">Student is doing well!</p>
              </div>
            )}
          </div>

          {/* Recent Quizzes */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Recent Quiz Performance
            </h3>
            {student.stats.recentQuizzes?.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {student.stats.recentQuizzes.map((quiz, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <div>
                      <p className="text-gray-300 font-medium">{quiz.topic}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(quiz.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPerformanceColor(quiz.score)}`}>
                      {quiz.score}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No quiz history yet</p>
            )}
          </div>
        </div>

        {/* Last Active */}
        {student.stats.lastActive && (
          <div className="mt-6 text-center text-gray-500 text-sm">
            Last active: {new Date(student.stats.lastActive).toLocaleString()}
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentDetailView;
