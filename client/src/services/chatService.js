import api from "../api/client";

export const askKnowledgeBase = async ({
  question,
  documentId = null,
}) => {
  const payload = {
    question: question.trim(),
  };

  if (documentId) {
    payload.documentId = documentId;
  }

  const { data } = await api.post(
    "/chat/ask",
    payload,
  );

  return data;
};