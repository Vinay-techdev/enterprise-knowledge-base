import mongoose from "mongoose";
import DocumentChunk from "../../models/DocumentChunk.js";
import { generateQueryEmbedding } from "./embeddingService.js";

const vectorIndexName =
  process.env.RAG_VECTOR_INDEX || "document_chunks_vector_index";

const defaultTopK = Number.parseInt(process.env.RAG_TOP_K || "5", 10);

const getPositiveInteger = (value, fallback, name) => {
  if (Number.isInteger(value) && value > 0) {
    return value;
  }

  if (value !== undefined) {
    console.warn(`${name} is invalid. Using ${fallback}.`);
  }

  return fallback;
};

const normalizeObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName} identifier`);
  }

  return new mongoose.Types.ObjectId(value);
};

export const searchRelevantChunks = async ({
  question,
  organizationId,
  documentId,
  topK = defaultTopK,
}) => {
  const cleanQuestion = question?.trim();

  if (!cleanQuestion) {
    throw new Error("A question is required for vector search");
  }

  const normalizedTopK = getPositiveInteger(topK, defaultTopK, "topK");

  const organizationObjectId = normalizeObjectId(
    organizationId,
    "organization",
  );

  const filter = {
    organization: organizationObjectId,
  };

  if (documentId) {
    filter.document = normalizeObjectId(documentId, "document");
  }

  const queryVector = await generateQueryEmbedding(cleanQuestion);

  const numCandidates = Math.max(normalizedTopK * 10, 50);

  //? Log the filter for debugging purposes
  console.log("Vector search filter:", {
  organization: filter.organization.toString(),
  document: filter.document?.toString() || null,
});

  const results = await DocumentChunk.aggregate([
    {
      $vectorSearch: {
        index: vectorIndexName,
        path: "embedding",
        queryVector,
        numCandidates,
        limit: normalizedTopK,
        filter,
      },
    },
    {
      $project: {
        _id: 1,
        document: 1,
        organization: 1,
        chunkIndex: 1,
        content: 1,
        metadata: 1,

        score: {
          $meta: "vectorSearchScore",
        },
      },
    },
  ]);

  return results;
};
