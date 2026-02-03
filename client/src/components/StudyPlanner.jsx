import React, { useState } from 'react';
import { 
  Calendar, Clock, Target, Play, Loader2, 
  ChevronRight, BookOpen, Brain, Coffee
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function StudyPlanner({ subject, topics, weakTopics = [] }) {
  const [loading, setLoading] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(3);
  const [plan, setPlan] = useState(null);

  const generatePlan = async () => {
    if (!examDate) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/generate/study-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics: topics.map(t => ({
            name: t.name || t,
            difficulty: t.difficulty || 'medium',
            importance: t.importance || 'medium',
          })),
          examDate,
          dailyStudyHours: dailyHours,
          weakTopics: weakTopics.map(t => t.name || t),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate plan');
      
      const result = await response.json();
      setPlan(result.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExam = () => {
    if (!examDate) return null;
    const diff = new Date(examDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExam();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl p-6 border border-purple-800/50">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Study Planner</h2>
        </div>
        <p className="text-gray-400">
          Generate a personalized study schedule based on your exam date
        </p>
      </div>

      {!plan ? (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Exam Date */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Exam Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {daysLeft !== null && daysLeft > 0 && (
                <p className="mt-2 text-sm text-purple-400">
                  {daysLeft} days until exam
                </p>
              )}
            </div>

            {/* Daily Study Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Daily Study Hours
              </label>
              <div className="flex gap-2">
                {[2, 3, 4, 5, 6].map(hours => (
                  <button
                    key={hours}
                    onClick={() => setDailyHours(hours)}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      dailyHours === hours
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Topics Summary */}
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              Topics to cover ({topics.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {topics.slice(0, 8).map((topic, i) => (
                <span 
                  key={i}
                  className={`px-2 py-1 rounded text-xs ${
                    weakTopics.some(w => (w.name || w) === (topic.name || topic))
                      ? 'bg-red-900/30 text-red-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {topic.name || topic}
                </span>
              ))}
              {topics.length > 8 && (
                <span className="px-2 py-1 text-gray-500 text-xs">
                  +{topics.length - 8} more
                </span>
              )}
            </div>
            {weakTopics.length > 0 && (
              <p className="mt-2 text-xs text-red-400">
                {weakTopics.length} weak topic(s) will be prioritized
              </p>
            )}
          </div>

          <button
            onClick={generatePlan}
            disabled={loading || !examDate}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            Generate Study Plan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Plan Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-center">
              <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{plan.totalDays}</p>
              <p className="text-xs text-gray-500">Study Days</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-center">
              <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{plan.totalHours}</p>
              <p className="text-xs text-gray-500">Total Hours</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-center">
              <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{topics.length}</p>
              <p className="text-xs text-gray-500">Topics</p>
            </div>
          </div>

          {/* Daily Schedule */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-medium text-white">Daily Schedule</h3>
            </div>
            <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
              {plan.schedule?.map((day, i) => (
                <div key={i} className="p-4 hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-purple-400">
                        Day {day.day}
                      </span>
                      <span className="text-xs text-gray-500">
                        {day.date || ''}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {day.hours}h planned
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {day.topics?.map((topic, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-300">{topic.name}</span>
                        <span className="text-xs text-gray-500">
                          ({topic.duration || '1h'})
                        </span>
                        {topic.type === 'review' && (
                          <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">
                            Review
                          </span>
                        )}
                        {topic.priority === 'high' && (
                          <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">
                            Priority
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {day.activities && (
                    <div className="mt-2 flex gap-2">
                      {day.activities.map((activity, k) => (
                        <span key={k} className="text-xs text-gray-500 flex items-center gap-1">
                          {activity === 'quiz' && <Brain className="w-3 h-3" />}
                          {activity === 'break' && <Coffee className="w-3 h-3" />}
                          {activity === 'review' && <BookOpen className="w-3 h-3" />}
                          {activity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {plan.tips && (
            <div className="bg-blue-900/20 rounded-xl p-5 border border-blue-800/50">
              <h3 className="font-medium text-blue-400 mb-3">Study Tips</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setPlan(null)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Generate new plan
          </button>
        </div>
      )}
    </div>
  );
}

export default StudyPlanner;
