# Lalashop1 — Bug Tracker

ผลการ audit แบบขนาน 3 มิติ (security/authz, money flows, frontend/contract)
แก้ทีไหร่ → เปลี่ยน `[ ]` เป็น `[x]` แล้วเติม `**FIX DONE** YYYY-MM-DD` ที่ท้ายบรรทัด

**สถานะรวม:** 24 / 29 closed (21 fixed + 3 N/A/deferred · 5 pending)

- Critical: 9 fixed + 1 N/A (#9 false positive)
- High: 7 fixed + 1 N/A (#14 no apply flow yet) · 4 pending design (#18, #19, #21, #22)
- Medium: 5 fixed (2 incidental + 3 frontend small) · 1 deferred (#28 refactor) · 1 pending (#25 design)

---

## 🔴 CRITICAL (10 bugs)

### 💰 Money flow

- [x] **#1 Refund complete → state guard ไม่ครบ** **FIX DONE** 2026-05-17
  ของจริง: ระบบไม่มี buyer wallet — refund disbursement เป็น manual bank transfer (by design); แต่ **`complete` action ไม่ guard state** → admin คลิก complete โดยไม่ approve ก่อน → ข้ามการหัก seller balance
  📁 [financeController.ts:36-100](backend/src/controllers/financeController.ts)
  💥 admin click complete ตรงจาก requested → seller ยังได้เงินอยู่แม้คืนให้ buyer แล้ว
  ✅ Applied: state transitions strict (approve/reject ต้อง requested, complete ต้อง approved); validate `refund.amount <= order.totalPrice`; reject ตอน wrong state คืน 409 (ไม่ใช่ silent skip)
  📝 Note: ถ้าจะ track buyer payout จริง ต้องเพิ่มฟิลด์ `disbursementRef`, `buyerBankAccount` ใน refundModel — แยกเป็น feature

- [x] **#2 Slip verify race condition → seller ได้เงิน 2 ครั้ง** **FIX DONE** 2026-05-17
  เช็คแค่ `if (order && !order.isPaid)` แต่ไม่ atomic — 2 admin concurrent อ่านพร้อมกัน, both credit
  📁 [paymentController.ts:236-340](backend/src/controllers/paymentController.ts)
  💥 admin กดซ้ำ หรือ concurrent request → balance ของ seller โดน credit ซ้ำ
  ✅ Applied: เปลี่ยน adminReviewSlip เป็น atomic 2 ระดับ — (1) `PaymentSlip.findOneAndUpdate({_id, status: "pending"}, ...)` claim slip, return 409 ถ้าใช่แล้ว, (2) `Order.findOneAndUpdate({_id, isPaid: false}, ...)` flip order — credit seller เฉพาะ winner เท่านั้น; reject path ก็ atomic เหมือนกัน
  📝 Related (ยังไม่แก้): [orderController.ts:265-333 payOrder](backend/src/controllers/orderController.ts#L265) มี race pattern เดียวกัน — buyer flow, blast radius เล็กกว่า แต่ควรแก้แบบเดียวกัน

- [x] **#3 Refund approved แต่ balance ไม่พอ ก็เงียบ** **FIX DONE** 2026-05-17
  `if (user && (user.balance || 0) >= refund.amount)` — ถ้า balance ไม่พอ ไม่ throw error แต่ mark approved ต่อ
  📁 [financeController.ts:36-100](backend/src/controllers/financeController.ts)
  💥 บัญชี seller/แพลตฟอร์ม imbalance
  ✅ Applied: เปลี่ยนเป็น atomic `findOneAndUpdate({_id, balance: {$gte: refund.amount}}, {$inc: {balance: -amount}})` → คืน 400 explicit ถ้าไม่พอ; ป้องกัน race ของ 2 admin approve concurrent ด้วย

- [x] **#4 `totalPrice` + `item.price` รับจาก req.body** **FIX DONE** 2026-05-17
  ไม่ recompute server-side จาก orderItems + ใช้ item.price จาก client (หนักกว่าที่ audit report)
  📁 [orderController.ts:69-180](backend/src/controllers/orderController.ts)
  💥 buyer ส่ง `price: 1` ซื้อของ 10000 ได้ → seller ได้เงิน 1, ส่ง `totalPrice: 1` ทำ posRevenue เพี้ยน
  ✅ Applied: re-fetch product จาก DB (`name`, `image`, `price`, `seller`) ทุก item, recompute totalPrice + posRevenue server-side, POS ownership check ใช้ product.seller (จาก DB) แทน item.seller (จาก client), block Archived products, sanitize qty เป็น positive integer
  📝 Bonus: tier/wholesale pricing ยังไม่ apply (ใช้ product.price ปกติ) — แยกเป็น feature เพิ่มทีหลัง

- [x] **#5 Withdraw race condition + cancel race** **FIX DONE** 2026-05-17
  หัก `user.balance` แบบไม่ atomic, concurrent withdraw → balance ติดลบ; cancel ก็ race เหมือนกัน
  📁 [withdrawController.ts:60-200](backend/src/controllers/withdrawController.ts)
  💥 seller withdraw 2 รอบพร้อมกัน, balance เกิน; cancel ซ้ำ credit balance 2 ครั้ง
  ✅ Applied: createWithdrawal ใช้ `User.findOneAndUpdate({_id, balance: {$gte: amount}}, {$inc: {balance: -amount}})` atomic; cancelWithdrawal ใช้ `Withdraw.findOneAndUpdate({_id, user, status: "pending"}, ...)` atomic claim — refund balance เฉพาะ winner

### 🔐 Security

- [x] **#6 JWT_SECRET fallback เป็น `"secret"` / `"default_secret"`** **FIX DONE** 2026-05-17
  ถ้า env หาย → fake token ได้ทันที
  📁 [authMiddleware.ts:21,48](backend/src/middlewares/authMiddleware.ts), [authController.ts](backend/src/controllers/authController.ts) (generateToken)
  💥 เข้า account ใครก็ได้ใน dev / misconfigured prod
  🔧 Fix: throw error ถ้า `JWT_SECRET` ไม่ตั้ง แทนที่จะ fallback
  ✅ Applied: fail-fast ตอน startup ([app.ts:7-15](backend/src/app.ts#L7)) + ลบ fallback ครบ 5 จุดใน authMiddleware/authController/authRoutes
  📝 Bonus finding (ยังไม่แก้): google OAuth callback [authRoutes.ts:73](backend/src/routes/authRoutes.ts#L73) ไม่มี `expiresIn` → token ไม่หมดอายุ

- [x] **#7 IDOR บน `GET /orders/:id` + guest-order leaks 3 จุด** **FIX DONE** 2026-05-17
  route ใช้ `optionalProtect` + controller ไม่ตรวจ ownership; guest orders ใช้ hardcoded `sessionId: "guest-session"`
  📁 [orderController.ts](backend/src/controllers/orderController.ts), [orderRoutes.ts](backend/src/routes/orderRoutes.ts)
  💥 unauth ดู order ใครก็ได้, list guest orders ทั้งหมด, mark guest order paid ฟรี (credit seller), ลบ guest order ใครก็ได้
  ✅ Applied: route — `GET /:id`, `GET /mine`, `PUT /:id/pay`, `DELETE /:id` เปลี่ยนเป็น `protect` ทั้งหมด; controller — getOrderById เพิ่ม authz (buyer/seller/admin), getMyOrders ลบ guest fallback, payOrder + deleteOrder ลบ guest path (return 403 ถ้าไม่ใช่ owner); POST `/` ยังเป็น optionalProtect (รักษา guest checkout — order data return ใน response)
  📝 Note: ถ้าจะรองรับ guest receipt page ในอนาคต ต้องออกแบบ per-guest cookie-based sessionId (ไม่ใช่ hardcoded string)

- [x] **#8 adminRole sub-role ไม่ถูก enforce** **FIX DONE** 2026-05-17
  middleware เช็คแค่ `isAdmin === true` ไม่เช็ค `adminRole` (super/finance/support/content)
  📁 [authMiddleware.ts](backend/src/middlewares/authMiddleware.ts), [adminRoutes.ts](backend/src/routes/adminRoutes.ts)
  💥 support admin เรียก `PATCH /api/admin/settings` (super only) หรือ withdraw approve (finance only) ได้
  ✅ Applied: เพิ่ม `requireRole(allowed: AdminRole[])` middleware (legacy admins ที่ไม่มี adminRole ถือว่า super); apply กับ 5 super-only routes:
    - `POST /admins`, `DELETE /admins/:id` → super only
    - `POST /invites`, `PATCH /invites/:id/revoke`, `PATCH /invites/:id/resend` → super only
    - `PATCH /settings/:key` → super only
    - `PATCH /users/:id/suspend` → super or support
    - `PUT /users/:id/bank` → super or finance
    - `PATCH /withdrawals/:id/process` → super or finance
  📝 Note: route อื่น ยังเปิดให้ admin ทุก sub-role (เก็บ behavior เดิม) — รอ design permission matrix แบบละเอียดทีหลัง

- [x] **#9 financeRoutes ไม่ require admin** **FALSE POSITIVE** — ไม่ใช่ bug
  📁 [financeRoutes.ts](backend/src/routes/financeRoutes.ts), [financeController.ts](backend/src/controllers/financeController.ts)
  ✅ ตรวจแล้ว: ทุก endpoint scope query ด้วย `shop: <currentUserId>` — เป็น **seller-side flow** (seller ดู refund/settlement/transaction ของตัวเอง) ไม่ใช่ admin endpoint แม้ชื่อจะดูเหมือน
  📝 Note: ชื่อ "financeRoutes" + path `/api/finance` ทำให้สับสน — พิจารณา rename เป็น `sellerFinanceRoutes` หรือย้ายไปอยู่ใต้ `/api/seller/finance` เพื่อความชัดเจน

- [x] **#10 User.find() leak password hash + 4 sensitive fields** **FIX DONE** 2026-05-17
  `userModel.password / twoFactorSecret / otp / otpExpires / withdrawPin` ไม่มี `select: false` default
  📁 [userModel.ts](backend/src/models/userModel.ts) + 7 caller files
  💥 controller ไหนที่ลืม `.select("-password")` จะส่ง bcrypt hash + 2FA secret + OTP + withdrawPin กลับ
  ✅ Applied: เพิ่ม `select: false` กับ 5 field ใน userModel; opt-in `.select("+xxx")` ที่ 9 caller sites:
    - authController: login (+password), getMe (+password +withdrawPin), verifyResetCode (+otp +otpExpires), resetPassword (+otp +otpExpires)
    - twoFactorController: verifyEmailOTP (+otp +otpExpires), verifyTOTP (+twoFactorSecret)
    - withdrawController.createWithdrawal (+withdrawPin)
    - userController.updateProfile (+password)
    - adminController.updateUser (+password +withdrawPin), getUserById (+password +sellerPassword +withdrawPin)
  📝 Note: pure assignment ไม่ต้อง opt-in (Mongoose ทำงานได้แม้ field ไม่ถูก load — pre-save hook + dirty tracking ดูแลเอง)

---

## 🟠 HIGH (12 bugs)

- [x] **#11 Affiliate cookie expired ยังจ่าย commission** **FIX DONE** 2026-05-17
  `attributeProduct` + `resolveAttribution` ไม่ตรวจ `affiliateClick.expiresAt`
  📁 [affiliateController.ts](backend/src/controllers/affiliateController.ts), [orderController.ts:26-80](backend/src/controllers/orderController.ts)
  💥 creator ได้ค่า commission จาก click ที่หมดอายุ 30+ วัน (ผ่าน body affiliateCode bypass)
  ✅ Applied: ทั้ง 2 ฟังก์ชัน query `AffiliateClick.findOne({creator, product, expiresAt: {$gte: now}})` — ไม่ attribute ถ้าไม่มี click ใน window

- [x] **#12 CreatorEarning ไม่ถูก cancel เมื่อ refund** **FIX DONE** 2026-05-17
  ไม่มี code path connect refund → CreatorEarning
  📁 [financeController.ts decideRefund](backend/src/controllers/financeController.ts)
  💥 refund แล้ว creator ยัง settled commission อยู่
  ✅ Applied: ใน `approve` action, query all earnings ของ order, settled → deduct creator balance + decrement totalEarned, ทั้งหมด → status `canceled`
  📝 Note: best-effort ไม่ใช่ transactional; creator balance ลง negative ได้ (debt — รอ design wallet recovery flow); refund per-item granularity ต้องรอ #18

- [x] **#13 Cart freeze ราคาเก่า** **FIX DONE** 2026-05-17 (incidental จาก #4)
  ใช้ `cart.items[].unitPrice` (snapshot) ไม่ re-fetch product ตอน checkout
  ✅ #4 ของ createOrder re-fetch `product.price` server-side อยู่แล้ว — cart's stale price ถูก ignore ตอน order creation
  📝 Note: cart UI ยังแสดงราคา snapshot — ถ้าจะ UX ดีกว่านี้ ให้ frontend re-fetch product ตอน load cart (แยก task)

- [~] **#14 Coupon `usedCount` ไม่ atomic** **N/A — ยังไม่มี apply flow**
  ตรวจแล้ว: marketingController มีแค่ CRUD coupon ไม่มี endpoint ที่ `$inc usedCount` หรือ apply coupon ในการ checkout เลย
  📝 Note: เมื่อสร้าง apply flow ใหม่ ต้องใช้ atomic `findOneAndUpdate({_id, usedCount: {$lt: usageLimit}}, {$inc: {usedCount: 1}})`

- [x] **#15 Admin invite token race + re-use** **FIX DONE** 2026-05-17
  status check block re-use แต่ 2 request concurrent ทั้งคู่ผ่าน check → ทั้งคู่ grant admin + เขียน password ทับ
  📁 [adminInviteController.ts acceptInvite](backend/src/controllers/adminInviteController.ts)
  💥 race condition → admin elevation + password overwrite
  ✅ Applied: atomic claim `AdminInvite.findOneAndUpdate({token, status: "pending", expiresAt: {$gte: now}}, {status: "accepted"})` — ผู้ที่ claim ได้คนเดียวเท่านั้นที่ดำเนินการต่อ; diagnostic 2nd-query ช่วยให้ frontend แสดง error message ที่ถูกต้อง (expired/accepted/not-found)

- [x] **#16 Mass assignment บน updateAddress** **FIX DONE** 2026-05-17
  รับ `req.body` ตรงๆ ใน `findOneAndUpdate`
  📁 [addressController.ts updateAddress](backend/src/controllers/addressController.ts)
  💥 ผู้ใช้ส่ง `user: <otherUserId>` → ที่อยู่ถูก reassign
  ✅ Applied: explicit whitelist ของ 7 fields (recipientName, phoneNumber, village, district, province, shippingBranch, isDefault) + type validation; ฟิลด์อื่น (user, createdAt, _id) ถูก ignore

- [x] **#17 Mass assignment ตอน Order.create** **FIX DONE** 2026-05-17 (incidental จาก #4)
  spread `req.body` → buyer ส่ง `status: "delivered"`, `isPaid: true` ได้
  ✅ #4 build `enriched` แบบ explicit ทุก field; Order constructor hardcode `status`, `isPaid`, `isDelivered` ตาม `isPos` server-side

- [ ] **#18 Multi-seller refund ไม่ proportional**
  `refundModel.shop` มีอันเดียว แต่ order มี seller หลายคน
  📁 [refundModel.ts](backend/src/models/refundModel.ts)
  💥 refund หัก balance ของ seller คนเดียว ไม่ครอบคลุม
  🔧 Fix: refund per-item หรือมี `refundItems[]`

- [ ] **#19 POS revenue ปนกับ balance**
  บางจุดใส่ `posRevenue` บางจุดใส่ `balance` → บัญชีไม่ตรง
  📁 [orderController.ts:149-151](backend/src/controllers/orderController.ts), [paymentController.ts:268](backend/src/controllers/paymentController.ts), [financeController.ts](backend/src/controllers/financeController.ts)
  💥 withdraw จาก `balance` ดึง pos revenue ไม่ได้ / ดึงได้แล้วแต่ที่

- [x] **#20 ไม่มี rate limit บน 2FA/OTP send + withdraw-pin/set** **FIX DONE** 2026-05-17
  DEPLOY.md ระบุ rate limit เฉพาะ auth endpoints
  📁 [authRoutes.ts:112-118](backend/src/routes/authRoutes.ts)
  💥 brute-force OTP / spam OTP email / steal withdraw PIN via XSS
  ✅ Applied: `authRateLimiter` ใน `/withdraw-pin/set`, `/2fa/email/send`, `/2fa/email/verify`, `/2fa/verify` (10 tries / 15 min) — เก็บ `/2fa/setup` ไว้ (GET, idempotent)

- [ ] **#21 Frontend: token ใน localStorage**
  ทั้ง 3 apps เก็บ JWT ใน localStorage → XSS ขโมยได้
  📁 [frontend/login/index.tsx:28,63](frontend/src/pages/login/index.tsx), [Admin/login.tsx:33](Admin/src/pages/login.tsx), [seller/login.tsx:32](seller/src/pages/login.tsx)
  🔧 Fix: ย้ายไป httpOnly cookie (server-set)

- [ ] **#22 Admin/seller pages ไม่มี auth guard ก่อน fetch**
  component render + fetch ก่อนตรวจ token
  📁 [Admin/withdrawpage/[id].tsx](Admin/src/pages/withdrawpage/[id].tsx), [Admin/index.tsx](Admin/src/pages/index.tsx), [seller/orders/index.tsx](seller/src/pages/orders/index.tsx)
  💥 network request leak, 401 หลัง render

---

## 🟡 MEDIUM (7 bugs)

- [x] **#23 Refund amount ไม่ validate ≤ order.totalPrice** **FIX DONE** 2026-05-17 (incidental จาก #1)
  ✅ #1 fix เพิ่ม `Order.findById(refund.order).select("totalPrice")` + check `refund.amount > order.totalPrice` → 400

- [x] **#24 Withdraw cancel silent fail ตอน status ≠ pending** **FIX DONE** 2026-05-17 (incidental จาก #5)
  ✅ #5 fix เปลี่ยน cancelWithdrawal เป็น atomic `findOneAndUpdate({_id, user, status: "pending"})` → 400 explicit ถ้าไม่ใช่ pending

- [ ] **#25 Commission lock ตอน create order ไม่ใช่ตอน paid**
  ถ้า seller เปลี่ยน commission rule ระหว่าง buyer จ่าย → rate เก่าค้าง
  📁 [orderController.ts:113-126](backend/src/controllers/orderController.ts)

- [x] **#26 Floating-point price arithmetic** **FIX DONE** 2026-05-17
  `parseFloat × parseInt` → 0.1 × 3 = 0.30000…4
  📁 [buyproduct/payment.tsx:60-69](frontend/src/pages/buyproduct/payment.tsx)
  ✅ Applied: `Math.round(price * qty * 100) / 100` + clamp price to non-negative + qty to positive integer; ปลอดภัยจาก NaN/Infinity ด้วย `Number.isFinite()`
  📝 Note: ไม่ได้ refactor ไปใช้ integer cents เต็มระบบ (จะกระทบ backend + DB schema) — เป็นแค่ display-rounding

- [x] **#27 Frontend ไม่ validate price/qty จาก URL** **FIX DONE** 2026-05-17
  รับ negative / NaN ได้
  📁 [buyproduct/transfer.tsx:101-114](frontend/src/pages/buyproduct/transfer.tsx)
  ✅ Applied: helper `safeNum(v, fallback)` ตรวจ `Number.isFinite()` + `>= 0`; qty floor + min 1; round 2 decimals
  📝 Note: backend #4 ก็ recompute totalPrice ฝั่ง server อยู่แล้ว — เรื่องนี้แค่ display correctness

- [~] **#28 apiClient 3 ตัวคืน shape ต่างกัน** **DEFERRED**
  - frontend: raw payload
  - Admin: `ApiResponse<T>` wrapper
  - seller: raw payload
  📁 services/apiClient.ts ทั้ง 3
  📝 ตรวจแล้ว: ไม่ใช่ bug จริง แต่เป็น style inconsistency; refactor ให้เหมือนกัน = ต้องแก้ทุก call site ใน 3 apps → ไม่เร็ว, แยกเป็น cleanup task

- [x] **#29 i18n hardcoded ภาษา (BCEL/LDB/JDB)** **FIX DONE** 2026-05-17
  ภาษาลาว ฝังตรงๆ ใน JSX แทน `t()`
  📁 [buyproduct/payment.tsx:75-92](frontend/src/pages/buyproduct/payment.tsx) + locales × 5
  💥 ภาษาอื่นไม่แสดง / 5-language coverage หลุด
  ✅ Applied: payment.tsx ใช้ `t("pages.payment.method.{bcelOne,ldbTrust,jdbYes}{Title,Desc}")`; เพิ่ม 6 keys ใหม่ใน en/lo/th/vi/zh common.json (รวม 30 strings)

---

## 🎯 Recommended fix order

1. **Hotfix ทันที (production-critical):** #6 · #4 · #2 · #7
2. **Money correctness:** #1 · #3 · #5 · #11 · #12
3. **AuthZ hardening:** #8 · #9 · #10 · #15 · #16 · #17
4. **Frontend / contract:** #21 · #22 · #28 · #13
5. **Rest:** ตามสะดวก

---

## 📜 Fix log

เพิ่ม entry เมื่อ fix done — สั้น ๆ ก็พอ:
- `YYYY-MM-DD · #N · commit-hash · note`

```
2026-05-17 · #6 · (uncommitted) · JWT secret fail-fast + remove 5 fallbacks
2026-05-17 · #4 · (uncommitted) · createOrder re-fetches product, recomputes price + totalPrice server-side
2026-05-17 · #2 · (uncommitted) · adminReviewSlip → atomic 2-tier compare-and-swap (slip + order)
2026-05-17 · #7 · (uncommitted) · orders routes/controllers — require auth, strict ownership, no guest fallback
2026-05-17 · #1 · (uncommitted) · decideRefund state guards (approve/reject must be requested, complete must be approved) + amount ≤ order.totalPrice
2026-05-17 · #3 · (uncommitted) · decideRefund atomic balance deduction with $gte guard → explicit 400 on insufficient
2026-05-17 · #5 · (uncommitted) · withdraw create + cancel use atomic findOneAndUpdate, no read-then-write
2026-05-17 · #8 · (uncommitted) · add requireRole(allowed[]) middleware + apply to 5 super-only admin routes
2026-05-17 · #9 · (skipped) · false positive — financeRoutes are seller-scoped, not admin
2026-05-17 · #10 · 5e0aea2 · userModel select:false on 5 secrets + opt-in .select("+xxx") at 9 caller sites
2026-05-17 · #6-#10 · 5e0aea2 · "fix(backend): close 9 critical security + money-flow holes"
2026-05-17 · #11 · (uncommitted) · resolveAttribution + attributeProduct check AffiliateClick.expiresAt
2026-05-17 · #12 · (uncommitted) · decideRefund approve → cancel CreatorEarnings + reverse creator balance/totalEarned
2026-05-17 · #15 · (uncommitted) · acceptInvite atomic claim via findOneAndUpdate (status: "pending" guard)
2026-05-17 · #16 · (uncommitted) · updateAddress whitelist 7 fields (kill mass-assignment)
2026-05-17 · #20 · (uncommitted) · authRateLimiter applied to /withdraw-pin/set, /2fa/email/send, /2fa/email/verify, /2fa/verify
2026-05-17 · #13, #17, #23, #24 · (closed by previous commits) · incidentally fixed by #4, #1, #5
2026-05-17 · #6-#12, #15-#16, #20 · da96364 · "fix(backend): close 5 high-severity bugs"
2026-05-17 · #26, #27, #29 · (uncommitted) · payment.tsx + transfer.tsx + i18n keys (30 strings × 5 langs)
```
