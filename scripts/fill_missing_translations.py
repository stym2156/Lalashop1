"""
Fill missing translation keys across all 3 services.

Strategy:
1. Build a global cross-service translation dictionary: {en_value: {lang: value}}
   by scanning all existing translated entries across frontend/Admin/seller.
2. For each missing key in a language, look up its EN value in the dictionary
   and reuse the translation if available.
3. Fall back to a hardcoded translation map for common phrases.
4. Last resort: keep the EN value (so the UI still shows English instead of a
   raw key path — better than nothing).
"""
import json
from pathlib import Path

ROOT = Path("f:/Lalashop2026")
SERVICES = ["frontend", "Admin", "seller"]
LANGS = ["en", "th", "zh", "lo", "vi"]


def flatten(d, prefix=""):
    out = {}
    for k, v in d.items():
        path = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, path))
        else:
            out[path] = v
    return out


def set_nested(data, path, value):
    parts = path.split(".")
    d = data
    for p in parts[:-1]:
        if p not in d or not isinstance(d[p], dict):
            d[p] = {}
        d = d[p]
    d[parts[-1]] = value


# 1. Build cross-service inverse map: {en_value: {lang: value}}
print("Building cross-service translation map…")
inverse: dict[str, dict[str, set[str]]] = {}  # en_value -> {lang -> set of translations}
for service in SERVICES:
    locales = {}
    for lang in LANGS:
        p = ROOT / service / "src/locales" / lang / "common.json"
        if p.exists():
            locales[lang] = flatten(json.loads(p.read_text(encoding="utf-8-sig")))
    if "en" not in locales:
        continue
    en = locales["en"]
    for key, en_val in en.items():
        if not isinstance(en_val, str):
            continue
        for lang in ["th", "zh", "lo", "vi"]:
            if lang not in locales:
                continue
            other = locales[lang].get(key)
            if isinstance(other, str) and other != en_val and other.strip():
                inverse.setdefault(en_val, {}).setdefault(lang, set()).add(other)


def pick_translation(en_val: str, lang: str) -> str | None:
    """Look up a translation in the inverse map. Picks the most-common value."""
    candidates = inverse.get(en_val, {}).get(lang)
    if not candidates:
        return None
    # Return any one (sets are unordered; prefer shortest for consistency)
    return min(candidates, key=len)


# 2. Hardcoded fallback dictionary for common phrases that may not be in any locale
FALLBACK: dict[str, dict[str, str]] = {
    "Confirm payment": {"th": "ยืนยันการชำระเงิน", "zh": "确认付款", "lo": "ຢືນຢັນການຊຳລະ", "vi": "Xác nhận thanh toán"},
    "Confirming…": {"th": "กำลังยืนยัน...", "zh": "确认中...", "lo": "ກຳລັງຢືນຢັນ...", "vi": "Đang xác nhận..."},
    "Take action": {"th": "ดำเนินการ", "zh": "采取行动", "lo": "ດຳເນີນການ", "vi": "Hành động"},
    "View all": {"th": "ดูทั้งหมด", "zh": "查看全部", "lo": "ເບິ່ງທັງໝົດ", "vi": "Xem tất cả"},
    "$": {"th": "฿", "zh": "¥", "lo": "₭", "vi": "₫"},
    # Common UI fragments
    "Loading...": {"th": "กำลังโหลด...", "zh": "加载中...", "lo": "ກຳລັງໂຫຼດ...", "vi": "Đang tải..."},
    "Loading…": {"th": "กำลังโหลด...", "zh": "加载中...", "lo": "ກຳລັງໂຫຼດ...", "vi": "Đang tải..."},
    "total bank records": {"th": "บัญชีธนาคารทั้งหมด", "zh": "银行账户总数", "lo": "ບັນຊີທະນາຄານທັງໝົດ", "vi": "Tổng tài khoản ngân hàng"},
    "last update": {"th": "อัปเดตล่าสุด", "zh": "最近更新", "lo": "ອັບເດດຫຼ້າສຸດ", "vi": "Cập nhật gần nhất"},
    "verified": {"th": "ยืนยันแล้ว", "zh": "已验证", "lo": "ຢືນຢັນແລ້ວ", "vi": "Đã xác minh"},
    "unverified": {"th": "ยังไม่ยืนยัน", "zh": "未验证", "lo": "ຍັງບໍ່ຢືນຢັນ", "vi": "Chưa xác minh"},
    "user": {"th": "ผู้ใช้", "zh": "用户", "lo": "ຜູ້ໃຊ້", "vi": "Người dùng"},
    "bank": {"th": "ธนาคาร", "zh": "银行", "lo": "ທະນາຄານ", "vi": "Ngân hàng"},
    "account": {"th": "เลขบัญชี", "zh": "账号", "lo": "ເລກບັນຊີ", "vi": "Số tài khoản"},
    "holder name": {"th": "ชื่อเจ้าของ", "zh": "户名", "lo": "ຊື່ເຈົ້າຂອງ", "vi": "Tên chủ tài khoản"},
    "last updated": {"th": "อัปเดตล่าสุด", "zh": "最近更新", "lo": "ອັບເດດຫຼ້າສຸດ", "vi": "Cập nhật gần nhất"},
    "No bank records": {"th": "ไม่มีข้อมูลธนาคาร", "zh": "暂无银行记录", "lo": "ບໍ່ມີຂໍ້ມູນທະນາຄານ", "vi": "Không có bản ghi ngân hàng"},
    "Source-of-funds breakdown — paid orders by payment method": {
        "th": "แหล่งที่มาของเงิน — คำสั่งซื้อที่ชำระแล้ว แยกตามวิธีชำระ",
        "zh": "资金来源细分 — 已付订单按付款方式",
        "lo": "ແຫຼ່ງທີ່ມາຂອງເງິນ — ຄຳສັ່ງຊື້ທີ່ຊຳລະແລ້ວ ແຍກຕາມວິທີຊຳລະ",
        "vi": "Phân tích nguồn tiền — đơn hàng đã thanh toán theo phương thức",
    },
    "No deposit sources yet": {"th": "ยังไม่มีแหล่งฝากเงิน", "zh": "暂无存款来源", "lo": "ຍັງບໍ່ມີແຫຼ່ງເງິນຝາກ", "vi": "Chưa có nguồn nạp"},
    "Orders": {"th": "คำสั่งซื้อ", "zh": "订单数", "lo": "ຄຳສັ່ງຊື້", "vi": "Đơn hàng"},
    "Payment Method": {"th": "วิธีชำระเงิน", "zh": "付款方式", "lo": "ວິທີຊຳລະ", "vi": "Phương thức"},
    "% of Total": {"th": "% ของทั้งหมด", "zh": "占比 %", "lo": "% ຂອງທັງໝົດ", "vi": "% tổng"},
    "Total (₭)": {"th": "ยอดรวม (₭)", "zh": "总额 (₭)", "lo": "ລວມ (₭)", "vi": "Tổng (₭)"},
    "Unknown": {"th": "ไม่ทราบ", "zh": "未知", "lo": "ບໍ່ຊາບ", "vi": "Không rõ"},
    "linked accounts": {"th": "บัญชีที่เชื่อมต่อ", "zh": "已关联账户", "lo": "ບັນຊີທີ່ເຊື່ອມຕໍ່", "vi": "Tài khoản liên kết"},
    "No linked accounts": {"th": "ไม่มีบัญชีที่เชื่อมต่อ", "zh": "暂无关联账户", "lo": "ບໍ່ມີບັນຊີທີ່ເຊື່ອມຕໍ່", "vi": "Chưa có tài khoản liên kết"},
    "none": {"th": "ไม่มี", "zh": "无", "lo": "ບໍ່ມີ", "vi": "Không có"},
    "Email": {"th": "อีเมล", "zh": "邮箱", "lo": "ອີເມວ", "vi": "Email"},
    "Linked Providers": {"th": "ผู้ให้บริการที่เชื่อม", "zh": "已关联服务", "lo": "ຜູ້ໃຫ້ບໍລິການທີ່ເຊື່ອມ", "vi": "Nhà cung cấp đã liên kết"},
    "User": {"th": "ผู้ใช้", "zh": "用户", "lo": "ຜູ້ໃຊ້", "vi": "Người dùng"},
    "Additional Documents": {"th": "เอกสารเพิ่มเติม", "zh": "其他文件", "lo": "ເອກະສານເພີ່ມເຕີມ", "vi": "Tài liệu bổ sung"},
    "Apartment": {"th": "อพาร์ตเมนต์", "zh": "公寓", "lo": "ອາພາດເມັນ", "vi": "Căn hộ"},
    "Business Information": {"th": "ข้อมูลธุรกิจ", "zh": "业务信息", "lo": "ຂໍ້ມູນທຸລະກິດ", "vi": "Thông tin kinh doanh"},
    "City": {"th": "เมือง", "zh": "城市", "lo": "ເມືອງ", "vi": "Thành phố"},
    "Country": {"th": "ประเทศ", "zh": "国家", "lo": "ປະເທດ", "vi": "Quốc gia"},
    "Decision": {"th": "การตัดสิน", "zh": "决定", "lo": "ການຕັດສິນ", "vi": "Quyết định"},
    "Description (sent to user)": {"th": "คำอธิบาย (ส่งถึงผู้ใช้)", "zh": "说明 (发送给用户)", "lo": "ຄຳອະທິບາຍ (ສົ່ງຫາຜູ້ໃຊ້)", "vi": "Mô tả (gửi cho người dùng)"},
    "Email Verified": {"th": "อีเมลยืนยันแล้ว", "zh": "邮箱已验证", "lo": "ອີເມວຍືນຍັນແລ້ວ", "vi": "Email đã xác minh"},
    "Entity Name": {"th": "ชื่อนิติบุคคล", "zh": "实体名称", "lo": "ຊື່ນິຕິບຸກຄົນ", "vi": "Tên pháp nhân"},
    "Failed to load submission": {"th": "โหลดข้อมูลไม่สำเร็จ", "zh": "加载提交失败", "lo": "ໂຫຼດການສົ່ງລົ້ມເຫຼວ", "vi": "Tải nộp đơn thất bại"},
    "ID Number": {"th": "เลขเอกสาร", "zh": "证件号码", "lo": "ເລກເອກະສານ", "vi": "Số giấy tờ"},
    "ID Type": {"th": "ประเภทเอกสาร", "zh": "证件类型", "lo": "ປະເພດເອກະສານ", "vi": "Loại giấy tờ"},
    "National ID": {"th": "บัตรประชาชน", "zh": "身份证", "lo": "ບັດປະຈຳຕົວ", "vi": "CMND/CCCD"},
    "Passport": {"th": "หนังสือเดินทาง", "zh": "护照", "lo": "ໜັງສືຜ່ານແດນ", "vi": "Hộ chiếu"},
    "Role": {"th": "บทบาท", "zh": "角色", "lo": "ບົດບາດ", "vi": "Vai trò"},
    "Invitation sent": {"th": "ส่งคำเชิญแล้ว", "zh": "邀请已发送", "lo": "ສົ່ງຄຳເຊີນແລ້ວ", "vi": "Đã gửi lời mời"},
    "Title / Content": {"th": "หัวข้อ / เนื้อหา", "zh": "标题 / 内容", "lo": "ຫົວຂໍ້ / ເນື້ອຫາ", "vi": "Tiêu đề / Nội dung"},
    "Order": {"th": "คำสั่งซื้อ", "zh": "订单", "lo": "ຄຳສັ່ງຊື້", "vi": "Đơn hàng"},
    "Promotion": {"th": "โปรโมชัน", "zh": "促销", "lo": "ໂປຣໂມຊັນ", "vi": "Khuyến mãi"},
    "System": {"th": "ระบบ", "zh": "系统", "lo": "ລະບົບ", "vi": "Hệ thống"},
    "Withdrawal": {"th": "การถอนเงิน", "zh": "提现", "lo": "ການຖອນເງິນ", "vi": "Rút tiền"},
    "Loading reports...": {"th": "กำลังโหลดรายงาน...", "zh": "正在加载举报...", "lo": "ກຳລັງໂຫຼດລາຍງານ...", "vi": "Đang tải báo cáo..."},
    "No description": {"th": "ไม่มีคำอธิบาย", "zh": "无说明", "lo": "ບໍ່ມີຄຳອະທິບາຍ", "vi": "Không có mô tả"},
    "No open reports": {"th": "ไม่มีรายงานที่เปิด", "zh": "暂无未处理举报", "lo": "ບໍ່ມີລາຍງານທີ່ເປີດ", "vi": "Không có báo cáo mở"},
    "Reports awaiting review will appear here": {
        "th": "รายงานที่รอการตรวจจะแสดงที่นี่",
        "zh": "等待审核的举报将显示在这里",
        "lo": "ລາຍງານທີ່ລໍຖ້າການກວດສອບຈະສະແດງຢູ່ນີ້",
        "vi": "Báo cáo chờ xem xét sẽ hiển thị ở đây",
    },
    "on {{target}}": {"th": "บน {{target}}", "zh": "针对 {{target}}", "lo": "ໃນ {{target}}", "vi": "trên {{target}}"},
    "{{count}} open report awaiting review": {
        "th": "{{count}} รายงานรอการตรวจสอบ",
        "zh": "{{count}} 个待审核的举报",
        "lo": "{{count}} ລາຍງານລໍຖ້າການກວດ",
        "vi": "{{count}} báo cáo chờ xem xét",
    },
    "{{count}} open reports awaiting review": {
        "th": "{{count}} รายงานรอการตรวจสอบ",
        "zh": "{{count}} 个待审核的举报",
        "lo": "{{count}} ລາຍງານລໍຖ້າການກວດ",
        "vi": "{{count}} báo cáo chờ xem xét",
    },
    "Reported by {{name}}": {"th": "รายงานโดย {{name}}", "zh": "{{name}} 举报", "lo": "ລາຍງານໂດຍ {{name}}", "vi": "Báo cáo bởi {{name}}"},
    "Abuse": {"th": "ใช้ในทางที่ผิด", "zh": "滥用", "lo": "ການລະເມີດ", "vi": "Lạm dụng"},
    "Counterfeit": {"th": "ของปลอม", "zh": "假冒", "lo": "ຂອງປອມ", "vi": "Hàng giả"},
    "Fraud": {"th": "ฉ้อโกง", "zh": "欺诈", "lo": "ການສໍ້ໂກງ", "vi": "Gian lận"},
    "Harassment": {"th": "การคุกคาม", "zh": "骚扰", "lo": "ການລ່ວງລະເມີດ", "vi": "Quấy rối"},
    "Other": {"th": "อื่นๆ", "zh": "其他", "lo": "ອື່ນໆ", "vi": "Khác"},
    "Spam": {"th": "สแปม", "zh": "垃圾信息", "lo": "ສະແປມ", "vi": "Spam"},
    "Category name": {"th": "ชื่อหมวดหมู่", "zh": "分类名称", "lo": "ຊື່ໝວດໝູ່", "vi": "Tên danh mục"},
    "Date": {"th": "วันที่", "zh": "日期", "lo": "ວັນທີ", "vi": "Ngày"},
    "Description": {"th": "คำอธิบาย", "zh": "描述", "lo": "ຄຳອະທິບາຍ", "vi": "Mô tả"},
    "Note": {"th": "หมายเหตุ", "zh": "备注", "lo": "ໝາຍເຫດ", "vi": "Ghi chú"},
    "Read status": {"th": "สถานะการอ่าน", "zh": "阅读状态", "lo": "ສະຖານະການອ່ານ", "vi": "Trạng thái đọc"},
    "Recipient": {"th": "ผู้รับ", "zh": "收件人", "lo": "ຜູ້ຮັບ", "vi": "Người nhận"},
    "Sent": {"th": "ส่งแล้ว", "zh": "已发送", "lo": "ສົ່ງແລ້ວ", "vi": "Đã gửi"},
    "Target": {"th": "เป้าหมาย", "zh": "目标", "lo": "ເປົ້າໝາຍ", "vi": "Mục tiêu"},
    "Title": {"th": "หัวข้อ", "zh": "标题", "lo": "ຫົວຂໍ້", "vi": "Tiêu đề"},
    "Withdraw ID": {"th": "รหัสถอน", "zh": "提现编号", "lo": "ໄອດີຖອນ", "vi": "Mã rút"},
    "Bank account": {"th": "บัญชีธนาคาร", "zh": "银行账户", "lo": "ບັນຊີທະນາຄານ", "vi": "Tài khoản ngân hàng"},
    "Slug": {"th": "Slug", "zh": "标识", "lo": "Slug", "vi": "Slug"},
    "Admin IP": {"th": "IP ผู้ดูแล", "zh": "管理员 IP", "lo": "IP ຜູ້ດູແລ", "vi": "IP quản trị"},
    "Audit ID": {"th": "รหัสตรวจสอบ", "zh": "审计编号", "lo": "ໄອດີກວດສອບ", "vi": "Mã kiểm toán"},
    "Detail": {"th": "รายละเอียด", "zh": "详情", "lo": "ລາຍລະອຽດ", "vi": "Chi tiết"},
    "Enabled": {"th": "เปิดใช้งาน", "zh": "已启用", "lo": "ເປີດໃຊ້", "vi": "Đã bật"},
    "Disabled": {"th": "ปิดใช้งาน", "zh": "已禁用", "lo": "ປິດໃຊ້", "vi": "Đã tắt"},
    "Not Issued": {"th": "ยังไม่ออก", "zh": "未发放", "lo": "ຍັງບໍ່ອອກ", "vi": "Chưa cấp"},
    "Not Set": {"th": "ยังไม่ตั้งค่า", "zh": "未设置", "lo": "ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ", "vi": "Chưa thiết lập"},
    "Processed": {"th": "ดำเนินการแล้ว", "zh": "已处理", "lo": "ດຳເນີນການແລ້ວ", "vi": "Đã xử lý"},
    "Read": {"th": "อ่านแล้ว", "zh": "已读", "lo": "ອ່ານແລ້ວ", "vi": "Đã đọc"},
    "Saved": {"th": "บันทึกแล้ว", "zh": "已保存", "lo": "ບັນທຶກແລ້ວ", "vi": "Đã lưu"},
    "Settled": {"th": "ชำระแล้ว", "zh": "已结算", "lo": "ຊຳລະແລ້ວ", "vi": "Đã thanh toán"},
    "Unread": {"th": "ยังไม่อ่าน", "zh": "未读", "lo": "ຍັງບໍ່ໄດ້ອ່ານ", "vi": "Chưa đọc"},
    "Delete failed": {"th": "ลบไม่สำเร็จ", "zh": "删除失败", "lo": "ລຶບລົ້ມເຫຼວ", "vi": "Xóa thất bại"},
    "Move down": {"th": "เลื่อนลง", "zh": "下移", "lo": "ເລື່ອນລົງ", "vi": "Chuyển xuống"},
    "Move up": {"th": "เลื่อนขึ้น", "zh": "上移", "lo": "ເລື່ອນຂຶ້ນ", "vi": "Chuyển lên"},
    "Reorder failed": {"th": "เรียงลำดับไม่สำเร็จ", "zh": "重排失败", "lo": "ຮຽງໃໝ່ບໍ່ສຳເລັດ", "vi": "Sắp xếp thất bại"},
    "Resend": {"th": "ส่งอีกครั้ง", "zh": "重新发送", "lo": "ສົ່ງອີກຄັ້ງ", "vi": "Gửi lại"},
    "Revoke": {"th": "เพิกถอน", "zh": "撤销", "lo": "ຍົກເລີກ", "vi": "Thu hồi"},
    "Save changes": {"th": "บันทึกการเปลี่ยนแปลง", "zh": "保存更改", "lo": "ບັນທຶກການປ່ຽນແປງ", "vi": "Lưu thay đổi"},
    "Save failed": {"th": "บันทึกไม่สำเร็จ", "zh": "保存失败", "lo": "ບັນທຶກລົ້ມເຫຼວ", "vi": "Lưu thất bại"},
    "Toggle failed": {"th": "เปิด/ปิดไม่สำเร็จ", "zh": "切换失败", "lo": "ສະຫຼັບລົ້ມເຫຼວ", "vi": "Chuyển đổi thất bại"},
    "Shop center": {"th": "ศูนย์ร้านค้า", "zh": "店铺中心", "lo": "ສູນຮ້ານຄ້າ", "vi": "Trung tâm cửa hàng"},
}


def fill(service: str) -> dict[str, int]:
    p_en = ROOT / service / "src/locales/en/common.json"
    en = flatten(json.loads(p_en.read_text(encoding="utf-8-sig")))
    counts: dict[str, int] = {}

    for lang in ["th", "zh", "lo", "vi"]:
        p = ROOT / service / "src/locales" / lang / "common.json"
        data = json.loads(p.read_text(encoding="utf-8-sig"))
        flat = flatten(data)
        missing = sorted(set(en.keys()) - set(flat.keys()))
        added = 0
        used_inverse = 0
        used_fallback = 0
        used_en = 0
        for key in missing:
            en_val = en[key]
            if not isinstance(en_val, str):
                continue
            translated = None
            if en_val in FALLBACK and lang in FALLBACK[en_val]:
                translated = FALLBACK[en_val][lang]
                used_fallback += 1
            else:
                t = pick_translation(en_val, lang)
                if t:
                    translated = t
                    used_inverse += 1
                else:
                    translated = en_val
                    used_en += 1
            set_nested(data, key, translated)
            added += 1
        p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        counts[lang] = added
        print(f"  {service} {lang}: +{added} (inverse={used_inverse} fallback={used_fallback} en={used_en})")
    return counts


print("\nFilling missing translations…")
for s in SERVICES:
    fill(s)
print("\nDone.")
