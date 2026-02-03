import express from 'express';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { generateSyllabusFromPDF } from '../services/generator.js';
import { addDocumentToRAG, generateEmbedding } from '../services/rag.js';

const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

/**
 * Clean and normalize extracted text
 */
function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
}

/**
 * Split text into semantic chunks for RAG
 */
function splitIntoChunks(text, chunkSize = 1000, overlap = 200) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length <= chunkSize) {
      currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      // Start new chunk with overlap from previous
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 10));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// POST /api/upload - Upload and process PDF document
router.post('/', upload.single('pdf'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log(`📄 Processing PDF: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB)`);

    // Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const rawText = pdfData.text;
    const cleanedText = cleanText(rawText);

    if (!cleanedText || cleanedText.length < 100) {
      return res.status(400).json({ 
        error: 'Could not extract sufficient text from PDF. Please ensure the PDF contains readable text.' 
      });
    }

    // Split into chunks for RAG
    const chunks = splitIntoChunks(cleanedText);

    // Generate document ID
    const documentId = crypto.randomUUID();

    // Generate syllabus with topics and metadata from content
    const syllabus = await generateSyllabusFromPDF(cleanedText);

    // Store chunks in RAG system
    await addDocumentToRAG(documentId, chunks, {
      filename: req.file.originalname,
      pageCount: pdfData.numpages,
      title: syllabus.title
    });

    res.json({
      success: true,
      data: {
        id: documentId,
        name: syllabus.title || req.file.originalname.replace('.pdf', ''),
        filename: req.file.originalname,
        pageCount: pdfData.numpages,
        textLength: cleanedText.length,
        chunkCount: chunks.length,
        content: cleanedText, // Full content for AI features
        syllabus,
        topics: syllabus.topics || [],
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    next(error);
  }
});

// POST /api/upload/text - Upload raw text content
router.post('/text', async (req, res, next) => {
  try {
    const { content, title } = req.body;

    if (!content || content.length < 100) {
      return res.status(400).json({ error: 'Content must be at least 100 characters' });
    }

    const cleanedText = cleanText(content);
    const chunks = splitIntoChunks(cleanedText);
    const documentId = crypto.randomUUID();

    // Generate syllabus
    const syllabus = await generateSyllabusFromPDF(cleanedText);

    // Store in RAG
    await addDocumentToRAG(documentId, chunks, { title: title || syllabus.title });

    res.json({
      success: true,
      data: {
        id: documentId,
        name: title || syllabus.title,
        textLength: cleanedText.length,
        chunkCount: chunks.length,
        content: cleanedText,
        syllabus,
        topics: syllabus.topics || [],
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Text upload error:', error);
    next(error);
  }
});

export default router;
