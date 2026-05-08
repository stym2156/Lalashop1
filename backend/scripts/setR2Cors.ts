// One-shot script to install browser-friendly CORS rules on the R2 bucket.
// Without this, the browser's PUT to a presigned R2 URL fails with
// "Failed to fetch" because the bucket rejects the CORS preflight.
//
// Usage:
//   cd backend && npx ts-node scripts/setR2Cors.ts

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const bucket = process.env.R2_BUCKET || "";

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error("Missing R2 env vars. Check backend/.env");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

// Allowed origins — Lalashop dev ports + leave room for production domains.
// Add real production hostnames here when deploying.
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
];

const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: ALLOWED_ORIGINS,
      // PUT for direct uploads via presigned URL.
      // GET/HEAD so the browser can read the public delivery URL too.
      AllowedMethods: ["PUT", "GET", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3000,
    },
  ],
};

const main = async () => {
  console.log(`\nApplying CORS to bucket "${bucket}"…\n`);

  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: corsConfig,
      })
    );
    console.log("✓ CORS rules applied");
  } catch (err) {
    console.error("✗ PutBucketCors failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  // Read back to confirm
  try {
    const res = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
    console.log("\nCurrent CORS configuration on bucket:");
    console.log(JSON.stringify(res.CORSRules, null, 2));
  } catch (err) {
    console.warn("Could not read back CORS:", err instanceof Error ? err.message : err);
  }

  console.log("\n✅ Done. Browser uploads to presigned R2 URLs should now work from:");
  for (const origin of ALLOWED_ORIGINS) {
    console.log(`   ${origin}`);
  }
  console.log(
    "\nTip: when you deploy, edit ALLOWED_ORIGINS in this script and re-run."
  );
  process.exit(0);
};

main().catch((err) => {
  console.error("Unexpected failure:", err);
  process.exit(1);
});
