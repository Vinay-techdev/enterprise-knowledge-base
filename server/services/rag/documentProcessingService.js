import Document from "../../models/Document.js";
import DocumentChunk from "../../models/DocumentChunk.js";
import { getDocumentFileBuffer } from "../storage/storageService.js";
import { generateDocumentEmbedding } from "./embeddingService.js";
import { splitTextIntoChunks } from "./textChunkingService.js";
import { extractTextFromDocument } from "./textExtractionService.js";
import { generateDocumentIntelligence } from "./documentIntelligenceService.js";

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

    // Makes reprocessing safe by removing old chunks first.
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

    /*
     * Document intelligence is optional enrichment.
     * If classification or metadata generation fails,
     * chunking and embedding should still continue.
     */
    let intelligence = null;

    try {
      intelligence = await generateDocumentIntelligence({
        text: extractedText,
        originalName: document.originalName,
        currentTitle: document.title,
      });
    } catch (error) {
      console.warn(
        `Document intelligence failed for ${document._id}:`,
        getSafeErrorMessage(error),
      );
    }

    const chunks = splitTextIntoChunks(extractedText);

    if (chunks.length === 0) {
      throw new Error("Document did not produce any text chunks");
    }

    const chunkDocuments = [];

    // Sequential processing reduces the risk of hitting API rate limits.
    for (const chunk of chunks) {
      const embedding = await generateDocumentEmbedding({
        title: intelligence?.generatedTitle || document.title,
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
          title: intelligence?.generatedTitle || document.title,
          pageNumber: null,
        },
      });
    }

    await DocumentChunk.insertMany(chunkDocuments);

    const documentUpdate = {
      status: "ready",
      processingError: null,
      chunkCount: chunkDocuments.length,
      processedAt: new Date(),
    };

    if (intelligence) {
      documentUpdate.documentType = intelligence.documentType;

      documentUpdate.intelligence = {
        generatedTitle: intelligence.generatedTitle,

        summary: intelligence.summary,

        keywords: intelligence.keywords,

        entities: intelligence.entities,

        generatedAt: new Date(),
      };
    }

    await Document.findByIdAndUpdate(document._id, documentUpdate);

    return {
      documentId: document._id,
      chunkCount: chunkDocuments.length,
      intelligenceGenerated: Boolean(intelligence),
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
