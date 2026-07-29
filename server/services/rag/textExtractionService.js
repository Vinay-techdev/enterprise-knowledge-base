import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const MIME_TYPES = {
  PDF: "application/pdf",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  TXT: "text/plain",
};

const normalizeExtractedText = (text) =>
  text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const extractPdfText = async (buffer) => {
  const parser = new PDFParse({
    data: buffer,
  });

  try {
    const result = await parser.getText();

    return result.text;
  } finally {
    await parser.destroy();
  }
};

const extractDocxText = async (buffer) => {
  const result = await mammoth.extractRawText({
    buffer,
  });

  return result.value;
};

const extractTxtText = (buffer) => buffer.toString("utf8");

export const extractTextFromDocument = async ({ buffer, mimeType }) => {
  let extractedText;

  switch (mimeType) {
    case MIME_TYPES.PDF:
      extractedText = await extractPdfText(buffer);
      break;

    case MIME_TYPES.DOCX:
      extractedText = await extractDocxText(buffer);
      break;

    case MIME_TYPES.TXT:
      extractedText = extractTxtText(buffer);
      break;

    default:
      throw new Error(`Unsupported document type: ${mimeType}`);
  }

  const normalizedText = normalizeExtractedText(extractedText);

  if (!normalizedText) {
    throw new Error("No readable text could be extracted from the document");
  }

  return normalizedText;
};
