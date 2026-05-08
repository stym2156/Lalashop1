// Nuke all products and all users except the keeper admin email.
// Also wipes every collection that holds user-scoped or product-scoped data,
// because leaving orphans would break /me/me, dashboard counts, and analytics.
//
// What gets deleted:
//   Products, Posts, Cart, Orders, Reviews, Reports, KYC submissions,
//   Notifications, Conversations, Messages, Withdrawals, PaymentSlips,
//   PaymentMethods, Coupons, Promotions, Broadcasts, CustomerLabels,
//   ShopSettings, CreatorProducts, CreatorEarnings, AffiliateClicks,
//   Refunds, SupportTickets, AdminInvites, AdminAuditLogs, PageViews,
//   Categories, Banks, Addresses
//
// What gets kept:
//   - The keeper admin user (default lalashop@gmail.com — pass another email
//     as argv[2] to override). isAdmin/adminRole flags preserved.
//   - SystemSetting documents (platform-wide config)
//
// Run modes:
//   npx ts-node scripts/wipeAllExceptAdmin.ts                 → DRY RUN
//   npx ts-node scripts/wipeAllExceptAdmin.ts --apply         → actually delete
//   npx ts-node scripts/wipeAllExceptAdmin.ts admin@x.co --apply → custom email

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import mongoose from "mongoose";

import User from "../src/models/userModel";
import Product from "../src/models/productModel";
import Post from "../src/models/postModel";
import Cart from "../src/models/cartModel";
import Order from "../src/models/orderModel";
import Review from "../src/models/reviewModel";
import Report from "../src/models/reportModel";
import KycSubmission from "../src/models/kycSubmissionModel";
import Notification from "../src/models/notificationModel";
import Conversation from "../src/models/conversationModel";
import Message from "../src/models/messageModel";
import Withdraw from "../src/models/withdrawModel";
import PaymentSlip from "../src/models/paymentSlipModel";
import PaymentMethod from "../src/models/paymentMethodModel";
import Coupon from "../src/models/couponModel";
import Promotion from "../src/models/promotionModel";
import Broadcast from "../src/models/broadcastModel";
import CustomerLabel from "../src/models/customerLabelModel";
import ShopSetting from "../src/models/shopSettingModel";
import CreatorProduct from "../src/models/creatorProductModel";
import CreatorEarning from "../src/models/creatorEarningModel";
import AffiliateClick from "../src/models/affiliateClickModel";
import Refund from "../src/models/refundModel";
import SupportTicket from "../src/models/supportTicketModel";
import AdminInvite from "../src/models/adminInviteModel";
import AdminAuditLog from "../src/models/adminAuditLogModel";
import PageView from "../src/models/pageViewModel";
import Category from "../src/models/categoryModel";
import Bank from "../src/models/bankModel";
import Address from "../src/models/addressModel";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const KEEP_EMAIL = (args.find((a) => !a.startsWith("--")) || "lalashop@gmail.com").toLowerCase();

const main = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB\n");

  // 1. Find the keeper admin
  const keeper = await User.findOne({ email: KEEP_EMAIL });
  if (!keeper) {
    console.error(`✗ Keeper user not found: ${KEEP_EMAIL}`);
    console.error(`  Run scripts/createAdmin.ts first to create the admin.`);
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`Keeper admin: ${keeper.email}  (_id ${keeper._id})`);
  console.log(`  isAdmin=${keeper.isAdmin}  adminRole=${keeper.adminRole || "—"}\n`);

  // 2. Count what we'll touch (collection => count)
  const userFilter = { _id: { $ne: keeper._id } };
  const counts: Array<{ name: string; count: number }> = [];

  const tally = async (
    name: string,
    fn: () => Promise<number>
  ): Promise<void> => {
    const n = await fn();
    counts.push({ name, count: n });
  };

  await Promise.all([
    tally("users (other than keeper)", () => User.countDocuments(userFilter)),
    tally("products", () => Product.countDocuments({})),
    tally("posts", () => Post.countDocuments({})),
    tally("carts", () => Cart.countDocuments({})),
    tally("orders", () => Order.countDocuments({})),
    tally("reviews", () => Review.countDocuments({})),
    tally("reports", () => Report.countDocuments({})),
    tally("kyc submissions", () => KycSubmission.countDocuments({})),
    tally("notifications", () => Notification.countDocuments({})),
    tally("conversations", () => Conversation.countDocuments({})),
    tally("messages", () => Message.countDocuments({})),
    tally("withdrawals", () => Withdraw.countDocuments({})),
    tally("payment slips", () => PaymentSlip.countDocuments({})),
    tally("payment methods", () => PaymentMethod.countDocuments({})),
    tally("coupons", () => Coupon.countDocuments({})),
    tally("promotions", () => Promotion.countDocuments({})),
    tally("broadcasts", () => Broadcast.countDocuments({})),
    tally("customer labels", () => CustomerLabel.countDocuments({})),
    tally("shop settings", () => ShopSetting.countDocuments({})),
    tally("creator products", () => CreatorProduct.countDocuments({})),
    tally("creator earnings", () => CreatorEarning.countDocuments({})),
    tally("affiliate clicks", () => AffiliateClick.countDocuments({})),
    tally("refunds", () => Refund.countDocuments({})),
    tally("support tickets", () => SupportTicket.countDocuments({})),
    tally("admin invites", () => AdminInvite.countDocuments({})),
    tally("admin audit logs", () => AdminAuditLog.countDocuments({})),
    tally("page views", () => PageView.countDocuments({})),
    tally("categories", () => Category.countDocuments({})),
    tally("banks", () => Bank.countDocuments({})),
    tally("addresses", () => Address.countDocuments({})),
  ]);

  console.log("Will delete from each collection:");
  for (const row of counts) {
    if (row.count > 0) {
      console.log(`  ${row.name.padEnd(28)} ${row.count}`);
    }
  }
  const total = counts.reduce((s, r) => s + r.count, 0);
  console.log(`\n  TOTAL records: ${total}\n`);

  if (!APPLY) {
    console.log("DRY RUN — nothing changed. Re-run with --apply to wipe:");
    console.log(`  npx ts-node scripts/wipeAllExceptAdmin.ts ${KEEP_EMAIL} --apply\n`);
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log("Applying wipe…\n");

  // 3. Drop everything in parallel where order doesn't matter.
  // We delete users last — many lookups above used the keeper id, deleting
  // it before the others could surface confusing intermediate states.
  await Promise.all([
    Product.deleteMany({}),
    Post.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Report.deleteMany({}),
    KycSubmission.deleteMany({}),
    Notification.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Withdraw.deleteMany({}),
    PaymentSlip.deleteMany({}),
    PaymentMethod.deleteMany({}),
    Coupon.deleteMany({}),
    Promotion.deleteMany({}),
    Broadcast.deleteMany({}),
    CustomerLabel.deleteMany({}),
    ShopSetting.deleteMany({}),
    CreatorProduct.deleteMany({}),
    CreatorEarning.deleteMany({}),
    AffiliateClick.deleteMany({}),
    Refund.deleteMany({}),
    SupportTicket.deleteMany({}),
    AdminInvite.deleteMany({}),
    AdminAuditLog.deleteMany({}),
    PageView.deleteMany({}),
    Category.deleteMany({}),
    Bank.deleteMany({}),
    Address.deleteMany({}),
  ]);

  // 4. Delete every user except the keeper
  const userResult = await User.deleteMany(userFilter);
  console.log(`✓ Deleted ${userResult.deletedCount} user(s); kept ${keeper.email}`);

  // 5. Reset the keeper's user-scoped financial state so they start clean.
  await User.updateOne(
    { _id: keeper._id },
    {
      $set: {
        balance: 0,
        posRevenue: 0,
        followers: [],
        following: [],
      },
    }
  );
  console.log(`✓ Reset keeper financial state (balance, posRevenue, followers, following)`);

  console.log("\n✅ Wipe complete. Login at http://localhost:3001/login");
  console.log(`   Email: ${keeper.email}`);
  console.log(`   Password: (unchanged)\n`);

  await mongoose.disconnect();
  process.exit(0);
};

main().catch(async (err) => {
  console.error("Wipe failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
