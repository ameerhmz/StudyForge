import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ollama } from '@langchain/ollama';
import { validateQuiz, validateFlashcardDeck, validateSyllabus } from './schemas.js';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialization - read env at runtime
let ollamaLLM;
let geminiModel;
let initialized = false;

function getAIProvider() {
  return process.env.AI_PROVIDER || 'ollama';
}

function initializeProviders() {
  if (initialized) return;
  
  const AI_PROVIDER = getAIProvider();
  const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (AI_PROVIDER === 'ollama') {
    ollamaLLM = new Ollama({
      model: 'qwen3:8b',
      baseUrl: OLLAMA_BASE_URL,
      temperature: 0.7,
    });
    console.log('🤖 Using Ollama (qwen3:8b) for generation');
  } else if (AI_PROVIDER === 'gemini') {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });
    console.log('🤖 Using Gemini 2.5 Flash for generation');
  }
  
  initialized = true;
}

/**
 * Generate text using the configured AI provider
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<string>} - The AI response
 */
async function generateText(prompt) {
  initializeProviders();
  const AI_PROVIDER = getAIProvider();
  
  if (AI_PROVIDER === 'gemini') {
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } else {
    return await ollamaLLM.invoke(prompt);
  }
}

/**
 * Extract JSON from AI response
 */
function extractJSON(response) {
  let jsonStr = response.trim();
  
  // Remove markdown code blocks
  if (jsonStr.includes('```json')) {
    const start = jsonStr.indexOf('```json') + 7;
    const end = jsonStr.lastIndexOf('```');
    jsonStr = jsonStr.slice(start, end).trim();
  } else if (jsonStr.includes('```')) {
    const start = jsonStr.indexOf('```') + 3;
    const end = jsonStr.lastIndexOf('```');
    jsonStr = jsonStr.slice(start, end).trim();
  }
  
  // Try to find JSON object in the response
  const jsonStart = jsonStr.indexOf('{');
  const jsonEnd = jsonStr.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
  }

  return jsonStr;
}

/**
 * Generate a syllabus from document content
 */
export async function generateSyllabus(content) {
  try {
    console.log('📚 Generating syllabus...');

    const prompt = `Analyze the following educational content and create a structured syllabus.

Content:
${content}

Generate ONLY a valid JSON object with this exact structure (no extra text):
{
  "title": "Course Title",
  "chapters": [
    {
      "title": "Chapter 1 Name",
      "topics": [
        {
          "title": "Topic Name"
        }
      ]
    }
  ]
}

CRITICAL RULES:
- Return ONLY the JSON object, no explanation or extra text
- Use double quotes for all strings
- Keep titles concise (under 50 characters)
- Extract 3-5 main chapters from the content
- Each chapter should have 2-4 topics`;

    const response = await generateText(prompt);
    const jsonStr = extractJSON(response);

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parsing failed. Raw response:', jsonStr.substring(0, 200));
      throw new Error(`Invalid JSON from AI: ${parseError.message}`);
    }
    
    const validated = validateSyllabus(parsed);
    console.log('✅ Syllabus generated successfully');
    return validated;
  } catch (error) {
    console.error('Error generating syllabus:', error.message);
    throw new Error(`Failed to generate syllabus: ${error.message}`);
  }
}

/**
 * Generate quiz questions from document content
 */
export async function generateQuiz(content, topic = null, difficulty = 'medium', questionCount = 5) {
  try {
    console.log(`📝 Generating ${difficulty} quiz with ${questionCount} questions...`);

    const topicText = topic ? `Focus on the topic: "${topic}".` : '';

    const prompt = `Create a ${difficulty} difficulty quiz from the following content. ${topicText}

Content:
${content}

Generate a JSON object with the following structure:
{
  "title": "Quiz Title",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of why this answer is correct"
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no other text
- Generate exactly ${questionCount} questions
- Each question must have exactly 4 options
- correctIndex is 0-3 (index of the correct option)
- Questions should test understanding, not just memorization
- Explanations should be clear and educational
- Difficulty: ${difficulty}`;

    const response = await generateText(prompt);
    const jsonStr = extractJSON(response);

    const parsed = JSON.parse(jsonStr);
    const validated = validateQuiz(parsed);

    console.log(`✅ Generated ${validated.questions.length} quiz questions`);
    return validated;
  } catch (error) {
    console.error('Error generating quiz:', error.message);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
}

/**
 * Generate flashcards from document content
 */
export async function generateFlashcards(content, cardCount = 10) {
  try {
    console.log(`🎴 Generating ${cardCount} flashcards...`);

    const prompt = `Extract key terms and concepts from the following content and create flashcards for studying.

Content:
${content}

Generate a JSON object with the following structure:
{
  "title": "Flashcard Deck Title",
  "cards": [
    {
      "term": "Key Term or Concept",
      "definition": "Clear, concise definition",
      "example": "Optional example or use case"
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no other text
- Generate approximately ${cardCount} flashcards
- Focus on the most important concepts
- Definitions should be clear and concise
- Include examples where they add value
- Cover different aspects of the content`;

    const response = await generateText(prompt);
    const jsonStr = extractJSON(response);

    const parsed = JSON.parse(jsonStr);
    const validated = validateFlashcardDeck(parsed);

    console.log(`✅ Generated ${validated.cards.length} flashcards`);
    return validated;
  } catch (error) {
    console.error('Error generating flashcards:', error.message);
    throw new Error(`Failed to generate flashcards: ${error.message}`);
  }
}
