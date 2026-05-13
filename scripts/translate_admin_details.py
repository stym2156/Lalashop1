"""Translate the remaining ~95 Admin keys (users/shops/orders/kyc/withdrawals details)
that fell back to English in th/zh/lo/vi."""
import json
from pathlib import Path

LOCALES = Path("f:/Lalashop2026/Admin/src/locales")

T: dict[str, dict[str, str]] = {
    # === users details ===
    "pages.users.details.identity": {
        "th": "ตัวตน", "zh": "身份", "lo": "ຕົວຕົນ", "vi": "Danh tính",
    },
    "pages.users.details.security": {
        "th": "ความปลอดภัยและกิจกรรม", "zh": "安全与活动",
        "lo": "ຄວາມປອດໄພ ແລະ ກິດຈະກຳ", "vi": "Bảo mật & Hoạt động",
    },
    "pages.users.details.trustScore": {
        "th": "คะแนนความน่าเชื่อถือ", "zh": "信用评分",
        "lo": "ຄະແນນຄວາມໜ້າເຊື່ອຖື", "vi": "Điểm tin cậy",
    },
    "pages.users.details.accountSuspended": {
        "th": "บัญชีถูกระงับ", "zh": "账户已暂停", "lo": "ບັນຊີຖືກລະງັບ",
        "vi": "Tài khoản bị tạm khóa",
    },
    "pages.users.details.liftSuspension": {
        "th": "ยกเลิกการระงับ", "zh": "解除暂停", "lo": "ຍົກເລີກການລະງັບ",
        "vi": "Gỡ tạm khóa",
    },
    "pages.users.details.suspendUser": {
        "th": "ระงับผู้ใช้", "zh": "暂停用户", "lo": "ລະງັບຜູ້ໃຊ້",
        "vi": "Tạm khóa người dùng",
    },
    "pages.users.details.issueSellerPassword": {
        "th": "ออกรหัสผ่านผู้ขาย", "zh": "发放卖家密码",
        "lo": "ອອກລະຫັດຜ່ານຜູ້ຂາຍ", "vi": "Cấp mật khẩu người bán",
    },
    "pages.users.details.issuing": {
        "th": "กำลังออก...", "zh": "发放中...", "lo": "ກຳລັງອອກ...",
        "vi": "Đang cấp...",
    },
    "pages.users.details.editUser": {
        "th": "แก้ไขผู้ใช้", "zh": "编辑用户", "lo": "ແກ້ໄຂຜູ້ໃຊ້",
        "vi": "Sửa người dùng",
    },
    "pages.users.details.unsuspend": {
        "th": "ยกเลิกการระงับ", "zh": "解除暂停", "lo": "ຍົກເລີກລະງັບ",
        "vi": "Gỡ khóa",
    },
    "pages.users.details.credsIssued": {
        "th": "ออกข้อมูลรับรองผู้ขายแล้ว", "zh": "已发放卖家凭证",
        "lo": "ອອກຂໍ້ມູນຮັບຮອງຜູ້ຂາຍແລ້ວ", "vi": "Đã cấp thông tin người bán",
    },
    "pages.users.details.credsIssuedDesc": {
        "th": "ผู้ใช้จะเห็นข้อมูลรับรองนี้ในการแจ้งเตือนภายในแอป...",
        "zh": "用户将在应用内通知中看到这些凭证...",
        "lo": "ຜູ້ໃຊ້ຈະເຫັນຂໍ້ມູນຮັບຮອງນີ້ໃນການແຈ້ງເຕືອນພາຍໃນແອັບ...",
        "vi": "Người dùng sẽ thấy thông tin này trong thông báo trong ứng dụng...",
    },
    "pages.users.details.loginUrl": {
        "th": "URL เข้าสู่ระบบ", "zh": "登录链接", "lo": "URL ເຂົ້າສູ່ລະບົບ",
        "vi": "URL đăng nhập",
    },
    "pages.users.details.moneySource": {
        "th": "แหล่งที่มาของเงิน", "zh": "资金来源", "lo": "ແຫຼ່ງທີ່ມາຂອງເງິນ",
        "vi": "Nguồn tiền",
    },
    "pages.users.details.moneySourceDesc": {
        "th": "ใช้ตรวจสอบแหล่งที่มาก่อนอนุมัติการถอน",
        "zh": "在批准提现前用于验证资金来源",
        "lo": "ໃຊ້ກວດສອບແຫຼ່ງທີ່ມາກ່ອນອະນຸມັດການຖອນ",
        "vi": "Dùng để xác minh nguồn gốc trước khi duyệt rút tiền",
    },
    "pages.users.details.orderActivity": {
        "th": "กิจกรรมคำสั่งซื้อ", "zh": "订单活动", "lo": "ກິດຈະກຳຄຳສັ່ງຊື້",
        "vi": "Hoạt động đơn hàng",
    },
    "pages.users.details.shopAndKyc": {
        "th": "ร้านค้าและ KYC", "zh": "店铺与 KYC", "lo": "ຮ້ານຄ້າ ແລະ KYC",
        "vi": "Cửa hàng & KYC",
    },
    "pages.users.details.systemMetadata": {
        "th": "ข้อมูลระบบ", "zh": "系统元数据", "lo": "ຂໍ້ມູນລະບົບ",
        "vi": "Siêu dữ liệu hệ thống",
    },
    "pages.users.details.editModal.title": {
        "th": "แก้ไขผู้ใช้", "zh": "编辑用户", "lo": "ແກ້ໄຂຜູ້ໃຊ້",
        "vi": "Sửa người dùng",
    },
    "pages.users.details.editModal.credsHeader": {
        "th": "รีเซ็ตข้อมูลรับรอง (ปล่อยว่างเพื่อเก็บค่าเดิม)",
        "zh": "重置凭证（留空保持当前值）",
        "lo": "ຣີເຊັດຂໍ້ມູນຮັບຮອງ (ປ່ອຍວ່າງເພື່ອຮັກສາຄ່າເດີມ)",
        "vi": "Đặt lại thông tin (để trống để giữ nguyên)",
    },
    "pages.users.details.editModal.newPin": {
        "th": "PIN ใหม่ (6 หลัก)", "zh": "新 PIN (6 位)",
        "lo": "PIN ໃໝ່ (6 ຫຼັກ)", "vi": "PIN mới (6 chữ số)",
    },
    "pages.users.details.editModal.passwordPlaceholder": {
        "th": "อย่างน้อย 6 ตัวอักษร", "zh": "至少 6 个字符",
        "lo": "ຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ", "vi": "Tối thiểu 6 ký tự",
    },
    "pages.users.details.editModal.pinPlaceholder": {
        "th": "6 หลัก", "zh": "6 位", "lo": "6 ຫຼັກ", "vi": "6 chữ số",
    },
    "pages.users.details.suspendModal.title": {
        "th": "ระงับผู้ใช้", "zh": "暂停用户", "lo": "ລະງັບຜູ້ໃຊ້",
        "vi": "Tạm khóa người dùng",
    },
    "pages.users.details.suspendModal.liftTitle": {
        "th": "ยกเลิกการระงับ", "zh": "解除暂停", "lo": "ຍົກເລີກການລະງັບ",
        "vi": "Gỡ tạm khóa",
    },
    "pages.users.details.suspendModal.liftDesc": {
        "th": "การยกเลิกจะคืนสิทธิ์เข้าสู่ระบบและสั่งซื้อให้กับผู้ใช้",
        "zh": "解除后将恢复该用户的登录和下单权限",
        "lo": "ການຍົກເລີກຈະຄືນສິດເຂົ້າສູ່ລະບົບ ແລະ ສັ່ງຊື້ໃຫ້ຜູ້ໃຊ້",
        "vi": "Gỡ tạm khóa sẽ khôi phục quyền đăng nhập và đặt hàng",
    },
    "pages.users.details.suspendModal.suspendDesc": {
        "th": "ผู้ใช้ที่ถูกระงับจะเข้าสู่ระบบและสั่งซื้อไม่ได้ เหตุผลจะแสดงต่อทีมสนับสนุน",
        "zh": "暂停的用户无法登录或下单。原因将向客服显示。",
        "lo": "ຜູ້ໃຊ້ທີ່ຖືກລະງັບຈະບໍ່ສາມາດເຂົ້າສູ່ລະບົບ ຫຼື ສັ່ງຊື້. ເຫດຜົນຈະສະແດງໃຫ້ທີມຊ່ວຍເຫຼືອ.",
        "vi": "Người dùng bị tạm khóa không thể đăng nhập hoặc đặt hàng. Lý do hiển thị cho nhân viên hỗ trợ.",
    },
    "pages.users.details.labels.customerPassword": {
        "th": "รหัสผ่านลูกค้า", "zh": "客户密码", "lo": "ລະຫັດຜ່ານລູກຄ້າ",
        "vi": "Mật khẩu khách hàng",
    },
    "pages.users.details.labels.sellerPassword": {
        "th": "รหัสผ่านผู้ขาย", "zh": "卖家密码", "lo": "ລະຫັດຜ່ານຜູ້ຂາຍ",
        "vi": "Mật khẩu người bán",
    },
    "pages.users.details.labels.lastUpdate": {
        "th": "อัปเดตล่าสุด", "zh": "最近更新", "lo": "ອັບເດດຫຼ້າສຸດ",
        "vi": "Cập nhật gần nhất",
    },
    # === shops details ===
    "pages.shops.details.closeShop": {
        "th": "ปิดร้าน", "zh": "关闭店铺", "lo": "ປິດຮ້ານ",
        "vi": "Đóng cửa hàng",
    },
    "pages.shops.details.openProfile": {
        "th": "เปิดโปรไฟล์ร้าน", "zh": "打开店铺资料", "lo": "ເປີດໂປຣໄຟລ໌ຮ້ານ",
        "vi": "Mở hồ sơ cửa hàng",
    },
    "pages.shops.details.viewProducts": {
        "th": "ดูสินค้า", "zh": "查看商品", "lo": "ເບິ່ງສິນຄ້າ",
        "vi": "Xem sản phẩm",
    },
    "pages.shops.details.viewOrders": {
        "th": "ดูคำสั่งซื้อ", "zh": "查看订单", "lo": "ເບິ່ງຄຳສັ່ງຊື້",
        "vi": "Xem đơn hàng",
    },
    "pages.shops.details.lifetimeTotals": {
        "th": "ยอดสะสมทั้งหมด", "zh": "累计总数", "lo": "ຍອດສະສົມທັງໝົດ",
        "vi": "Tổng tích lũy",
    },
    "pages.shops.details.balancePayout": {
        "th": "ยอดเงินและการจ่าย", "zh": "余额与付款", "lo": "ຍອດເງິນ ແລະ ການຈ່າຍ",
        "vi": "Số dư & Thanh toán",
    },
    "pages.shops.details.lastOrder": {
        "th": "คำสั่งซื้อล่าสุด", "zh": "最近收到的订单",
        "lo": "ຄຳສັ່ງຊື້ຫຼ້າສຸດ", "vi": "Đơn hàng gần nhất",
    },
    "pages.shops.details.shopBio": {
        "th": "ประวัติร้าน", "zh": "店铺简介", "lo": "ປະຫວັດຮ້ານ",
        "vi": "Giới thiệu cửa hàng",
    },
    "pages.shops.details.metrics.totalOrders": {
        "th": "คำสั่งซื้อทั้งหมด", "zh": "订单总数", "lo": "ຄຳສັ່ງຊື້ທັງໝົດ",
        "vi": "Tổng đơn hàng",
    },
    "pages.shops.details.metrics.grossRevenue": {
        "th": "รายได้รวม (฿)", "zh": "总收入 (฿)", "lo": "ລາຍຮັບລວມ (฿)",
        "vi": "Tổng doanh thu (฿)",
    },
    "pages.shops.details.metrics.currentBalance": {
        "th": "ยอดคงเหลือปัจจุบัน (฿)", "zh": "当前余额 (฿)",
        "lo": "ຍອດຄົງເຫຼືອປັດຈຸບັນ (฿)", "vi": "Số dư hiện tại (฿)",
    },
    "pages.shops.details.metrics.pendingWithdrawals": {
        "th": "การถอนรอดำเนินการ", "zh": "待处理提现",
        "lo": "ການຖອນລໍຖ້າ", "vi": "Rút tiền đang chờ",
    },
    "pages.shops.details.metrics.posRevenue": {
        "th": "รายได้ POS (฿)", "zh": "POS 收入 (฿)", "lo": "ລາຍຮັບ POS (฿)",
        "vi": "Doanh thu POS (฿)",
    },
    "pages.shops.details.metrics.lifetimeIncome": {
        "th": "รายได้สะสม (฿)", "zh": "累计收入 (฿)",
        "lo": "ລາຍຮັບສະສົມ (฿)", "vi": "Thu nhập tích lũy (฿)",
    },
    # === orders details ===
    "pages.orders.details.failedToUpdateSlip": {
        "th": "อัปเดตสลิปไม่สำเร็จ", "zh": "更新回单失败", "lo": "ອັບເດດໃບໂອນລົ້ມເຫຼວ",
        "vi": "Cập nhật biên lai thất bại",
    },
    "pages.orders.details.fromShop": {
        "th": "จากร้าน", "zh": "来自店铺", "lo": "ຈາກຮ້ານ", "vi": "Từ cửa hàng",
    },
    "pages.orders.details.placedAt": {
        "th": "สั่งซื้อเมื่อ {{date}}", "zh": "下单时间 {{date}}",
        "lo": "ສັ່ງຊື້ເມື່ອ {{date}}", "vi": "Đặt lúc {{date}}",
    },
    "pages.orders.details.contactBuyer": {
        "th": "ติดต่อผู้ซื้อ", "zh": "联系买家", "lo": "ຕິດຕໍ່ຜູ້ຊື້",
        "vi": "Liên hệ người mua",
    },
    "pages.orders.details.invoice": {
        "th": "ใบแจ้งหนี้", "zh": "发票", "lo": "ໃບແຈ້ງໜີ້", "vi": "Hóa đơn",
    },
    "pages.orders.details.escalate": {
        "th": "ยกระดับ", "zh": "升级处理", "lo": "ຍົກລະດັບ", "vi": "Chuyển cấp",
    },
    "pages.orders.details.paymentVerified": {
        "th": "ยืนยันการชำระแล้ว", "zh": "付款已验证",
        "lo": "ຍືນຍັນການຊຳລະແລ້ວ", "vi": "Đã xác minh thanh toán",
    },
    "pages.orders.details.paymentRejected": {
        "th": "ปฏิเสธการชำระ", "zh": "付款已拒绝",
        "lo": "ປະຕິເສດການຊຳລະ", "vi": "Từ chối thanh toán",
    },
    "pages.orders.details.slipAwaitingReview": {
        "th": "ส่งสลิปแล้ว — รอตรวจสอบ",
        "zh": "回单已提交 — 待审核",
        "lo": "ສົ່ງໃບໂອນແລ້ວ — ລໍຖ້າກວດສອບ",
        "vi": "Đã gửi biên lai — chờ xem xét",
    },
    "pages.orders.details.transferred": {
        "th": "โอนแล้ว", "zh": "已转账", "lo": "ໂອນແລ້ວ", "vi": "đã chuyển",
    },
    "pages.orders.details.amountMismatch": {
        "th": "จำนวนเงินไม่ตรง! คำสั่งซื้อ",
        "zh": "金额不匹配！订单",
        "lo": "ຈຳນວນເງິນບໍ່ຕົງ! ຄຳສັ່ງຊື້",
        "vi": "Số tiền không khớp! Đơn",
    },
    "pages.orders.details.orderAmount": {
        "th": "ยอดคำสั่งซื้อ", "zh": "订单金额", "lo": "ຍອດຄຳສັ່ງຊື້",
        "vi": "Số tiền đơn",
    },
    "pages.orders.details.toAccount": {
        "th": "ไปยังบัญชี", "zh": "至账户", "lo": "ໄປບັນຊີ", "vi": "Đến tài khoản",
    },
    "pages.orders.details.buyerNote": {
        "th": "หมายเหตุของผู้ซื้อ", "zh": "买家备注",
        "lo": "ໝາຍເຫດຜູ້ຊື້", "vi": "Ghi chú người mua",
    },
    "pages.orders.details.verifiedBy": {
        "th": "ยืนยันโดย", "zh": "审核人", "lo": "ກວດສອບໂດຍ",
        "vi": "Xác minh bởi",
    },
    "pages.orders.details.awaitingPayment": {
        "th": "ผู้ซื้อยังไม่อัปโหลดสลิป — รอชำระเงิน",
        "zh": "买家尚未上传付款回单 — 等待付款",
        "lo": "ຜູ້ຊື້ຍັງບໍ່ໄດ້ອັບໂຫຼດໃບໂອນ — ລໍຖ້າຊຳລະ",
        "vi": "Người mua chưa tải biên lai — chờ thanh toán",
    },
    "pages.orders.details.actorCarrier": {
        "th": "ผู้ขนส่ง", "zh": "承运商", "lo": "ຜູ້ຂົນສົ່ງ", "vi": "Đơn vị vận chuyển",
    },
    "pages.orders.details.eventCancelled": {
        "th": "ยกเลิกคำสั่งซื้อแล้ว", "zh": "订单已取消",
        "lo": "ຍົກເລີກຄຳສັ່ງຊື້ແລ້ວ", "vi": "Đã hủy đơn",
    },
    "pages.orders.details.actorAdmin": {
        "th": "ผู้ดูแล/ระบบ", "zh": "管理员/系统",
        "lo": "ຜູ້ດູແລ/ລະບົບ", "vi": "Quản trị/Hệ thống",
    },
    "pages.orders.details.paidAt": {
        "th": "ชำระเมื่อ", "zh": "付款时间", "lo": "ຊຳລະເມື່ອ",
        "vi": "Thanh toán lúc",
    },
    "pages.orders.details.inTransit": {
        "th": "กำลังจัดส่ง / รอดำเนินการ", "zh": "运输中 / 待处理",
        "lo": "ກຳລັງສົ່ງ / ລໍຖ້າ", "vi": "Đang giao / Đang chờ",
    },
    # === kyc verification ===
    "pages.kyc.verification.reviewSubmission": {
        "th": "ตรวจสอบการสมัคร", "zh": "审核提交",
        "lo": "ກວດສອບການສະໝັກ", "vi": "Xem xét đơn",
    },
    "pages.kyc.verification.sendApproval": {
        "th": "ส่งการอนุมัติ", "zh": "发送批准",
        "lo": "ສົ່ງການອະນຸມັດ", "vi": "Gửi chấp thuận",
    },
    "pages.kyc.verification.sendRejection": {
        "th": "ส่งการปฏิเสธ", "zh": "发送拒绝",
        "lo": "ສົ່ງການປະຕິເສດ", "vi": "Gửi từ chối",
    },
    "pages.kyc.verification.shopInformation": {
        "th": "ข้อมูลร้านค้า", "zh": "店铺信息",
        "lo": "ຂໍ້ມູນຮ້ານຄ້າ", "vi": "Thông tin cửa hàng",
    },
    "pages.kyc.verification.warehouseAddress": {
        "th": "ที่อยู่คลังสินค้า", "zh": "仓库地址",
        "lo": "ທີ່ຢູ່ຄັງສິນຄ້າ", "vi": "Địa chỉ kho",
    },
    "pages.kyc.verification.verificationStatus": {
        "th": "สถานะการยืนยัน", "zh": "验证状态",
        "lo": "ສະຖານະການຢືນຢັນ", "vi": "Trạng thái xác minh",
    },
    "pages.kyc.verification.phoneVerified": {
        "th": "ยืนยันเบอร์โทรแล้ว", "zh": "电话已验证",
        "lo": "ຢືນຢັນເບີໂທແລ້ວ", "vi": "Điện thoại đã xác minh",
    },
    "pages.kyc.verification.notProvided": {
        "th": "ไม่ได้ระบุ", "zh": "未提供", "lo": "ບໍ່ໄດ້ລະບຸ",
        "vi": "Chưa cung cấp",
    },
    "pages.kyc.verification.openPdf": {
        "th": "PDF — เปิด", "zh": "PDF — 打开", "lo": "PDF — ເປີດ",
        "vi": "PDF — Mở",
    },
    "pages.kyc.verification.tinNumber": {
        "th": "เลขประจำตัวผู้เสียภาษี", "zh": "税号",
        "lo": "ເລກປະຈຳຕົວຜູ້ເສຍພາສີ", "vi": "Mã số thuế",
    },
    "pages.kyc.verification.street": {
        "th": "ถนน", "zh": "街道", "lo": "ຖະໜົນ", "vi": "Đường",
    },
    "pages.kyc.verification.reviewedAt": {
        "th": "ตรวจสอบเมื่อ {{date}}", "zh": "审核于 {{date}}",
        "lo": "ກວດສອບເມື່ອ {{date}}", "vi": "Đã xem xét {{date}}",
    },
    "pages.kyc.verification.noSubmissionId": {
        "th": "ไม่ระบุรหัสการสมัคร", "zh": "未提供提交编号",
        "lo": "ບໍ່ມີລະຫັດການສະໝັກ", "vi": "Không có mã đơn",
    },
    "pages.kyc.verification.descriptionRequired": {
        "th": "กรุณาระบุคำอธิบายให้ผู้ใช้", "zh": "请向用户提供说明",
        "lo": "ກະລຸນາລະບຸຄຳອະທິບາຍສຳລັບຜູ້ໃຊ້",
        "vi": "Vui lòng cung cấp mô tả cho người dùng",
    },
    "pages.kyc.verification.idTypes.state_id": {
        "th": "บัตรประจำตัวรัฐ", "zh": "州身份证",
        "lo": "ບັດປະຈຳຕົວລັດ", "vi": "Thẻ căn cước nhà nước",
    },
    # === withdrawals details ===
    "pages.withdrawals.details.actions.noFurther": {
        "th": "ไม่มีการดำเนินการเพิ่มเติม", "zh": "无进一步操作",
        "lo": "ບໍ່ມີການດຳເນີນການເພີ່ມເຕີມ", "vi": "Không có hành động thêm",
    },
    "pages.withdrawals.details.amount.net": {
        "th": "ยอดสุทธิถึงผู้ใช้", "zh": "用户实收",
        "lo": "ສຸດທິເຖິງຜູ້ໃຊ້", "vi": "Thực nhận của người dùng",
    },
    "pages.withdrawals.details.bankInfo.notOnFile": {
        "th": "ไม่มีบัญชีธนาคารในระบบ", "zh": "未记录银行账户",
        "lo": "ບໍ່ມີບັນຊີທະນາຄານໃນລະບົບ",
        "vi": "Không có thông tin tài khoản ngân hàng",
    },
    "pages.withdrawals.details.notes.title": {
        "th": "บันทึกการดำเนินการของผู้ดูแล", "zh": "管理员处理备注",
        "lo": "ບັນທຶກການດຳເນີນການຂອງຜູ້ດູແລ",
        "vi": "Ghi chú xử lý của quản trị",
    },
    "pages.withdrawals.details.notes.refLabel": {
        "th": "รหัสอ้างอิงโอนเงิน", "zh": "银行转账参考号",
        "lo": "ລະຫັດອ້າງອີງການໂອນ", "vi": "Mã tham chiếu chuyển khoản",
    },
    "pages.withdrawals.details.notes.adminNotePlaceholder": {
        "th": "หมายเหตุภายในเกี่ยวกับการถอนนี้...",
        "zh": "关于此提现的内部备注...",
        "lo": "ໝາຍເຫດພາຍໃນກ່ຽວກັບການຖອນນີ້...",
        "vi": "Ghi chú nội bộ về giao dịch rút này...",
    },
    "pages.withdrawals.details.userSection.profile": {
        "th": "เปิดโปรไฟล์ผู้ใช้", "zh": "打开用户资料",
        "lo": "ເປີດໂປຣໄຟລ໌ຜູ້ໃຊ້", "vi": "Mở hồ sơ người dùng",
    },
    "pages.withdrawals.details.timeline.updated": {
        "th": "อัปเดตล่าสุด", "zh": "最近更新",
        "lo": "ອັບເດດຫຼ້າສຸດ", "vi": "Cập nhật gần nhất",
    },
    "pages.withdrawals.details.rejectConfirm": {
        "th": "ปฏิเสธการถอนนี้? จำนวนเงินจะถูกคืนเข้ายอดของผู้ใช้",
        "zh": "拒绝此提现？金额将退回到用户余额。",
        "lo": "ປະຕິເສດການຖອນນີ້? ຈຳນວນເງິນຈະຖືກຄືນເຂົ້າຍອດຜູ້ໃຊ້.",
        "vi": "Từ chối rút này? Số tiền sẽ được hoàn lại số dư người dùng.",
    },
    "pages.withdrawals.details.failConfirm": {
        "th": "ทำเครื่องหมายการถอนนี้ว่าล้มเหลว? จำนวนเงินจะถูกคืน",
        "zh": "将此提现标记为失败？金额将退回。",
        "lo": "ໝາຍການຖອນນີ້ວ່າລົ້ມເຫຼວ? ຈຳນວນເງິນຈະຖືກຄືນ.",
        "vi": "Đánh dấu rút này là thất bại? Số tiền sẽ được hoàn.",
    },
    "pages.withdrawals.details.markedAs": {
        "th": "ทำเครื่องหมายเป็น {{status}}", "zh": "标记为 {{status}}",
        "lo": "ໝາຍເປັນ {{status}}", "vi": "Đã đánh dấu {{status}}",
    },
    "pages.withdrawals.details.useApproveToSave": {
        "th": "ใช้ปุ่มอนุมัติหรือปฏิเสธเพื่อบันทึกหมายเหตุระหว่างที่การถอนยังรอดำเนินการ",
        "zh": "在提现待处理期间，请使用批准或拒绝按钮以保存备注",
        "lo": "ໃຊ້ປຸ່ມອະນຸມັດ ຫຼື ປະຕິເສດເພື່ອບັນທຶກໝາຍເຫດໃນຂະນະທີ່ການຖອນຍັງລໍຖ້າ",
        "vi": "Dùng nút Duyệt hoặc Từ chối để lưu ghi chú khi rút tiền đang chờ",
    },
    "pages.admins.invite.emailPlaceholder": {
        "th": "name@lala.shop", "zh": "name@lala.shop",
        "lo": "name@lala.shop", "vi": "name@lala.shop",
    },
}


def set_nested(data, path, value):
    parts = path.split(".")
    d = data
    for p in parts[:-1]:
        if p not in d or not isinstance(d[p], dict):
            d[p] = {}
        d = d[p]
    d[parts[-1]] = value


for lang in ["th", "zh", "lo", "vi"]:
    p = LOCALES / lang / "common.json"
    data = json.loads(p.read_text(encoding="utf-8-sig"))
    n = 0
    for key, vals in T.items():
        if lang in vals:
            set_nested(data, key, vals[lang])
            n += 1
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{lang}: +{n}")
