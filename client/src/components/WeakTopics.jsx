import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, TrendingUp, TrendingDown, Minus, 
  BookOpen, Target, RefreshCw, Loader2, Brain
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function WeakTopics({ subject, topics }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [quizScores, setQuizScores] = useState([]);

  const fetchWeakTopics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/progress/weak-topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: subject.id,
          topics: topics.map(t => t.name || t),
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze topics');
      
      const result = await response.json();
      setQuizScores(result.data.quizScores);
      setAnalysis(result.data.analysis);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subject && topics?.length > 0) {
      fetchWeakTopics();
    }
  }, [subject?.id]);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getScoreColor = (score) => {
    if (score === null) return 'text-gray-500';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score === null) return 'bg-gray-700';
    if (score >= 80) return 'bg-green-900/30';
    if (score >= 60) return 'bg-yellow-900/30';
    return 'bg-red-900/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-xl p-6 border border-red-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Weak Topics Analysis</h2>
              <p className="text-gray-400 text-sm">
                Identify areas that need more practice
              </p>
            </div>
          </div>
          <button
            onClick={fetchWeakTopics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
        </div>
      ) : quizScores.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 text-center">
          <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            No Quiz Data Yet
          </h3>
          <p className="text-gray-500 text-sm">
            Complete some quizzes to see your weak topics analysis
          </p>
        </div>
      ) : (
        <>
          {/* Topic Performance Grid */}
          <div className="grid gap-3">
            {quizScores.map((topic, i) => (
              <div 
                key={i}
                className={`${getScoreBg(topic.averageScore)} rounded-lg p-4 border border-gray-700`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold ${getScoreColor(topic.averageScore)}`}>
                      {topic.averageScore !== null ? `${topic.averageScore}%` : '--'}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{topic.topic}</h3>
                      <p className="text-xs text-gray-500">
                        {topic.attempts} quiz{topic.attempts !== 1 ? 'zes' : ''} taken
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(topic.trend)}
                    <span className="text-xs text-gray-400">{topic.trend}</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      topic.averageScore >= 80 ? 'bg-green-500' :
                      topic.averageScore >= 60 ? 'bg-yellow-500' :
                      topic.averageScore !== null ? 'bg-red-500' : 'bg-gray-600'
                    }`}
                    style={{ width: `${topic.averageScore || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          {analysis && (
            <div className="space-y-4">
              {/* Weak Topics */}
              {analysis.weakTopics?.length > 0 && (
                <div className="bg-red-900/20 rounded-xl p-5 border border-red-800/50">
                  <h3 className="font-medium text-red-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Topics Needing Attention
                  </h3>
                  <div className="space-y-2">
                    {analysis.weakTopics.map((topic, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <div>
                          <span className="text-white font-medium">{topic.name}</span>
                          {topic.recommendation && (
                            <p className="text-gray-400 text-sm">{topic.recommendation}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strong Topics */}
              {analysis.strongTopics?.length > 0 && (
                <div className="bg-green-900/20 rounded-xl p-5 border border-green-800/50">
                  <h3 className="font-medium text-green-400 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Strong Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.strongTopics.map((topic, i) => (
                      <span 
                        key={i}
                        className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm"
                      >
                        {topic.name || topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                  <h3 className="font-medium text-blue-400 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Study Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-blue-400">{i + 1}.</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default WeakTopics;
