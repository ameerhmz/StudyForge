import { OllamaEmbeddings } from '@langchain/ollama';
import dotenv from 'dotenv';

dotenv.config();

const embeddings = new OllamaEmbeddings({
    model: 'nomic-embed-text',
    baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
});

/**
 * Generates embeddings for a single string of text.
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
export async function getEmbeddings(text) {
    try {
        return await embeddings.embedQuery(text);
    } catch (error) {
        console.error('Error generating embeddings:', error);
        throw new Error('Failed to generate AI embeddings');
    }
}

/**
 * Generates embeddings for multiple chunks of text in batch.
 * @param {string[]} texts 
 * @returns {Promise<number[][]>}
 */
export async function getBatchEmbeddings(texts) {
    try {
        return await embeddings.embedDocuments(texts);
    } catch (error) {
        console.error('Error generating batch embeddings:', error);
        throw new Error('Failed to generate batch AI embeddings');
    }
}
