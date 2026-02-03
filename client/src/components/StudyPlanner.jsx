import React, { useState } from 'react';
import { 
  Calendar, Clock, Target, Play, Loader2, 
  ChevronRight, BookOpen, Brain, Coffee, AlertCircle,
  Sparkles, CheckCircle, RotateCcw
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function StudyPlanner({ subject, topics, weakTopics = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(3);
  const [plan, setPlan] = useState(null);

  const generatePlan = async () => {
    if (!examDate) return;
    
    setLoading(true);
    setError(null);
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

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Failed to generate plan');
      }
      
      const result = await response.json();
      setPlan(result.data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to generate study plan. Please try again.');
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
      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Study Planner</h2>
            <p className="text-gray-400 text-sm">
              Generate a personalized study schedule based on your exam date
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Failed to generate plan</p>
            <p className="text-red-400/70 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {!plan ? (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Exam Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2 text-purple-400" />
                Exam Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              />
              {daysLeft !== null && daysLeft > 0 && (
                <p className="mt-2 text-sm text-purple-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {daysLeft} days until exam
                </p>
              )}
            </div>

            {/* Daily Study Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-2 text-blue-400" />
                Daily Study Hours
              </label>
              <div className="flex gap-2">
                {[2, 3, 4, 5, 6].map(hours => (
                  <button
                    key={hours}
                    onClick={() => setDailyHours(hours)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      dailyHours === hours
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Topics Summary */}
          <div className="mt-6 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Topics to cover ({topics.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {topics.slice(0, 8).map((topic, i) => (
                <span 
                  key={i}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    weakTopics.some(w => (w.name || w) === (topic.name || topic))
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  {topic.name || topic}
                </span>
              ))}
              {topics.length > 8 && (
                <span className="px-3 py-1.5 text-gray-500 text-xs">
                  +{topics.length - 8} more
                </span>
              )}
            </div>
            {weakTopics.length > 0 && (
              <p className="mt-3 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {weakTopics.length} weak topic(s) will be prioritized
              </p>
            )}
          </div>

          <button
            onClick={generatePlan}
            disabled={loading || !examDate || topics.length === 0}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating your personalized plan...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Study Plan
              </>
            )}
          </button>

          {topics.length === 0 && (
            <p className="mt-3 text-center text-sm text-gray-500">
              No topics available. Generate topics first from the Topics tab.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Plan Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 text-center">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">{plan.totalDays}</p>
              <p className="text-xs text-gray-500 mt-1">Study Days</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{plan.totalHours}</p>
              <p className="text-xs text-gray-500 mt-1">Total Hours</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 text-center">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">{topics.length}</p>
              <p className="text-xs text-gray-500 mt-1">Topics</p>
            </div>
          </div>

          {/* Strategy */}
          {plan.strategy && (
            <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
              <p className="text-purple-300 text-sm">
                <Sparkles className="w-4 h-4 inline mr-2" />
                <strong>Strategy:</strong> {plan.strategy}
              </p>
            </div>
          )}

          {/* Daily Schedule */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
              <h3 className="font-medium text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Daily Schedule
              </h3>
              <span className="text-xs text-gray-500">
                {plan.schedule?.length || 0} days planned
              </span>
            </div>
            <div className="divide-y divide-gray-700/50 max-h-[400px] overflow-y-auto">
              {plan.schedule?.map((day, i) => (
                <div key={i} className="p-4 hover:bg-gray-700/20 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-400">{day.day}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white">
                          Day {day.day}
                        </span>
                        {day.date && (
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-lg">
                      {day.hours}h planned
                    </span>
                  </div>
                  
                  <div className="space-y-2 ml-11">
                    {day.topics?.map((topic, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm group">
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                        <span className="text-gray-300">{topic.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                          {topic.duration}
                        </span>
                        {topic.type === 'review' && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                            Review
                          </span>
                        )}
                        {topic.priority === 'high' && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                            Priority
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {day.activities && day.activities.length > 0 && (
                    <div className="mt-3 ml-11 flex gap-2">
                      {day.activities.map((activity, k) => (
                        <span key={k} className="text-xs text-gray-500 flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded">
                          {activity === 'quiz' && <Brain className="w-3 h-3" />}
                          {activity === 'break' && <Coffee className="w-3 h-3" />}
                          {activity === 'review' && <BookOpen className="w-3 h-3" />}
                          {activity === 'practice' && <Target className="w-3 h-3" />}
                          {activity === 'study' && <BookOpen className="w-3 h-3" />}
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
          {plan.tips && plan.tips.length > 0 && (
            <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-xl p-5 border border-blue-500/30">
              <h3 className="font-medium text-blue-400 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Study Tips
              </h3>
              <ul className="space-y-3">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => {
              setPlan(null);
              setError(null);
            }}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Generate new plan
          </button>
        </div>
      )}
    </div>
  );
}

export default StudyPlanner;
