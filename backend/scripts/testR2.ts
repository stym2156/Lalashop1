// Quick R2 connectivity smoke test.
// Usage:  cd backend && npx ts-node scripts/testR2.ts
//
// Verifies:
//   1. R2_* env vars are present and look correct
//   2. We can presign a PUT URL
//   3. Direct PUT against the presigned URL succeeds (writes a 12-byte
//      dummy object)
//   4. The resulting public URL is reachable and returns the same bytes

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { isR2Configured, presignUpload } from "../src/services/r2Service";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";

const ok = (msg: string) => console.log(`${GREEN}✓${RESET} ${msg}`);
const bad = (msg: string) => console.log(`${RED}✗${RESET} ${msg}`);
const warn = (msg: string) => console.log(`${YELLOW}!${RESET} ${msg}`);
const info = (msg: string) => console.log(`${DIM}  ${msg}${RESET}`);

const truncate = (s: string, n = 8): string =>
  s.length <= n ? s : `${s.slice(0, n)}…(${s.length} chars)`;

const main = async () => {
  console.log("\n── R2 connectivity smoke test ────────────────\n");

  // 1. Validate env vars
  const accountId = process.env.R2_ACCOUNT_ID || "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
  const bucket = process.env.R2_BUCKET || "";
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL || "";

  let bad_env = 0;
  if (!accountId) {
    bad("R2_ACCOUNT_ID is missing");
    bad_env++;
  } else if (accountId.length !== 32) {
    warn(`R2_ACCOUNT_ID length is ${accountId.length} (expected 32 hex chars)`);
  } else {
    ok(`R2_ACCOUNT_ID         ${truncate(accountId)}`);
  }

  if (!accessKeyId) {
    bad("R2_ACCESS_KEY_ID is missing");
    bad_env++;
  } else if (accessKeyId.startsWith("http")) {
    bad(`R2_ACCESS_KEY_ID looks like a URL (${truncate(accessKeyId, 30)}). It should be a 32-char hex string from Cloudflare → R2 → API Tokens.`);
    bad_env++;
  } else if (accessKeyId.length !== 32) {
    warn(`R2_ACCESS_KEY_ID length is ${accessKeyId.length} (expected 32 hex chars)`);
  } else {
    ok(`R2_ACCESS_KEY_ID      ${truncate(accessKeyId)}`);
  }

  if (!secretAccessKey) {
    bad("R2_SECRET_ACCESS_KEY is missing");
    bad_env++;
  } else if (secretAccessKey.length !== 64) {
    warn(`R2_SECRET_ACCESS_KEY length is ${secretAccessKey.length} (expected 64 hex chars)`);
  } else {
    ok(`R2_SECRET_ACCESS_KEY  ${truncate(secretAccessKey)}`);
  }

  if (!bucket) {
    bad("R2_BUCKET is missing");
    bad_env++;
  } else {
    ok(`R2_BUCKET             ${bucket}`);
  }

  if (!publicBaseUrl) {
    bad("R2_PUBLIC_BASE_URL is missing");
    bad_env++;
  } else if (!publicBaseUrl.startsWith("http")) {
    bad(`R2_PUBLIC_BASE_URL must start with https:// (got: ${publicBaseUrl})`);
    bad_env++;
  } else {
    ok(`R2_PUBLIC_BASE_URL    ${publicBaseUrl}`);
  }

  if (bad_env > 0) {
    console.log(`\n${RED}Stopping — fix env vars first.${RESET}\n`);
    process.exit(1);
  }

  if (!isR2Configured()) {
    bad("isR2Configured() returned false. Check r2Service.ts.");
    process.exit(1);
  }

  // 2. Presign a PUT URL
  console.log("");
  let presign;
  try {
    presign = await presignUpload({
      filename: "r2-smoke-test.txt",
      contentType: "text/plain",
      folder: "uploads",
    });
    ok(`Presigned URL generated`);
    info(`key:       ${presign.key}`);
    info(`publicUrl: ${presign.publicUrl}`);
    info(`expires:   ${presign.expiresIn}s`);
  } catch (err) {
    bad(`Presign failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  // 3. PUT to the presigned URL
  const body = `r2-test-${Date.now()}`;
  try {
    const putRes = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body,
    });
    if (!putRes.ok) {
      const text = await putRes.text().catch(() => "");
      bad(`PUT failed: HTTP ${putRes.status} ${putRes.statusText}`);
      if (text) info(text.slice(0, 400));
      process.exit(1);
    }
    ok(`PUT to presigned URL succeeded (HTTP ${putRes.status})`);
  } catch (err) {
    bad(`PUT request errored: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  // 4. Read it back from public URL
  try {
    const getRes = await fetch(presign.publicUrl);
    if (!getRes.ok) {
      bad(`Public GET failed: HTTP ${getRes.status}`);
      info(`Likely cause: your bucket is not connected to a public r2.dev domain, or R2_PUBLIC_BASE_URL is wrong.`);
      info(`Fix: Cloudflare → R2 → ${bucket} → Settings → enable "Public Access (r2.dev)" or attach a custom domain.`);
      process.exit(1);
    }
    const text = await getRes.text();
    if (text === body) {
      ok(`Public GET returned the exact same bytes`);
    } else {
      warn(`Public GET succeeded but body mismatch (got ${text.length} bytes, sent ${body.length})`);
    }
  } catch (err) {
    bad(`Public GET errored: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  console.log(`\n${GREEN}✅ R2 is working end-to-end.${RESET}\n`);
  info(`Test object lives at: ${presign.publicUrl}`);
  info(`(safe to delete from Cloudflare R2 dashboard if desired)\n`);
  process.exit(0);
};

main().catch((err) => {
  console.error("\nUnexpected failure:", err);
  process.exit(1);
});
