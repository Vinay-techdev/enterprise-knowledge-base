import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDir = path.resolve("uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`);
  },
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) return cb(new Error("Only PDF, DOCX and TXT files are allowed"));
    cb(null, true);
  },
});
