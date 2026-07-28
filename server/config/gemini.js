import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required");
}

export const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const embeddingModel =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";

export const embeddingDimensions = Number.parseInt(
  process.env.GEMINI_EMBEDDING_DIMENSIONS || "768",
  10,
);

if (!Number.isInteger(embeddingDimensions) || embeddingDimensions <= 0) {
  throw new Error("GEMINI_EMBEDDING_DIMENSIONS must be a positive integer");
}
