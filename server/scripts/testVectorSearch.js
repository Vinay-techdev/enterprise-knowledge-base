import "dotenv/config";
import mongoose from "mongoose";
import { searchRelevantChunks } from "../services/rag/vectorSearchService.js";

const connectDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(process.env.MONGODB_URI);
};

const run = async () => {
  try {
    await connectDatabase();

    const organizationId = process.argv[2];

    const question = process.argv.slice(3).join(" ");

    if (!organizationId || !question) {
      throw new Error(
        'Usage: node scripts/testVectorSearch.js <organizationId> "<question>"',
      );
    }

    const results = await searchRelevantChunks({
      organizationId,
      question,
      topK: 5,
    });

    console.log(
      JSON.stringify(
        results.map((result) => ({
          document: result.document,
          chunkIndex: result.chunkIndex,
          score: result.score,
          title: result.metadata?.title,
          contentPreview: result.content.slice(0, 250),
        })),
        null,
        2,
      ),
    );
  } catch (error) {
    console.error("Vector search test failed:", error);

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
