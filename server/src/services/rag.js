/**
 * RAG (Retrieval-Augmented Generation) Service
 * Handles document embeddings, storage, and semantic retrieval
 */

import { Ollama } from '@langchain/ollama';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// In-memory vector store (for hackathon - can be replaced with FAISS/Chroma later)
const vectorStore = new Map();
const documentMetadata = new Map();

// Embedding model
let embeddingModel = null;

function getAIProvider() {
  return process.env.AI_PROVIDER || 'ollama';
}

/**
 * Initialize embedding model based on provider
 */
async function initEmbeddings() {
  if (embeddingModel) return;
  
  const provider = getAIProvider();
  
  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    embeddingModel = {
      type: 'gemini',
      model: genAI.getGenerativeModel({ model: 'text-embedding-004' })
    };
    console.log('📊 Using Gemini embeddings');
  } else {
    // Use Ollama for local embeddings
    embeddingModel = {
      type: 'ollama',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    };
    console.log('📊 Using Ollama embeddings (nomic-embed-text)');
  }
}

/**
 * Generate embedding for a text chunk
 */
async function generateEmbedding(text) {
  await initEmbeddings();
  
  if (embeddingModel.type === 'gemini') {
    const result = await embeddingModel.model.embedContent(text);
    return result.embedding.values;
  } else {
    // Ollama embedding using nomic-embed-text or mxbai-embed-large
    const response = await fetch(`${embeddingModel.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: text
      })
    });
    
    if (!response.ok) {
      // Fallback: use simple TF-IDF-like embedding
      console.warn('⚠️ Ollama embeddings not available, using fallback');
      return simpleEmbedding(text);
    }
    
    const data = await response.json();
    return data.embedding;
  }
}

/**
 * Simple fallback embedding (bag of words + hashing)
 */
function simpleEmbedding(text, dimensions = 384) {
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const embedding = new Array(dimensions).fill(0);
  
  for (const word of words) {
    const hash = hashString(word);
    const index = Math.abs(hash) % dimensions;
    embedding[index] += 1;
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    // Pad shorter vector
    const maxLen = Math.max(a.length, b.length);
    while (a.length < maxLen) a.push(0);
    while (b.length < maxLen) b.push(0);
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Add document chunks to the vector store
 */
export async function addDocumentToRAG(documentId, chunks, metadata = {}) {
  console.log(`📚 Adding ${chunks.length} chunks to RAG for document ${documentId}`);
  
  const embeddings = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      const embedding = await generateEmbedding(chunk);
      embeddings.push({
        id: `${documentId}-${i}`,
        text: chunk,
        embedding,
        documentId,
        chunkIndex: i
      });
    } catch (error) {
      console.warn(`Failed to embed chunk ${i}:`, error.message);
      // Use fallback embedding
      const embedding = simpleEmbedding(chunk);
      embeddings.push({
        id: `${documentId}-${i}`,
        text: chunk,
        embedding,
        documentId,
        chunkIndex: i
      });
    }
  }
  
  vectorStore.set(documentId, embeddings);
  documentMetadata.set(documentId, {
    ...metadata,
    chunkCount: chunks.length,
    createdAt: new Date().toISOString()
  });
  
  console.log(`✅ Added ${embeddings.length} embeddings for document ${documentId}`);
  return { documentId, chunkCount: embeddings.length };
}

/**
 * Retrieve relevant chunks for a query
 */
export async function retrieveContext(documentId, query, topK = 5) {
  const docEmbeddings = vectorStore.get(documentId);
  
  if (!docEmbeddings || docEmbeddings.length === 0) {
    console.warn(`No embeddings found for document ${documentId}`);
    return [];
  }
  
  // Generate query embedding
  let queryEmbedding;
  try {
    queryEmbedding = await generateEmbedding(query);
  } catch (error) {
    queryEmbedding = simpleEmbedding(query);
  }
  
  // Calculate similarities
  const similarities = docEmbeddings.map(doc => ({
    ...doc,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding)
  }));
  
  // Sort by similarity and return top K
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topResults = similarities.slice(0, topK);
  
  console.log(`🔍 Retrieved ${topResults.length} chunks for query (top similarity: ${topResults[0]?.similarity.toFixed(3)})`);
  
  return topResults.map(r => ({
    text: r.text,
    similarity: r.similarity,
    chunkIndex: r.chunkIndex
  }));
}

/**
 * Search across all documents
 */
export async function searchAllDocuments(query, topK = 5) {
  let allResults = [];
  
  for (const [documentId, embeddings] of vectorStore.entries()) {
    const results = await retrieveContext(documentId, query, topK);
    allResults.push(...results.map(r => ({ ...r, documentId })));
  }
  
  allResults.sort((a, b) => b.similarity - a.similarity);
  return allResults.slice(0, topK);
}

/**
 * Get document metadata
 */
export function getDocumentMetadata(documentId) {
  return documentMetadata.get(documentId);
}

/**
 * Remove document from RAG
 */
export function removeDocumentFromRAG(documentId) {
  vectorStore.delete(documentId);
  documentMetadata.delete(documentId);
  console.log(`🗑️ Removed document ${documentId} from RAG`);
}

/**
 * Get RAG stats
 */
export function getRAGStats() {
  let totalChunks = 0;
  for (const embeddings of vectorStore.values()) {
    totalChunks += embeddings.length;
  }
  
  return {
    documentCount: vectorStore.size,
    totalChunks,
    documents: Array.from(documentMetadata.entries()).map(([id, meta]) => ({
      id,
      ...meta
    }))
  };
}

export { generateEmbedding };
