import Document from "../../models/Document.js";
import DocumentChunk from "../../models/DocumentChunk.js";

const getPositiveInteger = ({ name, fallback, minimum = 1 }) => {
  const parsed = Number.parseInt(process.env[name] || "", 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(minimum, parsed);
};

const maximumChunksPerDocument = getPositiveInteger({
  name: "RAG_SUMMARY_CHUNKS_PER_DOCUMENT",
  fallback: 8,
});

const maximumSummaryContextCharacters = getPositiveInteger({
  name: "RAG_SUMMARY_MAX_CONTEXT_CHARS",
  fallback: 30000,
  minimum: 5000,
});

const normalizeDocumentId = (value) =>
  value?._id?.toString?.() || value?.toString?.() || String(value);

const buildDocumentSection = ({ document, chunks, citationNumber }) => {
  const documentText = chunks
    .map((chunk) => chunk.content?.trim())
    .filter(Boolean)
    .join("\n\n");

  if (!documentText) {
    return null;
  }

  return [
    `[Source ${citationNumber}]`,
    `Document title: ${
      document.title || document.originalName || "Untitled document"
    }`,
    `Filename: ${document.originalName || "Unknown"}`,
    "",
    documentText,
  ].join("\n");
};

export const buildAllDocumentsSummaryContext = async ({ organizationId }) => {
  if (!organizationId) {
    throw new Error(
      "Organization ID is required to build document summary context",
    );
  }

  const documents = await Document.find({
    organization: organizationId,
    status: "ready",
  })
    .select("_id title originalName createdAt")
    .sort({ createdAt: -1 })
    .lean();

  if (documents.length === 0) {
    return {
      context: "",
      sources: [],
      documentCount: 0,
      includedChunkCount: 0,
    };
  }

  const documentIds = documents.map((document) => document._id);

  const allChunks = await DocumentChunk.find({
    organization: organizationId,
    document: { $in: documentIds },
  })
    .select("_id document chunkIndex content")
    .sort({
      document: 1,
      chunkIndex: 1,
    })
    .lean();

  const chunksByDocument = new Map();

  for (const chunk of allChunks) {
    const documentKey = normalizeDocumentId(chunk.document);

    if (!chunksByDocument.has(documentKey)) {
      chunksByDocument.set(documentKey, []);
    }

    const documentChunks = chunksByDocument.get(documentKey);

    if (documentChunks.length < maximumChunksPerDocument) {
      documentChunks.push(chunk);
    }
  }

  const contextSections = [];
  const sources = [];

  let contextLength = 0;
  let includedChunkCount = 0;

  for (const document of documents) {
    const documentKey = normalizeDocumentId(document._id);

    const chunks = chunksByDocument.get(documentKey) || [];

    if (chunks.length === 0) {
      continue;
    }

    const citationNumber = sources.length + 1;

    const section = buildDocumentSection({
      document,
      chunks,
      citationNumber,
    });

    if (!section) {
      continue;
    }

    const separator =
      contextSections.length > 0 ? "\n\n--------------------\n\n" : "";

    const additionalLength = separator.length + section.length;

    if (contextLength + additionalLength > maximumSummaryContextCharacters) {
      break;
    }

    contextSections.push(section);
    contextLength += additionalLength;
    includedChunkCount += chunks.length;

    const preview = chunks
      .map((chunk) => chunk.content)
      .filter(Boolean)
      .join(" ")
      .slice(0, 300);

    sources.push({
      citationNumber,
      documentId: document._id,
      chunkId: chunks[0]?._id || null,
      chunkIndex: null,
      title: document.title || document.originalName || "Untitled document",
      originalName: document.originalName || null,
      score: null,
      preview,
    });
  }

  return {
    context: contextSections.join("\n\n--------------------\n\n"),
    sources,
    documentCount: sources.length,
    includedChunkCount,
  };
};
