const { generateChunkEmbeddings } = require('./embeddingService');
const { getStoredChunks } = require('./inMemoryChunkStore');

const DEFAULT_RESULT_LIMIT = 3;

class RetrievalError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'RetrievalError';
    this.statusCode = statusCode;
  }
}

function vectorMagnitude(vector) {
  return Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
}

function isValidVector(vector) {
  return Array.isArray(vector)
    && vector.length > 0
    && vector.every(Number.isFinite)
    && vectorMagnitude(vector) > 0;
}

function cosineSimilarity(left, right) {
  if (!isValidVector(left) || !isValidVector(right)) {
    throw new RetrievalError('A stored or query embedding is invalid.');
  }
  if (left.length !== right.length) {
    throw new RetrievalError('Stored embeddings have incompatible vector dimensions.');
  }

  const dotProduct = left.reduce((sum, value, index) => sum + value * right[index], 0);
  const similarity = dotProduct / (vectorMagnitude(left) * vectorMagnitude(right));
  if (!Number.isFinite(similarity)) {
    throw new RetrievalError('Could not calculate similarity for a stored embedding.');
  }
  return similarity;
}

async function searchStoredChunks(question) {
  if (typeof question !== 'string' || !question.trim()) {
    throw new RetrievalError('Provide a non-empty question string.', 400);
  }

  const storedChunks = getStoredChunks();
  if (storedChunks.length === 0) return [];

  const [queryEmbedding] = await generateChunkEmbeddings([{ text: question.trim() }]);
  if (!isValidVector(queryEmbedding)) {
    throw new RetrievalError('The query embedding is invalid.', 502);
  }

  const results = storedChunks.map((chunk) => {
    if (!chunk || typeof chunk.text !== 'string' || !isValidVector(chunk.embedding)) {
      throw new RetrievalError('A stored chunk is missing valid text or an embedding.');
    }

    return {
      text: chunk.text,
      filename: chunk.filename,
      chunkIndex: chunk.chunkIndex,
      ...(chunk.pageNumbers ? { pageNumbers: chunk.pageNumbers } : {}),
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    };
  });

  return results
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, DEFAULT_RESULT_LIMIT);
}

module.exports = {
  RetrievalError,
  cosineSimilarity,
  searchStoredChunks,
};
