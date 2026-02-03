import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, RefreshCw, Check, X, ClipboardCheck } from 'lucide-react'
import { cn } from '../lib/utils'
import { generateQuiz } from '../lib/api'
import useStore from '../store/useStore'
import { toast } from 'sonner'
import Skeleton from './Skeleton'

export default function QuizTab({ document }) {
  const { quizzes, setQuiz, updateQuizScore } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [difficulty, setDifficulty] = useState('medium')
  const [count, setCount] = useState(5)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [answers, setAnswers] = useState({})
  const [quizComplete, setQuizComplete] = useState(false)

  const quiz = quizzes[document.id]

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setAnswers({})
    setQuizComplete(false)

    try {
      const result = await generateQuiz(document.content, {
        difficulty,
        questionCount: count
      })
      setQuiz(document.id, result)
      toast.success('Quiz generated! Good luck.')
    } catch (err) {
      toast.error(err.message || 'Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAnswer = (index) => {
    if (showResult) return
    setSelectedAnswer(index)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    setShowResult(true)
    setAnswers({ ...answers, [currentQuestion]: selectedAnswer })
  }

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      const score = Object.entries({ ...answers, [currentQuestion]: selectedAnswer })
        .filter(([qIndex, aIndex]) => quiz.questions[parseInt(qIndex)]?.correctIndex === aIndex)
        .length
      updateQuizScore(document.id, score, quiz.questions.length, { difficulty })
      setQuizComplete(true)
    }
  }

  const getScore = () => {
    return Object.entries(answers).filter(
      ([qIndex, aIndex]) => quiz.questions[parseInt(qIndex)]?.correctIndex === aIndex
    ).length
  }

  const restartQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setAnswers({})
    setQuizComplete(false)
  }

  // Setup view
  if (!quiz) {
    return (
      <div className="space-y-8">
        <div className="card p-8 lg:p-10">
          <h2 className="text-2xl font-bold text-white mb-2">Generate Quiz</h2>
          <p className="text-gray-400 mb-10">Customize your quiz and test your knowledge</p>

          <div className="grid md:grid-cols-2 gap-10 mb-10">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">Difficulty Level</label>
              <div className="flex gap-3">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl font-medium capitalize transition-all",
                      difficulty === level
                        ? level === 'easy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 neon-green'
                          : level === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 neon-amber'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Number of Questions: <span className="text-blue-400 font-bold">{count}</span>
              </label>
              <input
                type="range"
                min="3"
                max="15"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>3</span>
                <span>15</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mb-6">
              {error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading} className="btn btn-primary shimmer-button px-8">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Forgeing Quiz...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Quiz
              </>
            )}
          </button>
        </div>

        {loading && (
          <div className="card p-8 lg:p-10 animate-fade-in">
            <Skeleton variant="title" className="w-1/3" />
            <div className="space-y-4">
              <Skeleton variant="rectangle" className="h-12" />
              <Skeleton variant="rectangle" className="h-12" />
              <Skeleton variant="rectangle" className="h-12" />
              <Skeleton variant="rectangle" className="h-12" />
            </div>
            <div className="flex justify-end mt-8">
              <Skeleton variant="rectangle" className="w-32 h-10" />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Quiz complete
  if (quizComplete) {
    const totalQuestions = quiz.questions.length
    const scoreValue = getScore()
    const percentage = Math.round((scoreValue / totalQuestions) * 100)

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-12 lg:p-16 text-center"
      >
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/30 neon-blue">
          <span className="text-4xl font-bold text-white">{scoreValue}/{totalQuestions}</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Quiz Complete!</h2>
        <p className="text-gray-400 text-lg mb-10">
          You scored {scoreValue} out of {totalQuestions} ({percentage}%)
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={restartQuiz} className="btn btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Retry Quiz
          </button>
          <button onClick={handleGenerate} className="btn btn-primary shimmer-button">
            <Sparkles className="w-4 h-4" />
            New Quiz
          </button>
        </div>
      </motion.div>
    )
  }

  // Quiz in progress
  const questions = quiz.questions
  const currentQ = questions[currentQuestion]
  const isCorrect = selectedAnswer === currentQ?.correctIndex

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
          />
        </div>
        <span className="text-sm text-gray-400 font-medium whitespace-nowrap">
          {currentQuestion + 1} / {questions.length}
        </span>
      </div>

      {/* Question Card */}
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="card p-8 lg:p-10"
      >
        <div className="mb-8">
          <span className="text-sm text-blue-400 font-semibold uppercase tracking-wider">
            Question {currentQuestion + 1}
          </span>
          <h3 className="text-2xl font-bold text-white mt-2">{currentQ?.question}</h3>
        </div>

        <div className="space-y-3 mb-8">
          {currentQ?.options?.map((option, i) => {
            const isSelected = selectedAnswer === i
            const isCorrectAnswer = i === currentQ.correctIndex

            return (
              <button
                key={i}
                onClick={() => handleSelectAnswer(i)}
                disabled={showResult}
                className={cn(
                  "w-full p-4 rounded-xl text-left font-medium transition-all flex items-center gap-4",
                  showResult
                    ? isCorrectAnswer
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 border neon-green"
                      : isSelected
                        ? "bg-red-500/20 border-red-500/50 text-red-400 border"
                        : "bg-white/5 border-white/10 text-gray-400 border"
                    : isSelected
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400 border neon-blue"
                      : "bg-white/5 border-white/10 text-gray-300 border hover:bg-white/10 hover:border-white/20"
                )}
              >
                <span className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                  showResult
                    ? isCorrectAnswer ? "bg-emerald-500/30" : isSelected ? "bg-red-500/30" : "bg-white/10"
                    : isSelected ? "bg-blue-500/30" : "bg-white/10"
                )}>
                  {showResult ? (
                    isCorrectAnswer ? <Check className="w-4 h-4" /> : isSelected ? <X className="w-4 h-4" /> : String.fromCharCode(65 + i)
                  ) : String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
              </button>
            )
          })}
        </div>

        {showResult && currentQ?.explanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-4 rounded-xl mb-6",
              isCorrect ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-amber-500/10 border border-amber-500/30"
            )}
          >
            <p className={cn("text-sm", isCorrect ? "text-emerald-400" : "text-amber-400")}>
              <strong>Explanation:</strong> {currentQ.explanation}
            </p>
          </motion.div>
        )}

        <div className="flex justify-end">
          {!showResult ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="btn btn-primary"
            >
              Submit Answer
            </button>
          ) : (
            <button onClick={handleNextQuestion} className="btn btn-primary shimmer-button">
              {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
