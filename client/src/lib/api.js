import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' }
})

/**
 * Generate syllabus with optional streaming support
 */
export async function generateSyllabus(content, options = {}) {
  const { stream = false, onChunk } = options

  if (stream && onChunk) {
    // Streaming mode
    const response = await fetch(`${API_BASE}/generate/syllabus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, stream: true })
    })
    
    if (!response.ok) throw new Error('Failed to generate syllabus')
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let result = null
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'chunk') {
              onChunk(data.content)
            } else if (data.type === 'done') {
              result = data.data
            } else if (data.type === 'error') {
              throw new Error(data.message)
            }
          } catch (e) {
            if (e.message !== 'Unexpected end of JSON input') throw e
          }
        }
      }
    }
    return result
  } else {
    // Non-streaming mode
    const { data } = await api.post('/generate/syllabus', { content })
    return data.data
  }
}

/**
 * Generate quiz questions
 */
export async function generateQuiz(content, options = {}) {
  const { data } = await api.post('/generate/quiz', {
    content,
    difficulty: options.difficulty || 'medium',
    questionCount: options.questionCount || 5,
    topic: options.topic || null
  })
  return data.data
}

/**
 * Generate flashcards
 */
export async function generateFlashcards(content, options = {}) {
  const { data } = await api.post('/generate/flashcards', {
    content,
    cardCount: options.cardCount || 10
  })
  return data.data
}

/**
 * Save study progress
 */
export async function saveProgress(documentId, type, score, total, metadata = {}) {
  const { data } = await api.post('/progress/save', {
    documentId,
    type, // 'quiz' or 'flashcard'
    score,
    total,
    metadata
  })
  return data.data
}

/**
 * Get progress for a document
 */
export async function getProgress(documentId) {
  const { data } = await api.get(`/progress/${documentId}`)
  return data.data
}

/**
 * Get overall stats
 */
export async function getOverallStats() {
  const { data } = await api.get('/progress/stats/overall')
  return data.data
}

/**
 * Clear progress for a document
 */
export async function clearProgress(documentId) {
  const { data } = await api.delete(`/progress/${documentId}`)
  return data
}

/**
 * Chat with document
 */
export async function chatWithDocument(content, question, history = []) {
  const { data } = await api.post('/chat', {
    content,
    question,
    history
  })
  return data.data
}

/**
 * Generate YouTube search queries for a topic
 */
export async function generateYouTubeQueries(topics, subject = '') {
  const { data } = await api.post('/generate/youtube-queries', {
    topics: Array.isArray(topics) ? topics : [topics],
    subject
  })
  return data.data
}

/**
 * Health check
 */
export async function checkHealth() {
  const { data } = await api.get('/health')
  return data
}

export default api
