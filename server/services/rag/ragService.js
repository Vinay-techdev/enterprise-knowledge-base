import { searchRelevantChunks } from "./vectorSearchService.js";
import { generateGroundedAnswer } from "./answerGenerationService.js";

const getNumberFromEnvironment = ({ name, fallback }) => {
  const value = Number.parseFloat(process.env[name]);

  return Number.isFinite(value) ? value : fallback;
};

const minimumScore = getNumberFromEnvironment({
  name: "RAG_MIN_SCORE",
  fallback: 0.7,
});

const maximumContextCharacters = Math.max(
  1000,
  Number.parseInt(process.env.RAG_MAX_CONTEXT_CHARS || "12000", 10) || 12000,
);

const normalizeQuestion = (question) => {
  if (typeof question !== "string") {
    throw new Error("Question must be a string");
  }

  const normalized = question.trim();

  if (!normalized) {
    throw new Error("Question is required");
  }

  if (normalized.length > 1000) {
    throw new Error("Question must not exceed 1000 characters");
  }

  return normalized;
};

const createSourceKey = (chunk) => `${chunk.document}:${chunk.chunkIndex}`;

const buildSources = (chunks) => {
  const seen = new Set();

  return chunks
    .filter((chunk) => {
      const key = createSourceKey(chunk);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((chunk, index) => ({
      citationNumber: index + 1,
      documentId: chunk.document,
      chunkId: chunk._id,
      chunkIndex: chunk.chunkIndex,
      title:
        chunk.metadata?.title ||
        chunk.metadata?.originalName ||
        "Untitled document",
      originalName: chunk.metadata?.originalName || null,
      score: chunk.score,
      preview: chunk.content.slice(0, 300),
    }));
};

const buildContext = ({ chunks, sources }) => {
  const sourceNumberByKey = new Map(
    sources.map((source) => [
      `${source.documentId}:${source.chunkIndex}`,
      source.citationNumber,
    ]),
  );

  let context = "";

  for (const chunk of chunks) {
    const sourceNumber = sourceNumberByKey.get(createSourceKey(chunk));

    const block = [
      `[Source ${sourceNumber}]`,
      `Title: ${chunk.metadata?.title || "Untitled document"}`,
      `Filename: ${chunk.metadata?.originalName || "Unknown"}`,
      `Chunk: ${chunk.chunkIndex}`,
      "",
      chunk.content,
      "",
      "---",
      "",
    ].join("\n");

    if (context.length + block.length > maximumContextCharacters) {
      break;
    }

    context += block;
  }

  return context.trim();
};

export const answerQuestionWithRag = async ({
  question,
  organizationId,
  documentId,
}) => {
  const normalizedQuestion = normalizeQuestion(question);

  const retrievedChunks = await searchRelevantChunks({
    question: normalizedQuestion,
    organizationId,
    documentId,
  });

  const relevantChunks = retrievedChunks.filter(
    (chunk) => typeof chunk.score === "number" && chunk.score >= minimumScore,
  );

  if (relevantChunks.length === 0) {
    return {
      answer: "I couldn't find enough information in the available documents.",
      sources: [],
      retrieval: {
        retrievedCount: retrievedChunks.length,
        relevantCount: 0,
      },
    };
  }

  const sources = buildSources(relevantChunks);

  const context = buildContext({
    chunks: relevantChunks,
    sources,
  });

  if (!context) {
    return {
      answer: "I couldn't find enough information in the available documents.",
      sources: [],
      retrieval: {
        retrievedCount: retrievedChunks.length,
        relevantCount: 0,
      },
    };
  }

  const answer = await generateGroundedAnswer({
    question: normalizedQuestion,
    context,
  });

  return {
    answer,
    sources,
    retrieval: {
      retrievedCount: retrievedChunks.length,
      relevantCount: relevantChunks.length,
    },
  };
};
