import Document from "../../models/Document.js";
import DocumentChunk from "../../models/DocumentChunk.js";
import { getDocumentFileBuffer } from "../storage/storageService.js";
import { generateDocumentEmbedding } from "./embeddingService.js";
import { splitTextIntoChunks } from "./textChunkingService.js";
import { extractTextFromDocument } from "./textExtractionService.js";

const getSafeErrorMessage = (error) => {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown document processing error";

  return message.slice(0, 500);
};

export const processDocumentForRag = async (documentId) => {
  const document = await Document.findById(documentId);

  if (!document) {
    throw new Error(`Document not found: ${documentId}`);
  }

  try {
    await Document.findByIdAndUpdate(document._id, {
      status: "processing",
      processingError: null,
      chunkCount: 0,
      processedAt: null,
    });

    // Makes reprocessing safe.
    await DocumentChunk.deleteMany({
      document: document._id,
    });

    const buffer = await getDocumentFileBuffer({
      document,
    });

    const extractedText = await extractTextFromDocument({
      buffer,
      mimeType: document.mimeType,
    });

    const chunks = splitTextIntoChunks(extractedText);

    if (chunks.length === 0) {
      throw new Error("Document did not produce any text chunks");
    }

    const chunkDocuments = [];

    // Sequential processing avoids hitting API rate limits
    // while we are developing.
    for (const chunk of chunks) {
      const embedding = await generateDocumentEmbedding({
        title: document.title,
        content: chunk.content,
      });

      chunkDocuments.push({
        document: document._id,
        organization: document.organization,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding,

        metadata: {
          originalName: document.originalName,
          title: document.title,
          pageNumber: null,
        },
      });
    }

    await DocumentChunk.insertMany(chunkDocuments);

    await Document.findByIdAndUpdate(document._id, {
      status: "ready",
      processingError: null,
      chunkCount: chunkDocuments.length,
      processedAt: new Date(),
    });

    return {
      documentId: document._id,
      chunkCount: chunkDocuments.length,
    };
  } catch (error) {
    await DocumentChunk.deleteMany({
      document: document._id,
    });

    await Document.findByIdAndUpdate(document._id, {
      status: "failed",
      processingError: getSafeErrorMessage(error),
      chunkCount: 0,
      processedAt: null,
    });

    throw error;
  }
};
