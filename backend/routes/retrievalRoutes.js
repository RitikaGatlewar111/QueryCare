const express = require('express');
const {
  EmbeddingProviderError,
} = require('../services/embeddingService');
const {
  RetrievalError,
  searchStoredChunks,
} = require('../services/retrievalService');

const router = express.Router();

router.post('/search', async (request, response) => {
  try {
    const results = await searchStoredChunks(request.body?.question);
    response.json({
      message: results.length > 0
        ? 'Retrieved the most similar stored document chunks.'
        : 'No embedded document chunks are available in memory yet.',
      resultCount: results.length,
      results,
    });
  } catch (error) {
    if (error instanceof RetrievalError || error instanceof EmbeddingProviderError) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }
    response.status(500).json({ message: 'Could not search the in-memory document chunks.' });
  }
});

module.exports = router;
