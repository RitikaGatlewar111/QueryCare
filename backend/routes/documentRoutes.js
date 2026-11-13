const express = require('express');
const multer = require('multer');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { chunkText } = require('../utils/textChunker');
const {
  EmbeddingConfigurationError,
  EmbeddingProviderError,
  generateChunkEmbeddings,
  getEmbeddingConfiguration,
} = require('../services/embeddingService');
const { storeEmbeddedChunks } = require('../services/inMemoryChunkStore');

const router = express.Router();
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CHUNK_PREVIEW_COUNT = 3;
const CHUNK_PREVIEW_CHARACTERS = 300;
const EXTRACTED_TEXT_PREVIEW_CHARACTERS = 500;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter(request, file, callback) {
    const hasPdfExtension = path.extname(file.originalname).toLowerCase() === '.pdf';
    if (!hasPdfExtension || file.mimetype !== 'application/pdf') {
      const error = new Error('Only PDF files with a .pdf filename are allowed.');
      error.code = 'INVALID_PDF_TYPE';
      callback(error);
      return;
    }
    callback(null, true);
  },
});

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const pages = Array.isArray(result.pages)
      ? result.pages
        .filter((page) => page.text)
        .map((page) => ({ pageNumber: page.num, text: page.text }))
      : [];
    return {
      text: pages.map((page) => page.text).join('\n\n').trim(),
      pages,
    };
  } finally {
    await parser.destroy();
  }
}

router.post('/upload', (request, response, next) => {
  upload.single('pdf')(request, response, async (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          response.status(413).json({ message: 'The PDF exceeds the 10 MB file size limit.' });
          return;
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          response.status(400).json({ message: 'Upload exactly one file using the "pdf" field.' });
          return;
        }
        response.status(400).json({ message: 'The uploaded file could not be accepted.' });
        return;
      }

      if (error.code === 'INVALID_PDF_TYPE') {
        response.status(415).json({ message: error.message });
        return;
      }
      next(error);
      return;
    }

    if (!request.file) {
      response.status(400).json({ message: 'Select a PDF file using the "pdf" field.' });
      return;
    }

    const hasPdfSignature = request.file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    if (!hasPdfSignature) {
      response.status(415).json({ message: 'The selected file does not have a valid PDF signature.' });
      return;
    }

    let extracted;
    try {
      extracted = await extractPdfText(request.file.buffer);
    } catch {
      response.status(422).json({
        message: 'The PDF was received but could not be read. It may be corrupted, encrypted, or unreadable.',
      });
      return;
    }

    const extractedText = extracted.text;
    const hasExtractableText = extractedText.length > 0;
    const chunks = hasExtractableText
      ? chunkText(extractedText, request.file.originalname, extracted.pages)
      : [];
    let embeddingConfiguration = null;
    let embeddingStatus = hasExtractableText ? 'not_configured' : 'no_extractable_text';
    let embeddedChunkCount = 0;
    let storedChunkCount = 0;

    try {
      if (chunks.length > 0) {
        embeddingConfiguration = getEmbeddingConfiguration();
        if (embeddingConfiguration.configured) {
          const embeddings = await generateChunkEmbeddings(chunks, embeddingConfiguration);
          embeddedChunkCount = embeddings.length;
          storedChunkCount = storeEmbeddedChunks(
            chunks,
            embeddings,
            embeddingConfiguration.model,
          );
          embeddingStatus = 'generated';
        }
      }
    } catch (error) {
      if (error instanceof EmbeddingConfigurationError) {
        response.status(503).json({
          message: error.message,
          embeddingStatus: 'not_configured',
          embeddingsGenerated: false,
          embeddedChunkCount: 0,
          storedChunkCount: 0,
        });
        return;
      }
      if (error instanceof EmbeddingProviderError) {
        response.status(error.statusCode).json({
          message: error.message,
          embeddingStatus: 'failed',
          embeddingsGenerated: false,
          embeddedChunkCount: 0,
          storedChunkCount: 0,
        });
        return;
      }
      next(error);
      return;
    }

    response.status(200).json({
      message: embeddingStatus === 'generated'
        ? 'PDF text was chunked and embeddings were generated and stored in backend memory only. No files or data were saved permanently; retrieval is not implemented.'
        : hasExtractableText
          ? 'PDF text was extracted and chunked in memory, but embeddings were not generated. Set the backend embedding configuration to enable this step.'
          : 'PDF received and validated, but no extractable text was found. It may be scanned or image-based; OCR is not available.',
      filename: request.file.originalname,
      size: request.file.size,
      extractedTextPreview: extractedText.slice(0, EXTRACTED_TEXT_PREVIEW_CHARACTERS),
      chunkCount: chunks.length,
      embeddingStatus,
      embeddingsGenerated: embeddingStatus === 'generated',
      embeddedChunkCount,
      storedChunkCount,
      ...(embeddingStatus === 'generated'
        ? { embeddingModel: embeddingConfiguration.model }
        : {}),
      chunksPreview: chunks.slice(0, CHUNK_PREVIEW_COUNT).map((chunk) => ({
        filename: chunk.filename,
        chunkIndex: chunk.chunkIndex,
        ...(chunk.pageNumbers ? { pageNumbers: chunk.pageNumbers } : {}),
        text: chunk.text.length > CHUNK_PREVIEW_CHARACTERS
          ? `${chunk.text.slice(0, CHUNK_PREVIEW_CHARACTERS).trimEnd()}…`
          : chunk.text,
      })),
    });
  });
});

module.exports = router;
