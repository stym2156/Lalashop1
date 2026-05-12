"""
Translate the ~125 keys in Admin that still fall back to English in
th/zh/lo/vi. These were added by an earlier auto-generator that used
humanized English as a placeholder when the DICT didn't have a translation.
"""
import json
from pathlib import Path

ROOT = Path("f:/Lalashop2026/Admin")
LOCALES = ROOT / "src/locales"

# Translations keyed by full key path -> {lang: value}.
# Languages omitted will keep the existing (English fallback) value.
T: dict[str, dict[str, str]] = {
    # === admins.audit ===
    "admins.audit.stats.distinctActions": {
        "th": "การกระทำที่ไม่ซ้ำ", "zh": "唯一操作", "lo": "ການກະທຳທີ່ບໍ່ຊໍ້າ",
        "vi": "Thao tác khác nhau",
    },
    "admins.audit.table.action": {
        "th": "การกระทำ", "zh": "操作", "lo": "ການກະທຳ", "vi": "Thao tác",
    },
    "admins.audit.table.changes": {
        "th": "การเปลี่ยนแปลง", "zh": "更改", "lo": "ການປ່ຽນແປງ",
        "vi": "Thay đổi",
    },
    "admins.audit.table.time": {
        "th": "เวลา", "zh": "时间", "lo": "ເວລາ", "vi": "Thời gian",
    },
    # === admins.invite ===
    "admins.invite.confirmRevoke": {
        "th": "ยืนยันการเพิกถอน?", "zh": "确认撤销?", "lo": "ຢືນຢັນການຍົກເລີກ?",
        "vi": "Xác nhận thu hồi?",
    },
    "admins.invite.expiresIn": {
        "th": "หมดอายุใน", "zh": "过期时间", "lo": "ໝົດອາຍຸໃນ",
        "vi": "Hết hạn sau",
    },
    "admins.invite.invitations": {
        "th": "คำเชิญ", "zh": "邀请", "lo": "ຄຳເຊີນ", "vi": "Lời mời",
    },
    "admins.invite.invitedBy": {
        "th": "เชิญโดย", "zh": "邀请人", "lo": "ເຊີນໂດຍ",
        "vi": "Người mời",
    },
    "admins.invite.roles.contentDesc": {
        "en": "Products, categories, posts, and storefront moderation.",
        "th": "ดูแลสินค้า หมวดหมู่ โพสต์ และหน้าร้าน",
        "zh": "管理商品、分类、帖子和店面",
        "lo": "ດູແລສິນຄ້າ ໝວດໝູ່ ໂພສ ແລະ ໜ້າຮ້ານ",
        "vi": "Quản lý sản phẩm, danh mục, bài đăng và cửa hàng",
    },
    "admins.invite.roles.financeDesc": {
        "en": "Withdrawals, refunds, settlements, and payout decisions.",
        "th": "การถอน คืนเงิน ชำระบัญชี และอนุมัติจ่าย",
        "zh": "提现、退款、结算和付款决策",
        "lo": "ການຖອນ ຄືນເງິນ ການຊຳລະບັນຊີ ແລະ ການອະນຸມັດຈ່າຍ",
        "vi": "Rút tiền, hoàn tiền, đối soát và quyết định thanh toán",
    },
    "admins.invite.roles.superDesc": {
        "en": "Full access to every admin section.",
        "th": "เข้าถึงทุกส่วนของแอดมินได้เต็มที่",
        "zh": "完全访问所有管理板块",
        "lo": "ເຂົ້າເຖິງທຸກສ່ວນຂອງແອັດມິນໄດ້ເຕັມທີ່",
        "vi": "Truy cập đầy đủ tất cả phần quản trị",
    },
    "admins.invite.roles.supportDesc": {
        "en": "Tickets, reports, and customer assistance.",
        "th": "ตั๋ว รายงาน และช่วยเหลือลูกค้า",
        "zh": "工单、举报和客户协助",
        "lo": "ທິກເກັດ ລາຍງານ ແລະ ຊ່ວຍເຫຼືອລູກຄ້າ",
        "vi": "Tickets, báo cáo và hỗ trợ khách hàng",
    },
    "admins.invite.viewRoleMatrix": {
        "th": "ดูตารางสิทธิ์", "zh": "查看角色矩阵", "lo": "ເບິ່ງຕາຕະລາງສິດທິ",
        "vi": "Xem ma trận vai trò",
    },
    # === admins.roles ===
    "admins.roles.assignRoles": {
        "th": "กำหนดบทบาท", "zh": "分配角色", "lo": "ກຳນົດບົດບາດ",
        "vi": "Gán vai trò",
    },
    "admins.roles.confirmRevoke": {
        "th": "ยืนยันการเพิกถอน?", "zh": "确认撤销?", "lo": "ຢືນຢັນການຍົກເລີກ?",
        "vi": "Xác nhận thu hồi?",
    },
    "admins.roles.currentRole": {
        "th": "บทบาทปัจจุบัน", "zh": "当前角色", "lo": "ບົດບາດປັດຈຸບັນ",
        "vi": "Vai trò hiện tại",
    },
    "admins.roles.failedToRevoke": {
        "th": "เพิกถอนไม่สำเร็จ", "zh": "撤销失败", "lo": "ຍົກເລີກລົ້ມເຫຼວ",
        "vi": "Thu hồi thất bại",
    },
    "admins.roles.noRole": {
        "th": "ไม่มีบทบาท", "zh": "无角色", "lo": "ບໍ່ມີບົດບາດ",
        "vi": "Không có vai trò",
    },
    "admins.roles.noRoleAssigned": {
        "th": "ยังไม่กำหนดบทบาท", "zh": "未分配角色", "lo": "ຍັງບໍ່ກຳນົດບົດບາດ",
        "vi": "Chưa gán vai trò",
    },
    "admins.roles.permissions": {
        "th": "สิทธิ์", "zh": "权限", "lo": "ສິດທິ", "vi": "Quyền",
    },
    "admins.roles.perms.editCategories": {
        "th": "แก้ไขหมวดหมู่", "zh": "编辑分类", "lo": "ແກ້ໄຂໝວດໝູ່",
        "vi": "Sửa danh mục",
    },
    "admins.roles.perms.manageAdmins": {
        "th": "จัดการผู้ดูแล", "zh": "管理管理员", "lo": "ຈັດການຜູ້ດູແລ",
        "vi": "Quản lý quản trị viên",
    },
    "admins.roles.perms.manageBanners": {
        "th": "จัดการแบนเนอร์", "zh": "管理横幅", "lo": "ຈັດການປ້າຍ",
        "vi": "Quản lý banner",
    },
    "admins.roles.perms.managePosts": {
        "th": "จัดการโพสต์", "zh": "管理帖子", "lo": "ຈັດການໂພສ",
        "vi": "Quản lý bài đăng",
    },
    "admins.roles.perms.manageRoles": {
        "th": "จัดการบทบาท", "zh": "管理角色", "lo": "ຈັດການບົດບາດ",
        "vi": "Quản lý vai trò",
    },
    "admins.roles.perms.processPayouts": {
        "th": "ดำเนินการจ่ายเงิน", "zh": "处理付款", "lo": "ດຳເນີນການຈ່າຍເງິນ",
        "vi": "Xử lý thanh toán",
    },
    "admins.roles.perms.refundOrders": {
        "th": "คืนเงินคำสั่งซื้อ", "zh": "退款订单", "lo": "ຄືນເງິນຄຳສັ່ງຊື້",
        "vi": "Hoàn tiền đơn hàng",
    },
    "admins.roles.perms.replyTickets": {
        "th": "ตอบกลับตั๋ว", "zh": "回复工单", "lo": "ຕອບກັບທິກເກັດ",
        "vi": "Trả lời ticket",
    },
    "admins.roles.perms.sendNotifications": {
        "th": "ส่งการแจ้งเตือน", "zh": "发送通知", "lo": "ສົ່ງການແຈ້ງເຕືອນ",
        "vi": "Gửi thông báo",
    },
    "admins.roles.perms.viewAuditLog": {
        "th": "ดูบันทึกการตรวจสอบ", "zh": "查看审计日志", "lo": "ເບິ່ງບັນທຶກກວດສອບ",
        "vi": "Xem nhật ký kiểm toán",
    },
    "admins.roles.perms.viewFinancialReports": {
        "th": "ดูรายงานการเงิน", "zh": "查看财务报告", "lo": "ເບິ່ງລາຍງານການເງິນ",
        "vi": "Xem báo cáo tài chính",
    },
    "admins.roles.perms.viewUsers": {
        "th": "ดูผู้ใช้", "zh": "查看用户", "lo": "ເບິ່ງຜູ້ໃຊ້",
        "vi": "Xem người dùng",
    },
    "admins.roles.revokeTitle": {
        "th": "เพิกถอนบทบาท", "zh": "撤销角色", "lo": "ຍົກເລີກບົດບາດ",
        "vi": "Thu hồi vai trò",
    },
    # === common.* (used across many pages) ===
    "common.address": {
        "th": "ที่อยู่", "zh": "地址", "lo": "ທີ່ຢູ່", "vi": "Địa chỉ",
    },
    "common.backToAdmins": {
        "th": "กลับไปยังผู้ดูแล", "zh": "返回管理员列表", "lo": "ກັບໄປຜູ້ດູແລ",
        "vi": "Về quản trị viên",
    },
    "common.bankName": {
        "th": "ชื่อธนาคาร", "zh": "银行名称", "lo": "ຊື່ທະນາຄານ",
        "vi": "Tên ngân hàng",
    },
    "common.birthDate": {
        "th": "วันเกิด", "zh": "出生日期", "lo": "ວັນເກີດ",
        "vi": "Ngày sinh",
    },
    "common.businessLicense": {
        "th": "ใบอนุญาตประกอบการ", "zh": "营业执照", "lo": "ໃບອະນຸຍາດປະກອບການ",
        "vi": "Giấy phép kinh doanh",
    },
    "common.buyer": {
        "th": "ผู้ซื้อ", "zh": "买家", "lo": "ຜູ້ຊື້", "vi": "Người mua",
    },
    "common.copied": {
        "th": "คัดลอกแล้ว", "zh": "已复制", "lo": "ສຳເນົາແລ້ວ",
        "vi": "Đã sao chép",
    },
    "common.creating": {
        "th": "กำลังสร้าง...", "zh": "创建中...", "lo": "ກຳລັງສ້າງ...",
        "vi": "Đang tạo...",
    },
    "common.document": {
        "th": "เอกสาร", "zh": "文件", "lo": "ເອກະສານ", "vi": "Tài liệu",
    },
    "common.expires": {
        "th": "หมดอายุ", "zh": "过期", "lo": "ໝົດອາຍຸ", "vi": "Hết hạn",
    },
    "common.headsUp": {
        "th": "โปรดทราบ", "zh": "请注意", "lo": "ກະລຸນາຊາບ", "vi": "Lưu ý",
    },
    "common.idExpiry": {
        "th": "วันหมดอายุเอกสาร", "zh": "证件到期日", "lo": "ວັນໝົດອາຍຸເອກະສານ",
        "vi": "Ngày hết hạn giấy tờ",
    },
    "common.inStockUnits": {
        "th": "หน่วยในสต็อก", "zh": "库存数量", "lo": "ຈຳນວນໃນສະຕັອກ",
        "vi": "Đơn vị tồn kho",
    },
    "common.itemsSold": {
        "th": "ขายแล้ว", "zh": "已售出", "lo": "ຂາຍແລ້ວ", "vi": "Đã bán",
    },
    "common.kycDocuments": {
        "th": "เอกสาร KYC", "zh": "KYC 文件", "lo": "ເອກະສານ KYC",
        "vi": "Tài liệu KYC",
    },
    "common.kycIdentity": {
        "th": "ตัวตน KYC", "zh": "KYC 身份", "lo": "ຕົວຕົນ KYC",
        "vi": "Danh tính KYC",
    },
    "common.kycReviewed": {
        "th": "KYC ตรวจสอบแล้ว", "zh": "KYC 已审核", "lo": "KYC ກວດສອບແລ້ວ",
        "vi": "KYC đã xem xét",
    },
    "common.kycStatus": {
        "th": "สถานะ KYC", "zh": "KYC 状态", "lo": "ສະຖານະ KYC",
        "vi": "Trạng thái KYC",
    },
    "common.kycSubmitted": {
        "th": "KYC ส่งแล้ว", "zh": "KYC 已提交", "lo": "KYC ສົ່ງແລ້ວ",
        "vi": "KYC đã gửi",
    },
    "common.noAnalytics": {
        "th": "ไม่มีข้อมูลวิเคราะห์", "zh": "暂无分析数据", "lo": "ບໍ່ມີຂໍ້ມູນວິເຄາະ",
        "vi": "Không có dữ liệu phân tích",
    },
    "common.noProducts": {
        "th": "ไม่มีสินค้า", "zh": "暂无商品", "lo": "ບໍ່ມີສິນຄ້າ",
        "vi": "Không có sản phẩm",
    },
    "common.noReason": {
        "th": "ไม่ระบุเหตุผล", "zh": "未提供原因", "lo": "ບໍ່ລະບຸເຫດຜົນ",
        "vi": "Không có lý do",
    },
    "common.noViolations": {
        "th": "ไม่มีการละเมิด", "zh": "无违规", "lo": "ບໍ່ມີການລະເມີດ",
        "vi": "Không có vi phạm",
    },
    "common.notASeller": {
        "th": "ไม่ใช่ผู้ขาย", "zh": "非卖家", "lo": "ບໍ່ແມ່ນຜູ້ຂາຍ",
        "vi": "Không phải người bán",
    },
    "common.notLinked": {
        "th": "ยังไม่เชื่อมต่อ", "zh": "未连接", "lo": "ຍັງບໍ່ເຊື່ອມຕໍ່",
        "vi": "Chưa liên kết",
    },
    "common.ownerAccount": {
        "th": "บัญชีเจ้าของ", "zh": "所有者账户", "lo": "ບັນຊີເຈົ້າຂອງ",
        "vi": "Tài khoản chủ sở hữu",
    },
    "common.rejectionReason": {
        "th": "เหตุผลที่ปฏิเสธ", "zh": "拒绝原因", "lo": "ເຫດຜົນທີ່ປະຕິເສດ",
        "vi": "Lý do từ chối",
    },
    "common.requests": {
        "th": "คำขอ", "zh": "请求", "lo": "ຄຳຂໍ", "vi": "Yêu cầu",
    },
    "common.reviewNote": {
        "th": "หมายเหตุการตรวจสอบ", "zh": "审核备注", "lo": "ໝາຍເຫດການກວດສອບ",
        "vi": "Ghi chú xem xét",
    },
    "common.reviewedBy": {
        "th": "ตรวจสอบโดย", "zh": "审核人", "lo": "ກວດສອບໂດຍ",
        "vi": "Người xem xét",
    },
    "common.sellerType": {
        "th": "ประเภทผู้ขาย", "zh": "卖家类型", "lo": "ປະເພດຜູ້ຂາຍ",
        "vi": "Loại người bán",
    },
    "common.shopEmail": {
        "th": "อีเมลร้าน", "zh": "店铺邮箱", "lo": "ອີເມວຮ້ານ",
        "vi": "Email cửa hàng",
    },
    "common.shopName": {
        "th": "ชื่อร้าน", "zh": "店铺名称", "lo": "ຊື່ຮ້ານ",
        "vi": "Tên cửa hàng",
    },
    "common.since": {
        "th": "ตั้งแต่", "zh": "自", "lo": "ຕັ້ງແຕ່", "vi": "Từ",
    },
    "common.sold": {
        "th": "ขายแล้ว", "zh": "已售", "lo": "ຂາຍແລ້ວ", "vi": "Đã bán",
    },
    "common.suspendedAt": {
        "th": "ระงับเมื่อ", "zh": "暂停时间", "lo": "ລະງັບເມື່ອ",
        "vi": "Khóa lúc",
    },
    "common.thisShop": {
        "th": "ร้านนี้", "zh": "本店铺", "lo": "ຮ້ານນີ້",
        "vi": "Cửa hàng này",
    },
    "common.timestamps": {
        "th": "เวลา", "zh": "时间戳", "lo": "ເວລາ",
        "vi": "Dấu thời gian",
    },
    "common.userId": {
        "th": "รหัสผู้ใช้", "zh": "用户编号", "lo": "ໄອດີຜູ້ໃຊ້",
        "vi": "Mã người dùng",
    },
    "common.warehouse": {
        "th": "คลังสินค้า", "zh": "仓库", "lo": "ຄັງສິນຄ້າ",
        "vi": "Kho hàng",
    },
    "common.when": {
        "th": "เมื่อใด", "zh": "时间", "lo": "ເມື່ອໃດ", "vi": "Khi nào",
    },
    # === financial.* ===
    "financial.asBuyer": {
        "th": "ในฐานะผู้ซื้อ", "zh": "作为买家", "lo": "ໃນຖານະຜູ້ຊື້",
        "vi": "Với tư cách người mua",
    },
    "financial.asSeller": {
        "th": "ในฐานะผู้ขาย", "zh": "作为卖家", "lo": "ໃນຖານະຜູ້ຂາຍ",
        "vi": "Với tư cách người bán",
    },
    "financial.averageOrder": {
        "th": "ค่าเฉลี่ยต่อคำสั่ง", "zh": "平均订单", "lo": "ສະເລ່ຍຕໍ່ຄຳສັ່ງ",
        "vi": "Đơn trung bình",
    },
    "financial.avgOrder": {
        "th": "เฉลี่ยต่อคำสั่ง", "zh": "平均订单", "lo": "ສະເລ່ຍຕໍ່ຄຳສັ່ງ",
        "vi": "TB / đơn",
    },
    "financial.avgOrderReceived": {
        "th": "เฉลี่ยที่ได้รับ", "zh": "平均收到", "lo": "ສະເລ່ຍທີ່ໄດ້ຮັບ",
        "vi": "TB nhận",
    },
    "financial.byStatus": {
        "th": "ตามสถานะ", "zh": "按状态", "lo": "ຕາມສະຖານະ",
        "vi": "Theo trạng thái",
    },
    "financial.creatorCommission": {
        "th": "ค่าคอมครีเอเตอร์", "zh": "创作者佣金", "lo": "ຄ່າຄອມຄຣີເອເຕີ",
        "vi": "Hoa hồng creator",
    },
    "financial.creatorEarningsSettled": {
        "th": "รายได้ครีเอเตอร์ที่ชำระแล้ว", "zh": "已结算的创作者收入",
        "lo": "ລາຍຮັບຄຣີເອເຕີທີ່ຊຳລະແລ້ວ",
        "vi": "Thu nhập creator đã thanh toán",
    },
    "financial.drift": {
        "th": "ส่วนต่าง", "zh": "差异", "lo": "ສ່ວນຕ່າງ", "vi": "Chênh lệch",
    },
    "financial.itemsSold": {
        "th": "สินค้าที่ขายได้", "zh": "已售商品", "lo": "ສິນຄ້າທີ່ຂາຍໄດ້",
        "vi": "Sản phẩm đã bán",
    },
    "financial.lastPaidOrder": {
        "th": "คำสั่งซื้อที่ชำระล่าสุด", "zh": "最近已付订单",
        "lo": "ຄຳສັ່ງຊື້ທີ່ຊຳລະຫຼ້າສຸດ",
        "vi": "Đơn đã thanh toán gần nhất",
    },
    "financial.lastWithdrawal": {
        "th": "การถอนครั้งล่าสุด", "zh": "最近提现", "lo": "ການຖອນຫຼ້າສຸດ",
        "vi": "Rút tiền gần nhất",
    },
    "financial.netToBank": {
        "th": "สุทธิเข้าธนาคาร", "zh": "净额到银行", "lo": "ສຸດທິເຂົ້າທະນາຄານ",
        "vi": "Ròng vào ngân hàng",
    },
    "financial.nonWithdrawable": {
        "th": "ถอนไม่ได้", "zh": "不可提现", "lo": "ຖອນບໍ່ໄດ້",
        "vi": "Không thể rút",
    },
    "financial.ordersPlacedLifetime": {
        "th": "คำสั่งซื้อสะสมตลอดอายุ", "zh": "终身下单数",
        "lo": "ຄຳສັ່ງຊື້ສະສົມຕະຫຼອດອາຍຸ",
        "vi": "Tổng đơn đã đặt",
    },
    "financial.paidOrders": {
        "th": "คำสั่งซื้อที่ชำระแล้ว", "zh": "已付订单",
        "lo": "ຄຳສັ່ງຊື້ທີ່ຊຳລະແລ້ວ", "vi": "Đơn đã thanh toán",
    },
    "financial.reconciles": {
        "th": "กระทบยอด", "zh": "对账", "lo": "ກະທົບຍອດ",
        "vi": "Đối chiếu",
    },
    "financial.refundsIssued": {
        "th": "คืนเงินที่ออก", "zh": "已发起退款", "lo": "ການຄືນເງິນທີ່ອອກ",
        "vi": "Hoàn tiền đã phát hành",
    },
    "financial.totalAmount": {
        "th": "ยอดรวม", "zh": "总金额", "lo": "ຍອດລວມ", "vi": "Tổng số tiền",
    },
    "financial.totalSpent": {
        "th": "ใช้จ่ายทั้งหมด", "zh": "总支出", "lo": "ໃຊ້ຈ່າຍທັງໝົດ",
        "vi": "Tổng chi tiêu",
    },
    "financial.unpaidPending": {
        "th": "ยังไม่ชำระ / รอ", "zh": "未付 / 待处理", "lo": "ຍັງບໍ່ຊຳລະ / ລໍຖ້າ",
        "vi": "Chưa thanh toán / chờ",
    },
    "financial.webSales": {
        "th": "ยอดขายเว็บ", "zh": "网店销售", "lo": "ຍອດຂາຍເວັບ",
        "vi": "Doanh số web",
    },
    "financial.webSalesAsSeller": {
        "th": "ยอดขายเว็บ (ผู้ขาย)", "zh": "网店销售 (作为卖家)",
        "lo": "ຍອດຂາຍເວັບ (ຜູ້ຂາຍ)",
        "vi": "Doanh số web (người bán)",
    },
    "financial.withdrawnNet": {
        "th": "ถอนสุทธิ", "zh": "提现净额", "lo": "ຖອນສຸດທິ",
        "vi": "Ròng đã rút",
    },
    # === pages.acceptInvite ===
    "pages.acceptInvite.roleSuper": {
        # Keep brand-like "Super Admin" in some, transliterate where natural
        "en": "Super Admin",
        "th": "Super Admin", "zh": "超级管理员", "lo": "Super Admin",
        "vi": "Super Admin",
    },
    # === pages.admins ===
    "pages.admins.invite.emailPlaceholder": {
        "th": "name@lala.shop", "zh": "name@lala.shop",
        "lo": "name@lala.shop", "vi": "name@lala.shop",
    },
    # === pages.categories ===
    "pages.categories.activeCount": {
        "th": "ใช้งาน {{count}} หมวด", "zh": "活跃 {{count}} 个分类",
        "lo": "ໃຊ້ງານ {{count}} ໝວດໝູ່", "vi": "{{count}} danh mục đang dùng",
    },
    "pages.categories.form.iconLabel": {
        "th": "ไอคอน", "zh": "图标", "lo": "ໄອຄອນ", "vi": "Biểu tượng",
    },
    "pages.categories.loadingCategories": {
        "th": "กำลังโหลดหมวดหมู่...", "zh": "正在加载分类...",
        "lo": "ກຳລັງໂຫຼດໝວດໝູ່...", "vi": "Đang tải danh mục...",
    },
    "pages.categories.slug": {
        "th": "Slug", "zh": "标识 (slug)", "lo": "Slug", "vi": "Slug",
    },
    # === pages.history.tabs.kyc ===
    "pages.history.tabs.kyc": {
        # KYC is a global term, keep as-is
        "th": "KYC", "zh": "KYC", "lo": "KYC", "vi": "KYC",
    },
    # === pages.notifications ===
    "pages.notifications.send.channelSms": {
        "th": "SMS", "zh": "短信", "lo": "SMS", "vi": "SMS",
    },
    "pages.notifications.sendFailed": {
        "th": "ส่งไม่สำเร็จ", "zh": "发送失败", "lo": "ສົ່ງລົ້ມເຫຼວ",
        "vi": "Gửi thất bại",
    },
    "pages.notifications.types.info": {
        "th": "ข้อมูล", "zh": "信息", "lo": "ຂໍ້ມູນ", "vi": "Thông tin",
    },
    # === pages.payment ===
    "pages.payment.methods.formPromptpayId": {
        # PromptPay is brand; usually kept as-is
        "th": "PromptPay ID", "zh": "PromptPay ID",
        "lo": "PromptPay ID", "vi": "PromptPay ID",
    },
    # === pages.reports ===
    "pages.reports.detail.labelCustomId": {
        "th": "Custom ID", "zh": "自定义 ID",
        "lo": "Custom ID", "vi": "Custom ID",
    },
    # === pages.users ===
    "pages.users.details.demoteConfirm": {
        "th": "ยืนยันการลดสิทธิ์?", "zh": "确认降级?",
        "lo": "ຢືນຢັນການລົດສິດ?", "vi": "Xác nhận hạ cấp?",
    },
    "pages.users.details.issueConfirm": {
        "th": "ยืนยันการออก credentials?", "zh": "确认发放凭证?",
        "lo": "ຢືນຢັນອອກລະຫັດ?", "vi": "Xác nhận cấp thông tin?",
    },
    "pages.users.details.issueError": {
        "th": "ออก credentials ไม่สำเร็จ", "zh": "发放凭证失败",
        "lo": "ອອກລະຫັດລົ້ມເຫຼວ",
        "vi": "Cấp thông tin thất bại",
    },
    "pages.users.details.promoteConfirm": {
        "th": "ยืนยันการเลื่อนสิทธิ์?", "zh": "确认提升权限?",
        "lo": "ຢືນຢັນເລື່ອນສິດ?", "vi": "Xác nhận thăng cấp?",
    },
    "pages.users.details.saveError": {
        "th": "บันทึกไม่สำเร็จ", "zh": "保存失败", "lo": "ບັນທຶກລົ້ມເຫຼວ",
        "vi": "Lưu thất bại",
    },
    "pages.users.details.suspendError": {
        "th": "ระงับไม่สำเร็จ", "zh": "暂停失败", "lo": "ລະງັບລົ້ມເຫຼວ",
        "vi": "Tạm khóa thất bại",
    },
    "pages.users.details.suspendModal.reasonRequired": {
        "th": "ต้องระบุเหตุผล", "zh": "原因必填", "lo": "ຕ້ອງລະບຸເຫດຜົນ",
        "vi": "Lý do bắt buộc",
    },
    "pages.users.details.viewBuyerOrders": {
        "th": "ดูคำสั่งซื้อ (ผู้ซื้อ)", "zh": "查看买家订单",
        "lo": "ເບິ່ງຄຳສັ່ງຊື້ (ຜູ້ຊື້)",
        "vi": "Xem đơn (người mua)",
    },
    "pages.users.details.viewSellerOrders": {
        "th": "ดูคำสั่งซื้อ (ผู้ขาย)", "zh": "查看卖家订单",
        "lo": "ເບິ່ງຄຳສັ່ງຊື້ (ຜູ້ຂາຍ)",
        "vi": "Xem đơn (người bán)",
    },
    # === roles ===
    "roles.super": {
        "th": "Super Admin", "zh": "超级管理员",
        "lo": "Super Admin", "vi": "Super Admin",
    },
    # === status ===
    "status.notIssued": {
        "th": "ยังไม่ออก", "zh": "未发放", "lo": "ຍັງບໍ່ອອກ",
        "vi": "Chưa cấp",
    },
    "status.notSet": {
        "th": "ยังไม่ตั้งค่า", "zh": "未设置", "lo": "ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ",
        "vi": "Chưa thiết lập",
    },
    "status.settled": {
        "th": "ชำระแล้ว", "zh": "已结算", "lo": "ຊຳລະແລ້ວ",
        "vi": "Đã thanh toán",
    },
    # === table ===
    "table.slug": {
        "th": "Slug", "zh": "标识 (slug)", "lo": "Slug", "vi": "Slug",
    },
    "table.twofa": {
        # Keep "2FA" — it's a globally recognized acronym
        "th": "2FA", "zh": "2FA", "lo": "2FA", "vi": "2FA",
    },
}


def set_nested(data: dict, path: str, value: str) -> None:
    parts = path.split(".")
    d = data
    for p in parts[:-1]:
        if p not in d or not isinstance(d[p], dict):
            d[p] = {}
        d = d[p]
    d[parts[-1]] = value


def main():
    for lang in ["en", "th", "zh", "lo", "vi"]:
        p = LOCALES / lang / "common.json"
        data = json.loads(p.read_text(encoding="utf-8-sig"))
        applied = 0
        for key, vals in T.items():
            if lang in vals:
                set_nested(data, key, vals[lang])
                applied += 1
        p.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"{lang}: applied {applied} translations")


if __name__ == "__main__":
    main()
