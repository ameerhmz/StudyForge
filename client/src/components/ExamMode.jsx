import React, { useState } from 'react';
import { 
  Zap, Clock, AlertTriangle, BookOpen, CheckCircle, 
  Play, Loader2, Trophy, Brain, List
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function ExamMode({ subject, topics }) {
  const [activeTab, setActiveTab] = useState('revision'); // 'revision' | 'quiz'
  const [loading, setLoading] = useState(false);
  const [timeAvailable, setTimeAvailable] = useState(60);
  const [revision, setRevision] = useState(null);
  const [rapidQuiz, setRapidQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const generateRevision = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/generate/exam-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics: topics.map(t => t.name || t),
          content: subject.content,
          timeAvailable,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate revision');
      
      const result = await response.json();
      setRevision(result.data);
    } catch (error) {
      console.error('Revision error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    setLoading(true);
    setShowResults(false);
    setAnswers({});
    setCurrentQuestion(0);
    
    try {
      const response = await fetch(`${API_URL}/generate/rapid-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics: topics.map(t => t.name || t),
          content: subject.content,
          questionCount: 10,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate quiz');
      
      const result = await response.json();
      setRapidQuiz(result.data);
    } catch (error) {
      console.error('Quiz error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionIndex, answer) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const submitQuiz = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    if (!rapidQuiz?.questions) return 0;
    let correct = 0;
    rapidQuiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    return Math.round((correct / rapidQuiz.questions.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-xl p-6 border border-orange-800/50">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6 text-orange-400" />
          <h2 className="text-xl font-bold text-white">Exam Mode</h2>
        </div>
        <p className="text-gray-400">
          Compressed revision and intensive practice for last-minute preparation
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('revision')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'revision'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Quick Revision
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'quiz'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Brain className="w-4 h-4" />
          Rapid Quiz
        </button>
      </div>

      {/* Revision Tab */}
      {activeTab === 'revision' && (
        <div className="space-y-4">
          {!revision ? (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">
                Generate Compressed Revision
              </h3>
              
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">
                  Time available for study (minutes)
                </label>
                <div className="flex items-center gap-4">
                  {[30, 60, 90, 120].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setTimeAvailable(mins)}
                      className={`px-4 py-2 rounded-lg ${
                        timeAvailable === mins
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateRevision}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                Generate Revision Guide
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Time indicator */}
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Optimized for {timeAvailable} minutes of study</span>
              </div>

              {/* Revision content */}
              {revision.topics?.map((topic, i) => (
                <div key={i} className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-sm">
                      {i + 1}
                    </span>
                    {topic.name}
                  </h3>

                  {/* Must Remember */}
                  {topic.mustRemember && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-orange-400 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Must Remember
                      </h4>
                      <ul className="space-y-1">
                        {topic.mustRemember.map((item, j) => (
                          <li key={j} className="text-gray-300 text-sm flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Formulas */}
                  {topic.formulas?.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-400 mb-2">Key Formulas</h4>
                      <ul className="space-y-1 font-mono text-sm">
                        {topic.formulas.map((formula, j) => (
                          <li key={j} className="text-gray-300">{formula}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Definitions */}
                  {topic.definitions?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-green-400 mb-2">Definitions</h4>
                      <div className="space-y-2">
                        {topic.definitions.map((def, j) => (
                          <div key={j} className="text-sm">
                            <span className="text-white font-medium">{def.term}:</span>
                            <span className="text-gray-400 ml-2">{def.definition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Common Mistakes */}
                  {topic.commonMistakes?.length > 0 && (
                    <div className="p-3 bg-red-900/20 rounded-lg border border-red-800/30">
                      <h4 className="text-sm font-medium text-red-400 mb-2">⚠️ Common Mistakes</h4>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {topic.commonMistakes.map((mistake, j) => (
                          <li key={j}>• {mistake}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              {/* Quick Quiz */}
              {revision.quickQuiz && (
                <div className="bg-purple-900/30 rounded-xl p-5 border border-purple-700/50">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <List className="w-5 h-5 text-purple-400" />
                    Quick Self-Check
                  </h3>
                  <ul className="space-y-2">
                    {revision.quickQuiz.map((q, i) => (
                      <li key={i} className="text-gray-300 flex items-start gap-2">
                        <span className="text-purple-400 font-medium">{i + 1}.</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setRevision(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Generate new revision
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quiz Tab */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          {!rapidQuiz ? (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center">
              <Brain className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Rapid Fire Quiz
              </h3>
              <p className="text-gray-400 mb-6">
                10 challenging questions to test your exam readiness
              </p>
              <button
                onClick={generateQuiz}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 mx-auto"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
                Start Quiz
              </button>
            </div>
          ) : showResults ? (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="text-center mb-6">
                <Trophy className={`w-16 h-16 mx-auto mb-4 ${
                  calculateScore() >= 70 ? 'text-yellow-400' : 'text-gray-500'
                }`} />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Score: {calculateScore()}%
                </h3>
                <p className="text-gray-400">
                  {calculateScore() >= 80 ? "Excellent! You're exam ready!" :
                   calculateScore() >= 60 ? "Good job! Review weak areas." :
                   "Keep practicing! Focus on the topics you missed."}
                </p>
              </div>

              <div className="space-y-3">
                {rapidQuiz.questions.map((q, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-lg ${
                      answers[i] === q.correctAnswer
                        ? 'bg-green-900/30 border border-green-700'
                        : 'bg-red-900/30 border border-red-700'
                    }`}
                  >
                    <p className="text-sm text-gray-300 mb-1">{q.question}</p>
                    <p className="text-xs text-gray-400">
                      Your answer: {answers[i] || 'Not answered'} | 
                      Correct: {q.correctAnswer}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setRapidQuiz(null)}
                className="mt-6 text-gray-400 hover:text-white transition-colors"
              >
                ← Take another quiz
              </button>
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Question {currentQuestion + 1} of {rapidQuiz.questions.length}</span>
                  <span>{Object.keys(answers).length} answered</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all"
                    style={{ width: `${((currentQuestion + 1) / rapidQuiz.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current question */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4">
                  {rapidQuiz.questions[currentQuestion]?.question}
                </h3>
                <div className="space-y-2">
                  {rapidQuiz.questions[currentQuestion]?.options?.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(currentQuestion, option)}
                      className={`w-full p-3 text-left rounded-lg transition-colors ${
                        answers[currentQuestion] === option
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  ← Previous
                </button>
                
                {currentQuestion < rapidQuiz.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={submitQuiz}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Submit Quiz
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ExamMode;
