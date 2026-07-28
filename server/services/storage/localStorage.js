import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const uploadDirectory = path.resolve("uploads");

const sanitizeFilename = (filename) =>
  filename.replace(/[^a-zA-Z0-9._-]/g, "-");

const ensureUploadDirectory = async () => {
  await fs.mkdir(uploadDirectory, {
    recursive: true
  });
};

export const uploadToLocalStorage = async ({
  file,
  organizationId
}) => {
  await ensureUploadDirectory();

  const safeFilename = sanitizeFilename(file.originalname);

  const storedName = [
    Date.now(),
    crypto.randomUUID(),
    safeFilename
  ].join("-");

  const organizationDirectory = path.join(
    uploadDirectory,
    organizationId.toString()
  );

  await fs.mkdir(organizationDirectory, {
    recursive: true
  });

  const absoluteFilePath = path.join(
    organizationDirectory,
    storedName
  );

  await fs.writeFile(
    absoluteFilePath,
    file.buffer
  );

  return {
    provider: "local",
    key: absoluteFilePath,
    storedName
  };
};

export const getLocalDownload = async ({
  key
}) => {
  const absoluteFilePath = path.resolve(key);

  await fs.access(absoluteFilePath);

  return {
    type: "file",
    path: absoluteFilePath
  };
};

export const deleteFromLocalStorage = async ({
  key
}) => {
  try {
    await fs.unlink(path.resolve(key));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

//? Rag integration with local storage 
export const getLocalFileBuffer = async ({ key }) => {
  return fs.readFile(path.resolve(key));
};