const getPositiveInteger = (value, fallback, variableName) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    if (value !== undefined) {
      console.warn(`${variableName} is invalid. Using ${fallback}.`);
    }

    return fallback;
  }

  return parsed;
};

const chunkSize = getPositiveInteger(
  process.env.RAG_CHUNK_SIZE,
  1000,
  "RAG_CHUNK_SIZE",
);

const chunkOverlap = getPositiveInteger(
  process.env.RAG_CHUNK_OVERLAP,
  200,
  "RAG_CHUNK_OVERLAP",
);

if (chunkOverlap >= chunkSize) {
  throw new Error("RAG_CHUNK_OVERLAP must be smaller than RAG_CHUNK_SIZE");
}

const findNaturalBreak = (text, start, proposedEnd) => {
  if (proposedEnd >= text.length) {
    return text.length;
  }

  const minimumBreakPosition = start + Math.floor(chunkSize * 0.6);

  const candidates = [
    text.lastIndexOf("\n\n", proposedEnd),
    text.lastIndexOf(". ", proposedEnd),
    text.lastIndexOf("? ", proposedEnd),
    text.lastIndexOf("! ", proposedEnd),
    text.lastIndexOf(" ", proposedEnd),
  ];

  const naturalBreak = Math.max(...candidates);

  if (naturalBreak >= minimumBreakPosition) {
    return naturalBreak + 1;
  }

  return proposedEnd;
};

export const splitTextIntoChunks = (text) => {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return [];
  }

  const chunks = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < normalizedText.length) {
    const proposedEnd = Math.min(start + chunkSize, normalizedText.length);

    const end = findNaturalBreak(normalizedText, start, proposedEnd);

    const content = normalizedText.slice(start, end).trim();

    if (content) {
      chunks.push({
        chunkIndex,
        content,
        startCharacter: start,
        endCharacter: end,
      });

      chunkIndex += 1;
    }

    if (end >= normalizedText.length) {
      break;
    }

    const nextStart = end - chunkOverlap;

    // Prevent an accidental infinite loop.
    start = nextStart > start ? nextStart : end;
  }

  return chunks;
};
