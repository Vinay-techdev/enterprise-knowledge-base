import {
  deleteFromLocalStorage,
  getLocalDownload,
  uploadToLocalStorage
} from "./localStorage.js";

import {
  deleteFromS3,
  getS3Download,
  uploadToS3
} from "./s3Storage.js";

const configuredProvider =
  process.env.STORAGE_PROVIDER?.toLowerCase() || "local";

const supportedProviders = new Set([
  "local",
  "s3"
]);

if (!supportedProviders.has(configuredProvider)) {
  throw new Error(
    `Unsupported storage provider: ${configuredProvider}`
  );
}

export const uploadDocumentFile = async ({
  file,
  organizationId
}) => {
  if (configuredProvider === "s3") {
    return uploadToS3({
      file,
      organizationId
    });
  }

  return uploadToLocalStorage({
    file,
    organizationId
  });
};

export const getDocumentDownload = async ({
  document
}) => {
  if (document.storageProvider === "s3") {
    return getS3Download({
      key: document.storageKey,
      originalName: document.originalName,
      mimeType: document.mimeType
    });
  }

  return getLocalDownload({
    key: document.storageKey
  });
};

export const deleteDocumentFile = async ({
  document
}) => {
  if (document.storageProvider === "s3") {
    return deleteFromS3({
      key: document.storageKey
    });
  }

  return deleteFromLocalStorage({
    key: document.storageKey
  });
};

export const activeStorageProvider =
  configuredProvider;