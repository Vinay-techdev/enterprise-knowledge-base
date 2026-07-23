import fs from "fs/promises";
import path from "path";
import Document from "../models/Document.js";
import Organization from "../models/Organization.js";
import { logActivity } from "../services/activityService.js";
import { cleanText, isObjectId } from "../utils/validation.js";

const organizationId = (req) => req.user.organization._id;

export const listDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ organization: organizationId(req) })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, documents });
  } catch (error) { next(error); }
};

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Select a document to upload" });
    const title = cleanText(req.body.title) || path.parse(req.file.originalname).name;
    if (title.length > 160) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ success: false, message: "Document title must not exceed 160 characters" });
    }

    const document = await Document.create({
      title,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storageKey: req.file.path,
      organization: organizationId(req),
      uploadedBy: req.user._id,
      status: "ready"
    });
    await Organization.findByIdAndUpdate(organizationId(req), { $inc: { storageUsed: req.file.size } });
    await logActivity({ action: "DOCUMENT_UPLOADED", description: `${req.user.name} uploaded ${document.originalName}`, organization: organizationId(req), user: req.user._id, document: document._id });
    await document.populate("uploadedBy", "name email");
    res.status(201).json({ success: true, document });
  } catch (error) {
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
    next(error);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid document identifier" });
    const document = await Document.findOne({ _id: req.params.id, organization: organizationId(req) });
    if (!document) return res.status(404).json({ success: false, message: "Document not found" });

    const filePath = path.resolve(document.storageKey);
    try { await fs.access(filePath); }
    catch { return res.status(410).json({ success: false, message: "The stored file is unavailable. Ask an admin to remove this record." }); }

    await logActivity({ action: "DOCUMENT_DOWNLOADED", description: `${req.user.name} downloaded ${document.originalName}`, organization: organizationId(req), user: req.user._id, document: document._id });
    res.download(filePath, document.originalName, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) { next(error); }
};

export const deleteFile = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid document identifier" });
    const document = await Document.findOne({ _id: req.params.id, organization: organizationId(req) });
    if (!document) return res.status(404).json({ success: false, message: "Document not found" });
    const canDelete = req.user.role === "admin" || document.uploadedBy.toString() === req.user.id;
    if (!canDelete) return res.status(403).json({ success: false, message: "You can delete only documents you uploaded" });

    await fs.unlink(path.resolve(document.storageKey)).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    await Document.deleteOne({ _id: document._id });
    await Organization.findByIdAndUpdate(organizationId(req), [{ $set: { storageUsed: { $max: [0, { $subtract: ["$storageUsed", document.size] }] } } }]);
    await logActivity({ action: "DOCUMENT_DELETED", description: `${req.user.name} deleted ${document.originalName}`, organization: organizationId(req), user: req.user._id });
    res.json({ success: true, message: "Document deleted" });
  } catch (error) { next(error); }
};
