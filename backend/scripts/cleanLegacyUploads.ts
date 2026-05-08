// Clean up rows in MongoDB that point at the legacy `/uploads/...` paths
// (multer-era uploads from before we moved to Cloudflare R2). The actual
// image files are gone, so anything still referencing them only generates
// 404s in the browser.
//
// What this does:
//   - Products    : delete any product whose image / images[] / advertImages[]
//                   contains a /uploads/ path (any field is enough).
//   - Posts       : delete any post whose mediaUrl starts with /uploads/.
//   - Users       : reset profileImage to "" when it starts with /uploads/
//                   (we don't want to delete users — just blank the dead URL).
//
// Run modes:
//   npx ts-node scripts/cleanLegacyUploads.ts            → DRY RUN, prints counts
//   npx ts-node scripts/cleanLegacyUploads.ts --apply    → actually delete

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import mongoose from "mongoose";
import Product from "../src/models/productModel";
import Post from "../src/models/postModel";
import User from "../src/models/userModel";

const APPLY = process.argv.includes("--apply");

const matchesLegacy = /^\/uploads\//;

const main = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB\n");

  // ── Products ──────────────────────────────────────────────
  // image is Schema.Types.Mixed (string | string[]). We need to match
  // whether it's a single string OR any item in an array. Same for
  // images[] and advertImages[]. $elemMatch on an array matches against
  // each element; a top-level $regex on a Mixed field matches strings.
  const productFilter = {
    $or: [
      { image: { $regex: matchesLegacy } },
      { image: { $elemMatch: { $regex: matchesLegacy } } },
      { images: { $elemMatch: { $regex: matchesLegacy } } },
      { advertImages: { $elemMatch: { $regex: matchesLegacy } } },
    ],
  };

  const productCount = await Product.countDocuments(productFilter);
  console.log(`Products with legacy image paths : ${productCount}`);

  // ── Posts ─────────────────────────────────────────────────
  const postFilter = { mediaUrl: { $regex: matchesLegacy } };
  const postCount = await Post.countDocuments(postFilter);
  console.log(`Posts with legacy mediaUrl       : ${postCount}`);

  // ── Users with broken profileImage ────────────────────────
  const userFilter = { profileImage: { $regex: matchesLegacy } };
  const userCount = await User.countDocuments(userFilter);
  console.log(`Users with legacy profileImage   : ${userCount}`);

  console.log("");

  if (!APPLY) {
    console.log("DRY RUN — nothing changed. Re-run with --apply to delete:");
    console.log("  npx ts-node scripts/cleanLegacyUploads.ts --apply\n");
    await mongoose.disconnect();
    process.exit(0);
  }

  // ── Apply changes ─────────────────────────────────────────
  console.log("Applying changes…\n");

  const productResult = await Product.deleteMany(productFilter);
  console.log(`✓ Deleted ${productResult.deletedCount} product(s)`);

  const postResult = await Post.deleteMany(postFilter);
  console.log(`✓ Deleted ${postResult.deletedCount} post(s)`);

  const userResult = await User.updateMany(userFilter, {
    $set: { profileImage: "" },
  });
  console.log(`✓ Cleared profileImage on ${userResult.modifiedCount} user(s)`);

  console.log("\n✅ Cleanup complete.");
  await mongoose.disconnect();
  process.exit(0);
};

main().catch(async (err) => {
  console.error("Cleanup failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
