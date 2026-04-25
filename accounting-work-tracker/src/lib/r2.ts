import { randomUUID } from "node:crypto";
import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function getR2Config() {
  const accountId = requireEnv("R2_ACCOUNT_ID", process.env.R2_ACCOUNT_ID);
  const bucket = requireEnv("R2_BUCKET_NAME", process.env.R2_BUCKET_NAME);
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID", process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY", process.env.R2_SECRET_ACCESS_KEY);
  const endpoint =
    process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  return {
    accountId,
    bucket,
    endpoint,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL?.trim() || undefined,
  };
}

function getR2Client() {
  const config = getR2Config();

  return {
    bucket: config.bucket,
    publicBaseUrl: config.publicBaseUrl,
    client: new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
  };
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function buildWorkItemFileObjectKey(workItemId: string, fileName: string) {
  return `work-items/${workItemId}/${Date.now()}-${randomUUID()}-${sanitizeFileName(fileName)}`;
}

export async function uploadWorkItemFileToR2(params: {
  objectKey: string;
  file: File;
}) {
  const { client, bucket } = getR2Client();
  const bytes = Buffer.from(await params.file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.objectKey,
      Body: bytes,
      ContentType: params.file.type || "application/octet-stream",
      ContentLength: bytes.length,
      ContentDisposition: `attachment; filename="${sanitizeFileName(params.file.name)}"`,
    }),
  );
}

export async function deleteWorkItemFileFromR2(objectKey: string) {
  const { client, bucket } = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );
}

export async function getWorkItemFileDownloadUrl(params: {
  objectKey: string;
  fileName: string;
  expiresIn?: number;
}) {
  const { client, bucket, publicBaseUrl } = getR2Client();

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, "")}/${params.objectKey}`;
  }

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: params.objectKey,
      ResponseContentDisposition: `attachment; filename="${sanitizeFileName(params.fileName)}"`,
    }),
    { expiresIn: params.expiresIn ?? 300 },
  );
}
