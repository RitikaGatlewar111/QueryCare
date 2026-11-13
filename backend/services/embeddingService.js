const DEFAULT_EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const NORMALIZATION_TOLERANCE = 0.01;

let extractorPromise;

class EmbeddingConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EmbeddingConfigurationError';
  }
}

class EmbeddingProviderError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = 'EmbeddingProviderError';
    this.statusCode = statusCode;
  }
}

function getEmbeddingConfiguration() {
  return {
    configured: true,
    provider: 'local',
    model: DEFAULT_EMBEDDING_MODEL,
  };
}

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = import('@huggingface/transformers')
      .then(({ pipeline }) => pipeline('feature-extraction', DEFAULT_EMBEDDING_MODEL))
      .catch((error) => {
        extractorPromise = null;
        const details = error instanceof Error ? ` Details: ${error.message}` : '';
        throw new EmbeddingProviderError(
          `Could not load the local embedding model.${details}`,
        );
      });
  }

  return extractorPromise;
}

async function embedBatch(texts, extractor) {
  let output;
  try {
    output = await extractor(texts, {
      pooling: 'mean',
      normalize: true,
    });
  } catch {
    throw new EmbeddingProviderError(
      'The local embedding model failed to process this batch. No chunks from this upload were stored.',
    );
  }

  const embeddings = typeof output.tolist === 'function' ? output.tolist() : null;
  if (
    !Array.isArray(embeddings)
    || embeddings.length !== texts.length
    || embeddings.some((embedding) => (
      !Array.isArray(embedding)
      || embedding.length === 0
      || !embedding.every(Number.isFinite)
    ))
  ) {
    throw new EmbeddingProviderError(
      'The local embedding model returned invalid vectors. No chunks from this upload were stored.',
    );
  }

  for (const embedding of embeddings) {
    const magnitude = Math.sqrt(embedding.reduce((sum, value) => sum + value ** 2, 0));
    if (Math.abs(magnitude - 1) > NORMALIZATION_TOLERANCE) {
      throw new EmbeddingProviderError(
        'The local embedding model returned a non-normalized vector. No chunks from this upload were stored.',
      );
    }
  }

  return embeddings.map((embedding) => Array.from(embedding));
}

async function generateChunkEmbeddings(chunks, configuration = getEmbeddingConfiguration()) {
  if (!configuration.configured) {
    throw new EmbeddingConfigurationError(
      'Local embeddings are unavailable because the model is not configured.',
    );
  }
  if (chunks.length === 0) return [];

  const extractor = await getExtractor();
  const embeddings = [];

  for (let offset = 0; offset < chunks.length; offset += 32) {
    const batch = chunks.slice(offset, offset + 32);
    embeddings.push(...await embedBatch(batch.map((chunk) => chunk.text), extractor));
  }

  return embeddings;
}

module.exports = {
  EmbeddingConfigurationError,
  EmbeddingProviderError,
  getEmbeddingConfiguration,
  generateChunkEmbeddings,
};
