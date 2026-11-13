const embeddedChunks = [];

function storeEmbeddedChunks(chunks, embeddings, model) {
  if (chunks.length !== embeddings.length) {
    throw new Error('Each chunk must have exactly one embedding before storage.');
  }

  const storedEntries = chunks.map((chunk, index) => ({
    filename: chunk.filename,
    chunkIndex: chunk.chunkIndex,
    ...(chunk.pageNumbers ? { pageNumbers: [...chunk.pageNumbers] } : {}),
    text: chunk.text,
    embedding: embeddings[index],
    embeddingModel: model,
  }));

  embeddedChunks.push(...storedEntries);
  return storedEntries.length;
}

function getStoredChunkCount() {
  return embeddedChunks.length;
}

function getStoredChunks() {
  return embeddedChunks;
}

module.exports = {
  storeEmbeddedChunks,
  getStoredChunkCount,
  getStoredChunks,
};
