import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/userModel";
import Product from "../models/productModel";
import Order from "../models/orderModel";
import Post from "../models/postModel";
import Bank from "../models/bankModel";

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
    const [
      totalUsers,
      activeShops,
      totalProducts,
      totalPosts,
      pendingOrders,
      completedOrders,
      revenueAgg,
      activeUsersToday,
      pendingShopApprovals,
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
      User.countDocuments({ updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      User.countDocuments({ isSeller: true, seller_type: { $in: [null, undefined, ""] } }),
    ]);

    const totalRevenue = revenueAgg[0]?.total ?? 0;

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
          pendingShopApprovals,
        },
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

    const bank = await Bank.findOne({ user: userDoc._id });

    const safeUser = userDoc.toObject() as unknown as Record<string, unknown>;
    delete safeUser.password;
    delete safeUser.twoFactorSecret;
    delete safeUser.otp;
    delete safeUser.otpExpires;
    delete safeUser.withdrawPin;

    res.status(200).json({
      success: true,
      data: {
        ...safeUser,
        hasPassword: Boolean(userDoc.password),
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
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
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
