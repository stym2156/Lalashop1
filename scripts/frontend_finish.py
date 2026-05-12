"""Add the last batch of new translation keys to frontend locales."""
import json
from pathlib import Path

LOCALES = Path("f:/Lalashop2026/frontend/src/locales")

# Note: keys reused from existing namespaces (e.g., actions.cancel, actions.copy,
# actions.copied, actions.report, pages.creatorAttr2.commission,
# pages.creatorAddToStore2.freeShip, pages.myshopPanel2.freeShip,
# pages.creatorWithdraw2.withdrawalRules, pages.productPage2.{viewShop,buyNow})
# don't need adding — they already exist.

NEW_KEYS = {
    "pages.buy.addMoreUnlock": {
        "en": "Add more to unlock discounts",
        "th": "เพิ่มจำนวนเพื่อปลดล็อกส่วนลด",
        "zh": "再加一些解锁折扣",
        "lo": "ເພີ່ມຈຳນວນເພື່ອປົດລ໋ອກສ່ວນຫຼຸດ",
        "vi": "Thêm để mở ưu đãi giảm giá",
    },
    "pages.transfer.qrUnavailable": {
        "en": "QR unavailable",
        "th": "QR ไม่พร้อมใช้",
        "zh": "QR 不可用",
        "lo": "QR ບໍ່ພ້ອມໃຊ້",
        "vi": "QR không khả dụng",
    },
    "pages.transfer.qrNotUploaded": {
        "en": "QR not uploaded",
        "th": "ยังไม่ได้อัปโหลด QR",
        "zh": "尚未上传 QR",
        "lo": "ຍັງບໍ່ໄດ້ອັບໂຫຼດ QR",
        "vi": "Chưa tải QR lên",
    },
    "pages.transfer.qrFixedWarning": {
        "en": "⚠ This QR is fixed — make sure you transfer the exact total above.",
        "th": "⚠ QR นี้เป็นแบบคงที่ — กรุณาโอนยอดที่แสดงด้านบนให้ถูกต้อง",
        "zh": "⚠ 此 QR 为固定金额 — 请按上方显示的金额准确转账。",
        "lo": "⚠ QR ນີ້ເປັນແບບຄົງທີ່ — ກະລຸນາໂອນຍອດຕາມທີ່ສະແດງດ້ານເທິງໃຫ້ຖືກຕ້ອງ",
        "vi": "⚠ QR này cố định — vui lòng chuyển đúng số tiền ở trên.",
    },
    "pages.creatorWithdraw2.noPending": {
        "en": "No pending withdrawals",
        "th": "ไม่มีการถอนที่รอดำเนินการ",
        "zh": "暂无待处理提现",
        "lo": "ບໍ່ມີການຖອນທີ່ລໍຖ້າ",
        "vi": "Không có giao dịch rút đang chờ",
    },
    "pages.creatorWithdraw2.noHistoryYet": {
        "en": "No history yet",
        "th": "ยังไม่มีประวัติ",
        "zh": "暂无历史",
        "lo": "ຍັງບໍ່ມີປະຫວັດ",
        "vi": "Chưa có lịch sử",
    },
    "pages.openshopStep1.questionHeader": {
        "en": "What type of business do you operate?",
        "th": "ธุรกิจของคุณเป็นประเภทใด?",
        "zh": "您经营的是什么类型的业务?",
        "lo": "ທຸລະກິດຂອງທ່ານເປັນປະເພດໃດ?",
        "vi": "Bạn đang kinh doanh loại hình nào?",
    },
    "pages.openshopStep4.registrationSummary": {
        "en": "Registration Summary",
        "th": "สรุปการสมัคร",
        "zh": "注册摘要",
        "lo": "ສະຫຼຸບການລົງທະບຽນ",
        "vi": "Tóm tắt đăng ký",
    },
    "pages.paymentPanel.addAccount": {
        "en": "Add Account",
        "th": "เพิ่มบัญชี",
        "zh": "添加账户",
        "lo": "ເພີ່ມບັນຊີ",
        "vi": "Thêm tài khoản",
    },
    "pages.productPage2.noSimilarProducts": {
        "en": "No similar products found.",
        "th": "ไม่พบสินค้าใกล้เคียง",
        "zh": "未找到类似商品",
        "lo": "ບໍ່ພົບສິນຄ້າທີ່ໃກ້ຄຽງ",
        "vi": "Không tìm thấy sản phẩm tương tự",
    },
    "pages.productPage2.toCart": {
        "en": "To Cart",
        "th": "ใส่ตะกร้า",
        "zh": "加入购物车",
        "lo": "ໃສ່ກະຕ່າ",
        "vi": "Vào giỏ",
    },
    "pages.publicShop.reportUser": {
        "en": "Report user",
        "th": "รายงานผู้ใช้",
        "zh": "举报用户",
        "lo": "ລາຍງານຜູ້ໃຊ້",
        "vi": "Báo cáo người dùng",
    },
    "pages.publicShop.reportShop": {
        "en": "Report shop",
        "th": "รายงานร้าน",
        "zh": "举报店铺",
        "lo": "ລາຍງານຮ້ານ",
        "vi": "Báo cáo cửa hàng",
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


for lang in ["en", "th", "zh", "lo", "vi"]:
    p = LOCALES / lang / "common.json"
    data = json.loads(p.read_text(encoding="utf-8-sig"))
    n = 0
    for key, vals in NEW_KEYS.items():
        if lang in vals:
            set_nested(data, key, vals[lang])
            n += 1
    p.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{lang}: added {n}")
