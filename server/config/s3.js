import {
  S3Client
} from "@aws-sdk/client-s3";

const requiredVariables = [
  "AWS_REGION",
  "AWS_S3_BUCKET"
];

const validateS3Configuration = () => {
  if (process.env.STORAGE_PROVIDER !== "s3") {
    return;
  }

  const missingVariables = requiredVariables.filter(
    (variable) => !process.env[variable]
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required S3 environment variables: ${missingVariables.join(", ")}`
    );
  }
};

validateS3Configuration();

export const s3Client = new S3Client({
  region: process.env.AWS_REGION
});

export const s3BucketName = process.env.AWS_S3_BUCKET;

export const presignedUrlExpiry = Number(
  process.env.AWS_PRESIGNED_URL_EXPIRY || 300
);