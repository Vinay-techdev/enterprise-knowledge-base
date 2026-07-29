import {
  embeddingDimensions,
  embeddingModel,
  geminiClient,
} from "../../config/gemini.js";

const prepareDocumentText = ({ title, content }) =>
  `title: ${title || "none"} | text: ${content}`;

export const generateDocumentEmbedding = async ({ title, content }) => {
  const response = await geminiClient.models.embedContent({
    model: embeddingModel,

    contents: prepareDocumentText({
      title,
      content,
    }),

    config: {
      outputDimensionality: embeddingDimensions,
    },
  });

  const values = response.embeddings?.[0]?.values;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini did not return a document embedding");
  }

  if (values.length !== embeddingDimensions) {
    throw new Error(
      `Expected ${embeddingDimensions} embedding dimensions but received ${values.length}`,
    );
  }

  return values;
};

export const generateQueryEmbedding = async (question) => {
  const response = await geminiClient.models.embedContent({
    model: embeddingModel,

    contents: `task: question answering | query: ${question}`,

    config: {
      outputDimensionality: embeddingDimensions,
    },
  });

  const values = response.embeddings?.[0]?.values;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini did not return a query embedding");
  }

  return values;
};
