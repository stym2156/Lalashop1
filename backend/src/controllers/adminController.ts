import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/userModel";
import Product from "../models/productModel";
import Order from "../models/orderModel";
import Post from "../models/postModel";
import Bank from "../models/bankModel";
import Notification from "../models/notificationModel";
import KycSubmission from "../models/kycSubmissionModel";
import Withdraw from "../models/withdrawModel";
import Report from "../models/reportModel";
import SupportTicket from "../models/supportTicketModel";
import CreatorEarning from "../models/creatorEarningModel";
import Refund from "../models/refundModel";
import { IAuthRequest } from "../middlewares/authMiddleware";

interface ListQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
}

const parsePagination = (query: ListQuery) => {
  const page = Math.max(parseInt(query.page || "1", 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "100", 10) || 100, 1), 500);
  return { page, limit, skip: (page - 1) * limit };
};

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const day = 86400000;
    const since30 = new Date(now.getTime() - 30 * day);
    const since60 = new Date(now.getTime() - 60 * day);
    const since24h = new Date(now.getTime() - day);

    const [
      totalUsers,
      activeShops,
      totalProducts,
      totalPosts,
      pendingOrders,
      completedOrders,
      revenueAggAll,
      revenueAgg30,
      revenueAggPrev30,
      activeUsersToday,
      newUsers30,
      newUsers60,
      pendingKyc,
      pendingWithdrawals,
      openReports,
      openTickets,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isSeller: true }),
      Product.countDocuments({}),
      Post.countDocuments({}),
      Order.countDocuments({ status: { $in: ["pending", "processing"] } }),
      Order.countDocuments({ status: "delivered" }),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Order.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: since30 } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Order.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: since60, $lt: since30 } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      User.countDocuments({ updatedAt: { $gte: since24h } }),
      User.countDocuments({ createdAt: { $gte: since30 } }),
      User.countDocuments({ createdAt: { $gte: since60, $lt: since30 } }),
      KycSubmission.countDocuments({ status: "pending" }),
      Withdraw.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "open" }),
      SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
    ]);

    const totalRevenue = revenueAggAll[0]?.total ?? 0;
    const revenue30 = revenueAgg30[0]?.total ?? 0;
    const revenuePrev30 = revenueAggPrev30[0]?.total ?? 0;

    // Daily revenue trend (last 30 days) for the dashboard chart.
    const trendAgg = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: since30 } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
    ]);
    const trendMap = new Map<string, { revenue: number; orders: number }>(
      trendAgg.map((t) => [t._id, { revenue: t.revenue, orders: t.orders }])
    );
    const revenueTrend: Array<{ date: string; revenue: number; orders: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * day);
      const key = d.toISOString().slice(0, 10);
      const row = trendMap.get(key);
      revenueTrend.push({ date: key, revenue: row?.revenue || 0, orders: row?.orders || 0 });
    }

    // Top 5 shops by paid revenue (lifetime)
    const topShopsAgg = await Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.seller",
          revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] } },
          orders: { $addToSet: "$_id" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: "$seller" },
      {
        $project: {
          _id: 1,
          revenue: 1,
          orderCount: { $size: "$orders" },
          name: "$seller.name",
          email: "$seller.email",
          customId: "$seller.customId",
          profileImage: "$seller.profileImage",
        },
      },
    ]);

    // Recent 8 orders for the dashboard side panel
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .select("status totalPrice isPaid createdAt user")
      .populate("user", "name email customId profileImage")
      .lean();

    const pctChange = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    res.status(200).json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          activeShops,
          products: totalProducts,
          posts: totalPosts,
          revenue: totalRevenue,
        },
        secondary: {
          pendingOrders,
          completedOrders,
          activeUsersToday,
          // Kept for backward-compat with old card label; semantic is now
          // "shops awaiting approval" (= pending KYC submissions).
          pendingShopApprovals: pendingKyc,
        },
        // Operational queues — items needing admin action right now.
        queues: {
          pendingKyc,
          pendingWithdrawals,
          openReports,
          openTickets,
          pendingOrders,
        },
        // Period comparison — last 30 days vs the 30 before that.
        period: {
          revenue30,
          revenuePrev30,
          revenueChangePct: pctChange(revenue30, revenuePrev30),
          newUsers30,
          newUsers60: newUsers60,
          newUsersChangePct: pctChange(newUsers30, newUsers60),
        },
        revenueTrend,
        topShops: topShopsAgg,
        recentOrders,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentActivity = async (_req: Request, res: Response) => {
  try {
    const [recentUsers, recentOrders, recentProducts] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }).limit(5).select("name email customId isSeller createdAt"),
      Order.find({}).sort({ createdAt: -1 }).limit(5).select("status totalPrice createdAt user"),
      Product.find({}).sort({ createdAt: -1 }).limit(5).select("name seller createdAt"),
    ]);

    const activity = [
      ...recentUsers.map((u: any) => ({
        id: `${u._id}`,
        text: `${u.isSeller ? "seller" : "user"} ${u.name || u.email} `,
        type: u.isSeller ? "shop" : "user",
        at: u.createdAt,
      })),
      ...recentOrders.map((o: any) => ({
        id: `-${o._id}`,
        text: `${o._id.toString().slice(-6)} is ${o.status} (${o.totalPrice}).`,
        at: o.createdAt,
      })),
      ...recentProducts.map((p: any) => ({
        id: `${p._id}`,
        text: `${p.name}`,
        at: p.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 10);

    res.status(200).json({ success: true, data: activity });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as ListQuery);
    const { search, status, role } = req.query as ListQuery & { role?: string };

    const filter: Record<string, unknown> = {};

    if (role === "seller") filter.isSeller = true;
    if (role === "buyer") filter.isSeller = { $ne: true };
    if (role === "admin") filter.isAdmin = true;

    if (status === "active") filter.twoFactorEnabled = { $ne: undefined };

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { name: regex },
        { email: regex },
        { username: regex },
        { phone: regex },
        { customId: regex },
      ];
    }

    const [users, total, balanceAgg] = await Promise.all([
      User.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "banks",
            localField: "_id",
            foreignField: "user",
            as: "bank",
          },
        },
        {
          $lookup: {
            from: "kycsubmissions",
            let: { userId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$user", "$$userId"] } } },
              {
                $addFields: {
                  _statusRank: {
                    $cond: [{ $eq: ["$status", "approved"] }, 0, 1],
                  },
                },
              },
              { $sort: { _statusRank: 1, submittedAt: -1, createdAt: -1 } },
              { $limit: 1 },
              {
                $project: {
                  _id: 0,
                  shopName: "$shopInfo.shopName",
                  shopCategory: "$shopInfo.shopCategory",
                  status: 1,
                },
              },
            ],
            as: "kyc",
          },
        },
        {
          $addFields: {
            bank: {
              $cond: [
                { $gt: [{ $size: "$bank" }, 0] },
                {
                  $let: {
                    vars: { b: { $arrayElemAt: ["$bank", 0] } },
                    in: {
                      _id: "$$b._id",
                      bankName: "$$b.bankName",
                      accountNumber: "$$b.accountNumber",
                      accountName: "$$b.accountName",
                      isVerified: "$$b.isVerified",
                    },
                  },
                },
                null,
              ],
            },
            shopName: { $arrayElemAt: ["$kyc.shopName", 0] },
            shopCategory: { $arrayElemAt: ["$kyc.shopCategory", 0] },
            kycStatus: { $arrayElemAt: ["$kyc.status", 0] },
          },
        },
        {
          $project: {
            password: 0,
            twoFactorSecret: 0,
            otp: 0,
            otpExpires: 0,
            withdrawPin: 0,
            kyc: 0,
          },
        },
      ]),
      User.countDocuments(filter),
      User.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$balance" } } },
      ]),
    ]);

    const balanceTotal = balanceAgg[0]?.total ?? 0;

    res.status(200).json({
      success: true,
      data: users,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        balanceTotal,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const userDoc = await User.findById(req.params.id);

    if (!userDoc) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Pull bank + activity rollups in parallel for the admin detail panel.
    // Compliance reviewers need to see provenance of money before approving
    // withdrawals — we aggregate income/outgo by source here.
    const [
      bank,
      orderCount,
      productCount,
      postCount,
      lastOrder,
      latestKyc,
      pendingWithdrawals,
      // Withdrawal aggregation by status (count + total amount per state)
      withdrawStatusAgg,
      lastWithdrawal,
      // Income — web sales as seller (paid orders containing this seller's items)
      sellerSalesAgg,
      // Income — creator earnings (settled commission)
      creatorEarningsAgg,
      // Outgoing — refunds issued by this user (as seller)
      refundsIssuedAgg,
      // Buyer orders (this user as buyer) by paid/unpaid
      buyerOrderAgg,
      lastBuyerOrder,
      // Seller orders received (this user as seller)
      sellerOrderCountAgg,
    ] = await Promise.all([
      Bank.findOne({ user: userDoc._id }),
      Order.countDocuments({ user: userDoc._id }),
      Product.countDocuments({ seller: userDoc._id }),
      Post.countDocuments({ user: userDoc._id }),
      Order.findOne({ user: userDoc._id })
        .sort({ createdAt: -1 })
        .select("totalPrice status isPaid createdAt"),
      KycSubmission.findOne({ user: userDoc._id })
        .sort({ createdAt: -1 })
        .select("status submittedAt reviewedAt rejectionReason shopInfo"),
      Withdraw.countDocuments({ user: userDoc._id, status: "pending" }),
      Withdraw.aggregate([
        { $match: { user: userDoc._id } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
            totalNet: { $sum: "$netAmount" },
            totalFee: { $sum: "$fee" },
          },
        },
      ]),
      Withdraw.findOne({ user: userDoc._id })
        .sort({ createdAt: -1 })
        .select("amount netAmount fee status createdAt processedAt bankAccount")
        .populate("bankAccount", "bankName accountNumber"),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $unwind: "$orderItems" },
        { $match: { "orderItems.seller": userDoc._id } },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] },
            },
            itemsSold: { $sum: "$orderItems.qty" },
            orders: { $addToSet: "$_id" },
          },
        },
      ]),
      CreatorEarning.aggregate([
        { $match: { creator: userDoc._id } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            total: { $sum: "$amount" },
          },
        },
      ]),
      Refund.aggregate([
        { $match: { shop: userDoc._id, status: { $in: ["approved", "completed"] } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: "$amount" },
          },
        },
      ]),
      Order.aggregate([
        { $match: { user: userDoc._id } },
        {
          $group: {
            _id: { isPaid: "$isPaid" },
            count: { $sum: 1 },
            total: { $sum: "$totalPrice" },
          },
        },
      ]),
      Order.findOne({ user: userDoc._id, isPaid: true })
        .sort({ createdAt: -1 })
        .select("totalPrice createdAt status"),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $unwind: "$orderItems" },
        { $match: { "orderItems.seller": userDoc._id } },
        { $group: { _id: "$_id" } },
        { $count: "n" },
      ]),
    ]);

    // Reduce withdrawal status aggregation into a friendly object
    const withdrawals: Record<
      string,
      { count: number; totalAmount: number; totalNet: number; totalFee: number }
    > = {};
    let withdrawTotalCount = 0;
    let withdrawTotalAmount = 0;
    let withdrawTotalNet = 0;
    for (const row of withdrawStatusAgg) {
      withdrawals[row._id || "unknown"] = {
        count: row.count,
        totalAmount: row.totalAmount,
        totalNet: row.totalNet,
        totalFee: row.totalFee,
      };
      withdrawTotalCount += row.count;
      withdrawTotalAmount += row.totalAmount;
      withdrawTotalNet += row.totalNet;
    }

    const sellerSales = sellerSalesAgg[0] || { totalRevenue: 0, itemsSold: 0, orders: [] };
    const creatorEarnings: Record<string, { count: number; total: number }> = {};
    let creatorTotal = 0;
    for (const row of creatorEarningsAgg) {
      creatorEarnings[row._id || "unknown"] = { count: row.count, total: row.total };
      if (row._id === "settled") creatorTotal += row.total;
    }
    const refundsIssued = refundsIssuedAgg[0] || { count: 0, total: 0 };

    // Buyer orders: split paid vs unpaid
    let buyerPaidCount = 0;
    let buyerPaidTotal = 0;
    let buyerUnpaidCount = 0;
    for (const row of buyerOrderAgg) {
      if (row._id?.isPaid) {
        buyerPaidCount = row.count;
        buyerPaidTotal = row.total;
      } else {
        buyerUnpaidCount = row.count;
      }
    }

    const sellerOrderCount = sellerOrderCountAgg[0]?.n || 0;

    const safeUser = userDoc.toObject() as unknown as Record<string, unknown>;
    delete safeUser.password;
    delete safeUser.sellerPassword;
    delete safeUser.twoFactorSecret;
    delete safeUser.otp;
    delete safeUser.otpExpires;
    delete safeUser.withdrawPin;

    res.status(200).json({
      success: true,
      data: {
        ...safeUser,
        hasPassword: Boolean(userDoc.password),
        hasSellerPassword: Boolean(userDoc.get("sellerPassword")),
        hasPin: Boolean(userDoc.withdrawPin),
        bank: bank
          ? {
              _id: bank._id,
              bankName: bank.bankName,
              accountNumber: bank.accountNumber,
              accountName: bank.accountName,
              isVerified: bank.isVerified,
            }
          : null,
        stats: {
          orderCount,
          productCount,
          postCount,
          pendingWithdrawals,
          lastOrderAt: lastOrder ? (lastOrder as unknown as { createdAt: Date }).createdAt : null,
          lastOrderTotal: lastOrder?.totalPrice ?? 0,
          lastOrderStatus: lastOrder?.status ?? null,
        },
        // Comprehensive money-trail breakdown for compliance review.
        // - income: where the user's balance came from (web sales, creator
        //   commission, POS revenue) so reviewers can verify provenance before
        //   approving a withdrawal.
        // - withdrawals: by status (pending/approved/completed/rejected/...)
        // - orders: separate buyer-side (placed) and seller-side (received).
        finance: {
          withdrawals: {
            byStatus: withdrawals,
            totalCount: withdrawTotalCount,
            totalAmount: withdrawTotalAmount,
            totalNet: withdrawTotalNet,
            last: lastWithdrawal
              ? {
                  amount: lastWithdrawal.amount,
                  netAmount: lastWithdrawal.netAmount,
                  fee: lastWithdrawal.fee,
                  status: lastWithdrawal.status,
                  createdAt: (lastWithdrawal as unknown as { createdAt: Date }).createdAt,
                  processedAt: lastWithdrawal.processedAt,
                  bank: lastWithdrawal.bankAccount as
                    | { bankName?: string; accountNumber?: string }
                    | null,
                }
              : null,
          },
          income: {
            sellerWebSales: {
              total: sellerSales.totalRevenue,
              orders: sellerSales.orders?.length ?? 0,
              itemsSold: sellerSales.itemsSold ?? 0,
            },
            creatorEarnings: {
              byStatus: creatorEarnings,
              settledTotal: creatorTotal,
            },
            posRevenue: userDoc.posRevenue || 0,
            // currentBalance is what's actually in user.balance right now —
            // the breakdown is historical and not guaranteed to sum to balance
            // (admin can manually edit balance, refunds deduct, etc.).
            currentBalance: userDoc.balance || 0,
          },
          outgoing: {
            refundsIssued: {
              count: refundsIssued.count,
              total: refundsIssued.total,
            },
          },
          buyerActivity: {
            paidCount: buyerPaidCount,
            paidTotal: buyerPaidTotal,
            unpaidCount: buyerUnpaidCount,
            lastPaidAt: lastBuyerOrder
              ? (lastBuyerOrder as unknown as { createdAt: Date }).createdAt
              : null,
            lastPaidAmount: lastBuyerOrder?.totalPrice ?? 0,
          },
          sellerActivity: {
            ordersReceived: sellerOrderCount,
            grossRevenue: sellerSales.totalRevenue,
            itemsSold: sellerSales.itemsSold ?? 0,
          },
        },
        kyc: latestKyc
          ? {
              status: latestKyc.get("status"),
              submittedAt: latestKyc.get("submittedAt"),
              reviewedAt: latestKyc.get("reviewedAt"),
              rejectionReason: latestKyc.get("rejectionReason"),
              shopInfo: latestKyc.get("shopInfo"),
            }
          : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /admin/users/:id/suspend
// Body: { suspended: boolean, reason?: string }
export const suspendUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: "Cannot suspend an admin account — demote first.",
      });
    }
    const suspended = !!req.body?.suspended;
    const reason = String(req.body?.reason || "");
    user.isSuspended = suspended;
    user.suspendedReason = suspended ? reason : "";
    user.suspendedAt = suspended ? new Date() : undefined;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        isSuspended: user.isSuspended,
        suspendedReason: user.suspendedReason,
        suspendedAt: user.suspendedAt,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server Error";
    res.status(500).json({ success: false, message });
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { name, email, phone, balance, password, pin } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      balance?: number | string;
      password?: string;
      pin?: string;
    };

    if (typeof name === "string") user.name = name.trim();
    if (typeof phone === "string") user.phone = phone.trim();

    if (typeof email === "string") {
      const cleaned = email.trim().toLowerCase();
      if (!EMAIL_RE.test(cleaned)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }
      if (cleaned !== user.email) {
        const existing = await User.findOne({ email: cleaned, _id: { $ne: user._id } });
        if (existing) {
          return res.status(409).json({ success: false, message: "Email already in use" });
        }
        user.email = cleaned;
      }
    }

    if (balance !== undefined) {
      const num = typeof balance === "string" ? Number(balance) : balance;
      if (!Number.isFinite(num)) {
        return res.status(400).json({ success: false, message: "Balance must be a number" });
      }
      user.balance = num;
    }

    if (typeof password === "string" && password.length > 0) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      }
      user.password = password; // pre-save hook hashes it
    }

    if (typeof pin === "string" && pin.length > 0) {
      if (!/^\d{6}$/.test(pin)) {
        return res.status(400).json({ success: false, message: "PIN must be 6 digits" });
      }
      const salt = await bcrypt.genSalt(10);
      user.withdrawPin = await bcrypt.hash(pin, salt);
    }

    const { isAdmin: setIsAdmin, adminRole } = req.body as {
      isAdmin?: boolean;
      adminRole?: "super" | "finance" | "support" | "content" | null;
    };
    if (typeof setIsAdmin === "boolean") {
      user.isAdmin = setIsAdmin;
      if (!setIsAdmin) user.adminRole = undefined;
    }
    if (adminRole === null) {
      user.adminRole = undefined;
    } else if (adminRole && ["super", "finance", "support", "content"].includes(adminRole)) {
      user.adminRole = adminRole;
      user.isAdmin = true;
    }

    await user.save();

    const safeUser = user.toObject() as unknown as Record<string, unknown>;
    delete safeUser.password;
    delete safeUser.twoFactorSecret;
    delete safeUser.otp;
    delete safeUser.otpExpires;
    delete safeUser.withdrawPin;

    res.status(200).json({
      success: true,
      data: {
        ...safeUser,
        hasPassword: Boolean(user.password),
        hasPin: Boolean(user.withdrawPin),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserBank = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { bankName, accountNumber, accountName, isVerified } = req.body as {
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
      isVerified?: boolean;
    };

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({
        success: false,
        message: "bankName, accountNumber, and accountName are required",
      });
    }

    const bank = await Bank.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        ...(typeof isVerified === "boolean" ? { isVerified } : {}),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: {
        _id: bank._id,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountName: bank.accountName,
        isVerified: bank.isVerified,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate (or re-issue) the seller-side password for an approved seller
// and notify the user with a credential card. Useful for sellers whose KYC
// was approved before the seller-credentials flow was introduced, or whose
// seller password needs to be reset.
export const issueSellerCredentials = async (req: IAuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!user.isSeller) {
      return res
        .status(400)
        .json({ success: false, message: "User is not a seller. Approve their KYC first." });
    }

    const generated = crypto.randomBytes(6).toString("base64").slice(0, 10);
    const salt = await bcrypt.genSalt(10);
    user.sellerPassword = await bcrypt.hash(generated, salt);
    await user.save();

    const sellerDashboardUrl =
      process.env.SELLER_DASHBOARD_URL || "http://localhost:3002";

    const body = [
      "Your seller dashboard credentials have been issued/reset by an admin.",
      "",
      "Use the following credentials to sign in to your seller dashboard:",
      "",
      `Email:    ${user.email}`,
      `Password: ${generated}`,
      "",
      `Seller dashboard:  ${sellerDashboardUrl}/login`,
      "",
      "Notes:",
      "• This password is separate from your customer-site password.",
      "• Save this password now. The system shows it only on this notification.",
      "• You can change it from Seller Center → Settings after first login.",
    ].join("\n");

    await Notification.create({
      user: user._id,
      type: "kyc_approved",
      title: "Seller credentials issued",
      body,
      link: `${sellerDashboardUrl}/login`,
      metadata: {
        reissuedAt: new Date().toISOString(),
        sellerDashboardUrl,
        credentials: {
          email: user.email,
          password: generated,
          loginUrl: `${sellerDashboardUrl}/login`,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        // Returned to admin once so they can pass it to the seller out-of-band
        // if needed; otherwise the seller reads it from their notification.
        password: generated,
        loginUrl: `${sellerDashboardUrl}/login`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
