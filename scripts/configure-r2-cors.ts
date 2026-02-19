import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, "..", ".env") });
// Also try loading .env.local if available
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "cortex-raw";

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("❌ Missing R2 credentials in .env or .env.local");
  process.exit(1);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function main() {
  console.log(`Configuring CORS for bucket: ${R2_BUCKET_NAME}...`);

  const command = new PutBucketCorsCommand({
    Bucket: R2_BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["PUT", "POST", "GET", "DELETE", "HEAD"],
          AllowedOrigins: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  });

  try {
    await r2.send(command);
    console.log("✅ CORS configuration applied successfully!");
  } catch (error) {
    console.error("❌ Error configuring CORS:", error);
  }
}

main();
