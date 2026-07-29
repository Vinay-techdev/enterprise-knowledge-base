import Document from "../models/Document.js";
import { answerQuestionWithRag } from "../services/rag/ragService.js";
import { cleanText, isObjectId } from "../utils/validation.js";

const getOrganizationId = (req) =>
  req.user.organization?._id ?? req.user.organization;

export const askQuestion = async (req, res, next) => {
  try {
    const question = cleanText(req.body.question);

    const documentId =
      typeof req.body.documentId === "string"
        ? req.body.documentId.trim()
        : null;

    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Organization information is missing",
      });
    }

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    if (question.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Question must not exceed 1000 characters",
      });
    }

    if (documentId && !isObjectId(documentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document identifier",
      });
    }

    if (documentId) {
      console.log("Single-document RAG request:", {
        documentId,
        organizationId: organizationId.toString(),
      });

      const document = await Document.findOne({
        _id: documentId,
        organization: organizationId,
      }).select("_id organization status title originalName");

      if (!document) {
        const documentById = await Document.findById(documentId).select(
          "_id organization status title originalName",
        );

        console.log(
          "Document exists without organization filter:",
          documentById,
        );

        return res.status(404).json({
          success: false,
          message: "Document not found",
        });
      }

      if (document.status !== "ready") {
        return res.status(409).json({
          success: false,
          message: "The selected document is not ready for questions",
        });
      }
    }

    const result = await answerQuestionWithRag({
      question,
      organizationId,
      documentId,
    });

    return res.status(200).json({
      success: true,
      question,
      answer: result.answer,
      sources: result.sources,
      retrieval: result.retrieval,
    });
  } catch (error) {
    next(error);
  }
};
