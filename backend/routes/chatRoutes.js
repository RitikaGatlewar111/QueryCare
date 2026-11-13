const express = require('express');
const {
  EmbeddingProviderError,
} = require('../services/embeddingService');
const {
  GeminiConfigurationError,
  GeminiProviderError,
  generateGroundedAnswer,
} = require('../services/geminiService');
const {
  RetrievalError,
  searchStoredChunks,
} = require('../services/retrievalService');

const router = express.Router();
const NO_CONTEXT_ANSWER =
  'The uploaded documents do not provide enough information to answer this question.';

router.post('/', async (request, response) => {
  const question = request.body?.question;
  if (typeof question !== 'string' || !question.trim()) {
    response.status(400).json({ message: 'Provide a non-empty question string.' });
    return;
  }

  try {
    const sources = await searchStoredChunks(question.trim());
    if (sources.length === 0) {
      response.json({
        answer: NO_CONTEXT_ANSWER,
        sources: [],
        model: null,
        retrievalCount: 0,
      });
      return;
    }

    const { answer, model } = await generateGroundedAnswer(question.trim(), sources);
    response.json({
      answer,
      sources: sources.map((source) => ({
        filename: source.filename,
        chunkIndex: source.chunkIndex,
        ...(source.pageNumbers ? { pageNumbers: source.pageNumbers } : {}),
        similarity: source.similarity,
      })),
      model,
      retrievalCount: sources.length,
    });
  } catch (error) {
    if (
      error instanceof RetrievalError
      || error instanceof EmbeddingProviderError
      || error instanceof GeminiConfigurationError
      || error instanceof GeminiProviderError
    ) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }
    response.status(500).json({ message: 'Could not generate an answer from the uploaded documents.' });
  }
});

module.exports = router;
