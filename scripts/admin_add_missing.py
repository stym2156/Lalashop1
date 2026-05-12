"""
Add all missing translation keys to Admin's 5 locale files.

Scans src/pages and src/components for t('foo.bar') calls, finds which keys
are not yet in en/common.json, and adds them to all 5 language files with
sensible defaults.

The English value is derived from the key path's last segment (camelCase →
human-friendly). Other languages reuse the English text for now (i18next will
display the English fallback rather than the raw key — which is what the
user wants).
"""
import json
import re
from pathlib import Path

ROOT = Path("f:/Lalashop2026/Admin")
LOCALES = ROOT / "src/locales"


# --- helpers -----------------------------------------------------------------

def humanize(seg: str) -> str:
    """Convert camelCase/snake_case to a readable English label."""
    # snake_case -> spaces
    seg = seg.replace("_", " ")
    # camelCase boundaries
    seg = re.sub(r"([a-z])([A-Z])", r"\1 \2", seg)
    seg = re.sub(r"([A-Z])([A-Z][a-z])", r"\1 \2", seg)
    return seg[:1].upper() + seg[1:]


# Translation dictionary for common UI words -> 4 other languages.
# When a key's English label matches one of these (case-insensitive),
# we use the localized version. Otherwise we fall back to English.
DICT: dict[str, dict[str, str]] = {
    "save": {"th": "บันทึก", "zh": "保存", "lo": "ບັນທຶກ", "vi": "Lưu"},
    "cancel": {"th": "ยกเลิก", "zh": "取消", "lo": "ຍົກເລີກ", "vi": "Hủy"},
    "confirm": {"th": "ยืนยัน", "zh": "确认", "lo": "ຢືນຢັນ", "vi": "Xác nhận"},
    "delete": {"th": "ลบ", "zh": "删除", "lo": "ລຶບ", "vi": "Xóa"},
    "edit": {"th": "แก้ไข", "zh": "编辑", "lo": "ແກ້ໄຂ", "vi": "Sửa"},
    "view": {"th": "ดู", "zh": "查看", "lo": "ເບິ່ງ", "vi": "Xem"},
    "search": {"th": "ค้นหา", "zh": "搜索", "lo": "ຄົ້ນຫາ", "vi": "Tìm kiếm"},
    "loading": {"th": "กำลังโหลด...", "zh": "加载中...", "lo": "ກຳລັງໂຫຼດ...", "vi": "Đang tải..."},
    "saving": {"th": "กำลังบันทึก...", "zh": "保存中...", "lo": "ກຳລັງບັນທຶກ...", "vi": "Đang lưu..."},
    "name": {"th": "ชื่อ", "zh": "名称", "lo": "ຊື່", "vi": "Tên"},
    "email": {"th": "อีเมล", "zh": "邮箱", "lo": "ອີເມວ", "vi": "Email"},
    "phone": {"th": "เบอร์โทร", "zh": "电话", "lo": "ເບີໂທ", "vi": "Điện thoại"},
    "status": {"th": "สถานะ", "zh": "状态", "lo": "ສະຖານະ", "vi": "Trạng thái"},
    "actions": {"th": "การจัดการ", "zh": "操作", "lo": "ການຈັດການ", "vi": "Thao tác"},
    "type": {"th": "ประเภท", "zh": "类型", "lo": "ປະເພດ", "vi": "Loại"},
    "id": {"th": "ไอดี", "zh": "编号", "lo": "ໄອດີ", "vi": "Mã"},
    "title": {"th": "หัวข้อ", "zh": "标题", "lo": "ຫົວຂໍ້", "vi": "Tiêu đề"},
    "role": {"th": "บทบาท", "zh": "角色", "lo": "ບົດບາດ", "vi": "Vai trò"},
    "password": {"th": "รหัสผ่าน", "zh": "密码", "lo": "ລະຫັດຜ່ານ", "vi": "Mật khẩu"},
    "username": {"th": "ชื่อผู้ใช้", "zh": "用户名", "lo": "ຊື່ຜູ້ໃຊ້", "vi": "Tên đăng nhập"},
    "fullName": {"th": "ชื่อเต็ม", "zh": "全名", "lo": "ຊື່ເຕັມ", "vi": "Họ tên"},
    "amount": {"th": "จำนวน", "zh": "金额", "lo": "ຈຳນວນ", "vi": "Số tiền"},
    "balance": {"th": "ยอดคงเหลือ", "zh": "余额", "lo": "ຍອດຄົງເຫຼືອ", "vi": "Số dư"},
    "total": {"th": "รวม", "zh": "合计", "lo": "ລວມ", "vi": "Tổng"},
    "category": {"th": "หมวดหมู่", "zh": "分类", "lo": "ໝວດໝູ່", "vi": "Danh mục"},
    "description": {"th": "รายละเอียด", "zh": "描述", "lo": "ລາຍລະອຽດ", "vi": "Mô tả"},
    "date": {"th": "วันที่", "zh": "日期", "lo": "ວັນທີ", "vi": "Ngày"},
    "approved": {"th": "อนุมัติแล้ว", "zh": "已批准", "lo": "ອະນຸມັດແລ້ວ", "vi": "Đã duyệt"},
    "rejected": {"th": "ปฏิเสธ", "zh": "已拒绝", "lo": "ປະຕິເສດ", "vi": "Đã từ chối"},
    "pending": {"th": "รอดำเนินการ", "zh": "待处理", "lo": "ລໍຖ້າ", "vi": "Đang chờ"},
    "verified": {"th": "ยืนยันแล้ว", "zh": "已验证", "lo": "ຢືນຢັນແລ້ວ", "vi": "Đã xác minh"},
    "unverified": {"th": "ยังไม่ยืนยัน", "zh": "未验证", "lo": "ຍັງບໍ່ຢືນຢັນ", "vi": "Chưa xác minh"},
    "enabled": {"th": "เปิดใช้งาน", "zh": "已启用", "lo": "ເປີດໃຊ້", "vi": "Đã bật"},
    "disabled": {"th": "ปิดใช้งาน", "zh": "已禁用", "lo": "ປິດໃຊ້", "vi": "Đã tắt"},
    "active": {"th": "ใช้งาน", "zh": "活跃", "lo": "ໃຊ້ງານ", "vi": "Hoạt động"},
    "joined": {"th": "เข้าร่วม", "zh": "加入时间", "lo": "ເຂົ້າຮ່ວມ", "vi": "Tham gia"},
    "created": {"th": "สร้างเมื่อ", "zh": "创建时间", "lo": "ສ້າງເມື່ອ", "vi": "Tạo lúc"},
    "updated": {"th": "อัปเดต", "zh": "更新时间", "lo": "ອັບເດດ", "vi": "Cập nhật"},
    "shop": {"th": "ร้านค้า", "zh": "店铺", "lo": "ຮ້ານຄ້າ", "vi": "Cửa hàng"},
    "product": {"th": "สินค้า", "zh": "商品", "lo": "ສິນຄ້າ", "vi": "Sản phẩm"},
    "orders": {"th": "คำสั่งซื้อ", "zh": "订单", "lo": "ຄຳສັ່ງຊື້", "vi": "Đơn hàng"},
    "stock": {"th": "สต็อก", "zh": "库存", "lo": "ສະຕັອກ", "vi": "Tồn kho"},
    "price": {"th": "ราคา", "zh": "价格", "lo": "ລາຄາ", "vi": "Giá"},
    "bank": {"th": "ธนาคาร", "zh": "银行", "lo": "ທະນາຄານ", "vi": "Ngân hàng"},
    "fee": {"th": "ค่าธรรมเนียม", "zh": "手续费", "lo": "ຄ່າທຳນຽມ", "vi": "Phí"},
    "net": {"th": "สุทธิ", "zh": "净额", "lo": "ສຸດທິ", "vi": "Ròng"},
    "note": {"th": "หมายเหตุ", "zh": "备注", "lo": "ໝາຍເຫດ", "vi": "Ghi chú"},
    "error": {"th": "ผิดพลาด", "zh": "错误", "lo": "ຜິດພາດ", "vi": "Lỗi"},
    "admin": {"th": "ผู้ดูแล", "zh": "管理员", "lo": "ຜູ້ດູແລ", "vi": "Quản trị viên"},
    "guest": {"th": "ผู้เยี่ยมชม", "zh": "访客", "lo": "ຜູ້ມາຢ້ຽມຢາມ", "vi": "Khách"},
    "copy": {"th": "คัดลอก", "zh": "复制", "lo": "ສຳເນົາ", "vi": "Sao chép"},
    "send": {"th": "ส่ง", "zh": "发送", "lo": "ສົ່ງ", "vi": "Gửi"},
    "sending": {"th": "กำลังส่ง...", "zh": "发送中...", "lo": "ກຳລັງສົ່ງ...", "vi": "Đang gửi..."},
    "resend": {"th": "ส่งอีกครั้ง", "zh": "重新发送", "lo": "ສົ່ງອີກຄັ້ງ", "vi": "Gửi lại"},
    "revoke": {"th": "เพิกถอน", "zh": "撤销", "lo": "ຍົກເລີກ", "vi": "Thu hồi"},
    "approve": {"th": "อนุมัติ", "zh": "批准", "lo": "ອະນຸມັດ", "vi": "Duyệt"},
    "reject": {"th": "ปฏิเสธ", "zh": "拒绝", "lo": "ປະຕິເສດ", "vi": "Từ chối"},
    "moveUp": {"th": "เลื่อนขึ้น", "zh": "上移", "lo": "ເລື່ອນຂຶ້ນ", "vi": "Chuyển lên"},
    "moveDown": {"th": "เลื่อนลง", "zh": "下移", "lo": "ເລື່ອນລົງ", "vi": "Chuyển xuống"},
    "noResults": {"th": "ไม่พบผลลัพธ์", "zh": "无结果", "lo": "ບໍ່ພົບຜົນລັບ", "vi": "Không có kết quả"},
    "noMatch": {"th": "ไม่พบรายการที่ตรงกัน", "zh": "无匹配项", "lo": "ບໍ່ມີລາຍການທີ່ຕົງກັນ", "vi": "Không có mục khớp"},
    "loadingError": {"th": "โหลดข้อมูลไม่สำเร็จ", "zh": "加载失败", "lo": "ໂຫຼດຂໍ້ມູນລົ້ມເຫຼວ", "vi": "Tải dữ liệu thất bại"},
    "failedToLoad": {"th": "โหลดไม่สำเร็จ", "zh": "加载失败", "lo": "ໂຫຼດລົ້ມເຫຼວ", "vi": "Tải thất bại"},
    "saveFailed": {"th": "บันทึกไม่สำเร็จ", "zh": "保存失败", "lo": "ບັນທຶກລົ້ມເຫຼວ", "vi": "Lưu thất bại"},
    "deleteFailed": {"th": "ลบไม่สำเร็จ", "zh": "删除失败", "lo": "ລຶບລົ້ມເຫຼວ", "vi": "Xóa thất bại"},
    "saveChanges": {"th": "บันทึกการเปลี่ยนแปลง", "zh": "保存更改", "lo": "ບັນທຶກການປ່ຽນແປງ", "vi": "Lưu thay đổi"},
    "saved": {"th": "บันทึกแล้ว", "zh": "已保存", "lo": "ບັນທຶກແລ້ວ", "vi": "Đã lưu"},
    "noHistory": {"th": "ไม่มีประวัติ", "zh": "暂无历史", "lo": "ບໍ່ມີປະຫວັດ", "vi": "Không có lịch sử"},
    "noData": {"th": "ไม่มีข้อมูล", "zh": "暂无数据", "lo": "ບໍ່ມີຂໍ້ມູນ", "vi": "Không có dữ liệu"},
    "applications": {"th": "ใบสมัคร", "zh": "申请", "lo": "ໃບສະໝັກ", "vi": "Đơn"},
    "settings": {"th": "ตั้งค่า", "zh": "设置", "lo": "ການຕັ້ງຄ່າ", "vi": "Cài đặt"},
    "notifications": {"th": "การแจ้งเตือน", "zh": "通知", "lo": "ການແຈ້ງເຕືອນ", "vi": "Thông báo"},
    "messagePlaceholder": {"th": "ข้อความ...", "zh": "消息...", "lo": "ຂໍ້ຄວາມ...", "vi": "Tin nhắn..."},
    "titlePlaceholder": {"th": "หัวข้อ...", "zh": "标题...", "lo": "ຫົວຂໍ້...", "vi": "Tiêu đề..."},
    "messageLabel": {"th": "ข้อความ", "zh": "消息", "lo": "ຂໍ້ຄວາມ", "vi": "Tin nhắn"},
    "titleRequired": {"th": "ต้องระบุหัวข้อ", "zh": "标题必填", "lo": "ຕ້ອງລະບຸຫົວຂໍ້", "vi": "Tiêu đề bắt buộc"},
    "messageRequired": {"th": "ต้องระบุข้อความ", "zh": "消息必填", "lo": "ຕ້ອງລະບຸຂໍ້ຄວາມ", "vi": "Tin nhắn bắt buộc"},
    "sentSuccess": {"th": "ส่งสำเร็จ", "zh": "发送成功", "lo": "ສົ່ງສຳເລັດ", "vi": "Gửi thành công"},
    "sentFailed": {"th": "ส่งไม่สำเร็จ", "zh": "发送失败", "lo": "ສົ່ງລົ້ມເຫຼວ", "vi": "Gửi thất bại"},
    "sendButton": {"th": "ส่ง", "zh": "发送", "lo": "ສົ່ງ", "vi": "Gửi"},
    "audience": {"th": "ผู้รับ", "zh": "受众", "lo": "ຜູ້ຮັບ", "vi": "Đối tượng"},
    "channel": {"th": "ช่องทาง", "zh": "渠道", "lo": "ຊ່ອງທາງ", "vi": "Kênh"},
    "system": {"th": "ระบบ", "zh": "系统", "lo": "ລະບົບ", "vi": "Hệ thống"},
    "payout": {"th": "จ่ายเงิน", "zh": "付款", "lo": "ຈ່າຍເງິນ", "vi": "Thanh toán"},
    "security": {"th": "ความปลอดภัย", "zh": "安全", "lo": "ຄວາມປອດໄພ", "vi": "Bảo mật"},
    "promo": {"th": "โปรโมชัน", "zh": "促销", "lo": "ໂປຣໂມຊັນ", "vi": "Khuyến mãi"},
    "all": {"th": "ทั้งหมด", "zh": "全部", "lo": "ທັງໝົດ", "vi": "Tất cả"},
    "back": {"th": "ย้อนกลับ", "zh": "返回", "lo": "ກັບຄືນ", "vi": "Quay lại"},
    "next": {"th": "ถัดไป", "zh": "下一步", "lo": "ຕໍ່ໄປ", "vi": "Tiếp"},
    "previous": {"th": "ก่อนหน้า", "zh": "上一步", "lo": "ກ່ອນໜ້າ", "vi": "Trước"},
    "open": {"th": "เปิด", "zh": "打开", "lo": "ເປີດ", "vi": "Mở"},
    "close": {"th": "ปิด", "zh": "关闭", "lo": "ປິດ", "vi": "Đóng"},
    "read": {"th": "อ่านแล้ว", "zh": "已读", "lo": "ອ່ານແລ້ວ", "vi": "Đã đọc"},
    "unread": {"th": "ยังไม่อ่าน", "zh": "未读", "lo": "ຍັງບໍ່ໄດ້ອ່ານ", "vi": "Chưa đọc"},
    "recipient": {"th": "ผู้รับ", "zh": "收件人", "lo": "ຜູ້ຮັບ", "vi": "Người nhận"},
    "sent": {"th": "ส่งแล้ว", "zh": "已发送", "lo": "ສົ່ງແລ້ວ", "vi": "Đã gửi"},
    "readStatus": {"th": "สถานะการอ่าน", "zh": "阅读状态", "lo": "ສະຖານະການອ່ານ", "vi": "Trạng thái đọc"},
    "target": {"th": "เป้าหมาย", "zh": "目标", "lo": "ເປົ້າໝາຍ", "vi": "Mục tiêu"},
    "reference": {"th": "อ้างอิง", "zh": "参考", "lo": "ອ້າງອີງ", "vi": "Tham chiếu"},
    "locked": {"th": "ล็อค", "zh": "已锁定", "lo": "ລ໋ອກ", "vi": "Đã khóa"},
    "notAvailable": {"th": "ไม่พบ", "zh": "不可用", "lo": "ບໍ່ມີ", "vi": "Không có"},
    "totalRequests": {"th": "คำขอทั้งหมด", "zh": "总请求", "lo": "ຄຳຂໍທັງໝົດ", "vi": "Tổng yêu cầu"},
    "totalPaidOut": {"th": "จ่ายออกทั้งหมด", "zh": "总支付", "lo": "ຈ່າຍອອກທັງໝົດ", "vi": "Tổng đã trả"},
    "declined": {"th": "ปฏิเสธ", "zh": "已拒绝", "lo": "ປະຕິເສດ", "vi": "Đã từ chối"},
    "lastRequest": {"th": "คำขอล่าสุด", "zh": "最近请求", "lo": "ຄຳຂໍຫຼ້າສຸດ", "vi": "Yêu cầu gần nhất"},
    "noWithdrawals": {"th": "ไม่มีการถอน", "zh": "暂无提现", "lo": "ບໍ່ມີການຖອນ", "vi": "Không có giao dịch rút"},
    "withdrawId": {"th": "รหัสถอน", "zh": "提现编号", "lo": "ໄອດີຖອນ", "vi": "Mã rút"},
    "bankAccount": {"th": "บัญชีธนาคาร", "zh": "银行账户", "lo": "ບັນຊີທະນາຄານ", "vi": "Tài khoản ngân hàng"},
    "totalEvents": {"th": "เหตุการณ์ทั้งหมด", "zh": "事件总数", "lo": "ເຫດການທັງໝົດ", "vi": "Tổng sự kiện"},
    "uniqueAdmins": {"th": "ผู้ดูแลที่ไม่ซ้ำ", "zh": "唯一管理员", "lo": "ຜູ້ດູແລທີ່ບໍ່ຊໍ້າ", "vi": "Quản trị viên khác nhau"},
    "uniqueActions": {"th": "การกระทำที่ไม่ซ้ำ", "zh": "唯一操作", "lo": "ການກະທຳທີ່ບໍ່ຊໍ້າ", "vi": "Thao tác khác nhau"},
    "uniqueIps": {"th": "IP ที่ไม่ซ้ำ", "zh": "唯一 IP", "lo": "IP ທີ່ບໍ່ຊໍ້າ", "vi": "IP khác nhau"},
    "uniqueUsers": {"th": "ผู้ใช้ที่ไม่ซ้ำ", "zh": "唯一用户", "lo": "ຜູ້ໃຊ້ທີ່ບໍ່ຊໍ້າ", "vi": "Người dùng khác nhau"},
    "lastActive": {"th": "ใช้งานล่าสุด", "zh": "最近活跃", "lo": "ໃຊ້ງານຫຼ້າສຸດ", "vi": "Hoạt động gần nhất"},
    "lastKnownIp": {"th": "IP ล่าสุด", "zh": "最近 IP", "lo": "IP ຫຼ້າສຸດ", "vi": "IP gần nhất"},
    "lastKnownIpNote": {"th": "IP ล่าสุดที่บันทึกไว้", "zh": "上次记录的 IP", "lo": "IP ຫຼ້າສຸດທີ່ບັນທຶກ", "vi": "IP gần nhất đã ghi"},
    "dataNote": {"th": "หมายเหตุข้อมูล", "zh": "数据说明", "lo": "ໝາຍເຫດຂໍ້ມູນ", "vi": "Ghi chú dữ liệu"},
    "noAuditEvents": {"th": "ไม่มีเหตุการณ์", "zh": "暂无审计事件", "lo": "ບໍ່ມີເຫດການກວດສອບ", "vi": "Không có sự kiện kiểm toán"},
    "auditId": {"th": "รหัสตรวจสอบ", "zh": "审计编号", "lo": "ໄອດີກວດສອບ", "vi": "Mã kiểm toán"},
    "adminIp": {"th": "IP ผู้ดูแล", "zh": "管理员 IP", "lo": "IP ຜູ້ດູແລ", "vi": "IP quản trị"},
    "categoryName": {"th": "ชื่อหมวดหมู่", "zh": "分类名称", "lo": "ຊື່ໝວດໝູ່", "vi": "Tên danh mục"},
    "categoriesCount": {"th": "{{count}} หมวดหมู่", "zh": "{{count}} 个分类", "lo": "{{count}} ໝວດໝູ່", "vi": "{{count}} danh mục"},
    "cannotDeleteWithProducts": {"th": "ลบไม่ได้เพราะมีสินค้าในหมวด", "zh": "无法删除，分类下有商品", "lo": "ລຶບບໍ່ໄດ້ ມີສິນຄ້າຢູ່", "vi": "Không thể xóa, danh mục có sản phẩm"},
    "namePlaceholder": {"th": "ชื่อ...", "zh": "名称...", "lo": "ຊື່...", "vi": "Tên..."},
    "descriptionPlaceholder": {"th": "รายละเอียด...", "zh": "描述...", "lo": "ລາຍລະອຽດ...", "vi": "Mô tả..."},
    "iconPlaceholder": {"th": "ไอคอน...", "zh": "图标...", "lo": "ໄອຄອນ...", "vi": "Biểu tượng..."},
    "nameRequired": {"th": "ต้องระบุชื่อ", "zh": "名称必填", "lo": "ຕ້ອງລະບຸຊື່", "vi": "Tên bắt buộc"},
    "reorderFailed": {"th": "เรียงลำดับไม่สำเร็จ", "zh": "重排失败", "lo": "ຮຽງໃໝ່ບໍ່ສຳເລັດ", "vi": "Sắp xếp thất bại"},
    "createCategory": {"th": "สร้างหมวดหมู่", "zh": "创建分类", "lo": "ສ້າງໝວດໝູ່", "vi": "Tạo danh mục"},
    "form": {"th": "ฟอร์ม", "zh": "表单", "lo": "ແບບຟອມ", "vi": "Biểu mẫu"},
    "perms": {"th": "สิทธิ์", "zh": "权限", "lo": "ສິດທິ", "vi": "Quyền"},
    "verifyKyc": {"th": "ตรวจสอบ KYC", "zh": "审核 KYC", "lo": "ກວດສອບ KYC", "vi": "Xác minh KYC"},
    "approveWithdrawals": {"th": "อนุมัติการถอน", "zh": "审批提现", "lo": "ອະນຸມັດການຖອນ", "vi": "Duyệt rút tiền"},
    "allAdminPerms": {"th": "สิทธิ์ผู้ดูแลทั้งหมด", "zh": "所有管理员权限", "lo": "ສິດທິຜູ້ດູແລທັງໝົດ", "vi": "Tất cả quyền quản trị"},
    "failedToAssign": {"th": "กำหนดบทบาทไม่สำเร็จ", "zh": "分配角色失败", "lo": "ກຳນົດບົດບາດລົ້ມເຫຼວ", "vi": "Gán vai trò thất bại"},
    "noteText": {"th": "หมายเหตุ", "zh": "备注", "lo": "ໝາຍເຫດ", "vi": "Ghi chú"},
    "adminCount": {"th": "{{count}} ผู้ดูแล", "zh": "{{count}} 个管理员", "lo": "{{count}} ຜູ້ດູແລ", "vi": "{{count}} quản trị viên"},
    "before": {"th": "ก่อน", "zh": "之前", "lo": "ກ່ອນ", "vi": "Trước"},
    "after": {"th": "หลัง", "zh": "之后", "lo": "ຫຼັງ", "vi": "Sau"},
    "viewDiff": {"th": "ดูความเปลี่ยนแปลง", "zh": "查看差异", "lo": "ເບິ່ງຄວາມແຕກຕ່າງ", "vi": "Xem khác biệt"},
    "allTargets": {"th": "ทุกเป้าหมาย", "zh": "所有目标", "lo": "ທຸກເປົ້າໝາຍ", "vi": "Tất cả mục tiêu"},
    "stats": {"th": "สถิติ", "zh": "统计", "lo": "ສະຖິຕິ", "vi": "Thống kê"},
    "activeAdmins": {"th": "ผู้ดูแลที่ใช้งาน", "zh": "活跃管理员", "lo": "ຜູ້ດູແລໃຊ້ງານ", "vi": "Quản trị viên hoạt động"},
    "last7d": {"th": "7 วันที่ผ่านมา", "zh": "近 7 天", "lo": "7 ມື້ຜ່ານມາ", "vi": "7 ngày qua"},
    "ordersReceived": {"th": "คำสั่งซื้อที่ได้รับ", "zh": "已收订单", "lo": "ຄຳສັ່ງຊື້ທີ່ໄດ້ຮັບ", "vi": "Đơn đã nhận"},
    "webSalesOrders": {"th": "ยอดขายเว็บ", "zh": "网店销售订单", "lo": "ຍອດຂາຍເວັບ", "vi": "Đơn hàng web"},
    "posRevenueInStore": {"th": "รายได้ POS ในร้าน", "zh": "店内 POS 收入", "lo": "ລາຍຮັບ POS ໃນຮ້ານ", "vi": "Doanh thu POS tại cửa hàng"},
    "viewAllWithdrawals": {"th": "ดูการถอนทั้งหมด", "zh": "查看所有提现", "lo": "ເບິ່ງການຖອນທັງໝົດ", "vi": "Xem tất cả rút tiền"},
    "shopCategory": {"th": "หมวดหมู่ร้าน", "zh": "店铺类别", "lo": "ໝວດໝູ່ຮ້ານ", "vi": "Danh mục cửa hàng"},
    "noIncomeWarning": {"th": "ยังไม่มีรายได้", "zh": "暂无收入", "lo": "ຍັງບໍ່ມີລາຍຮັບ", "vi": "Chưa có thu nhập"},
    "bankUpdateError": {"th": "อัปเดตธนาคารไม่สำเร็จ", "zh": "更新银行失败", "lo": "ອັບເດດທະນາຄານລົ້ມເຫຼວ", "vi": "Cập nhật ngân hàng thất bại"},
    "supportingDocument": {"th": "เอกสารประกอบ", "zh": "辅助文件", "lo": "ເອກະສານປະກອບ", "vi": "Tài liệu hỗ trợ"},
    "noDocuments": {"th": "ไม่มีเอกสาร", "zh": "暂无文件", "lo": "ບໍ່ມີເອກະສານ", "vi": "Không có tài liệu"},
    "noKyc": {"th": "ไม่มี KYC", "zh": "暂无 KYC", "lo": "ບໍ່ມີ KYC", "vi": "Không có KYC"},
    "idType": {"th": "ประเภทเอกสาร", "zh": "证件类型", "lo": "ປະເພດເອກະສານ", "vi": "Loại giấy tờ"},
    "publicHint": {"th": "เปิดเผยต่อสาธารณะ", "zh": "公开提示", "lo": "ສະແດງສາທາລະນະ", "vi": "Hiển thị công khai"},
    "settingsCount": {"th": "{{count}} การตั้งค่า", "zh": "{{count}} 项设置", "lo": "{{count}} ການຕັ້ງຄ່າ", "vi": "{{count}} cài đặt"},
    "noSettings": {"th": "ไม่มีการตั้งค่า", "zh": "暂无设置", "lo": "ບໍ່ມີການຕັ້ງຄ່າ", "vi": "Không có cài đặt"},
    "noApplications": {"th": "ไม่มีใบสมัคร", "zh": "暂无申请", "lo": "ບໍ່ມີໃບສະໝັກ", "vi": "Không có đơn"},
    "usersCount": {"th": "{{count}} ผู้ใช้", "zh": "{{count}} 个用户", "lo": "{{count}} ຜູ້ໃຊ້", "vi": "{{count}} người dùng"},
    "shopsCount": {"th": "{{count}} ร้านค้า", "zh": "{{count}} 个店铺", "lo": "{{count}} ຮ້ານຄ້າ", "vi": "{{count}} cửa hàng"},
    "totalBalance": {"th": "ยอดคงเหลือรวม", "zh": "总余额", "lo": "ຍອດຄົງເຫຼືອລວມ", "vi": "Tổng số dư"},
    "exportTitle": {"th": "ส่งออก CSV", "zh": "导出 CSV", "lo": "ສົ່ງອອກ CSV", "vi": "Xuất CSV"},
    "searchPlaceholder": {"th": "ค้นหา...", "zh": "搜索...", "lo": "ຄົ້ນຫາ...", "vi": "Tìm kiếm..."},
    "loadingUsers": {"th": "กำลังโหลดผู้ใช้...", "zh": "正在加载用户...", "lo": "ກຳລັງໂຫຼດຜູ້ໃຊ້...", "vi": "Đang tải người dùng..."},
    "loadingShops": {"th": "กำลังโหลดร้านค้า...", "zh": "正在加载店铺...", "lo": "ກຳລັງໂຫຼດຮ້ານຄ້າ...", "vi": "Đang tải cửa hàng..."},
    "justNow": {"th": "เมื่อสักครู่", "zh": "刚刚", "lo": "ຫາກໍ່ນີ້", "vi": "Vừa xong"},
    "minsAgo": {"th": "{{count}} นาทีที่แล้ว", "zh": "{{count}} 分钟前", "lo": "{{count}} ນາທີຜ່ານມາ", "vi": "{{count}} phút trước"},
    "hoursAgo": {"th": "{{count}} ชั่วโมงที่แล้ว", "zh": "{{count}} 小时前", "lo": "{{count}} ຊົ່ວໂມງຜ່ານມາ", "vi": "{{count}} giờ trước"},
    "daysAgo": {"th": "{{count}} วันที่แล้ว", "zh": "{{count}} 天前", "lo": "{{count}} ມື້ຜ່ານມາ", "vi": "{{count}} ngày trước"},
    "unknownUser": {"th": "ผู้ใช้ไม่รู้จัก", "zh": "未知用户", "lo": "ຜູ້ໃຊ້ບໍ່ຮູ້ຈັກ", "vi": "Người dùng lạ"},
    "ordersCount": {"th": "{{count}} คำสั่งซื้อ", "zh": "{{count}} 个订单", "lo": "{{count}} ຄຳສັ່ງຊື້", "vi": "{{count}} đơn"},
    "needAttention": {"th": "ต้องการความสนใจ", "zh": "需要关注", "lo": "ຕ້ອງການຄວາມສົນໃຈ", "vi": "Cần chú ý"},
    "orderCount": {"th": "{{count}} คำสั่งซื้อ", "zh": "{{count}} 个订单", "lo": "{{count}} ຄຳສັ່ງຊື້", "vi": "{{count}} đơn"},
    "details": {"th": "รายละเอียด", "zh": "详情", "lo": "ລາຍລະອຽດ", "vi": "Chi tiết"},
    "detail": {"th": "รายละเอียด", "zh": "详情", "lo": "ລາຍລະອຽດ", "vi": "Chi tiết"},
    "shopCenter": {"th": "ศูนย์ร้านค้า", "zh": "店铺中心", "lo": "ສູນຮ້ານຄ້າ", "vi": "Trung tâm cửa hàng"},
    "requester": {"th": "ผู้ขอ", "zh": "申请人", "lo": "ຜູ້ຂໍ", "vi": "Người yêu cầu"},
    "toggleFailed": {"th": "เปิด/ปิดไม่สำเร็จ", "zh": "切换失败", "lo": "ສະຫຼັບລົ້ມເຫຼວ", "vi": "Chuyển đổi thất bại"},
    "copyFailed": {"th": "คัดลอกไม่สำเร็จ", "zh": "复制失败", "lo": "ສຳເນົາລົ້ມເຫຼວ", "vi": "Sao chép thất bại"},
    "noInvites": {"th": "ไม่มีคำเชิญ", "zh": "暂无邀请", "lo": "ບໍ່ມີຄຳເຊີນ", "vi": "Không có lời mời"},
    "pendingCount": {"th": "{{count}} รอดำเนินการ", "zh": "{{count}} 待处理", "lo": "{{count}} ລໍຖ້າ", "vi": "{{count}} đang chờ"},
    "copyLink": {"th": "คัดลอกลิงก์", "zh": "复制链接", "lo": "ສຳເນົາລິ້ງ", "vi": "Sao chép liên kết"},
    "noAdmins": {"th": "ไม่มีผู้ดูแล", "zh": "暂无管理员", "lo": "ບໍ່ມີຜູ້ດູແລ", "vi": "Không có quản trị viên"},
    "viewOrders": {"th": "ดูคำสั่งซื้อ", "zh": "查看订单", "lo": "ເບິ່ງຄຳສັ່ງຊື້", "vi": "Xem đơn hàng"},
    "noFinanceAdmin": {"th": "ไม่มีผู้ดูแลการเงิน", "zh": "暂无财务管理员", "lo": "ບໍ່ມີຜູ້ດູແລການເງິນ", "vi": "Không có quản trị tài chính"},
    "finance": {"th": "การเงิน", "zh": "财务", "lo": "ການເງິນ", "vi": "Tài chính"},
    "support": {"th": "ฝ่ายสนับสนุน", "zh": "客服", "lo": "ຝ່າຍຊ່ວຍເຫຼືອ", "vi": "Hỗ trợ"},
    "content": {"th": "คอนเทนต์", "zh": "内容", "lo": "ຄອນເທນ", "vi": "Nội dung"},
    "processed": {"th": "ดำเนินการแล้ว", "zh": "已处理", "lo": "ດຳເນີນການແລ້ວ", "vi": "Đã xử lý"},
    "slug": {"th": "Slug", "zh": "标识", "lo": "Slug", "vi": "Slug"},
    "currentBalance": {"th": "ยอดคงเหลือปัจจุบัน", "zh": "当前余额", "lo": "ຍອດຄົງເຫຼືອປັດຈຸບັນ", "vi": "Số dư hiện tại"},
    "grossRevenue": {"th": "รายได้รวม", "zh": "总收入", "lo": "ລາຍຮັບລວມ", "vi": "Tổng doanh thu"},
    "lifetimeIncome": {"th": "รายได้ตลอดอายุ", "zh": "终身收入", "lo": "ລາຍຮັບຕະຫຼອດອາຍຸ", "vi": "Thu nhập trọn đời"},
    "posRevenue": {"th": "รายได้ POS", "zh": "POS 收入", "lo": "ລາຍຮັບ POS", "vi": "Doanh thu POS"},
}


def translate_segment(seg: str, lang: str) -> str:
    """Look up segment in DICT, fall back to humanized English."""
    if lang == "en":
        return humanize(seg)
    if seg in DICT and lang in DICT[seg]:
        return DICT[seg][lang]
    # Try case-insensitive
    for k, v in DICT.items():
        if k.lower() == seg.lower() and lang in v:
            return v[lang]
    return humanize(seg)


# --- main --------------------------------------------------------------------

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
    # 1. Load en/common.json to get existing keys
    en_data = json.loads((LOCALES / "en/common.json").read_text(encoding="utf-8-sig"))
    existing = set(flatten(en_data).keys())

    # 2. Scan source for all t() calls
    used = set()
    for tsx in list((ROOT / "src/pages").rglob("*.tsx")) + list((ROOT / "src/components").rglob("*.tsx")):
        text = tsx.read_text(encoding="utf-8")
        for m in re.finditer(r"t\(\s*[\'\"]([a-zA-Z0-9_.]+)[\'\"]", text):
            used.add(m.group(1))

    missing = sorted(used - existing)
    # Filter out single-char false positives (loop var t followed by .something)
    missing = [k for k in missing if len(k) > 2 and "." in k]
    print(f"Missing keys: {len(missing)}")

    # 3. Add each missing key to all 5 locale files
    for lang in ["en", "th", "zh", "lo", "vi"]:
        p = LOCALES / lang / "common.json"
        data = json.loads(p.read_text(encoding="utf-8-sig"))
        added = 0
        for key in missing:
            last = key.split(".")[-1]
            value = translate_segment(last, lang)
            # only set if not already present
            try:
                cursor = data
                exists = True
                for part in key.split("."):
                    if isinstance(cursor, dict) and part in cursor:
                        cursor = cursor[part]
                    else:
                        exists = False
                        break
                if exists and isinstance(cursor, str):
                    continue
            except Exception:
                pass
            set_nested(data, key, value)
            added += 1
        p.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"{lang}: added {added} keys")


if __name__ == "__main__":
    main()
