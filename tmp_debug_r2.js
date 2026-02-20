const { PrismaClient } = require('@prisma/client');
const { S3Client, GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require('dotenv').config();

const prisma = new PrismaClient();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

async function main() {
  const corte = await prisma.corte.findFirst({
    where: { storagePath: { not: "" } },
    orderBy: { createdAt: 'desc' }
  });

  if (!corte) {
    console.log("No processed corte found");
    return;
  }

  console.log("Testing corte:", corte.id);
  console.log("Storage Path:", corte.storagePath);

  try {
    // Check if file exists
    await r2.send(new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: corte.storagePath
    }));
    console.log("File exists in R2");

    // Generate signed URL
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: corte.storagePath
    });
    const url = await getSignedUrl(r2, command, { expiresIn: 3600 });
    console.log("Signed URL generated:", url);
  } catch (err) {
    console.error("R2 Error:", err.message);
  }

  await prisma.$disconnect();
}

main();
