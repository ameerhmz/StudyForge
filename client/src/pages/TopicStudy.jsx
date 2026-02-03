import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, ArrowLeft, CheckCircle, BookOpen, 
  MessageCircle, RefreshCw, ChevronLeft, ChevronRight,
  Youtube, ExternalLink, Loader2
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { cn } from '../lib/utils'
import useStore from '../store/useStore'
import { chatWithDocument, generateYouTubeQueries } from '../lib/api'

export default function TopicStudy() {
  const { subjectId, topicId } = useParams()
  const navigate = useNavigate()
  const { 
    subjects, currentSubject, setCurrentSubject, 
    topicContent, setTopicContent, markTopicStudied 
  } = useStore()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [askingQuestion, setAskingQuestion] = useState(false)
  const [youtubeQueries, setYoutubeQueries] = useState([])
  const [loadingYoutube, setLoadingYoutube] = useState(false)

  // Find subject and topic
  const subject = subjects.find(s => s.id === subjectId) || currentSubject
  const topic = subject?.topics?.find(t => t.id === topicId)
  const topicIndex = subject?.topics?.findIndex(t => t.id === topicId) || 0
  
  // Get cached AI content
  const cachedContent = topicContent[`${subjectId}-${topicId}`]

  useEffect(() => {
    if (subject) {
      setCurrentSubject(subject)
    }
    if (!subject || !topic) {
      navigate('/dashboard')
    }
  }, [subject, topic, navigate, setCurrentSubject])

  // Generate detailed explanation when first visiting
  useEffect(() => {
    if (topic && !cachedContent && !loading) {
      generateExplanation()
    }
  }, [topic, cachedContent])

  const generateExplanation = async () => {
    if (!topic) return
    
    setLoading(true)
    setError(null)
    
    try {
      const prompt = `Explain "${topic.title}" in detail for a student studying ${subject.name}. 
      
Topic content: ${topic.content}

Please provide:
1. A clear, comprehensive explanation
2. Key concepts and definitions
3. Examples where helpful
4. Important points to remember

Format the response with clear sections and bullet points.`

      const result = await chatWithDocument(subject.content || '', prompt, [])
      setTopicContent(subjectId, topicId, result.response)
      markTopicStudied(subjectId, topicId)
    } catch (err) {
      setError(err.message || 'Failed to generate explanation')
    } finally {
      setLoading(false)
    }
  }

  const handleAskQuestion = async (e) => {
    e.preventDefault()
    if (!question.trim() || askingQuestion) return
    
    setAskingQuestion(true)
    setAnswer(null)
    
    try {
      const context = `Topic: ${topic.title}\n\nContent: ${topic.content}\n\nDetailed Explanation: ${cachedContent || ''}`
      const result = await chatWithDocument(context, question, [])
      setAnswer(result.response)
    } catch (err) {
      setAnswer(`Error: ${err.message}`)
    } finally {
      setAskingQuestion(false)
    }
  }

  const fetchYouTubeQueries = async () => {
    if (!topic) return
    
    setLoadingYoutube(true)
    try {
      const queries = await generateYouTubeQueries(topic.title, subject.name)
      setYoutubeQueries(queries || [])
    } catch (err) {
      console.error('Failed to get YouTube queries:', err)
    } finally {
      setLoadingYoutube(false)
    }
  }

  const openYouTubeSearch = (query) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    window.open(url, '_blank')
  }

  const navigateTopic = (direction) => {
    const newIndex = topicIndex + direction
    if (newIndex >= 0 && newIndex < subject.topics.length) {
      const newTopic = subject.topics[newIndex]
      navigate(`/subject/${subjectId}/topic/${newTopic.id}`)
    }
  }

  if (!subject || !topic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hasPrev = topicIndex > 0
  const hasNext = topicIndex < (subject.topics?.length || 0) - 1

  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-cyan-950/10" />
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/subject/${subjectId}`)}
              className="p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTopic(-1)}
              disabled={!hasPrev}
              className={cn(
                "p-2 rounded-lg transition-colors",
                hasPrev ? "hover:bg-white/10 text-gray-400 hover:text-white" : "text-gray-700 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-500">
              {topicIndex + 1} / {subject.topics?.length || 0}
            </span>
            <button
              onClick={() => navigateTopic(1)}
              disabled={!hasNext}
              className={cn(
                "p-2 rounded-lg transition-colors",
                hasNext ? "hover:bg-white/10 text-gray-400 hover:text-white" : "text-gray-700 cursor-not-allowed"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative max-w-5xl mx-auto px-6 lg:px-8 py-10">
        {/* Topic Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl",
              subject.gradient || 'from-blue-500 to-blue-600'
            )}>
              {topicIndex + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-400 font-medium mb-1">{subject.name}</p>
              <h1 className="text-3xl font-bold text-white">{topic.title}</h1>
              {topic.description && (
                <p className="text-gray-400 mt-2">{topic.description}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Original Content */}
        {topic.content && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6 lg:p-8 mb-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Topic Overview
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap">
              {topic.content}
            </div>
          </motion.div>
        )}

        {/* AI Generated Explanation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 lg:p-8 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              AI Deep Dive
            </h2>
            <button
              onClick={generateExplanation}
              disabled={loading}
              className="btn btn-ghost text-sm"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              {loading ? 'Generating...' : 'Regenerate'}
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mb-4">
              {error}
            </div>
          )}

          {loading && !cachedContent ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Generating detailed explanation...</p>
              </div>
            </div>
          ) : cachedContent ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-6 mb-3">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-semibold text-white mt-5 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-medium text-blue-300 mt-4 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc ml-5 mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-5 mb-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-300">{children}</li>,
                  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                  code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-sm">{children}</code>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400">{children}</blockquote>,
                }}
              >
                {cachedContent}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>Click "Regenerate" to get an AI explanation</p>
            </div>
          )}
        </motion.div>

        {/* Ask a Question */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6 lg:p-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            Ask a Question
          </h2>

          <form onSubmit={handleAskQuestion} className="flex gap-3 mb-4">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about this topic..."
              className="input flex-1"
              disabled={askingQuestion}
            />
            <button
              type="submit"
              disabled={!question.trim() || askingQuestion}
              className="btn btn-primary"
            >
              {askingQuestion ? 'Asking...' : 'Ask'}
            </button>
          </form>

          {answer && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="text-gray-300 mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                    li: ({ children }) => <li className="text-gray-300 mb-1">{children}</li>,
                    strong: ({ children }) => <strong className="text-white">{children}</strong>,
                    code: ({ children }) => <code className="px-1 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs">{children}</code>,
                  }}
                >
                  {answer}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </motion.div>

        {/* YouTube Video Suggestions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-6 lg:p-8 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              YouTube Video Suggestions
            </h2>
            <button
              onClick={fetchYouTubeQueries}
              disabled={loadingYoutube}
              className="btn btn-ghost text-sm"
            >
              {loadingYoutube ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {loadingYoutube ? 'Finding videos...' : youtubeQueries.length > 0 ? 'Refresh' : 'Find Videos'}
            </button>
          </div>

          {youtubeQueries.length > 0 ? (
            <div className="grid gap-3">
              {youtubeQueries.map((item, index) => (
                <button
                  key={index}
                  onClick={() => openYouTubeSearch(item.query)}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Youtube className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium group-hover:text-red-300 transition-colors">
                        {item.query}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 transition-colors" />
                    </div>
                    <p className="text-sm text-gray-400">{item.description}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-gray-700/50 text-gray-400 capitalize">
                      {item.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Youtube className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">Find YouTube videos to help you learn this topic</p>
              <button
                onClick={fetchYouTubeQueries}
                disabled={loadingYoutube}
                className="btn btn-primary"
              >
                {loadingYoutube ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finding Videos...
                  </>
                ) : (
                  <>
                    <Youtube className="w-4 h-4" />
                    Get Video Suggestions
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between mt-8 pt-8 border-t border-white/10"
        >
          <button
            onClick={() => navigateTopic(-1)}
            disabled={!hasPrev}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl transition-colors",
              hasPrev 
                ? "text-gray-400 hover:text-white hover:bg-white/10" 
                : "text-gray-700 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous Topic
          </button>

          <button
            onClick={() => navigate(`/subject/${subjectId}`)}
            className="btn btn-ghost"
          >
            <CheckCircle className="w-4 h-4" />
            Back to Subject
          </button>

          <button
            onClick={() => navigateTopic(1)}
            disabled={!hasNext}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl transition-colors",
              hasNext 
                ? "text-gray-400 hover:text-white hover:bg-white/10" 
                : "text-gray-700 cursor-not-allowed"
            )}
          >
            Next Topic
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </main>
    </div>
  )
}
