import { searchRelevantChunks } from "./vectorSearchService.js";
import { generateGroundedAnswer } from "./answerGenerationService.js";
import { buildAllDocumentsSummaryContext } from "./documentSummaryService.js";

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

const summaryMaximumOutputTokens = Math.max(
  1000,
  Number.parseInt(process.env.GEMINI_SUMMARY_MAX_OUTPUT_TOKENS || "2500", 10) ||
    2500,
);

const normalizeQuestion = (question) => {
  if (typeof question !== "string") {
    throw new Error("Question must be a string");
  }

  const normalizedQuestion = question.trim();

  if (!normalizedQuestion) {
    throw new Error("Question is required");
  }

  if (normalizedQuestion.length > 1000) {
    throw new Error("Question must not exceed 1000 characters");
  }

  return normalizedQuestion;
};

const normalizeId = (value) =>
  value?._id?.toString?.() || value?.toString?.() || String(value);

const isAllDocumentsSummaryQuestion = ({ question, documentId }) => {
  if (documentId) {
    return false;
  }

  const normalizedQuestion = question
    .toLowerCase()
    .replace(/[?.!,]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const explicitPatterns = [
    "summarize all documents",
    "summarise all documents",
    "summarize the available documents",
    "summarise the available documents",
    "summarize available documents",
    "summarise available documents",
    "summary of all documents",
    "summary of the available documents",
    "give me a summary of all documents",
    "give me an overview of all documents",
    "overview of all documents",
    "overview of the available documents",
    "describe all documents",
    "explain all documents",
    "what documents are available",
    "summarize the knowledge base",
    "summarise the knowledge base",
    "overview of the knowledge base",
  ];

  const matchesExplicitPattern = explicitPatterns.some((pattern) =>
    normalizedQuestion.includes(pattern),
  );

  if (matchesExplicitPattern) {
    return true;
  }

  const hasSummaryIntent =
    normalizedQuestion.includes("summarize") ||
    normalizedQuestion.includes("summarise") ||
    normalizedQuestion.includes("summary") ||
    normalizedQuestion.includes("overview");

  const hasAllDocumentsIntent =
    normalizedQuestion.includes("all document") ||
    normalizedQuestion.includes("available document") ||
    normalizedQuestion.includes("knowledge base");

  return hasSummaryIntent && hasAllDocumentsIntent;
};

const createSourceKey = (chunk) =>
  `${normalizeId(chunk.document)}:${chunk.chunkIndex}`;

const buildSources = (chunks) => {
  const seenSources = new Set();

  return chunks
    .filter((chunk) => {
      const sourceKey = createSourceKey(chunk);

      if (seenSources.has(sourceKey)) {
        return false;
      }

      seenSources.add(sourceKey);

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
      score: typeof chunk.score === "number" ? chunk.score : null,
      preview:
        typeof chunk.content === "string"
          ? chunk.content.slice(0, 300).trim()
          : "",
    }));
};

const buildContext = ({ chunks, sources }) => {
  const citationNumberBySource = new Map(
    sources.map((source) => [
      `${normalizeId(source.documentId)}:${source.chunkIndex}`,
      source.citationNumber,
    ]),
  );

  let context = "";

  for (const chunk of chunks) {
    const citationNumber = citationNumberBySource.get(createSourceKey(chunk));

    if (!citationNumber) {
      continue;
    }

    const content =
      typeof chunk.content === "string" ? chunk.content.trim() : "";

    if (!content) {
      continue;
    }

    const block = [
      `[Source ${citationNumber}]`,
      `Title: ${
        chunk.metadata?.title ||
        chunk.metadata?.originalName ||
        "Untitled document"
      }`,
      `Filename: ${chunk.metadata?.originalName || "Unknown"}`,
      `Chunk: ${chunk.chunkIndex}`,
      "",
      content,
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

const createEmptyResponse = ({ retrievedCount = 0, mode }) => ({
  answer: "I couldn't find enough information in the available documents.",
  sources: [],
  retrieval: {
    retrievedCount,
    relevantCount: 0,
    documentCount: 0,
    mode,
  },
});

const answerAllDocumentsSummary = async ({
  organizationId,
  originalQuestion,
}) => {
  const summaryData = await buildAllDocumentsSummaryContext({
    organizationId,
  });

  if (!summaryData.context || summaryData.sources.length === 0) {
    return {
      answer: "I couldn't find any ready documents to summarize.",
      sources: [],
      retrieval: {
        retrievedCount: 0,
        relevantCount: 0,
        documentCount: 0,
        includedChunkCount: 0,
        mode: "all-documents-summary",
      },
    };
  }

  const summaryQuestion = `
The user asked:

"${originalQuestion}"

Summarize every document included in the supplied context.

Formatting requirements:

- Start with the heading: "## Knowledge Base Summary".
- Create one section for each document using a level-three Markdown heading.
- Use the document title as the heading.
- Under each document, write:
  - A one-sentence purpose.
  - Three to six concise bullet points containing the most important information.
- Cite each bullet only when necessary.
- Prefer one citation at the end of a bullet instead of citing every sentence.
- Do not repeat the same citation multiple times in one bullet.
- Do not create separate "Purpose" and "Summary of Important Information" headings.
- Keep each document summary concise and easy to scan.
- Include every document supplied in the context.
- Do not focus only on the first document.
- Do not invent or infer unsupported information.

Privacy requirements:

- Do not expose full phone numbers, email addresses, postal addresses, transaction IDs, receipt IDs, student identifiers, or other sensitive identifiers unless the user specifically requests them.
- You may describe the existence and purpose of such identifiers without reproducing their complete values.
- Financial totals and general academic or professional information may be included when relevant.

Accuracy requirements:

- Preserve factual values such as dates, amounts, qualifications, technologies, and scores.
- Do not repeat malformed amount-in-words text when the numeric amount is already available.
- If extracted text appears inconsistent, use cautious language instead of correcting it without evidence.

Finish with:

### Combined Overview

Write two to four concise sentences explaining what types of information are represented across the complete knowledge base.

Do not repeat every detail from the individual document summaries in the combined overview.
    `.trim();

  const answer = await generateGroundedAnswer({
    question: summaryQuestion,
    context: summaryData.context,
    maxOutputTokens: summaryMaximumOutputTokens,
  });

  return {
    answer,
    sources: summaryData.sources,
    retrieval: {
      retrievedCount: summaryData.includedChunkCount,
      relevantCount: summaryData.sources.length,
      documentCount: summaryData.documentCount,
      includedChunkCount: summaryData.includedChunkCount,
      mode: "all-documents-summary",
    },
  };
};

export const answerQuestionWithRag = async ({
  question,
  organizationId,
  documentId,
}) => {
  const normalizedQuestion = normalizeQuestion(question);

  if (!organizationId) {
    throw new Error("Organization ID is required");
  }

  const shouldSummarizeAllDocuments = isAllDocumentsSummaryQuestion({
    question: normalizedQuestion,
    documentId,
  });

  if (shouldSummarizeAllDocuments) {
    return answerAllDocumentsSummary({
      organizationId,
      originalQuestion: normalizedQuestion,
    });
  }

  const mode = documentId ? "single-document-search" : "semantic-search";

  const retrievedChunks = await searchRelevantChunks({
    question: normalizedQuestion,
    organizationId,
    documentId,
  });

  const relevantChunks = retrievedChunks.filter(
    (chunk) => typeof chunk.score === "number" && chunk.score >= minimumScore,
  );

  if (relevantChunks.length === 0) {
    return createEmptyResponse({
      retrievedCount: retrievedChunks.length,
      mode,
    });
  }

  const sources = buildSources(relevantChunks);

  const context = buildContext({
    chunks: relevantChunks,
    sources,
  });

  if (!context) {
    return createEmptyResponse({
      retrievedCount: retrievedChunks.length,
      mode,
    });
  }

  const answer = await generateGroundedAnswer({
    question: normalizedQuestion,
    context,
  });

  const documentCount = new Set(
    sources.map((source) => normalizeId(source.documentId)),
  ).size;

  return {
    answer,
    sources,
    retrieval: {
      retrievedCount: retrievedChunks.length,
      relevantCount: relevantChunks.length,
      documentCount,
      mode,
    },
  };
};
