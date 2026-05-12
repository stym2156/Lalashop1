"""
Refine generic translation values added by admin_add_missing.py.

For each missing key, prefer (in order):
1. A specific contextual override (manual translation map below)
2. A copy from an existing locale key with the same last segment under a
   sibling namespace (e.g., admins.title -> pages.admins.title)
3. The humanized English fallback (already set by add_missing)
"""
import json
import re
from pathlib import Path

ROOT = Path("f:/Lalashop2026/Admin")
LOCALES = ROOT / "src/locales"

# Contextual overrides: key path -> {lang: value}
OVERRIDES: dict[str, dict[str, str]] = {
    "admins.title": {
        "en": "Admin team", "th": "ทีมแอดมิน", "zh": "管理员团队",
        "lo": "ທີມຜູ້ດູແລ", "vi": "Đội ngũ quản trị",
    },
    "admins.noAdmins": {
        "en": "No admins yet", "th": "ยังไม่มีผู้ดูแล", "zh": "暂无管理员",
        "lo": "ຍັງບໍ່ມີຜູ້ດູແລ", "vi": "Chưa có quản trị viên",
    },
    "admins.invite.title": {
        "en": "Invite admin", "th": "เชิญแอดมิน", "zh": "邀请管理员",
        "lo": "ເຊີນຜູ້ດູແລ", "vi": "Mời quản trị viên",
    },
    "admins.invite.subtitle": {
        "en": "Send an invitation to a new administrator",
        "th": "ส่งคำเชิญให้ผู้ดูแลใหม่",
        "zh": "向新管理员发送邀请",
        "lo": "ສົ່ງຄຳເຊີນໃຫ້ຜູ້ດູແລໃໝ່",
        "vi": "Gửi lời mời cho quản trị viên mới",
    },
    "admins.invite.loading": {
        "en": "Loading invites…", "th": "กำลังโหลดคำเชิญ...", "zh": "正在加载邀请...",
        "lo": "ກຳລັງໂຫຼດຄຳເຊີນ...", "vi": "Đang tải lời mời...",
    },
    "admins.invite.noInvites": {
        "en": "No pending invites", "th": "ไม่มีคำเชิญรอดำเนินการ", "zh": "暂无待处理邀请",
        "lo": "ບໍ່ມີຄຳເຊີນລໍຖ້າ", "vi": "Không có lời mời đang chờ",
    },
    "admins.invite.failed": {
        "en": "Failed to send invite", "th": "ส่งคำเชิญไม่สำเร็จ", "zh": "发送邀请失败",
        "lo": "ສົ່ງຄຳເຊີນລົ້ມເຫຼວ", "vi": "Gửi lời mời thất bại",
    },
    "admins.invite.failedToLoad": {
        "en": "Failed to load invites", "th": "โหลดคำเชิญไม่สำเร็จ", "zh": "加载邀请失败",
        "lo": "ໂຫຼດຄຳເຊີນລົ້ມເຫຼວ", "vi": "Tải lời mời thất bại",
    },
    "admins.invite.send": {
        "en": "Send invite", "th": "ส่งคำเชิญ", "zh": "发送邀请",
        "lo": "ສົ່ງຄຳເຊີນ", "vi": "Gửi lời mời",
    },
    "admins.invite.sentSuccess": {
        "en": "Invitation sent", "th": "ส่งคำเชิญแล้ว", "zh": "邀请已发送",
        "lo": "ສົ່ງຄຳເຊີນແລ້ວ", "vi": "Đã gửi lời mời",
    },
    "admins.invite.messagePlaceholder": {
        "en": "Optional personal message…", "th": "ข้อความ (ไม่บังคับ)...",
        "zh": "可选的个人留言...", "lo": "ຂໍ້ຄວາມ (ບໍ່ບັງຄັບ)...",
        "vi": "Lời nhắn tùy chọn...",
    },
    "admins.roles.failedToLoad": {
        "en": "Failed to load roles", "th": "โหลดบทบาทไม่สำเร็จ", "zh": "加载角色失败",
        "lo": "ໂຫຼດບົດບາດລົ້ມເຫຼວ", "vi": "Tải vai trò thất bại",
    },
    "admins.roles.failedToAssign": {
        "en": "Failed to assign role", "th": "กำหนดบทบาทไม่สำเร็จ", "zh": "分配角色失败",
        "lo": "ກຳນົດບົດບາດລົ້ມເຫຼວ", "vi": "Gán vai trò thất bại",
    },
    "admins.roles.note": {
        "en": "Roles control which sections an admin can access",
        "th": "บทบาทกำหนดว่าแอดมินเข้าถึงส่วนใดได้บ้าง",
        "zh": "角色决定管理员可访问哪些区域",
        "lo": "ບົດບາດກຳນົດວ່າຜູ້ດູແລເຂົ້າເຖິງສ່ວນໃດໄດ້",
        "vi": "Vai trò quyết định quản trị viên có thể truy cập phần nào",
    },
    "admins.roles.adminCount": {
        "en": "{{count}} admins", "th": "{{count}} ผู้ดูแล", "zh": "{{count}} 名管理员",
        "lo": "{{count}} ຜູ້ດູແລ", "vi": "{{count}} quản trị viên",
    },
    "admins.audit.loading": {
        "en": "Loading audit log…", "th": "กำลังโหลดบันทึก...", "zh": "正在加载审计日志...",
        "lo": "ກຳລັງໂຫຼດບັນທຶກ...", "vi": "Đang tải nhật ký...",
    },
    "admins.audit.noLogs": {
        "en": "No audit events", "th": "ไม่มีบันทึก", "zh": "暂无审计事件",
        "lo": "ບໍ່ມີເຫດການກວດສອບ", "vi": "Không có sự kiện kiểm toán",
    },
    "admins.audit.searchPlaceholder": {
        "en": "Search audit log…", "th": "ค้นหาบันทึก...", "zh": "搜索审计日志...",
        "lo": "ຄົ້ນຫາບັນທຶກ...", "vi": "Tìm trong nhật ký...",
    },
    "table.title": {
        "en": "Title", "th": "หัวข้อ", "zh": "标题",
        "lo": "ຫົວຂໍ້", "vi": "Tiêu đề",
    },
    "table.target": {
        "en": "Target", "th": "เป้าหมาย", "zh": "目标",
        "lo": "ເປົ້າໝາຍ", "vi": "Mục tiêu",
    },
    "table.description": {
        "en": "Description", "th": "รายละเอียด", "zh": "描述",
        "lo": "ລາຍລະອຽດ", "vi": "Mô tả",
    },
    "table.detail": {
        "en": "Detail", "th": "รายละเอียด", "zh": "详情",
        "lo": "ລາຍລະອຽດ", "vi": "Chi tiết",
    },
    "table.date": {
        "en": "Date", "th": "วันที่", "zh": "日期",
        "lo": "ວັນທີ", "vi": "Ngày",
    },
    "table.sent": {
        "en": "Sent", "th": "ส่งแล้ว", "zh": "已发送",
        "lo": "ສົ່ງແລ້ວ", "vi": "Đã gửi",
    },
    "table.recipient": {
        "en": "Recipient", "th": "ผู้รับ", "zh": "收件人",
        "lo": "ຜູ້ຮັບ", "vi": "Người nhận"
    },
    "table.readStatus": {
        "en": "Read status", "th": "สถานะการอ่าน", "zh": "阅读状态",
        "lo": "ສະຖານະການອ່ານ", "vi": "Trạng thái đọc",
    },
    "table.note": {
        "en": "Note", "th": "หมายเหตุ", "zh": "备注",
        "lo": "ໝາຍເຫດ", "vi": "Ghi chú",
    },
    "table.withdrawId": {
        "en": "Withdraw ID", "th": "รหัสถอน", "zh": "提现编号",
        "lo": "ໄອດີຖອນ", "vi": "Mã rút",
    },
    "table.bankAccount": {
        "en": "Bank account", "th": "บัญชีธนาคาร", "zh": "银行账户",
        "lo": "ບັນຊີທະນາຄານ", "vi": "Tài khoản ngân hàng",
    },
    "table.adminIp": {
        "en": "Admin IP", "th": "IP ผู้ดูแล", "zh": "管理员 IP",
        "lo": "IP ຜູ້ດູແລ", "vi": "IP quản trị",
    },
    "table.auditId": {
        "en": "Audit ID", "th": "รหัสตรวจสอบ", "zh": "审计编号",
        "lo": "ໄອດີກວດສອບ", "vi": "Mã kiểm toán",
    },
    "table.categoryName": {
        "en": "Category name", "th": "ชื่อหมวดหมู่", "zh": "分类名称",
        "lo": "ຊື່ໝວດໝູ່", "vi": "Tên danh mục",
    },
    "table.slug": {
        "en": "Slug", "th": "Slug", "zh": "标识",
        "lo": "Slug", "vi": "Slug",
    },
    "common.email": {
        "en": "Email", "th": "อีเมล", "zh": "邮箱",
        "lo": "ອີເມວ", "vi": "Email",
    },
    "common.password": {
        "en": "Password", "th": "รหัสผ่าน", "zh": "密码",
        "lo": "ລະຫັດຜ່ານ", "vi": "Mật khẩu",
    },
    "common.fullName": {
        "en": "Full name", "th": "ชื่อเต็ม", "zh": "全名",
        "lo": "ຊື່ເຕັມ", "vi": "Họ tên",
    },
    "common.phone": {
        "en": "Phone", "th": "เบอร์โทร", "zh": "电话",
        "lo": "ເບີໂທ", "vi": "Điện thoại",
    },
    "common.username": {
        "en": "Username", "th": "ชื่อผู้ใช้", "zh": "用户名",
        "lo": "ຊື່ຜູ້ໃຊ້", "vi": "Tên đăng nhập",
    },
    "common.name": {
        "en": "Name", "th": "ชื่อ", "zh": "姓名",
        "lo": "ຊື່", "vi": "Tên",
    },
    "common.role": {
        "en": "Role", "th": "บทบาท", "zh": "角色",
        "lo": "ບົດບາດ", "vi": "Vai trò",
    },
    "common.status": {
        "en": "Status", "th": "สถานะ", "zh": "状态",
        "lo": "ສະຖານະ", "vi": "Trạng thái",
    },
    "common.id": {
        "en": "ID", "th": "ไอดี", "zh": "编号",
        "lo": "ໄອດີ", "vi": "Mã",
    },
    "common.type": {
        "en": "Type", "th": "ประเภท", "zh": "类型",
        "lo": "ປະເພດ", "vi": "Loại",
    },
    "common.amount": {
        "en": "Amount", "th": "จำนวน", "zh": "金额",
        "lo": "ຈຳນວນ", "vi": "Số tiền",
    },
    "common.balance": {
        "en": "Balance", "th": "ยอดคงเหลือ", "zh": "余额",
        "lo": "ຍອດຄົງເຫຼືອ", "vi": "Số dư",
    },
    "common.fee": {
        "en": "Fee", "th": "ค่าธรรมเนียม", "zh": "手续费",
        "lo": "ຄ່າທຳນຽມ", "vi": "Phí",
    },
    "common.net": {
        "en": "Net", "th": "สุทธิ", "zh": "净额",
        "lo": "ສຸດທິ", "vi": "Ròng",
    },
    "common.bank": {
        "en": "Bank", "th": "ธนาคาร", "zh": "银行",
        "lo": "ທະນາຄານ", "vi": "Ngân hàng",
    },
    "common.accountName": {
        "en": "Account name", "th": "ชื่อบัญชี", "zh": "户名",
        "lo": "ຊື່ບັນຊີ", "vi": "Tên tài khoản",
    },
    "common.accountNumber": {
        "en": "Account number", "th": "เลขบัญชี", "zh": "账号",
        "lo": "ເລກບັນຊີ", "vi": "Số tài khoản",
    },
    "common.category": {
        "en": "Category", "th": "หมวดหมู่", "zh": "分类",
        "lo": "ໝວດໝູ່", "vi": "Danh mục",
    },
    "common.shopCategory": {
        "en": "Shop category", "th": "หมวดหมู่ร้าน", "zh": "店铺类别",
        "lo": "ໝວດໝູ່ຮ້ານ", "vi": "Danh mục cửa hàng",
    },
    "common.orders": {
        "en": "Orders", "th": "คำสั่งซื้อ", "zh": "订单",
        "lo": "ຄຳສັ່ງຊື້", "vi": "Đơn hàng",
    },
    "common.orderId": {
        "en": "Order ID", "th": "รหัสคำสั่งซื้อ", "zh": "订单编号",
        "lo": "ໄອດີຄຳສັ່ງຊື້", "vi": "Mã đơn hàng",
    },
    "common.product": {
        "en": "Product", "th": "สินค้า", "zh": "商品",
        "lo": "ສິນຄ້າ", "vi": "Sản phẩm",
    },
    "common.stock": {
        "en": "Stock", "th": "สต็อก", "zh": "库存",
        "lo": "ສະຕັອກ", "vi": "Tồn kho"
    },
    "common.price": {
        "en": "Price", "th": "ราคา", "zh": "价格",
        "lo": "ລາຄາ", "vi": "Giá",
    },
    "common.totalProducts": {
        "en": "Total products", "th": "สินค้าทั้งหมด", "zh": "商品总数",
        "lo": "ສິນຄ້າທັງໝົດ", "vi": "Tổng sản phẩm",
    },
    "common.refunds": {
        "en": "Refunds", "th": "การคืนเงิน", "zh": "退款",
        "lo": "ການຄືນເງິນ", "vi": "Hoàn tiền",
    },
    "common.message": {
        "en": "Message", "th": "ข้อความ", "zh": "消息",
        "lo": "ຂໍ້ຄວາມ", "vi": "Tin nhắn",
    },
    "common.created": {
        "en": "Created", "th": "สร้างเมื่อ", "zh": "创建时间",
        "lo": "ສ້າງເມື່ອ", "vi": "Tạo lúc",
    },
    "common.updated": {
        "en": "Updated", "th": "อัปเดต", "zh": "更新时间",
        "lo": "ອັບເດດ", "vi": "Cập nhật",
    },
    "common.joined": {
        "en": "Joined", "th": "เข้าร่วม", "zh": "加入时间",
        "lo": "ເຂົ້າຮ່ວມ", "vi": "Tham gia",
    },
    "common.loading": {
        "en": "Loading…", "th": "กำลังโหลด...", "zh": "加载中...",
        "lo": "ກຳລັງໂຫຼດ...", "vi": "Đang tải...",
    },
    "common.error": {
        "en": "Error", "th": "ผิดพลาด", "zh": "错误",
        "lo": "ຜິດພາດ", "vi": "Lỗi",
    },
    "common.unknownUser": {
        "en": "Unknown user", "th": "ผู้ใช้ไม่รู้จัก", "zh": "未知用户",
        "lo": "ຜູ້ໃຊ້ບໍ່ຮູ້ຈັກ", "vi": "Người dùng lạ",
    },
    "common.guest": {
        "en": "Guest", "th": "ผู้เยี่ยมชม", "zh": "访客",
        "lo": "ຜູ້ມາຢ້ຽມຢາມ", "vi": "Khách",
    },
    "common.copy": {
        "en": "Copy", "th": "คัดลอก", "zh": "复制",
        "lo": "ສຳເນົາ", "vi": "Sao chép",
    },
    "common.copyFailed": {
        "en": "Copy failed", "th": "คัดลอกไม่สำเร็จ", "zh": "复制失败",
        "lo": "ສຳເນົາລົ້ມເຫຼວ", "vi": "Sao chép thất bại",
    },
    "common.admin": {
        "en": "Admin", "th": "ผู้ดูแล", "zh": "管理员",
        "lo": "ຜູ້ດູແລ", "vi": "Quản trị viên",
    },
    "common.lastIp": {
        "en": "Last IP", "th": "IP ล่าสุด", "zh": "最近 IP",
        "lo": "IP ຫຼ້າສຸດ", "vi": "IP gần nhất",
    },
    "common.locked": {
        "en": "Locked", "th": "ล็อค", "zh": "已锁定",
        "lo": "ລ໋ອກ", "vi": "Đã khóa",
    },
    "common.reference": {
        "en": "Reference", "th": "อ้างอิง", "zh": "参考",
        "lo": "ອ້າງອີງ", "vi": "Tham chiếu",
    },
    "common.noHistory": {
        "en": "No history", "th": "ไม่มีประวัติ", "zh": "暂无历史",
        "lo": "ບໍ່ມີປະຫວັດ", "vi": "Không có lịch sử",
    },
    "common.noDocuments": {
        "en": "No documents", "th": "ไม่มีเอกสาร", "zh": "暂无文件",
        "lo": "ບໍ່ມີເອກະສານ", "vi": "Không có tài liệu",
    },
    "common.noKyc": {
        "en": "No KYC submitted", "th": "ยังไม่มี KYC", "zh": "暂无 KYC",
        "lo": "ບໍ່ມີ KYC", "vi": "Không có KYC",
    },
    "common.supportingDocument": {
        "en": "Supporting document", "th": "เอกสารประกอบ", "zh": "辅助文件",
        "lo": "ເອກະສານປະກອບ", "vi": "Tài liệu hỗ trợ",
    },
    "common.idType": {
        "en": "ID type", "th": "ประเภทเอกสาร", "zh": "证件类型",
        "lo": "ປະເພດເອກະສານ", "vi": "Loại giấy tờ",
    },
    "common.idNumber": {
        "en": "ID number", "th": "เลขเอกสาร", "zh": "证件号码",
        "lo": "ເລກເອກະສານ", "vi": "Số giấy tờ",
    },
    "common.tinNumber": {
        "en": "Tax ID", "th": "เลขประจำตัวผู้เสียภาษี", "zh": "税号",
        "lo": "ເລກປະຈຳຕົວຜູ້ເສຍພາສີ", "vi": "Mã số thuế",
    },
    "common.entityName": {
        "en": "Entity name", "th": "ชื่อนิติบุคคล", "zh": "实体名称",
        "lo": "ຊື່ນິຕິບຸກຄົນ", "vi": "Tên pháp nhân",
    },
    "common.actions": {
        "en": "Actions", "th": "การจัดการ", "zh": "操作",
        "lo": "ການຈັດການ", "vi": "Thao tác",
    },
    "common.verified": {
        "en": "Verified", "th": "ยืนยันแล้ว", "zh": "已验证",
        "lo": "ຢືນຢັນແລ້ວ", "vi": "Đã xác minh",
    },
    "common.unverified": {
        "en": "Unverified", "th": "ยังไม่ยืนยัน", "zh": "未验证",
        "lo": "ຍັງບໍ່ຢືນຢັນ", "vi": "Chưa xác minh",
    },
    "common.businessType": {
        "en": "Business type", "th": "ประเภทธุรกิจ", "zh": "经营类型",
        "lo": "ປະເພດທຸລະກິດ", "vi": "Loại hình kinh doanh",
    },
    "roles.finance": {
        "en": "Finance", "th": "การเงิน", "zh": "财务",
        "lo": "ການເງິນ", "vi": "Tài chính",
    },
    "roles.support": {
        "en": "Support", "th": "ฝ่ายสนับสนุน", "zh": "客服",
        "lo": "ຝ່າຍຊ່ວຍເຫຼືອ", "vi": "Hỗ trợ",
    },
    "roles.content": {
        "en": "Content", "th": "คอนเทนต์", "zh": "内容",
        "lo": "ຄອນເທນ", "vi": "Nội dung",
    },
    "auth.fullName": {
        "en": "Full name", "th": "ชื่อเต็ม", "zh": "全名",
        "lo": "ຊື່ເຕັມ", "vi": "Họ tên",
    },
    "auth.name": {
        "en": "Name", "th": "ชื่อ", "zh": "姓名",
        "lo": "ຊື່", "vi": "Tên",
    },
    "auth.phone": {
        "en": "Phone", "th": "เบอร์โทร", "zh": "电话",
        "lo": "ເບີໂທ", "vi": "Điện thoại",
    },
    "actions.saveChanges": {
        "en": "Save changes", "th": "บันทึกการเปลี่ยนแปลง", "zh": "保存更改",
        "lo": "ບັນທຶກການປ່ຽນແປງ", "vi": "Lưu thay đổi",
    },
    "actions.saveFailed": {
        "en": "Save failed", "th": "บันทึกไม่สำเร็จ", "zh": "保存失败",
        "lo": "ບັນທຶກລົ້ມເຫຼວ", "vi": "Lưu thất bại",
    },
    "actions.deleteFailed": {
        "en": "Delete failed", "th": "ลบไม่สำเร็จ", "zh": "删除失败",
        "lo": "ລຶບລົ້ມເຫຼວ", "vi": "Xóa thất bại",
    },
    "actions.revoke": {
        "en": "Revoke", "th": "เพิกถอน", "zh": "撤销",
        "lo": "ຍົກເລີກ", "vi": "Thu hồi",
    },
    "actions.resend": {
        "en": "Resend", "th": "ส่งอีกครั้ง", "zh": "重新发送",
        "lo": "ສົ່ງອີກຄັ້ງ", "vi": "Gửi lại",
    },
    "actions.moveUp": {
        "en": "Move up", "th": "เลื่อนขึ้น", "zh": "上移",
        "lo": "ເລື່ອນຂຶ້ນ", "vi": "Chuyển lên",
    },
    "actions.moveDown": {
        "en": "Move down", "th": "เลื่อนลง", "zh": "下移",
        "lo": "ເລື່ອນລົງ", "vi": "Chuyển xuống",
    },
    "actions.toggleFailed": {
        "en": "Toggle failed", "th": "เปิด/ปิดไม่สำเร็จ", "zh": "切换失败",
        "lo": "ສະຫຼັບລົ້ມເຫຼວ", "vi": "Chuyển đổi thất bại",
    },
    "actions.reorderFailed": {
        "en": "Reorder failed", "th": "เรียงลำดับไม่สำเร็จ", "zh": "重排失败",
        "lo": "ຮຽງໃໝ່ບໍ່ສຳເລັດ", "vi": "Sắp xếp thất bại",
    },
    "status.enabled": {
        "en": "Enabled", "th": "เปิดใช้งาน", "zh": "已启用",
        "lo": "ເປີດໃຊ້", "vi": "Đã bật",
    },
    "status.read": {
        "en": "Read", "th": "อ่านแล้ว", "zh": "已读",
        "lo": "ອ່ານແລ້ວ", "vi": "Đã đọc",
    },
    "status.unread": {
        "en": "Unread", "th": "ยังไม่อ่าน", "zh": "未读",
        "lo": "ຍັງບໍ່ໄດ້ອ່ານ", "vi": "Chưa đọc",
    },
    "status.processed": {
        "en": "Processed", "th": "ดำเนินการแล้ว", "zh": "已处理",
        "lo": "ດຳເນີນການແລ້ວ", "vi": "Đã xử lý",
    },
    "status.saved": {
        "en": "Saved", "th": "บันทึกแล้ว", "zh": "已保存",
        "lo": "ບັນທຶກແລ້ວ", "vi": "Đã lưu",
    },
    "time.justNow": {
        "en": "Just now", "th": "เมื่อสักครู่", "zh": "刚刚",
        "lo": "ຫາກໍ່ນີ້", "vi": "Vừa xong",
    },
    "time.minsAgo": {
        "en": "{{count}} minutes ago", "th": "{{count}} นาทีที่แล้ว",
        "zh": "{{count}} 分钟前", "lo": "{{count}} ນາທີຜ່ານມາ",
        "vi": "{{count}} phút trước",
    },
    "time.hoursAgo": {
        "en": "{{count}} hours ago", "th": "{{count}} ชั่วโมงที่แล้ว",
        "zh": "{{count}} 小时前", "lo": "{{count}} ຊົ່ວໂມງຜ່ານມາ",
        "vi": "{{count}} giờ trước",
    },
    "time.daysAgo": {
        "en": "{{count}} days ago", "th": "{{count}} วันที่แล้ว",
        "zh": "{{count}} 天前", "lo": "{{count}} ມື້ຜ່ານມາ",
        "vi": "{{count}} ngày trước",
    },
    "dashboard.orderCount": {
        "en": "{{count}} orders", "th": "{{count}} คำสั่งซื้อ",
        "zh": "{{count}} 个订单", "lo": "{{count}} ຄຳສັ່ງຊື້",
        "vi": "{{count}} đơn hàng",
    },
    "dashboard.needAttention": {
        "en": "Needs attention", "th": "ต้องการความสนใจ", "zh": "需要关注",
        "lo": "ຕ້ອງການຄວາມສົນໃຈ", "vi": "Cần chú ý",
    },
    "nav.shopCenter": {
        "en": "Shop center", "th": "ศูนย์ร้านค้า", "zh": "店铺中心",
        "lo": "ສູນຮ້ານຄ້າ", "vi": "Trung tâm cửa hàng",
    },
    "financial.currentBalance": {
        "en": "Current balance", "th": "ยอดคงเหลือปัจจุบัน", "zh": "当前余额",
        "lo": "ຍອດຄົງເຫຼືອປັດຈຸບັນ", "vi": "Số dư hiện tại",
    },
    "financial.grossRevenue": {
        "en": "Gross revenue", "th": "รายได้รวม", "zh": "总收入",
        "lo": "ລາຍຮັບລວມ", "vi": "Tổng doanh thu",
    },
    "financial.lifetimeIncome": {
        "en": "Lifetime income", "th": "รายได้สะสม", "zh": "累计收入",
        "lo": "ລາຍຮັບສະສົມ", "vi": "Thu nhập tích lũy",
    },
    "financial.ordersReceived": {
        "en": "Orders received", "th": "คำสั่งซื้อที่ได้รับ", "zh": "已收订单",
        "lo": "ຄຳສັ່ງຊື້ທີ່ໄດ້ຮັບ", "vi": "Đơn đã nhận",
    },
    "financial.webSalesOrders": {
        "en": "Web sales orders", "th": "คำสั่งซื้อจากเว็บ", "zh": "网店销售订单",
        "lo": "ຄຳສັ່ງຊື້ຈາກເວັບ", "vi": "Đơn hàng web",
    },
    "financial.posRevenue": {
        "en": "POS revenue", "th": "รายได้ POS", "zh": "POS 收入",
        "lo": "ລາຍຮັບ POS", "vi": "Doanh thu POS",
    },
    "financial.posRevenueInStore": {
        "en": "POS revenue (in-store)", "th": "รายได้ POS (ในร้าน)",
        "zh": "店内 POS 收入", "lo": "ລາຍຮັບ POS (ໃນຮ້ານ)",
        "vi": "Doanh thu POS (tại cửa hàng)",
    },
    "pages.shops.applications.title": {
        "en": "Shop applications", "th": "ใบสมัครร้านค้า", "zh": "店铺申请",
        "lo": "ໃບສະໝັກຮ້ານຄ້າ", "vi": "Đơn đăng ký cửa hàng",
    },
    "pages.shops.applications.noApplications": {
        "en": "No applications", "th": "ไม่มีใบสมัคร", "zh": "暂无申请",
        "lo": "ບໍ່ມີໃບສະໝັກ", "vi": "Không có đơn",
    },
    "pages.shops.kpi.allShops": {
        "en": "All shops", "th": "ร้านค้าทั้งหมด", "zh": "所有店铺",
        "lo": "ຮ້ານຄ້າທັງໝົດ", "vi": "Tất cả cửa hàng",
    },
    "pages.shops.kpi.totalBalance": {
        "en": "Total balance", "th": "ยอดคงเหลือรวม", "zh": "总余额",
        "lo": "ຍອດຄົງເຫຼືອລວມ", "vi": "Tổng số dư",
    },
    "pages.shops.kpi.verified": {
        "en": "Verified", "th": "ยืนยันแล้ว", "zh": "已验证",
        "lo": "ຢືນຢັນແລ້ວ", "vi": "Đã xác minh",
    },
    "pages.shops.kpi.pending": {
        "en": "Pending", "th": "รอดำเนินการ", "zh": "待处理",
        "lo": "ລໍຖ້າ", "vi": "Đang chờ",
    },
    "pages.shops.totalBalance": {
        "en": "Total balance", "th": "ยอดคงเหลือรวม", "zh": "总余额",
        "lo": "ຍອດຄົງເຫຼືອລວມ", "vi": "Tổng số dư",
    },
    "pages.shops.shopsCount": {
        "en": "{{count}} shops", "th": "{{count}} ร้านค้า",
        "zh": "{{count}} 个店铺", "lo": "{{count}} ຮ້ານຄ້າ",
        "vi": "{{count}} cửa hàng",
    },
    "pages.shops.noMatch": {
        "en": "No matching shops", "th": "ไม่มีร้านค้าที่ตรงกัน", "zh": "无匹配店铺",
        "lo": "ບໍ່ມີຮ້ານຄ້າທີ່ຕົງກັນ", "vi": "Không có cửa hàng khớp",
    },
    "pages.shops.searchPlaceholder": {
        "en": "Search shops…", "th": "ค้นหาร้านค้า...", "zh": "搜索店铺...",
        "lo": "ຄົ້ນຫາຮ້ານຄ້າ...", "vi": "Tìm cửa hàng...",
    },
    "pages.shops.loadingShops": {
        "en": "Loading shops…", "th": "กำลังโหลดร้านค้า...", "zh": "正在加载店铺...",
        "lo": "ກຳລັງໂຫຼດຮ້ານຄ້າ...", "vi": "Đang tải cửa hàng...",
    },
    "pages.shops.details.notFound": {
        "en": "Shop not found", "th": "ไม่พบร้านค้า", "zh": "未找到店铺",
        "lo": "ບໍ່ພົບຮ້ານຄ້າ", "vi": "Không tìm thấy cửa hàng",
    },
    "pages.users.usersCount": {
        "en": "{{count}} users", "th": "{{count}} ผู้ใช้",
        "zh": "{{count}} 个用户", "lo": "{{count}} ຜູ້ໃຊ້",
        "vi": "{{count}} người dùng",
    },
    "pages.users.totalBalance": {
        "en": "Total balance", "th": "ยอดคงเหลือรวม", "zh": "总余额",
        "lo": "ຍອດຄົງເຫຼືອລວມ", "vi": "Tổng số dư",
    },
    "pages.users.noMatch": {
        "en": "No matching users", "th": "ไม่มีผู้ใช้ที่ตรงกัน", "zh": "无匹配用户",
        "lo": "ບໍ່ມີຜູ້ໃຊ້ທີ່ຕົງກັນ", "vi": "Không có người dùng khớp",
    },
    "pages.users.searchPlaceholder": {
        "en": "Search users…", "th": "ค้นหาผู้ใช้...", "zh": "搜索用户...",
        "lo": "ຄົ້ນຫາຜູ້ໃຊ້...", "vi": "Tìm người dùng...",
    },
    "pages.users.exportTitle": {
        "en": "Export to CSV", "th": "ส่งออก CSV", "zh": "导出 CSV",
        "lo": "ສົ່ງອອກ CSV", "vi": "Xuất CSV",
    },
    "pages.users.loadingUsers": {
        "en": "Loading users…", "th": "กำลังโหลดผู้ใช้...", "zh": "正在加载用户...",
        "lo": "ກຳລັງໂຫຼດຜູ້ໃຊ້...", "vi": "Đang tải người dùng...",
    },
    "pages.notifications.target": {
        "en": "Target", "th": "เป้าหมาย", "zh": "目标",
        "lo": "ເປົ້າໝາຍ", "vi": "Mục tiêu",
    },
    "pages.notifications.sending": {
        "en": "Sending…", "th": "กำลังส่ง...", "zh": "发送中...",
        "lo": "ກຳລັງສົ່ງ...", "vi": "Đang gửi...",
    },
    "pages.notifications.sentSuccess": {
        "en": "Notification sent", "th": "ส่งการแจ้งเตือนแล้ว", "zh": "通知已发送",
        "lo": "ສົ່ງການແຈ້ງເຕືອນແລ້ວ", "vi": "Đã gửi thông báo",
    },
    "pages.notifications.sendButton": {
        "en": "Send now", "th": "ส่งทันที", "zh": "立即发送",
        "lo": "ສົ່ງດຽວນີ້", "vi": "Gửi ngay",
    },
    "pages.notifications.noHistory": {
        "en": "No notifications sent", "th": "ยังไม่มีการแจ้งเตือน",
        "zh": "尚未发送通知", "lo": "ຍັງບໍ່ມີການແຈ້ງເຕືອນ",
        "vi": "Chưa gửi thông báo",
    },
    "pages.notifications.loadingHistory": {
        "en": "Loading history…", "th": "กำลังโหลดประวัติ...",
        "zh": "正在加载历史...", "lo": "ກຳລັງໂຫຼດປະຫວັດ...",
        "vi": "Đang tải lịch sử...",
    },
    "pages.notifications.table.titleContent": {
        "en": "Title / Content", "th": "หัวข้อ / เนื้อหา", "zh": "标题 / 内容",
        "lo": "ຫົວຂໍ້ / ເນື້ອຫາ", "vi": "Tiêu đề / Nội dung",
    },
    "pages.notifications.form.messagePlaceholder": {
        "en": "Enter notification message…", "th": "ใส่ข้อความแจ้งเตือน...",
        "zh": "输入通知消息...", "lo": "ໃສ່ຂໍ້ຄວາມແຈ້ງເຕືອນ...",
        "vi": "Nhập tin nhắn thông báo...",
    },
    "pages.notifications.form.titlePlaceholder": {
        "en": "Enter notification title…", "th": "ใส่หัวข้อ...",
        "zh": "输入通知标题...", "lo": "ໃສ່ຫົວຂໍ້...",
        "vi": "Nhập tiêu đề thông báo...",
    },
    "pages.notifications.form.messageLabel": {
        "en": "Message", "th": "ข้อความ", "zh": "消息",
        "lo": "ຂໍ້ຄວາມ", "vi": "Tin nhắn",
    },
    "pages.notifications.form.titleRequired": {
        "en": "Title is required", "th": "ต้องระบุหัวข้อ", "zh": "标题必填",
        "lo": "ຕ້ອງລະບຸຫົວຂໍ້", "vi": "Tiêu đề bắt buộc",
    },
    "pages.notifications.types.system": {
        "en": "System", "th": "ระบบ", "zh": "系统",
        "lo": "ລະບົບ", "vi": "Hệ thống",
    },
    "pages.notifications.types.payout": {
        "en": "Payout", "th": "จ่ายเงิน", "zh": "付款",
        "lo": "ຈ່າຍເງິນ", "vi": "Thanh toán",
    },
    "pages.notifications.types.security": {
        "en": "Security", "th": "ความปลอดภัย", "zh": "安全",
        "lo": "ຄວາມປອດໄພ", "vi": "Bảo mật",
    },
    "pages.history.totalRequests": {
        "en": "Total requests", "th": "คำขอทั้งหมด", "zh": "总请求",
        "lo": "ຄຳຂໍທັງໝົດ", "vi": "Tổng yêu cầu",
    },
    "pages.history.totalPaidOut": {
        "en": "Total paid out", "th": "จ่ายออกทั้งหมด", "zh": "总支付",
        "lo": "ຈ່າຍອອກທັງໝົດ", "vi": "Tổng đã trả",
    },
    "pages.history.approved": {
        "en": "Approved", "th": "อนุมัติแล้ว", "zh": "已批准",
        "lo": "ອະນຸມັດແລ້ວ", "vi": "Đã duyệt",
    },
    "pages.history.declined": {
        "en": "Declined", "th": "ปฏิเสธ", "zh": "已拒绝",
        "lo": "ປະຕິເສດ", "vi": "Đã từ chối",
    },
    "pages.history.lastRequest": {
        "en": "Last request", "th": "คำขอล่าสุด", "zh": "最近请求",
        "lo": "ຄຳຂໍຫຼ້າສຸດ", "vi": "Yêu cầu gần nhất",
    },
    "pages.history.noWithdrawals": {
        "en": "No withdrawals", "th": "ไม่มีการถอน", "zh": "暂无提现",
        "lo": "ບໍ່ມີການຖອນ", "vi": "Không có giao dịch rút",
    },
    "pages.history.totalEvents": {
        "en": "Total events", "th": "เหตุการณ์ทั้งหมด", "zh": "事件总数",
        "lo": "ເຫດການທັງໝົດ", "vi": "Tổng sự kiện",
    },
    "pages.history.uniqueAdmins": {
        "en": "Unique admins", "th": "ผู้ดูแลที่ไม่ซ้ำ", "zh": "唯一管理员",
        "lo": "ຜູ້ດູແລທີ່ບໍ່ຊໍ້າ", "vi": "Quản trị viên khác nhau",
    },
    "pages.history.uniqueActions": {
        "en": "Unique actions", "th": "การกระทำที่ไม่ซ้ำ", "zh": "唯一操作",
        "lo": "ການກະທຳທີ່ບໍ່ຊໍ້າ", "vi": "Thao tác khác nhau",
    },
    "pages.history.uniqueIps": {
        "en": "Unique IPs", "th": "IP ที่ไม่ซ้ำ", "zh": "唯一 IP",
        "lo": "IP ທີ່ບໍ່ຊໍ້າ", "vi": "IP khác nhau",
    },
    "pages.history.uniqueUsers": {
        "en": "Unique users", "th": "ผู้ใช้ที่ไม่ซ้ำ", "zh": "唯一用户",
        "lo": "ຜູ້ໃຊ້ທີ່ບໍ່ຊໍ້າ", "vi": "Người dùng khác nhau",
    },
    "pages.history.lastActive": {
        "en": "Last active", "th": "ใช้งานล่าสุด", "zh": "最近活跃",
        "lo": "ໃຊ້ງານຫຼ້າສຸດ", "vi": "Hoạt động gần nhất",
    },
    "pages.history.noData": {
        "en": "No data", "th": "ไม่มีข้อมูล", "zh": "暂无数据",
        "lo": "ບໍ່ມີຂໍ້ມູນ", "vi": "Không có dữ liệu",
    },
    "pages.history.noAuditEvents": {
        "en": "No audit events", "th": "ไม่มีบันทึก", "zh": "暂无审计事件",
        "lo": "ບໍ່ມີເຫດການກວດສອບ", "vi": "Không có sự kiện kiểm toán",
    },
    "pages.history.dataNote": {
        "en": "Data note", "th": "หมายเหตุข้อมูล", "zh": "数据说明",
        "lo": "ໝາຍເຫດຂໍ້ມູນ", "vi": "Ghi chú dữ liệu",
    },
    "pages.history.lastKnownIpNote": {
        "en": "Last known IP", "th": "IP ล่าสุดที่บันทึก", "zh": "上次记录的 IP",
        "lo": "IP ຫຼ້າສຸດທີ່ບັນທຶກ", "vi": "IP gần nhất đã ghi",
    },
    "pages.categories.cannotDeleteWithProducts": {
        "en": "Cannot delete: category has products",
        "th": "ลบไม่ได้: หมวดยังมีสินค้า",
        "zh": "无法删除：分类下有商品",
        "lo": "ລຶບບໍ່ໄດ້: ໝວດໝູ່ມີສິນຄ້າ",
        "vi": "Không thể xóa: danh mục có sản phẩm",
    },
    "pages.categories.categoriesCount": {
        "en": "{{count}} categories", "th": "{{count}} หมวดหมู่",
        "zh": "{{count}} 个分类", "lo": "{{count}} ໝວດໝູ່",
        "vi": "{{count}} danh mục",
    },
    "pages.categories.createCategory": {
        "en": "Create category", "th": "สร้างหมวดหมู่", "zh": "创建分类",
        "lo": "ສ້າງໝວດໝູ່", "vi": "Tạo danh mục",
    },
    "pages.categories.noMatch": {
        "en": "No matching categories", "th": "ไม่มีหมวดที่ตรงกัน",
        "zh": "无匹配分类", "lo": "ບໍ່ມີໝວດໝູ່ທີ່ຕົງກັນ",
        "vi": "Không có danh mục khớp",
    },
    "pages.categories.searchPlaceholder": {
        "en": "Search categories…", "th": "ค้นหาหมวดหมู่...",
        "zh": "搜索分类...", "lo": "ຄົ້ນຫາໝວດໝູ່...",
        "vi": "Tìm danh mục...",
    },
    "pages.categories.failedToLoad": {
        "en": "Failed to load categories", "th": "โหลดหมวดหมู่ไม่สำเร็จ",
        "zh": "加载分类失败", "lo": "ໂຫຼດໝວດໝູ່ລົ້ມເຫຼວ",
        "vi": "Tải danh mục thất bại",
    },
    "pages.categories.form.activeLabel": {
        "en": "Active", "th": "เปิดใช้งาน", "zh": "启用",
        "lo": "ເປີດໃຊ້", "vi": "Kích hoạt",
    },
    "pages.categories.form.nameRequired": {
        "en": "Name is required", "th": "ต้องระบุชื่อ", "zh": "名称必填",
        "lo": "ຕ້ອງລະບຸຊື່", "vi": "Tên bắt buộc",
    },
    "pages.categories.form.namePlaceholder": {
        "en": "Category name…", "th": "ชื่อหมวดหมู่...", "zh": "分类名称...",
        "lo": "ຊື່ໝວດໝູ່...", "vi": "Tên danh mục...",
    },
    "pages.categories.form.descriptionPlaceholder": {
        "en": "Optional description…", "th": "รายละเอียด (ไม่บังคับ)...",
        "zh": "可选描述...", "lo": "ລາຍລະອຽດ (ບໍ່ບັງຄັບ)...",
        "vi": "Mô tả tùy chọn...",
    },
    "pages.categories.form.iconPlaceholder": {
        "en": "Icon name (lucide-react)…", "th": "ชื่อไอคอน (lucide-react)...",
        "zh": "图标名称 (lucide-react)...", "lo": "ຊື່ໄອຄອນ (lucide-react)...",
        "vi": "Tên biểu tượng (lucide-react)...",
    },
    "pages.settings.failedToLoad": {
        "en": "Failed to load settings", "th": "โหลดการตั้งค่าไม่สำเร็จ",
        "zh": "加载设置失败", "lo": "ໂຫຼດການຕັ້ງຄ່າລົ້ມເຫຼວ",
        "vi": "Tải cài đặt thất bại",
    },
    "pages.settings.noSettings": {
        "en": "No settings", "th": "ไม่มีการตั้งค่า", "zh": "暂无设置",
        "lo": "ບໍ່ມີການຕັ້ງຄ່າ", "vi": "Không có cài đặt",
    },
    "pages.settings.settingsCount": {
        "en": "{{count}} settings", "th": "{{count}} การตั้งค่า",
        "zh": "{{count}} 项设置", "lo": "{{count}} ການຕັ້ງຄ່າ",
        "vi": "{{count}} cài đặt",
    },
    "pages.settings.publicHint": {
        "en": "Public (visible to all users)", "th": "เปิดเผยต่อสาธารณะ",
        "zh": "公开 (所有用户可见)", "lo": "ສະແດງສາທາລະນະ (ທຸກຄົນເຫັນ)",
        "vi": "Công khai (mọi người dùng thấy)",
    },
    "pages.withdraw.requester": {
        "en": "Requester", "th": "ผู้ขอ", "zh": "申请人",
        "lo": "ຜູ້ຂໍ", "vi": "Người yêu cầu",
    },
    "pages.withdrawals.details.loadingError": {
        "en": "Failed to load withdrawal", "th": "โหลดการถอนไม่สำเร็จ",
        "zh": "加载提现失败", "lo": "ໂຫຼດການຖອນລົ້ມເຫຼວ",
        "vi": "Tải rút tiền thất bại",
    },
    "pages.withdrawals.details.user.notAvailable": {
        "en": "User info not available", "th": "ไม่มีข้อมูลผู้ใช้",
        "zh": "用户信息不可用", "lo": "ບໍ່ມີຂໍ້ມູນຜູ້ໃຊ້",
        "vi": "Không có thông tin người dùng",
    },
}


def flatten(d, prefix=""):
    out = {}
    for k, v in d.items():
        path = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, path))
        else:
            out[path] = v
    return out


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
        overrode = 0
        for key, vals in OVERRIDES.items():
            if lang in vals:
                set_nested(data, key, vals[lang])
                overrode += 1
        p.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"{lang}: overrode {overrode} keys")


if __name__ == "__main__":
    main()
