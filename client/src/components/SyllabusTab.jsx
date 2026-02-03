import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, RefreshCw, BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { generateSyllabus } from '../lib/api'
import useStore from '../store/useStore'
import { cn } from '../lib/utils'

export default function SyllabusTab({ document }) {
  const { syllabi, setSyllabus } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedChapters, setExpandedChapters] = useState({})

  const syllabus = syllabi[document.id]

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await generateSyllabus(document.content)
      setSyllabus(document.id, result)
      // Expand all chapters by default
      const expanded = {}
      result?.chapters?.forEach((_, i) => { expanded[i] = true })
      setExpandedChapters(expanded)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleChapter = (index) => {
    setExpandedChapters(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Study Syllabus</h2>
          <p className="text-gray-400">AI-generated comprehensive study plan</p>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="btn btn-primary shimmer-button">
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : syllabus ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Syllabus
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {syllabus ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Title */}
          <div className="card p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-2">{syllabus.title}</h1>
            <p className="text-gray-400">{syllabus.chapters?.length || 0} chapters</p>
          </div>

          {/* Chapters */}
          <div className="space-y-4">
            {syllabus.chapters?.map((chapter, chapterIndex) => (
              <div key={chapterIndex} className="card overflow-hidden">
                <button
                  onClick={() => toggleChapter(chapterIndex)}
                  className="w-full p-5 lg:p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {chapterIndex + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-white">{chapter.title}</h3>
                  </div>
                  {expandedChapters[chapterIndex] ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {expandedChapters[chapterIndex] && chapter.topics && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-white/10 p-5 lg:p-6 bg-white/[0.02]"
                  >
                    <ul className="space-y-3">
                      {chapter.topics.map((topic, topicIndex) => (
                        <li key={topicIndex} className="flex items-start gap-3 text-gray-300">
                          <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                          <span>{typeof topic === 'string' ? topic : topic.title}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="card p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-9 h-9 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No syllabus yet</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Generate a comprehensive study syllabus from your document with AI
          </p>
          <button onClick={handleGenerate} className="btn btn-primary shimmer-button">
            <Sparkles className="w-4 h-4" />
            Generate Syllabus
          </button>
        </div>
      )}
    </div>
  )
}
