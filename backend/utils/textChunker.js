const TARGET_WORDS_PER_CHUNK = 500;
const OVERLAP_WORDS = 50;

// Word counts are a simple approximation; they do not match model tokenizer tokens.
function chunkText(text, filename, pages = []) {
  const sourceParagraphs = pages.length > 0
    ? pages.flatMap((page) =>
      page.text.replace(/\r\n?/g, '\n').split(/\n+/)
        .map((paragraph) => ({ text: paragraph, pageNumber: page.pageNumber })),
    )
    : text.replace(/\r\n?/g, '\n').split(/\n+/).map((paragraph) => ({ text: paragraph }));
  const paragraphs = sourceParagraphs
    .map((paragraph) => ({
      ...paragraph,
      text: paragraph.text.replace(/\s+/g, ' ').trim(),
    }))
    .filter((paragraph) => paragraph.text);
  const chunks = [];
  let currentWords = [];
  let previousWords = [];

  function saveChunk(words) {
    const chunkText = words.map((word) => word.text).join(' ').trim();
    if (!chunkText) return;
    const pageNumbers = [...new Set(words.map((word) => word.pageNumber)
      .filter(Number.isInteger))].sort((left, right) => left - right);

    chunks.push({
      filename,
      chunkIndex: chunks.length + 1,
      text: chunkText,
      ...(pageNumbers.length > 0 ? { pageNumbers } : {}),
    });
    previousWords = [...words];
  }

  function splitLongParagraph(words, previousChunkWords) {
    let start = 0;
    let prefix = previousChunkWords.slice(-OVERLAP_WORDS);

    while (start < words.length) {
      const contentLimit = TARGET_WORDS_PER_CHUNK - prefix.length;
      const content = words.slice(start, start + contentLimit);
      saveChunk([...prefix, ...content]);
      if (start + content.length >= words.length) break;
      start += Math.max(1, content.length - OVERLAP_WORDS);
      prefix = [];
    }
  }

  for (const paragraph of paragraphs) {
    const words = paragraph.text.split(' ')
      .map((word) => ({ text: word, pageNumber: paragraph.pageNumber }));

    if (words.length > TARGET_WORDS_PER_CHUNK - OVERLAP_WORDS) {
      if (currentWords.length > 0) {
        saveChunk(currentWords);
        currentWords = [];
      }
      splitLongParagraph(words, previousWords);
      continue;
    }

    if (currentWords.length + words.length > TARGET_WORDS_PER_CHUNK) {
      saveChunk(currentWords);
      currentWords = previousWords.slice(-OVERLAP_WORDS);
    }

    currentWords.push(...words);
  }

  if (currentWords.length > 0) saveChunk(currentWords);
  return chunks;
}

module.exports = {
  chunkText,
  TARGET_WORDS_PER_CHUNK,
  OVERLAP_WORDS,
};
