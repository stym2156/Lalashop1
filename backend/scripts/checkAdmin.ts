import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import User from "../src/models/userModel";

const main = async () => {
  const email = (process.argv[2] || "lalashop@gmail.com").toLowerCase();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }
  await mongoose.connect(uri);

  const user = await User.findOne({ email });
  if (!user) {
    console.log(`✗ No user found with email: ${email}`);
  } else {
    console.log(`✓ User found:`);
    console.log({
      _id: user._id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      adminRole: user.adminRole,
      isSeller: user.isSeller,
      hasPassword: Boolean(user.password),
      passwordHashLength: user.password?.length,
      isSuspended: user.isSuspended,
    });
  }

  await mongoose.disconnect();
  process.exit(0);
};

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
