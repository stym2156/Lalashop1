"""Add remaining missing keys to frontend and seller locales."""
import json
from pathlib import Path

ROOT = Path("f:/Lalashop2026")

ADDITIONS = {
    "frontend": {
        "common.currencySymbol": {
            "en": "$", "th": "฿", "zh": "¥", "lo": "₭", "vi": "₫",
        },
        "pages.search.product": {
            "en": "Product", "th": "สินค้า", "zh": "商品",
            "lo": "ສິນຄ້າ", "vi": "Sản phẩm",
        },
        "pages.search.result": {
            "en": "Result", "th": "ผลลัพธ์", "zh": "结果",
            "lo": "ຜົນລັບ", "vi": "Kết quả",
        },
    },
    "seller": {
        "pages.coupons.code": {
            "en": "Coupon code", "th": "รหัสคูปอง", "zh": "优惠券代码",
            "lo": "ລະຫັດບັດສ່ວນຫຼຸດ", "vi": "Mã giảm giá",
        },
        "pages.coupons.titleLabel": {
            "en": "Coupon title", "th": "ชื่อคูปอง", "zh": "优惠券标题",
            "lo": "ຊື່ບັດສ່ວນຫຼຸດ", "vi": "Tên mã giảm giá",
        },
        "pages.coupons.descriptionLabel": {
            "en": "Description", "th": "รายละเอียด", "zh": "描述",
            "lo": "ລາຍລະອຽດ", "vi": "Mô tả",
        },
        "pages.coupons.type": {
            "en": "Discount type", "th": "ประเภทส่วนลด", "zh": "折扣类型",
            "lo": "ປະເພດສ່ວນຫຼຸດ", "vi": "Loại giảm giá",
        },
        "pages.coupons.percent": {
            "en": "Percentage", "th": "เปอร์เซ็นต์", "zh": "百分比",
            "lo": "ເປີເຊັນ", "vi": "Phần trăm",
        },
        "pages.coupons.fixed": {
            "en": "Fixed amount", "th": "จำนวนคงที่", "zh": "固定金额",
            "lo": "ຈຳນວນຄົງທີ່", "vi": "Số tiền cố định",
        },
        "pages.coupons.freeship": {
            "en": "Free shipping", "th": "ส่งฟรี", "zh": "免运费",
            "lo": "ສົ່ງຟຣີ", "vi": "Miễn phí vận chuyển",
        },
        "pages.coupons.value": {
            "en": "Discount value", "th": "มูลค่าส่วนลด", "zh": "折扣值",
            "lo": "ມູນຄ່າສ່ວນຫຼຸດ", "vi": "Giá trị giảm",
        },
        "pages.coupons.maxDiscount": {
            "en": "Maximum discount", "th": "ส่วนลดสูงสุด", "zh": "最高折扣",
            "lo": "ສ່ວນຫຼຸດສູງສຸດ", "vi": "Giảm tối đa",
        },
        "pages.coupons.usageLimitHint": {
            "en": "Total redemptions allowed", "th": "จำนวนครั้งที่ใช้ได้ทั้งหมด",
            "zh": "允许总兑换次数", "lo": "ຈຳນວນຄັ້ງທີ່ໃຊ້ໄດ້ທັງໝົດ",
            "vi": "Số lần đổi tối đa",
        },
        "pages.coupons.startsAt": {
            "en": "Starts at", "th": "เริ่มเมื่อ", "zh": "开始时间",
            "lo": "ເລີ່ມເມື່ອ", "vi": "Bắt đầu",
        },
        "pages.coupons.expiresAt": {
            "en": "Expires at", "th": "หมดอายุเมื่อ", "zh": "过期时间",
            "lo": "ໝົດອາຍຸເມື່ອ", "vi": "Hết hạn",
        },
        "pages.coupons.status": {
            "en": "Status", "th": "สถานะ", "zh": "状态",
            "lo": "ສະຖານະ", "vi": "Trạng thái",
        },
        "pages.coupons.saveChanges": {
            "en": "Save changes", "th": "บันทึกการเปลี่ยนแปลง", "zh": "保存更改",
            "lo": "ບັນທຶກການປ່ຽນແປງ", "vi": "Lưu thay đổi",
        },
        "pages.coupons.saving": {
            "en": "Saving…", "th": "กำลังบันทึก...", "zh": "保存中...",
            "lo": "ກຳລັງບັນທຶກ...", "vi": "Đang lưu...",
        },
        "pages.kyc.verification.failedToLoad": {
            "en": "Failed to load KYC", "th": "โหลด KYC ไม่สำเร็จ",
            "zh": "加载 KYC 失败", "lo": "ໂຫຼດ KYC ລົ້ມເຫຼວ",
            "vi": "Tải KYC thất bại",
        },
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


for service, keys in ADDITIONS.items():
    for lang in ["en", "th", "zh", "lo", "vi"]:
        p = ROOT / f"{service}/src/locales/{lang}/common.json"
        data = json.loads(p.read_text(encoding="utf-8-sig"))
        added = 0
        for key, vals in keys.items():
            if lang in vals:
                set_nested(data, key, vals[lang])
                added += 1
        p.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    print(f"{service}: added {len(keys)} keys across 5 langs")
