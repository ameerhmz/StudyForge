import { ChatOllama } from '@langchain/ollama';
import { z } from 'zod';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { db } from './storage.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';

const model = new ChatOllama({
    model: 'llama3',
    baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    temperature: 0.3,
});

// --- Schemas ---

const syllabusSchema = z.object({
    chapters: z.array(z.object({
        title: z.string(),
        topics: z.array(z.string()),
        summary: z.string()
    }))
});

const quizSchema = z.object({
    questions: z.array(z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        correctAnswer: z.string(),
        explanation: z.string()
    }))
});

const flashcardSchema = z.object({
    cards: z.array(z.object({
        term: z.string(),
        definition: z.string()
    }))
});

// --- Parsers ---

const syllabusParser = StructuredOutputParser.fromZodSchema(syllabusSchema);
const quizParser = StructuredOutputParser.fromZodSchema(quizSchema);
const flashcardParser = StructuredOutputParser.fromZodSchema(flashcardSchema);

// --- Functions ---

/**
 * Generates a syllabus for a document.
 */
export async function generateSyllabus(docId, context) {
    const prompt = new PromptTemplate({
        template: "Analyze the following document context and create a structured study syllabus.\n{format_instructions}\nContext:\n{context}",
        inputVariables: ["context"],
        partialVariables: { format_instructions: syllabusParser.getFormatInstructions() },
    });

    const input = await prompt.format({ context });
    const response = await model.invoke(input);
    const result = await syllabusParser.parse(response.content);

    await saveGeneratedContent(docId, 'syllabus', result);
    return result;
}

/**
 * Generates a quiz for a document.
 */
export async function generateQuiz(docId, context) {
    const prompt = new PromptTemplate({
        template: "Based on the following document context, generate a multiple-choice quiz with 5 questions.\n{format_instructions}\nContext:\n{context}",
        inputVariables: ["context"],
        partialVariables: { format_instructions: quizParser.getFormatInstructions() },
    });

    const input = await prompt.format({ context });
    const response = await model.invoke(input);
    const result = await quizParser.parse(response.content);

    await saveGeneratedContent(docId, 'quiz', result);
    return result;
}

/**
 * Generates flashcards for a document.
 */
export async function generateFlashcards(docId, context) {
    const prompt = new PromptTemplate({
        template: "Extract 10 key terms and their definitions from the following document context into flashcards.\n{format_instructions}\nContext:\n{context}",
        inputVariables: ["context"],
        partialVariables: { format_instructions: flashcardParser.getFormatInstructions() },
    });

    const input = await prompt.format({ context });
    const response = await model.invoke(input);
    const result = await flashcardParser.parse(response.content);

    await saveGeneratedContent(docId, 'flashcards', result);
    return result;
}

/**
 * Internal helper to save generated content to DB.
 */
async function saveGeneratedContent(docId, type, content) {
    await db.insert(schema.generatedContent).values({
        docId,
        type,
        content,
    });
}
