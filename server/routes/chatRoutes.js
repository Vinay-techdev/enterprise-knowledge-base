import express from "express";
import { askQuestion } from "../controllers/chatController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/ask", protect, askQuestion);

export default router;
