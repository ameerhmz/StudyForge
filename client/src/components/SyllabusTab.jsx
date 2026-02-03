import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, RefreshCw, BookOpen, ChevronDown, ChevronRight, 
  Clock, Award, AlertCircle, CheckCircle, BookMarked, 
  Calendar, User, Mail, Phone, MapPin, GraduationCap,
  FileText, Target, Lightbulb, TrendingUp, Code
} from 'lucide-react'
import { generateSyllabus } from '../lib/api'
import useStore from '../store/useStore'
import { cn } from '../lib/utils'

export default function SyllabusTab({ document }) {
  const { syllabi, setSyllabus } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedTopics, setExpandedTopics] = useState({})
  const [expandedChapters, setExpandedChapters] = useState({})

  const syllabus = syllabi[document.id]
  const isDetailedSyllabus = syllabus && syllabus.topics && syllabus.topics[0]?.content

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await generateSyllabus(document.content)
      setSyllabus(document.id, result)
      
      // Expand all items by default
      if (result.topics) {
        const expanded = {}
        result.topics.forEach((_, i) => { expanded[i] = true })
        setExpandedTopics(expanded)
      } else if (result.chapters) {
        const expanded = {}
        result.chapters.forEach((_, i) => { expanded[i] = true })
        setExpandedChapters(expanded)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleTopic = (index) => {
    setExpandedTopics(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const toggleChapter = (index) => {
    setExpandedChapters(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getImportanceIcon = (importance) => {
    switch(importance?.toLowerCase()) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'medium': return <AlertCircle className="w-4 h-4 text-yellow-400" />
      case 'low': return <AlertCircle className="w-4 h-4 text-green-400" />
      default: return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {isDetailedSyllabus ? 'Course Syllabus' : 'Study Syllabus'}
          </h2>
          <p className="text-gray-400">
            {isDetailedSyllabus ? 'Comprehensive course information and schedule' : 'AI-generated comprehensive study plan'}
          </p>
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
        isDetailedSyllabus ? (
          /* Detailed Course Syllabus View */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Course Header */}
            <div className="card p-6 lg:p-8">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">{syllabus.title}</h1>
                  {syllabus.courseCode && (
                    <p className="text-lg text-blue-400 mb-1">{syllabus.courseCode}</p>
                  )}
                  {syllabus.institution && (
                    <p className="text-gray-400">{syllabus.institution}</p>
                  )}
                </div>
                {syllabus.totalCredits && (
                  <div className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
                    <p className="text-blue-400 font-semibold">{syllabus.totalCredits} Credits</p>
                  </div>
                )}
              </div>

              {syllabus.description && (
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{syllabus.description}</p>
              )}
            </div>

            {/* Instructor & Contact Info */}
            {(syllabus.instructor || syllabus.contactInfo) && (
              <div className="card p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Instructor Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {syllabus.instructor && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      {syllabus.instructor}
                    </div>
                  )}
                  {syllabus.contactInfo?.email && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {syllabus.contactInfo.email}
                    </div>
                  )}
                  {syllabus.contactInfo?.phone && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {syllabus.contactInfo.phone}
                    </div>
                  )}
                  {syllabus.contactInfo?.office && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {syllabus.contactInfo.office}
                    </div>
                  )}
                  {syllabus.officeHours && (
                    <div className="flex items-center gap-2 text-gray-300 sm:col-span-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      Office Hours: {syllabus.officeHours}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Course Info Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Learning Objectives */}
              {syllabus.objectives && syllabus.objectives.length > 0 && (
                <div className="card p-5">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-400" />
                    Learning Objectives
                  </h4>
                  <ul className="space-y-2">
                    {syllabus.objectives.slice(0, 3).map((obj, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Schedule */}
              {syllabus.schedule && (
                <div className="card p-5">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    Schedule
                  </h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    {syllabus.schedule.duration && (
                      <p><span className="text-gray-400">Duration:</span> {syllabus.schedule.duration}</p>
                    )}
                    {syllabus.schedule.weeklyHours && (
                      <p><span className="text-gray-400">Weekly:</span> {syllabus.schedule.weeklyHours}</p>
                    )}
                    {syllabus.schedule.lectureHours && (
                      <p><span className="text-gray-400">Lectures:</span> {syllabus.schedule.lectureHours}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Assessment */}
              {syllabus.assessmentBreakdown && (
                <div className="card p-5">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    Assessment
                  </h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    {Object.entries(syllabus.assessmentBreakdown).map(([key, value]) => (
                      value && (
                        <p key={key}>
                          <span className="text-gray-400 capitalize">{key}:</span> {value}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Prerequisites */}
            {syllabus.prerequisites && syllabus.prerequisites.length > 0 && (
              <div className="card p-5">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-purple-400" />
                  Prerequisites
                </h4>
                <div className="flex flex-wrap gap-2">
                  {syllabus.prerequisites.map((prereq, i) => (
                    <span key={i} className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-sm border border-purple-500/30">
                      {prereq}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Topics/Chapters */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-400" />
                Course Content ({syllabus.topics?.length || 0} topics)
              </h3>

              {syllabus.topics?.map((topic, topicIndex) => (
                <div key={topicIndex} className="card overflow-hidden">
                  <button
                    onClick={() => toggleTopic(topicIndex)}
                    className="w-full p-5 lg:p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                        {topic.weekNumber || topicIndex + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-lg font-semibold text-white">{topic.title}</h3>
                          {topic.importance && getImportanceIcon(topic.importance)}
                        </div>
                        {topic.subtitle && (
                          <p className="text-sm text-gray-400">{topic.subtitle}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {topic.difficulty && (
                            <span className={cn("px-2 py-1 rounded text-xs border", getDifficultyColor(topic.difficulty))}>
                              {topic.difficulty}
                            </span>
                          )}
                          {topic.studyTime && (
                            <span className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-300 border border-gray-500/30 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {topic.studyTime}
                            </span>
                          )}
                          {topic.examWeight && (
                            <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                              {topic.examWeight}% exam weight
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedTopics[topicIndex] ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                  
                  {expandedTopics[topicIndex] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-white/10 p-5 lg:p-6 bg-white/[0.02] space-y-6"
                    >
                      {/* Description */}
                      {topic.description && (
                        <div>
                          <h4 className="font-semibold text-white mb-2">Overview</h4>
                          <p className="text-gray-300 leading-relaxed">{topic.description}</p>
                        </div>
                      )}

                      {/* Detailed Content */}
                      {topic.content && (
                        <div>
                          <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            Detailed Content
                          </h4>
                          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{topic.content}</p>
                        </div>
                      )}

                      {/* Learning Outcomes */}
                      {topic.learningOutcomes && topic.learningOutcomes.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-400" />
                            Learning Outcomes
                          </h4>
                          <ul className="space-y-2">
                            {topic.learningOutcomes.map((outcome, i) => (
                              <li key={i} className="text-gray-300 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                                <span>{outcome}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Key Points */}
                      {topic.keyPoints && topic.keyPoints.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-400" />
                            Key Points
                          </h4>
                          <ul className="space-y-2">
                            {topic.keyPoints.map((point, i) => (
                              <li key={i} className="text-gray-300 flex items-start gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Concepts */}
                      {topic.concepts && topic.concepts.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <Code className="w-4 h-4 text-purple-400" />
                            Core Concepts
                          </h4>
                          <div className="space-y-4">
                            {topic.concepts.map((concept, i) => (
                              <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <h5 className="font-semibold text-blue-300 mb-2">{concept.name}</h5>
                                <p className="text-gray-300 text-sm mb-2">{concept.explanation}</p>
                                {concept.formula && (
                                  <div className="p-2 rounded bg-black/30 font-mono text-xs text-green-300 mb-2">
                                    {concept.formula}
                                  </div>
                                )}
                                {concept.applications && concept.applications.length > 0 && (
                                  <div className="text-xs text-gray-400 mt-2">
                                    <span className="font-semibold">Applications:</span> {concept.applications.join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sub-topics */}
                      {topic.subTopics && topic.subTopics.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-white mb-3">Subtopics</h4>
                          <div className="space-y-3">
                            {topic.subTopics.map((sub, i) => (
                              <div key={i} className="p-3 rounded-lg bg-white/5">
                                <p className="font-medium text-blue-300 mb-1">{sub.title}</p>
                                <p className="text-sm text-gray-400">{sub.description}</p>
                                {sub.keyTerms && sub.keyTerms.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {sub.keyTerms.map((term, j) => (
                                      <span key={j} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs">
                                        {term}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Exam Tips */}
                      {topic.examTips && topic.examTips.length > 0 && (
                        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                          <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Exam Tips
                          </h4>
                          <ul className="space-y-1">
                            {topic.examTips.map((tip, i) => (
                              <li key={i} className="text-sm text-yellow-200">{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Common Mistakes */}
                      {topic.commonMistakes && topic.commonMistakes.length > 0 && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                          <h4 className="font-semibold text-red-400 mb-2">Common Mistakes</h4>
                          <ul className="space-y-1">
                            {topic.commonMistakes.map((mistake, i) => (
                              <li key={i} className="text-sm text-red-200">{mistake}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Resources */}
                      {topic.resources && Object.keys(topic.resources).some(key => topic.resources[key]) && (
                        <div>
                          <h4 className="font-semibold text-white mb-2">Resources</h4>
                          <div className="text-sm text-gray-400 space-y-1">
                            {topic.resources.textbookPages && (
                              <p>📖 Textbook: {topic.resources.textbookPages}</p>
                            )}
                            {topic.resources.exercises && (
                              <p>✏️ Exercises: {topic.resources.exercises}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>

            {/* Textbooks */}
            {syllabus.textbooks && syllabus.textbooks.length > 0 && (
              <div className="card p-6">
                <h3 className="text-xl font-bold text-white mb-4">Required Textbooks</h3>
                <div className="space-y-3">
                  {syllabus.textbooks.map((book, i) => (
                    <div key={i} className="p-4 rounded-lg bg-white/5">
                      <p className="font-semibold text-white">{book.title}</p>
                      {book.author && <p className="text-sm text-gray-400">by {book.author}</p>}
                      {book.isbn && <p className="text-xs text-gray-500 mt-1">ISBN: {book.isbn}</p>}
                      {book.required !== undefined && (
                        <span className={cn(
                          "inline-block px-2 py-1 rounded text-xs mt-2",
                          book.required 
                            ? "bg-red-500/20 text-red-300 border border-red-500/30" 
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        )}>
                          {book.required ? 'Required' : 'Optional'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Important Dates */}
            {syllabus.importantDates && syllabus.importantDates.length > 0 && (
              <div className="card p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Important Dates
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {syllabus.importantDates.map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white/5 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                        {item.date}
                      </div>
                      <p className="text-gray-300">{item.event}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grading Scale */}
            {syllabus.gradingScale && (
              <div className="card p-6">
                <h3 className="text-xl font-bold text-white mb-4">Grading Scale</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.entries(syllabus.gradingScale).map(([grade, range]) => (
                    <div key={grade} className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-center">
                      <p className="text-2xl font-bold text-white">{grade}</p>
                      <p className="text-xs text-gray-400 mt-1">{range}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Policies */}
            {syllabus.policies && Object.keys(syllabus.policies).some(key => syllabus.policies[key]) && (
              <div className="card p-6">
                <h3 className="text-xl font-bold text-white mb-4">Course Policies</h3>
                <div className="space-y-3 text-gray-300">
                  {syllabus.policies.attendance && (
                    <div>
                      <p className="font-semibold text-white">Attendance</p>
                      <p className="text-sm">{syllabus.policies.attendance}</p>
                    </div>
                  )}
                  {syllabus.policies.latePenalty && (
                    <div>
                      <p className="font-semibold text-white">Late Submissions</p>
                      <p className="text-sm">{syllabus.policies.latePenalty}</p>
                    </div>
                  )}
                  {syllabus.policies.academicIntegrity && (
                    <div>
                      <p className="font-semibold text-white">Academic Integrity</p>
                      <p className="text-sm">{syllabus.policies.academicIntegrity}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Simple Syllabus View (fallback for old format) */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="card p-6 lg:p-8">
              <h1 className="text-3xl font-bold text-white mb-2">{syllabus.title}</h1>
              <p className="text-gray-400">{syllabus.chapters?.length || 0} chapters</p>
            </div>

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
        )
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
