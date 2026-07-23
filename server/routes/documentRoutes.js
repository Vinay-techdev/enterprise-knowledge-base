import { Router } from "express";
import { deleteFile, downloadFile, listDocuments, uploadFile } from "../controllers/documentController.js";
import { uploadDocument } from "../config/upload.js";
import { protect } from "../middlewares/auth.js";

const router = Router();
router.use(protect);
router.get("/", listDocuments);
router.post("/", uploadDocument.single("file"), uploadFile);
router.get("/:id/download", downloadFile);
router.delete("/:id", deleteFile);
export default router;
