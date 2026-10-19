'use strict';

const { pipeline } = require('@xenova/transformers');

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const VECTOR_DIMENSIONS = 384;

let extractorInstance = null;
let isInitializing = false;

/**
 * Returns the cached ONNX pipeline instance or initializes it lazily.
 */
const getExtractor = async () => {
  if (extractorInstance) {
    return extractorInstance;
  }

  if (isInitializing) {
    // Wait briefly if initialization is already in flight
    for (let i = 0; i < 50; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (extractorInstance) return extractorInstance;
    }
  }

  isInitializing = true;
  try {
    extractorInstance = await pipeline('feature-extraction', MODEL_NAME, {
      quantized: true,
    });
    return extractorInstance;
  } finally {
    isInitializing = false;
  }
};

/**
 * Generates a 384-dimensional normalized dense embedding vector for text.
 * Runs 100% locally with zero external API calls or costs.
 *
 * @param {string} text - Input text to embed
 * @returns {Promise<number[] | null>} 384-dimensional array of floats or null on error
 */
const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const cleanText = text.trim().slice(0, 2000);
  if (!cleanText) {
    return null;
  }

  try {
    const pipe = await getExtractor();
    const output = await pipe(cleanText, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.warn('[EmbeddingService] Local embedding failed:', err.message);
    return null;
  }
};

/**
 * Converts a float array into a PostgreSQL pgvector literal string: '[0.1, 0.2, ...]'
 *
 * @param {number[]} vector - Array of floating point numbers
 * @returns {string} String representation for pgvector SQL casting
 */
const formatVectorForPostgres = (vector) => {
  if (!Array.isArray(vector)) {
    return null;
  }
  return `[${vector.join(',')}]`;
};

module.exports = {
  MODEL_NAME,
  VECTOR_DIMENSIONS,
  generateEmbedding,
  formatVectorForPostgres,
};
