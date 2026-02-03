import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Bot, User, MessageCircle, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { cn } from '../lib/utils'
import { chatWithDocument } from '../lib/api'

export default function ChatTab({ document }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const result = await chatWithDocument(document.content, input, messages)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.response
        }
      ])
    } catch (err) {
      setError(err.message || 'Failed to get response')
      // Remove the user message if there was an error
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  const suggestedQuestions = [
    'Summarize the main concepts',
    'What are the key takeaways?',
    'Explain the most important topic',
    'Create a study checklist'
  ]

  return (
    <div className="h-[calc(100vh-260px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">AI Study Assistant</h2>
          <p className="text-gray-400">Ask questions about your document</p>
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="btn btn-ghost text-gray-400 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            AI Powered
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mb-4">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 card p-6 overflow-y-auto mb-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
              <MessageCircle className="w-9 h-9 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Start a Conversation</h3>
            <p className="text-gray-400 mb-8 max-w-md">
              Ask me anything about <span className="text-blue-300 font-medium">{document.name}</span>. 
              I can help explain concepts, summarize content, or answer specific questions.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 text-sm hover:bg-white/10 hover:text-white border border-white/10 hover:border-blue-500/30 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  msg.role === 'user'
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-emerald-500/20 text-emerald-400"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "flex-1 p-4 rounded-2xl max-w-[80%]",
                  msg.role === 'user'
                    ? "bg-blue-500/20 text-white ml-auto"
                    : "bg-white/5 text-gray-200"
                )}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                          code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs">{children}</code>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}
            
            {loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 max-w-[80%]">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                        className="w-2 h-2 rounded-full bg-blue-400"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your document..."
          className="input flex-1"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn btn-primary shimmer-button px-6"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}
