import {
  geminiClient,
  generationModel,
} from "../../config/gemini.js";

const supportedDocumentTypes = [
  "resume",
  "receipt",
  "invoice",
  "policy",
  "report",
  "agreement",
  "manual",
  "notes",
  "certificate",
  "academic",
  "other",
];

const responseSchema = {
  type: "object",

  properties: {
    documentType: {
      type: "string",
      enum: supportedDocumentTypes,
    },

    generatedTitle: {
      type: "string",
    },

    summary: {
      type: "string",
    },

    keywords: {
      type: "array",
      items: {
        type: "string",
      },
    },

    entities: {
      type: "object",

      properties: {
        organizations: {
          type: "array",
          items: {
            type: "string",
          },
        },

        people: {
          type: "array",
          items: {
            type: "string",
          },
        },

        dates: {
          type: "array",
          items: {
            type: "string",
          },
        },

        amounts: {
          type: "array",
          items: {
            type: "string",
          },
        },

        technologies: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },

      required: [
        "organizations",
        "people",
        "dates",
        "amounts",
        "technologies",
      ],
    },
  },

  required: [
    "documentType",
    "generatedTitle",
    "summary",
    "keywords",
    "entities",
  ],
};

const normalizeArray = (
  values,
  maximumItems = 15,
) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const uniqueValues = new Set();

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const normalized = value.trim();

    if (!normalized) {
      continue;
    }

    uniqueValues.add(normalized);

    if (uniqueValues.size >= maximumItems) {
      break;
    }
  }

  return [...uniqueValues];
};

const normalizeIntelligence = (value) => {
  const documentType =
    supportedDocumentTypes.includes(
      value?.documentType,
    )
      ? value.documentType
      : "other";

  return {
    documentType,

    generatedTitle:
      typeof value?.generatedTitle === "string"
        ? value.generatedTitle.trim().slice(0, 160)
        : null,

    summary:
      typeof value?.summary === "string"
        ? value.summary.trim().slice(0, 2000)
        : null,

    keywords: normalizeArray(
      value?.keywords,
      12,
    ),

    entities: {
      organizations: normalizeArray(
        value?.entities?.organizations,
      ),

      people: normalizeArray(
        value?.entities?.people,
      ),

      dates: normalizeArray(
        value?.entities?.dates,
      ),

      amounts: normalizeArray(
        value?.entities?.amounts,
      ),

      technologies: normalizeArray(
        value?.entities?.technologies,
      ),
    },
  };
};

export const generateDocumentIntelligence =
  async ({
    text,
    originalName,
    currentTitle,
  }) => {
    if (
      typeof text !== "string" ||
      !text.trim()
    ) {
      throw new Error(
        "Extracted document text is required",
      );
    }

    const maximumInputCharacters = 18000;

    const documentText = text
      .trim()
      .slice(0, maximumInputCharacters);

    const prompt = `
Analyze the supplied enterprise document and return structured metadata.

Filename: ${originalName || "Unknown"}
Current title: ${currentTitle || "Untitled"}

Tasks:

1. Classify the document into exactly one supported type.
2. Generate a short, professional title.
3. Write a concise summary in no more than three sentences.
4. Extract up to twelve meaningful keywords.
5. Extract useful entities.

Supported document types:

${supportedDocumentTypes.join(", ")}

Privacy rules:

- Do not include phone numbers, email addresses, postal addresses, student IDs, transaction IDs, receipt IDs, account numbers, or other sensitive identifiers in the generated title, summary, or keywords.
- People names may be listed only when central to understanding the document.
- Amounts may be retained when financially relevant.
- Do not invent missing information.

Document text:

${documentText}
    `.trim();

    const response =
      await geminiClient.models.generateContent({
        model: generationModel,

        contents: prompt,

        config: {
          temperature: 0.1,
          responseMimeType:
            "application/json",
          responseJsonSchema:
            responseSchema,
          maxOutputTokens: 1200,
        },
      });

    const responseText =
      response.text?.trim();

    if (!responseText) {
      throw new Error(
        "Gemini did not return document intelligence",
      );
    }

    let parsedResponse;

    try {
      parsedResponse =
        JSON.parse(responseText);
    } catch {
      throw new Error(
        "Gemini returned invalid document intelligence JSON",
      );
    }

    return normalizeIntelligence(
      parsedResponse,
    );
  };