import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      // Subjects (main entities)
      subjects: [],
      currentSubject: null,
      currentTopic: null,
      
      // Generated content (cached by subject)
      syllabi: {},
      quizzes: {},
      flashcards: {},
      topicContent: {}, // AI-generated topic explanations
      
      // Progress tracking
      quizScores: {},
      flashcardProgress: {},
      topicProgress: {}, // Track which topics are studied
      serverStats: null,
      
      // ===== Subject Actions =====
      addSubject: (subject) => set((state) => ({
        subjects: [...state.subjects, { 
          ...subject, 
          id: subject.id || crypto.randomUUID(),
          topics: subject.topics || [],
          createdAt: new Date().toISOString()
        }]
      })),
      
      updateSubject: (id, updates) => set((state) => ({
        subjects: state.subjects.map(s => 
          s.id === id ? { ...s, ...updates } : s
        )
      })),
      
      setCurrentSubject: (subject) => set({ currentSubject: subject }),
      
      removeSubject: (id) => set((state) => ({
        subjects: state.subjects.filter(s => s.id !== id),
        syllabi: { ...state.syllabi, [id]: undefined },
        quizzes: { ...state.quizzes, [id]: undefined },
        flashcards: { ...state.flashcards, [id]: undefined },
        quizScores: { ...state.quizScores, [id]: undefined },
        flashcardProgress: { ...state.flashcardProgress, [id]: undefined },
        topicProgress: { ...state.topicProgress, [id]: undefined },
        topicContent: Object.fromEntries(
          Object.entries(state.topicContent).filter(([key]) => !key.startsWith(id))
        )
      })),
      
      // ===== Topic Actions =====
      addTopicToSubject: (subjectId, topic) => set((state) => ({
        subjects: state.subjects.map(s => 
          s.id === subjectId 
            ? { 
                ...s, 
                topics: [...(s.topics || []), { 
                  ...topic, 
                  id: topic.id || crypto.randomUUID(),
                  createdAt: new Date().toISOString()
                }]
              }
            : s
        )
      })),
      
      setTopicsForSubject: (subjectId, topics) => set((state) => ({
        subjects: state.subjects.map(s => 
          s.id === subjectId ? { ...s, topics } : s
        )
      })),
      
      updateTopic: (subjectId, topicId, updates) => set((state) => ({
        subjects: state.subjects.map(s => 
          s.id === subjectId 
            ? { 
                ...s, 
                topics: s.topics.map(t => 
                  t.id === topicId ? { ...t, ...updates } : t
                )
              }
            : s
        )
      })),
      
      removeTopic: (subjectId, topicId) => set((state) => ({
        subjects: state.subjects.map(s => 
          s.id === subjectId 
            ? { ...s, topics: s.topics.filter(t => t.id !== topicId) }
            : s
        ),
        topicContent: { ...state.topicContent, [`${subjectId}-${topicId}`]: undefined }
      })),
      
      setCurrentTopic: (topic) => set({ currentTopic: topic }),
      
      // ===== Content Actions =====
      setSyllabus: (subjectId, syllabus) => set((state) => ({
        syllabi: { ...state.syllabi, [subjectId]: syllabus }
      })),
      
      setQuiz: (subjectId, quiz) => set((state) => ({
        quizzes: { ...state.quizzes, [subjectId]: quiz }
      })),
      
      setFlashcards: (subjectId, cards) => set((state) => ({
        flashcards: { ...state.flashcards, [subjectId]: cards }
      })),
      
      setTopicContent: (subjectId, topicId, content) => set((state) => ({
        topicContent: { 
          ...state.topicContent, 
          [`${subjectId}-${topicId}`]: content 
        }
      })),
      
      // ===== Progress Actions =====
      updateQuizScore: (subjectId, score, total, metadata = {}) => set((state) => ({
        quizScores: { 
          ...state.quizScores, 
          [subjectId]: [
            ...(state.quizScores[subjectId] || []), 
            { 
              score, 
              total, 
              date: new Date().toISOString(),
              difficulty: metadata.difficulty,
              timeSpent: metadata.timeSpent,
              topic: metadata.topic
            }
          ]
        }
      })),
      
      updateFlashcardProgress: (subjectId, cardIndex, known) => set((state) => {
        const progress = state.flashcardProgress[subjectId] || {}
        return {
          flashcardProgress: {
            ...state.flashcardProgress,
            [subjectId]: { ...progress, [cardIndex]: known }
          }
        }
      }),
      
      resetFlashcardProgress: (subjectId) => set((state) => ({
        flashcardProgress: {
          ...state.flashcardProgress,
          [subjectId]: {}
        }
      })),
      
      markTopicStudied: (subjectId, topicId) => set((state) => ({
        topicProgress: {
          ...state.topicProgress,
          [subjectId]: {
            ...(state.topicProgress[subjectId] || {}),
            [topicId]: { studied: true, lastStudied: new Date().toISOString() }
          }
        }
      })),
      
      setServerStats: (stats) => set({ serverStats: stats }),
      
      // ===== Getters =====
      getStats: () => {
        const state = get()
        const quizSessions = Object.values(state.quizScores).flat()
        const totalQuizzes = quizSessions.length
        const totalCards = Object.values(state.flashcards).reduce((acc, deck) => {
          return acc + (deck?.cards?.length || 0)
        }, 0)
        const knownCards = Object.values(state.flashcardProgress).reduce((acc, prog) => {
          return acc + Object.values(prog || {}).filter(Boolean).length
        }, 0)
        
        const totalTopics = state.subjects.reduce((acc, s) => acc + (s.topics?.length || 0), 0)
        const studiedTopics = Object.values(state.topicProgress).reduce((acc, prog) => {
          return acc + Object.values(prog || {}).filter(p => p.studied).length
        }, 0)
        
        const avgScore = totalQuizzes > 0 
          ? Math.round(quizSessions.reduce((sum, q) => sum + (q.score / q.total * 100), 0) / totalQuizzes)
          : 0
        
        return {
          subjectsCount: state.subjects.length,
          topicsCount: totalTopics,
          topicsStudied: studiedTopics,
          quizzesCompleted: totalQuizzes,
          flashcardsStudied: totalCards,
          masteredCards: knownCards,
          averageQuizScore: avgScore
        }
      },
      
      getSubjectProgress: (subjectId) => {
        const state = get()
        const subject = state.subjects.find(s => s.id === subjectId)
        const quizHistory = state.quizScores[subjectId] || []
        const flashcardProg = state.flashcardProgress[subjectId] || {}
        const flashcardDeck = state.flashcards[subjectId]
        const topicProg = state.topicProgress[subjectId] || {}
        
        const knownCount = Object.values(flashcardProg).filter(Boolean).length
        const totalCards = flashcardDeck?.cards?.length || 0
        const topicsStudied = Object.values(topicProg).filter(p => p.studied).length
        const totalTopics = subject?.topics?.length || 0
        
        return {
          quizSessions: quizHistory.length,
          lastQuizScore: quizHistory.length > 0 ? quizHistory[quizHistory.length - 1] : null,
          flashcardsMastered: knownCount,
          flashcardsTotal: totalCards,
          flashcardPercentage: totalCards > 0 ? Math.round((knownCount / totalCards) * 100) : 0,
          topicsStudied,
          totalTopics,
          topicsPercentage: totalTopics > 0 ? Math.round((topicsStudied / totalTopics) * 100) : 0
        }
      },
      
      // Legacy support - documents alias to subjects
      get documents() { return get().subjects },
      currentDocument: null,
      addDocument: (doc) => get().addSubject(doc),
      setCurrentDocument: (doc) => get().setCurrentSubject(doc),
      removeDocument: (id) => get().removeSubject(id)
    }),
    { 
      name: 'studyforge-storage', 
      version: 3,
      migrate: (persistedState, version) => {
        // Migrate from version 2 (documents) to version 3 (subjects)
        if (version < 3) {
          const oldState = persistedState
          return {
            ...oldState,
            // Convert documents to subjects
            subjects: oldState.documents || [],
            currentSubject: oldState.currentDocument || null,
            currentTopic: null,
            topicContent: {},
            topicProgress: {},
            // Keep existing data
            syllabi: oldState.syllabi || {},
            quizzes: oldState.quizzes || {},
            flashcards: oldState.flashcards || {},
            quizScores: oldState.quizScores || {},
            flashcardProgress: oldState.flashcardProgress || {},
            serverStats: oldState.serverStats || null
          }
        }
        return persistedState
      }
    }
  )
)

export default useStore
