"""
Add translation keys for product category data (productCategories.ts + categoryFields.ts).

Strategy:
- Add `pages.productCategories.{value}` for the 16 dropdown labels (frontend + seller)
- Add `pages.categoryConfig.{value}.label` / `.description` for CATEGORY_CONFIG
- Add `pages.categoryConfig.{value}.variants.{name}` for variant axis names
- Add `pages.categoryConfig.{value}.attributes.{key}` for attribute labels

Common attribute keys (Material, Brand, Fit, Gender, etc.) get top-level keys so
they can be reused across categories.
"""
import json
from pathlib import Path

ROOTS = {
    "frontend": Path("f:/Lalashop2026/frontend/src/locales"),
    "seller":   Path("f:/Lalashop2026/seller/src/locales"),
}

# 16 product categories — dropdown labels
PRODUCT_CATEGORIES = {
    "fashion": {
        "en": "Fashion & Accessories", "th": "แฟชั่นและเครื่องประดับ",
        "zh": "时尚配饰", "lo": "ແຟຊັນ ແລະ ເຄື່ອງປະດັບ",
        "vi": "Thời trang & Phụ kiện",
    },
    "electronics": {
        "en": "Electronics & Gadgets", "th": "อิเล็กทรอนิกส์",
        "zh": "电子产品", "lo": "ເຄື່ອງໃຊ້ໄຟຟ້າ", "vi": "Điện tử",
    },
    "beauty": {
        "en": "Beauty & Personal Care", "th": "ความงามและของใช้ส่วนตัว",
        "zh": "美妆个护", "lo": "ຄວາມງາມ ແລະ ຂອງໃຊ້ສ່ວນຕົວ",
        "vi": "Làm đẹp & Chăm sóc cá nhân",
    },
    "food": {
        "en": "Food & Beverages", "th": "อาหารและเครื่องดื่ม",
        "zh": "食品饮料", "lo": "ອາຫານ ແລະ ເຄື່ອງດື່ມ",
        "vi": "Thực phẩm & Đồ uống",
    },
    "home": {
        "en": "Home & Living", "th": "บ้านและของใช้ในบ้าน",
        "zh": "家居生活", "lo": "ບ້ານ ແລະ ການດຳລົງຊີວິດ",
        "vi": "Nhà cửa & Đời sống",
    },
    "mother_baby": {
        "en": "Mother & Baby", "th": "แม่และเด็ก",
        "zh": "母婴", "lo": "ແມ່ ແລະ ເດັກ", "vi": "Mẹ & Bé",
    },
    "toys": {
        "en": "Toys & Hobbies", "th": "ของเล่นและงานอดิเรก",
        "zh": "玩具与爱好", "lo": "ຂອງຫຼິ້ນ ແລະ ງານອະດິເລກ",
        "vi": "Đồ chơi & Sở thích",
    },
    "sports": {
        "en": "Sports & Outdoors", "th": "กีฬาและกิจกรรมกลางแจ้ง",
        "zh": "运动户外", "lo": "ກິລາ ແລະ ກິດຈະກຳກາງແຈ້ງ",
        "vi": "Thể thao & Ngoài trời",
    },
    "automotive": {
        "en": "Automotive", "th": "ยานยนต์",
        "zh": "汽车配件", "lo": "ຍານພາຫະນະ", "vi": "Ô tô",
    },
    "health": {
        "en": "Health & Wellness", "th": "สุขภาพและความเป็นอยู่ดี",
        "zh": "健康养生", "lo": "ສຸຂະພາບ ແລະ ການເບິ່ງແຍງ",
        "vi": "Sức khỏe & Chăm sóc",
    },
    "pet": {
        "en": "Pet Supplies", "th": "สัตว์เลี้ยง",
        "zh": "宠物用品", "lo": "ສັດລ້ຽງ", "vi": "Vật nuôi",
    },
    "office": {
        "en": "Office & Stationery", "th": "สำนักงานและเครื่องเขียน",
        "zh": "办公文具", "lo": "ສຳນັກງານ ແລະ ເຄື່ອງຂຽນ",
        "vi": "Văn phòng & Văn phòng phẩm",
    },
    "tools": {
        "en": "Tools & Home Improvement", "th": "เครื่องมือและของใช้ในบ้าน",
        "zh": "工具与家居改造", "lo": "ເຄື່ອງມື ແລະ ການປັບປຸງບ້ານ",
        "vi": "Dụng cụ & Cải tạo nhà",
    },
    "jewelry": {
        "en": "Jewelry & Watches", "th": "เครื่องประดับและนาฬิกา",
        "zh": "珠宝手表", "lo": "ເຄື່ອງປະດັບ ແລະ ໂມງ",
        "vi": "Trang sức & Đồng hồ",
    },
    "digital": {
        "en": "Digital Products", "th": "สินค้าดิจิทัล",
        "zh": "数字产品", "lo": "ສິນຄ້າດິຈິຕອນ", "vi": "Sản phẩm số",
    },
    "others": {
        "en": "Others", "th": "อื่นๆ", "zh": "其他", "lo": "ອື່ນໆ", "vi": "Khác",
    },
}

# Category-config descriptions
CATEGORY_DESCRIPTIONS = {
    "fashion": {
        "en": "Clothing, shoes, bags, accessories. Buyers pick a size and color before ordering.",
        "th": "เสื้อผ้า รองเท้า กระเป๋า เครื่องประดับ ผู้ซื้อเลือกไซส์และสีก่อนสั่งซื้อ",
        "zh": "服装、鞋子、包包、配饰。买家在下单前选择尺码和颜色。",
        "lo": "ເຄື່ອງນຸ່ງ ເກີບ ກະເປົາ ເຄື່ອງປະດັບ. ຜູ້ຊື້ເລືອກຂະໜາດ ແລະ ສີກ່ອນສັ່ງຊື້.",
        "vi": "Quần áo, giày, túi, phụ kiện. Người mua chọn size và màu trước khi đặt.",
    },
    "electronics": {
        "en": "Tech products. Variants typically capture color, storage, and connectivity.",
        "th": "สินค้าเทคโนโลยี ตัวเลือกมักเป็นสี ความจุ และการเชื่อมต่อ",
        "zh": "科技产品。规格通常包括颜色、存储和连接方式。",
        "lo": "ສິນຄ້າເທັກໂນໂລຊີ. ຕົວເລືອກມັກເປັນສີ, ຄວາມຈຸ ແລະ ການເຊື່ອມຕໍ່.",
        "vi": "Sản phẩm công nghệ. Biến thể thường gồm màu, bộ nhớ, kết nối.",
    },
    "beauty": {
        "en": "Skincare, makeup, fragrance. Variants describe shade and net weight.",
        "th": "ผลิตภัณฑ์ความงาม เครื่องสำอาง น้ำหอม ตัวเลือกบรรยายเฉดสีและขนาด",
        "zh": "护肤、彩妆、香水。规格描述色调和净重。",
        "lo": "ຜະລິດຕະພັນຄວາມງາມ, ເຄື່ອງສຳອາງ, ນ້ຳຫອມ. ຕົວເລືອກບອກສີ ແລະ ນ້ຳໜັກ.",
        "vi": "Chăm sóc da, trang điểm, nước hoa. Biến thể mô tả màu và trọng lượng.",
    },
    "food": {
        "en": "Edible goods. Capture pack size and expiry — required for compliance.",
        "th": "อาหารและเครื่องดื่ม ระบุขนาดและวันหมดอายุ — จำเป็นต่อการปฏิบัติตามข้อกำหนด",
        "zh": "食品。需记录包装规格和保质期——合规必填。",
        "lo": "ອາຫານ ແລະ ເຄື່ອງດື່ມ. ລະບຸຂະໜາດແພັກ ແລະ ວັນໝົດອາຍຸ — ຈຳເປັນ.",
        "vi": "Thực phẩm. Ghi kích cỡ gói và hạn dùng — bắt buộc tuân thủ.",
    },
    "home": {
        "en": "Furniture, décor, kitchenware. Capture material and dimensions.",
        "th": "เฟอร์นิเจอร์ ของตกแต่ง เครื่องครัว ระบุวัสดุและขนาด",
        "zh": "家具、装饰、厨具。需记录材质和尺寸。",
        "lo": "ເຟີນິເຈີ, ການຕົກແຕ່ງ, ເຄື່ອງເຮືອນຄົວ. ລະບຸວັດສະດຸ ແລະ ຂະໜາດ.",
        "vi": "Nội thất, trang trí, đồ bếp. Ghi vật liệu và kích thước.",
    },
    "mother_baby": {
        "en": "Baby products. Variant on age range, capture safety info.",
        "th": "ผลิตภัณฑ์เด็ก ตัวเลือกตามช่วงอายุ ระบุข้อมูลด้านความปลอดภัย",
        "zh": "婴儿用品。按年龄段分类,记录安全信息。",
        "lo": "ຜະລິດຕະພັນເດັກ. ຕົວເລືອກຕາມຊ່ວງອາຍຸ, ລະບຸຂໍ້ມູນຄວາມປອດໄພ.",
        "vi": "Sản phẩm cho bé. Biến thể theo độ tuổi, ghi thông tin an toàn.",
    },
    "toys": {
        "en": "Toys, models, hobbies. Variant on color, capture age range.",
        "th": "ของเล่น โมเดล งานอดิเรก ตัวเลือกตามสี ระบุช่วงอายุ",
        "zh": "玩具、模型、爱好。按颜色分类,记录适用年龄。",
        "lo": "ຂອງຫຼິ້ນ, ໂມເດວ, ງານອະດິເລກ. ຕົວເລືອກຕາມສີ, ລະບຸຊ່ວງອາຍຸ.",
        "vi": "Đồ chơi, mô hình, sở thích. Biến thể theo màu, ghi độ tuổi.",
    },
    "sports": {
        "en": "Sports gear. Variant on size and color, capture sport.",
        "th": "อุปกรณ์กีฬา ตัวเลือกตามขนาดและสี ระบุประเภทกีฬา",
        "zh": "运动装备。按尺码和颜色分类,记录运动类型。",
        "lo": "ອຸປະກອນກິລາ. ຕົວເລືອກຕາມຂະໜາດ ແລະ ສີ, ລະບຸປະເພດກິລາ.",
        "vi": "Dụng cụ thể thao. Biến thể theo size và màu, ghi môn thể thao.",
    },
    "automotive": {
        "en": "Car & moto parts. Capture compatibility info.",
        "th": "อะไหล่รถยนต์และมอเตอร์ไซค์ ระบุข้อมูลความเข้ากันได้",
        "zh": "汽车与摩托车配件。需记录兼容信息。",
        "lo": "ອາໄຫຼ່ລົດ ແລະ ມໍເຕີໄຊ. ລະບຸຂໍ້ມູນຄວາມເຂົ້າກັນໄດ້.",
        "vi": "Phụ tùng ô tô & xe máy. Ghi thông tin tương thích.",
    },
    "health": {
        "en": "Vitamins, supplements, medical aids. Variant on pack count.",
        "th": "วิตามิน อาหารเสริม อุปกรณ์การแพทย์ ตัวเลือกตามจำนวนแพ็ค",
        "zh": "维生素、补充剂、医疗用品。按包装数量分类。",
        "lo": "ວິຕາມິນ, ອາຫານເສີມ, ອຸປະກອນທາງການແພດ. ຕົວເລືອກຕາມຈຳນວນແພັກ.",
        "vi": "Vitamin, thực phẩm bổ sung, dụng cụ y tế. Biến thể theo số lượng.",
    },
    "pet": {
        "en": "Pet food, accessories. Variant on size, capture pet type.",
        "th": "อาหารและของใช้สัตว์เลี้ยง ตัวเลือกตามขนาด ระบุประเภทสัตว์",
        "zh": "宠物食品、配件。按尺寸分类,记录宠物类型。",
        "lo": "ອາຫານສັດລ້ຽງ, ເຄື່ອງປະກອບ. ຕົວເລືອກຕາມຂະໜາດ, ລະບຸປະເພດສັດ.",
        "vi": "Thức ăn, phụ kiện vật nuôi. Biến thể theo size, ghi loại vật nuôi.",
    },
    "office": {
        "en": "Stationery, office supplies. Variant on color and pack quantity.",
        "th": "เครื่องเขียนและของใช้สำนักงาน ตัวเลือกตามสีและจำนวนแพ็ค",
        "zh": "文具、办公用品。按颜色和包装数量分类。",
        "lo": "ເຄື່ອງຂຽນ, ເຄື່ອງໃຊ້ສຳນັກງານ. ຕົວເລືອກຕາມສີ ແລະ ຈຳນວນແພັກ.",
        "vi": "Văn phòng phẩm. Biến thể theo màu và số lượng gói.",
    },
    "tools": {
        "en": "Hand tools, power tools, hardware. Capture power source.",
        "th": "เครื่องมือช่าง เครื่องมือไฟฟ้า อุปกรณ์ฮาร์ดแวร์ ระบุแหล่งพลังงาน",
        "zh": "手工具、电动工具、五金。需记录电源类型。",
        "lo": "ເຄື່ອງມືມື, ເຄື່ອງມືໄຟຟ້າ, ຮາດແວ. ລະບຸແຫຼ່ງພະລັງງານ.",
        "vi": "Dụng cụ cầm tay, máy điện, phần cứng. Ghi nguồn điện.",
    },
    "jewelry": {
        "en": "Jewelry & watches. Variant on metal, gemstone, ring size.",
        "th": "เครื่องประดับและนาฬิกา ตัวเลือกตามโลหะ อัญมณี และไซส์แหวน",
        "zh": "珠宝与手表。按金属、宝石、戒指尺寸分类。",
        "lo": "ເຄື່ອງປະດັບ ແລະ ໂມງ. ຕົວເລືອກຕາມໂລຫະ, ແກ້ວ, ຂະໜາດແຫວນ.",
        "vi": "Trang sức & đồng hồ. Biến thể theo kim loại, đá quý, size nhẫn.",
    },
    "digital": {
        "en": "Software, e-books, licenses. No physical variants needed.",
        "th": "ซอฟต์แวร์ อีบุ๊ก ไลเซนส์ ไม่ต้องระบุตัวเลือกทางกายภาพ",
        "zh": "软件、电子书、许可证。无需实物规格。",
        "lo": "ຊອບແວ, ປຶ້ມອີເລັກໂທຣນິກ, ໃບອະນຸຍາດ. ບໍ່ຕ້ອງມີຕົວເລືອກທາງກາຍະພາບ.",
        "vi": "Phần mềm, ebook, giấy phép. Không cần biến thể vật lý.",
    },
    "others": {
        "en": "Catch-all for anything not covered above.",
        "th": "หมวดสำหรับสินค้าอื่นๆ ที่ไม่อยู่ในรายการข้างบน",
        "zh": "上述未涵盖的其他商品。",
        "lo": "ສຳລັບສິນຄ້າອື່ນໆ ທີ່ບໍ່ໄດ້ກວມລ້ວມຂ້າງເທິງ.",
        "vi": "Danh mục cho mọi mặt hàng không thuộc danh mục trên.",
    },
}

# Variant axis names (cross-category reusable)
VARIANT_NAMES = {
    "Size":         {"th": "ขนาด",    "zh": "尺码",   "lo": "ຂະໜາດ",       "vi": "Kích cỡ"},
    "Color":        {"th": "สี",      "zh": "颜色",   "lo": "ສີ",          "vi": "Màu"},
    "Storage":      {"th": "ความจุ",  "zh": "存储",   "lo": "ຄວາມຈຸ",      "vi": "Bộ nhớ"},
    "Connectivity": {"th": "การเชื่อมต่อ", "zh": "连接", "lo": "ການເຊື່ອມຕໍ່", "vi": "Kết nối"},
    "Volume":       {"th": "ปริมาณ",  "zh": "容量",   "lo": "ປະລິມານ",     "vi": "Dung tích"},
    "Shade":        {"th": "เฉดสี",   "zh": "色号",   "lo": "ເຉດສີ",       "vi": "Tông màu"},
    "Pack Size":    {"th": "ขนาดแพ็ค","zh": "包装规格","lo": "ຂະໜາດແພັກ",    "vi": "Kích cỡ gói"},
    "Flavor":       {"th": "รสชาติ",  "zh": "口味",   "lo": "ລົດຊາດ",      "vi": "Hương vị"},
    "Age Range":    {"th": "ช่วงอายุ","zh": "年龄段", "lo": "ຊ່ວງອາຍຸ",     "vi": "Độ tuổi"},
    "Pet Size":     {"th": "ขนาดสัตว์เลี้ยง","zh":"宠物尺寸","lo":"ຂະໜາດສັດລ້ຽງ","vi":"Kích cỡ vật nuôi"},
    "Pack":         {"th": "แพ็ค",    "zh": "包装",   "lo": "ແພັກ",        "vi": "Gói"},
    "Voltage":      {"th": "แรงดันไฟ","zh": "电压",   "lo": "ແຮງດັນໄຟ",     "vi": "Điện áp"},
    "Metal":        {"th": "โลหะ",    "zh": "金属",   "lo": "ໂລຫະ",        "vi": "Kim loại"},
    "Ring Size":    {"th": "ไซส์แหวน","zh": "戒指尺寸","lo": "ຂະໜາດແຫວນ",   "vi": "Size nhẫn"},
    "License":      {"th": "ไลเซนส์", "zh": "许可证", "lo": "ໃບອະນຸຍາດ",   "vi": "Giấy phép"},
}

# Attribute labels (cross-category reusable)
ATTRIBUTE_LABELS = {
    "Material":             {"th": "วัสดุ",            "zh": "材质",       "lo": "ວັດສະດຸ",        "vi": "Chất liệu"},
    "Fit":                  {"th": "ทรง",              "zh": "版型",       "lo": "ຮູບແບບ",          "vi": "Phom dáng"},
    "Gender":               {"th": "เพศ",              "zh": "性别",       "lo": "ເພດ",            "vi": "Giới tính"},
    "Care instructions":    {"th": "วิธีดูแล",         "zh": "护理说明",   "lo": "ການເບິ່ງແຍງ",    "vi": "Hướng dẫn bảo quản"},
    "Brand":                {"th": "แบรนด์",           "zh": "品牌",       "lo": "ຍີ່ຫໍ້",          "vi": "Thương hiệu"},
    "Model number":         {"th": "หมายเลขรุ่น",      "zh": "型号",       "lo": "ເລກລຸ້ນ",         "vi": "Số model"},
    "Warranty period":      {"th": "ระยะเวลารับประกัน","zh": "保修期",     "lo": "ໄລຍະຮັບປະກັນ",     "vi": "Thời hạn bảo hành"},
    "Power source":         {"th": "แหล่งพลังงาน",     "zh": "电源类型",   "lo": "ແຫຼ່ງພະລັງງານ",   "vi": "Nguồn điện"},
    "Key specifications":   {"th": "ข้อมูลจำเพาะหลัก", "zh": "主要规格",   "lo": "ສະເປັກສຳຄັນ",     "vi": "Thông số chính"},
    "Skin type":            {"th": "ประเภทผิว",        "zh": "肤质",       "lo": "ປະເພດຜິວ",        "vi": "Loại da"},
    "Key ingredients":      {"th": "ส่วนผสมหลัก",      "zh": "主要成分",   "lo": "ສ່ວນປະກອບຫຼັກ",   "vi": "Thành phần chính"},
    "Expiry / PAO":         {"th": "วันหมดอายุ / PAO", "zh": "保质期 / PAO","lo":"ວັນໝົດອາຍຸ / PAO", "vi": "Hạn dùng / PAO"},
    "Cruelty-free?":        {"th": "ไม่ทดลองในสัตว์?", "zh": "无动物实验?",  "lo":"ບໍ່ທົດລອງສັດ?",    "vi": "Không thử trên động vật?"},
    "Ingredients":          {"th": "ส่วนผสม",          "zh": "成分",       "lo": "ສ່ວນປະກອບ",      "vi": "Thành phần"},
    "Expiry date":          {"th": "วันหมดอายุ",       "zh": "保质期",     "lo": "ວັນໝົດອາຍຸ",      "vi": "Hạn sử dụng"},
    "Storage instructions": {"th": "วิธีเก็บรักษา",    "zh": "存储说明",   "lo": "ການເກັບຮັກສາ",   "vi": "Hướng dẫn bảo quản"},
    "Dietary":              {"th": "ข้อมูลโภชนาการ",  "zh": "饮食要求",   "lo": "ຂໍ້ມູນດ້ານອາຫານ", "vi": "Chế độ ăn"},
    "Allergen warnings":    {"th": "คำเตือนสารก่อภูมิแพ้","zh": "过敏原警告","lo":"ຄຳເຕືອນສານກໍ່ພູມແພ້","vi": "Cảnh báo dị ứng"},
    "Suitable room":        {"th": "ห้องที่เหมาะ",     "zh": "适用房间",   "lo": "ຫ້ອງທີ່ເໝາະ",     "vi": "Phòng phù hợp"},
    "Assembly required?":   {"th": "ต้องประกอบ?",      "zh": "需要组装?",  "lo": "ຕ້ອງປະກອບ?",     "vi": "Cần lắp ráp?"},
    "Recommended age":      {"th": "อายุที่แนะนำ",     "zh": "推荐年龄",   "lo": "ອາຍຸທີ່ແນະນຳ",    "vi": "Tuổi khuyến nghị"},
    "Safety certification": {"th": "การรับรองความปลอดภัย","zh":"安全认证","lo":"ການຮັບຮອງຄວາມປອດໄພ","vi":"Chứng nhận an toàn"},
    "Battery required?":    {"th": "ใช้แบตเตอรี่?",    "zh": "需要电池?",  "lo": "ໃຊ້ແບັດເຕີຣີ?",   "vi": "Cần pin?"},
    "Sport / activity":     {"th": "กีฬา / กิจกรรม",   "zh": "运动 / 活动","lo": "ກິລາ / ກິດຈະກຳ", "vi": "Môn thể thao / Hoạt động"},
    "Vehicle compatibility":{"th": "ความเข้ากันได้ของรถ","zh":"车辆兼容性","lo":"ຄວາມເຂົ້າກັນຂອງລົດ","vi":"Tương thích xe"},
    "Part number / OEM":    {"th": "เลขชิ้นส่วน / OEM","zh": "零件号 / OEM","lo":"ເລກອາໄຫຼ່ / OEM",  "vi": "Mã số / OEM"},
    "Active ingredients":   {"th": "ส่วนประกอบสำคัญ",  "zh": "活性成分",   "lo": "ສ່ວນປະກອບສຳຄັນ",  "vi": "Hoạt chất"},
    "Recommended dosage":   {"th": "ขนาดยาที่แนะนำ",   "zh": "推荐用量",   "lo": "ປະລິມານທີ່ແນະນຳ",  "vi": "Liều khuyến nghị"},
    "FDA / regulatory certification": {"th": "อย. / การรับรอง", "zh":"FDA / 监管认证","lo":"FDA / ການຮັບຮອງ","vi":"FDA / chứng nhận pháp lý"},
    "Pet type":             {"th": "ประเภทสัตว์เลี้ยง","zh": "宠物类型",   "lo": "ປະເພດສັດລ້ຽງ",    "vi": "Loại vật nuôi"},
    "Use case":             {"th": "การใช้งาน",        "zh": "使用场景",   "lo": "ກໍລະນີໃຊ້",       "vi": "Trường hợp dùng"},
    "Warranty":             {"th": "การรับประกัน",     "zh": "保修",       "lo": "ການຮັບປະກັນ",     "vi": "Bảo hành"},
    "Metal purity":         {"th": "ความบริสุทธิ์โลหะ","zh": "金属纯度",   "lo": "ຄວາມບໍລິສຸດໂລຫະ",  "vi": "Độ tinh khiết kim loại"},
    "Gemstone":             {"th": "อัญมณี",           "zh": "宝石",       "lo": "ແກ້ວ",            "vi": "Đá quý"},
    "Weight (g)":           {"th": "น้ำหนัก (กรัม)",  "zh": "重量 (g)",   "lo": "ນ້ຳໜັກ (g)",      "vi": "Trọng lượng (g)"},
    "Warranty / certificate":{"th": "ใบรับประกัน",    "zh": "保修 / 证书","lo": "ການຮັບປະກັນ / ໃບຢັ້ງຢືນ","vi":"Bảo hành / chứng chỉ"},
    "File type":            {"th": "ประเภทไฟล์",       "zh": "文件类型",   "lo": "ປະເພດໄຟລ໌",       "vi": "Loại tệp"},
    "Delivery method":      {"th": "วิธีการส่งมอบ",    "zh": "交付方式",   "lo": "ວິທີສົ່ງມອບ",     "vi": "Cách giao hàng"},
    "License duration":     {"th": "ระยะเวลาไลเซนส์",  "zh": "许可时长",   "lo": "ໄລຍະໃບອະນຸຍາດ",   "vi": "Thời hạn giấy phép"},
    "Additional details":   {"th": "รายละเอียดเพิ่มเติม","zh": "其他详情","lo": "ລາຍລະອຽດເພີ່ມເຕີມ","vi": "Chi tiết thêm"},
}


def set_nested(data: dict, path: str, value: str) -> None:
    parts = path.split(".")
    d = data
    for p in parts[:-1]:
        if p not in d or not isinstance(d[p], dict):
            d[p] = {}
        d = d[p]
    d[parts[-1]] = value


for service, root in ROOTS.items():
    print(f"\n=== {service} ===")
    for lang in ["en", "th", "zh", "lo", "vi"]:
        p = root / lang / "common.json"
        data = json.loads(p.read_text(encoding="utf-8-sig"))
        n = 0
        # productCategories.{value} (16 keys)
        for val, locs in PRODUCT_CATEGORIES.items():
            set_nested(data, f"pages.productCategories.{val}", locs[lang])
            n += 1
        # categoryConfig.{value}.label
        for val, locs in PRODUCT_CATEGORIES.items():
            set_nested(data, f"pages.categoryConfig.{val}.label", locs[lang])
            n += 1
        # categoryConfig.{value}.description
        for val, locs in CATEGORY_DESCRIPTIONS.items():
            set_nested(data, f"pages.categoryConfig.{val}.description", locs[lang])
            n += 1
        # variantNames.{name}
        for name, locs in VARIANT_NAMES.items():
            translated = locs[lang] if lang != "en" else name
            slug = name.lower().replace(" ", "_").replace("/", "_")
            set_nested(data, f"pages.variantNames.{slug}", translated)
            n += 1
        # attributeLabels.{key}
        for label, locs in ATTRIBUTE_LABELS.items():
            translated = locs[lang] if lang != "en" else label
            # use a snake-ish slug for label
            slug = label.lower().replace(" ", "_").replace("?", "").replace("/", "_").replace("(", "").replace(")", "").replace("-","_").strip("_")
            set_nested(data, f"pages.attributeLabels.{slug}", translated)
            n += 1
        p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"  {lang}: +{n}")
