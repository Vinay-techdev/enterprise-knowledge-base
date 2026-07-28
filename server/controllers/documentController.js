import path from "path";
import Document from "../models/Document.js";
import Organization from "../models/Organization.js";
import { logActivity } from "../services/activityService.js";
import {
  activeStorageProvider,
  deleteDocumentFile,
  getDocumentDownload,
  uploadDocumentFile
} from "../services/storage/storageService.js";
import {
  cleanText,
  isObjectId
} from "../utils/validation.js";

const getOrganizationId = (req) =>
  req.user.organization._id;

export const listDocuments = async (
  req,
  res,
  next
) => {
  try {
    const documents = await Document.find({
      organization: getOrganizationId(req)
    })
      .populate("uploadedBy", "name email")
      .sort({
        createdAt: -1
      });

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    next(error);
  }
};

export const uploadFile = async (
  req,
  res,
  next
) => {
  let storedFile = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Select a document to upload"
      });
    }

    const title =
      cleanText(req.body.title) ||
      path.parse(req.file.originalname).name;

    if (title.length > 160) {
      return res.status(400).json({
        success: false,
        message:
          "Document title must not exceed 160 characters"
      });
    }

    storedFile = await uploadDocumentFile({
      file: req.file,
      organizationId: getOrganizationId(req)
    });

    const document = await Document.create({
      title,
      originalName: req.file.originalname,
      storedName: storedFile.storedName,
      mimeType: req.file.mimetype,
      size: req.file.size,

      storageProvider: storedFile.provider,
      storageKey: storedFile.key,

      organization: getOrganizationId(req),
      uploadedBy: req.user._id,
      status: "ready"
    });

    await Organization.findByIdAndUpdate(
      getOrganizationId(req),
      {
        $inc: {
          storageUsed: req.file.size
        }
      }
    );

    await logActivity({
      action: "DOCUMENT_UPLOADED",
      description:
        `${req.user.name} uploaded ${document.originalName}`,
      organization: getOrganizationId(req),
      user: req.user._id,
      document: document._id
    });

    await document.populate(
      "uploadedBy",
      "name email"
    );

    res.status(201).json({
      success: true,
      document
    });
  } catch (error) {
    if (storedFile) {
      await deleteDocumentFile({
        document: {
          storageProvider: storedFile.provider,
          storageKey: storedFile.key
        }
      }).catch(() => {});
    }

    next(error);
  }
};

export const downloadFile = async (
  req,
  res,
  next
) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document identifier"
      });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      organization: getOrganizationId(req)
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const download = await getDocumentDownload({
      document
    });

    await logActivity({
      action: "DOCUMENT_DOWNLOADED",
      description:
        `${req.user.name} downloaded ${document.originalName}`,
      organization: getOrganizationId(req),
      user: req.user._id,
      document: document._id
    });

    if (download.type === "redirect") {
      return res.json({
        success: true,
        downloadUrl: download.url,
        expiresIn: download.expiresIn
      });
    }

    return res.download(
      download.path,
      document.originalName,
      (error) => {
        if (error && !res.headersSent) {
          next(error);
        }
      }
    );
  } catch (error) {
    if (
      error.name === "NoSuchKey" ||
      error.$metadata?.httpStatusCode === 404 ||
      error.code === "ENOENT"
    ) {
      return res.status(410).json({
        success: false,
        message:
          "The stored file is unavailable. Ask an admin to remove this record."
      });
    }

    next(error);
  }
};

export const deleteFile = async (
  req,
  res,
  next
) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document identifier"
      });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      organization: getOrganizationId(req)
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const canDelete =
      req.user.role === "admin" ||
      document.uploadedBy.toString() === req.user.id;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message:
          "You can delete only documents you uploaded"
      });
    }

    await deleteDocumentFile({
      document
    });

    await Document.deleteOne({
      _id: document._id
    });

    await Organization.findByIdAndUpdate(
      getOrganizationId(req),
      [
        {
          $set: {
            storageUsed: {
              $max: [
                0,
                {
                  $subtract: [
                    "$storageUsed",
                    document.size
                  ]
                }
              ]
            }
          }
        }
      ]
    );

    await logActivity({
      action: "DOCUMENT_DELETED",
      description:
        `${req.user.name} deleted ${document.originalName}`,
      organization: getOrganizationId(req),
      user: req.user._id
    });

    res.json({
      success: true,
      message: "Document deleted"
    });
  } catch (error) {
    next(error);
  }
};