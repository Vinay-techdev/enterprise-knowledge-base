import multer from "multer";

const allowedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]);

const memoryStorage = multer.memoryStorage();

export const uploadDocument = multer({
  storage: memoryStorage,

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(
        new Error("Only PDF, DOCX and TXT files are allowed")
      );
    }

    callback(null, true);
  }
});