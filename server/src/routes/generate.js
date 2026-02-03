import express from 'express';
import { db } from '../services/storage.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateSyllabus, generateQuiz, generateFlashcards } from '../services/generator.js';

const router = express.Router();

/**
 * Helper to get document content for context.
 * In a real app, we might search or just take the first few chunks.
 * For generation, we'll try to get representative chunks.
 */
async function getDocContext(docId) {
    const chunks = await db.select()
        .from(schema.embeddings)
        .where(eq(schema.embeddings.docId, docId))
        .limit(10); // Take first 10 chunks as context for generation

    return chunks.map(c => c.content).join('\n\n');
}

router.post('/syllabus', async (req, res) => {
    try {
        const { docId } = req.body;
        if (!docId) return res.status(400).json({ error: 'docId is required' });

        const context = await getDocContext(docId);
        const syllabus = await generateSyllabus(docId, context);
        res.json(syllabus);
    } catch (error) {
        console.error('Syllabus gen error:', error);
        res.status(500).json({ error: 'Failed to generate syllabus', details: error.message });
    }
});

router.post('/quiz', async (req, res) => {
    try {
        const { docId } = req.body;
        if (!docId) return res.status(400).json({ error: 'docId is required' });

        const context = await getDocContext(docId);
        const quiz = await generateQuiz(docId, context);
        res.json(quiz);
    } catch (error) {
        console.error('Quiz gen error:', error);
        res.status(500).json({ error: 'Failed to generate quiz', details: error.message });
    }
});

router.post('/flashcards', async (req, res) => {
    try {
        const { docId } = req.body;
        if (!docId) return res.status(400).json({ error: 'docId is required' });

        const context = await getDocContext(docId);
        const flashcards = await generateFlashcards(docId, context);
        res.json(flashcards);
    } catch (error) {
        console.error('Flashcards gen error:', error);
        res.status(500).json({ error: 'Failed to generate flashcards', details: error.message });
    }
});

export default router;
