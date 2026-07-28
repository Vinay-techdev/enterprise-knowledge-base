import crypto from "crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import {
  getSignedUrl
} from "@aws-sdk/s3-request-presigner";
import {
  presignedUrlExpiry,
  s3BucketName,
  s3Client
} from "../../config/s3.js";

const sanitizeFilename = (filename) =>
  filename.replace(/[^a-zA-Z0-9._-]/g, "-");

const buildObjectKey = ({
  organizationId,
  originalName
}) => {
  const safeFilename = sanitizeFilename(originalName);

  return [
    "organizations",
    organizationId.toString(),
    "documents",
    `${crypto.randomUUID()}-${safeFilename}`
  ].join("/");
};

export const uploadToS3 = async ({
  file,
  organizationId
}) => {
  const key = buildObjectKey({
    organizationId,
    originalName: file.originalname
  });

  const command = new PutObjectCommand({
    Bucket: s3BucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,

    Metadata: {
      organizationId: organizationId.toString()
    }
  });

  await s3Client.send(command);

  return {
    provider: "s3",
    key,
    storedName: key.split("/").at(-1)
  };
};

export const getS3Download = async ({
  key,
  originalName,
  mimeType
}) => {
  const command = new GetObjectCommand({
    Bucket: s3BucketName,
    Key: key,

    ResponseContentType: mimeType,

    ResponseContentDisposition:
      `attachment; filename="${encodeURIComponent(originalName)}"`
  });

  const url = await getSignedUrl(
    s3Client,
    command,
    {
      expiresIn: presignedUrlExpiry
    }
  );

  return {
    type: "redirect",
    url,
    expiresIn: presignedUrlExpiry
  };
};

export const deleteFromS3 = async ({
  key
}) => {
  const command = new DeleteObjectCommand({
    Bucket: s3BucketName,
    Key: key
  });

  await s3Client.send(command);
};

//? Rag integration with s3 storage

const streamToBuffer = async (stream) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

export const getS3FileBuffer = async ({ key }) => {
  const command = new GetObjectCommand({
    Bucket: s3BucketName,
    Key: key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error("S3 returned an empty document body");
  }

  return streamToBuffer(response.Body);
};