"""Final i18n pass — add all new keys needed by the most-recent frontend edits.

Usage:
    python scripts/i18n_final_pass.py

Idempotent: re-running just overwrites existing keys with the same translations.
"""
import json
from pathlib import Path

LOCALES = ['en', 'th', 'zh', 'lo', 'vi']
ROOT = Path(__file__).parent.parent / 'frontend' / 'src' / 'locales'


def set_nested(d, path, value):
    parts = path.split('.')
    for k in parts[:-1]:
        if k not in d or not isinstance(d[k], dict):
            d[k] = {}
        d = d[k]
    d[parts[-1]] = value


# Truly new keys not already in locale files (post manual additions for receipt + chat).
NEW = {
    # ProductPage.tsx
    'pages.productPage2.bangkokLocation': {
        'en': 'Bangkok, Thailand', 'th': 'กรุงเทพฯ ประเทศไทย',
        'zh': '泰国曼谷', 'lo': 'ບາງກອກ, ປະເທດໄທ', 'vi': 'Bangkok, Thái Lan'
    },
    'pages.productPage2.businessDays37': {
        'en': '3–7 Business Days', 'th': '3–7 วันทำการ',
        'zh': '3–7 个工作日', 'lo': '3–7 ວັນລັດຖະການ', 'vi': '3–7 ngày làm việc'
    },
    'pages.productPage2.promoAlt': {
        'en': '{{name}} promo {{index}}', 'th': '{{name}} โปร {{index}}',
        'zh': '{{name}} 推广 {{index}}', 'lo': '{{name}} ໂປຣ {{index}}',
        'vi': '{{name}} khuyến mãi {{index}}'
    },

    # ProductTabs.tsx
    'pages.productTabs.dimensions': {
        'en': 'Dimensions', 'th': 'ขนาด', 'zh': '尺寸',
        'lo': 'ຂະໜາດ', 'vi': 'Kích thước'
    },
    'pages.productTabs.weight': {
        'en': 'Weight', 'th': 'น้ำหนัก', 'zh': '重量',
        'lo': 'ນ້ຳໜັກ', 'vi': 'Trọng lượng'
    },
    'pages.productTabs.thisMonth': {
        'en': 'This month', 'th': 'เดือนนี้', 'zh': '本月',
        'lo': 'ເດືອນນີ້', 'vi': 'Tháng này'
    },
    'pages.productTabs.monthSuffix': {
        'en': '{{count}} month', 'th': '{{count}} เดือน',
        'zh': '{{count}} 个月', 'lo': '{{count}} ເດືອນ', 'vi': '{{count}} tháng'
    },
    'pages.productTabs.monthsSuffix': {
        'en': '{{count}} months', 'th': '{{count}} เดือน',
        'zh': '{{count}} 个月', 'lo': '{{count}} ເດືອນ', 'vi': '{{count}} tháng'
    },
    'pages.productTabs.yearSuffix': {
        'en': '{{count}} year', 'th': '{{count}} ปี',
        'zh': '{{count}} 年', 'lo': '{{count}} ປີ', 'vi': '{{count}} năm'
    },
    'pages.productTabs.yearsSuffix': {
        'en': '{{count}} years', 'th': '{{count}} ปี',
        'zh': '{{count}} 年', 'lo': '{{count}} ປີ', 'vi': '{{count}} năm'
    },
    'pages.productTabs.activeOn': {
        'en': 'Active On Lalashop', 'th': 'ใช้งานบน Lalashop',
        'zh': '在 Lalashop 活跃', 'lo': 'ໃຊ້ງານໃນ Lalashop',
        'vi': 'Hoạt động trên Lalashop'
    },
    'pages.productTabs.productsListed': {
        'en': 'Products Listed', 'th': 'รายการสินค้า',
        'zh': '已上架产品', 'lo': 'ສິນຄ້າທີ່ລົງຂາຍ', 'vi': 'Sản phẩm đã đăng'
    },
    'pages.productTabs.ordersFulfilled': {
        'en': 'Orders Fulfilled', 'th': 'คำสั่งซื้อที่ส่งเสร็จ',
        'zh': '已完成订单', 'lo': 'ສັ່ງຊື້ສຳເລັດ', 'vi': 'Đơn hoàn tất'
    },
    'pages.productTabs.followersCount': {
        'en': 'Followers', 'th': 'ผู้ติดตาม',
        'zh': '关注者', 'lo': 'ຜູ້ຕິດຕາມ', 'vi': 'Người theo dõi'
    },
    'pages.productTabs.noSpecsYet': {
        'en': "The seller hasn't added detailed specifications yet.",
        'th': 'ผู้ขายยังไม่ได้เพิ่มข้อมูลจำเพาะโดยละเอียด',
        'zh': '卖家尚未添加详细规格。',
        'lo': 'ຜູ້ຂາຍຍັງບໍ່ໄດ້ເພີ່ມຂໍ້ມູນລະອຽດ',
        'vi': 'Người bán chưa thêm thông số chi tiết.'
    },
    'pages.productTabs.noDescYet': {
        'en': "The seller hasn't added a description for this product yet.",
        'th': 'ผู้ขายยังไม่ได้เพิ่มคำอธิบายสำหรับสินค้านี้',
        'zh': '卖家尚未为此产品添加描述。',
        'lo': 'ຜູ້ຂາຍຍັງບໍ່ໄດ້ເພີ່ມຄຳອະທິບາຍຂອງສິນຄ້ານີ້',
        'vi': 'Người bán chưa thêm mô tả cho sản phẩm này.'
    },
    'pages.productTabs.freeShippingFeature': {
        'en': 'Free shipping', 'th': 'จัดส่งฟรี',
        'zh': '免运费', 'lo': 'ສົ່ງຟຣີ', 'vi': 'Miễn phí vận chuyển'
    },
    'pages.productTabs.dayReturns': {
        'en': '{{days}}-day returns', 'th': 'คืนสินค้าได้ {{days}} วัน',
        'zh': '{{days}} 天可退', 'lo': 'ຄືນສິນຄ້າໄດ້ {{days}} ວັນ',
        'vi': 'Đổi trả trong {{days}} ngày'
    },
    'pages.productTabs.shipsInSingle': {
        'en': 'Ships in {{min}} {{unit}}',
        'th': 'จัดส่งใน {{min}} {{unit}}',
        'zh': '{{min}} {{unit}}内发货',
        'lo': 'ສົ່ງໃນ {{min}} {{unit}}',
        'vi': 'Gửi trong {{min}} {{unit}}'
    },
    'pages.productTabs.shipsInRange': {
        'en': 'Ships in {{min}}–{{max}} {{unit}}',
        'th': 'จัดส่งใน {{min}}–{{max}} {{unit}}',
        'zh': '{{min}}–{{max}} {{unit}}内发货',
        'lo': 'ສົ່ງໃນ {{min}}–{{max}} {{unit}}',
        'vi': 'Gửi trong {{min}}–{{max}} {{unit}}'
    },
    'pages.productTabs.unitHours': {
        'en': 'h', 'th': 'ชม.', 'zh': '小时', 'lo': 'ຊມ.', 'vi': 'giờ'
    },
    'pages.productTabs.unitDays': {
        'en': 'days', 'th': 'วัน', 'zh': '天', 'lo': 'ວັນ', 'vi': 'ngày'
    },
    'pages.productTabs.unitWeeks': {
        'en': 'wks', 'th': 'สัปดาห์', 'zh': '周', 'lo': 'ອາທິດ', 'vi': 'tuần'
    },
    'pages.productTabs.madeIn': {
        'en': 'Made in {{country}}', 'th': 'ผลิตใน {{country}}',
        'zh': '产自 {{country}}', 'lo': 'ຜະລິດໃນ {{country}}',
        'vi': 'Sản xuất tại {{country}}'
    },
    'pages.productTabs.bulkPricingAvail': {
        'en': 'Bulk pricing available', 'th': 'มีราคาขายส่ง',
        'zh': '提供批发价', 'lo': 'ມີລາຄາຂາຍສົ່ງ', 'vi': 'Có giá sỉ'
    },
    'pages.productTabs.pleaseLogin': {
        'en': 'Please log in to leave a review.',
        'th': 'กรุณาเข้าสู่ระบบเพื่อเขียนรีวิว',
        'zh': '请登录后再评价。',
        'lo': 'ກະລຸນາເຂົ້າສູ່ລະບົບເພື່ອຂຽນຄຳວິຈານ',
        'vi': 'Vui lòng đăng nhập để đánh giá.'
    },
    'pages.productTabs.pickRatingFirst': {
        'en': 'Pick a star rating first.', 'th': 'เลือกจำนวนดาวก่อน',
        'zh': '请先选择星级。', 'lo': 'ກະລຸນາເລືອກດາວກ່ອນ',
        'vi': 'Hãy chọn số sao trước.'
    },
    'pages.productTabs.failedSubmitReview': {
        'en': 'Failed to submit review', 'th': 'ส่งรีวิวไม่สำเร็จ',
        'zh': '提交评价失败', 'lo': 'ສົ່ງຄຳວິຈານບໍ່ສຳເລັດ',
        'vi': 'Gửi đánh giá thất bại'
    },
    'pages.productTabs.shareExperience': {
        'en': 'SHARE YOUR EXPERIENCE', 'th': 'แบ่งปันประสบการณ์',
        'zh': '分享您的体验', 'lo': 'ແບ່ງປັນປະສົບການ',
        'vi': 'CHIA SẺ TRẢI NGHIỆM'
    },
    'pages.productTabs.rateProduct': {
        'en': 'Rate product', 'th': 'รีวิวสินค้า',
        'zh': '评价产品', 'lo': 'ປະເມີນສິນຄ້າ', 'vi': 'Đánh giá sản phẩm'
    },
    'pages.productTabs.rateShop': {
        'en': 'Rate shop', 'th': 'รีวิวร้านค้า',
        'zh': '评价店铺', 'lo': 'ປະເມີນຮ້ານຄ້າ', 'vi': 'Đánh giá cửa hàng'
    },
    'pages.productTabs.rateNStars': {
        'en': 'Rate {{n}} stars', 'th': 'ให้ {{n}} ดาว',
        'zh': '评 {{n}} 星', 'lo': 'ໃຫ້ {{n}} ດາວ', 'vi': 'Đánh giá {{n}} sao'
    },
    'pages.productTabs.reviewTextarea': {
        'en': 'Tell other buyers what you liked, fit, quality, packaging…',
        'th': 'บอกผู้ซื้อคนอื่นว่าคุณชอบอะไร ขนาด คุณภาพ บรรจุภัณฑ์…',
        'zh': '告诉其他买家您喜欢什么、尺寸、质量、包装…',
        'lo': 'ບອກຜູ້ຊື້ຄົນອື່ນວ່າທ່ານມັກຫຍັງ, ຂະໜາດ, ຄຸນນະພາບ, ບັນຈຸພັນ…',
        'vi': 'Hãy chia sẻ với người mua khác về cảm nhận, độ vừa, chất lượng, đóng gói…'
    },
    'pages.productTabs.posting': {
        'en': 'Posting…', 'th': 'กำลังโพสต์…', 'zh': '发布中…',
        'lo': 'ກຳລັງໂພສ…', 'vi': 'Đang đăng…'
    },
    'pages.productTabs.postReview': {
        'en': 'review', 'th': 'รีวิว', 'zh': '评价',
        'lo': 'ຄຳວິຈານ', 'vi': 'đánh giá'
    },
    'pages.productTabs.loadingReviews': {
        'en': 'Loading reviews…', 'th': 'กำลังโหลดรีวิว…',
        'zh': '加载评价中…', 'lo': 'ກຳລັງໂຫລດຄຳວິຈານ…',
        'vi': 'Đang tải đánh giá…'
    },
    'pages.productTabs.noReviewsYet': {
        'en': 'No reviews yet — be the first to review this product.',
        'th': 'ยังไม่มีรีวิว — เป็นคนแรกที่รีวิวสินค้านี้',
        'zh': '暂无评价 — 成为第一个评价此产品的人。',
        'lo': 'ຍັງບໍ່ມີຄຳວິຈານ — ເປັນຄົນທຳອິດທີ່ປະເມີນສິນຄ້ານີ້',
        'vi': 'Chưa có đánh giá — hãy là người đầu tiên đánh giá sản phẩm này.'
    },
    'pages.productTabs.anonymousUser': {
        'en': 'Anonymous', 'th': 'ไม่ระบุชื่อ', 'zh': '匿名用户',
        'lo': 'ບໍ່ລະບຸຊື່', 'vi': 'Ẩn danh'
    },
    'pages.productTabs.noCommentText': {
        'en': '(no comment)', 'th': '(ไม่มีความคิดเห็น)',
        'zh': '（无评论）', 'lo': '(ບໍ່ມີຄຳເຫັນ)', 'vi': '(không có nhận xét)'
    },
    'pages.productTabs.userPlaceholder': {
        'en': 'User', 'th': 'ผู้ใช้', 'zh': '用户',
        'lo': 'ຜູ້ໃຊ້', 'vi': 'Người dùng'
    },

    # Truck.tsx
    'components.truck.backToHome': {
        'en': 'Back to Home', 'th': 'กลับสู่หน้าหลัก',
        'zh': '返回首页', 'lo': 'ກັບໄປໜ້າຫຼັກ', 'vi': 'Về trang chủ'
    },
    'components.truck.globalLogisticsNetwork': {
        'en': 'Global Logistics Network', 'th': 'เครือข่ายโลจิสติกส์ระดับโลก',
        'zh': '全球物流网络', 'lo': 'ເຄືອຂ່າຍໂລຈິສຕິກໂລກ',
        'vi': 'Mạng lưới Logistics toàn cầu'
    },
    'components.truck.heroTitlePart1': {
        'en': 'Fast. Secure.', 'th': 'รวดเร็ว ปลอดภัย',
        'zh': '快速。安全。', 'lo': 'ໄວ ປອດໄພ', 'vi': 'Nhanh. An toàn.'
    },
    'components.truck.heroTitleReliable': {
        'en': 'Reliable', 'th': 'น่าเชื่อถือ',
        'zh': '可靠', 'lo': 'ໜ້າເຊື່ອຖື', 'vi': 'Đáng tin cậy'
    },
    'components.truck.heroTitlePart2': {
        'en': 'Distribution.', 'th': 'การกระจายสินค้า',
        'zh': '分销。', 'lo': 'ການກະຈາຍສິນຄ້າ', 'vi': 'Phân phối.'
    },
    'components.truck.heroSubtitle': {
        'en': 'Connect your business to the world through our high-performance fulfillment centers.',
        'th': 'เชื่อมต่อธุรกิจของคุณสู่ระดับโลกผ่านศูนย์กระจายสินค้าประสิทธิภาพสูง',
        'zh': '通过我们的高性能履约中心，将您的业务连接到世界。',
        'lo': 'ເຊື່ອມຕໍ່ທຸລະກິດຂອງທ່ານກັບໂລກຜ່ານສູນຄຸ້ມຄອງສິນຄ້າປະສິດທິພາບສູງ',
        'vi': 'Kết nối doanh nghiệp của bạn với thế giới qua các trung tâm hoàn tất đơn hàng hiệu suất cao.'
    },
    'components.truck.exploreHub': {
        'en': 'Explore Hub', 'th': 'สำรวจฮับ',
        'zh': '探索枢纽', 'lo': 'ສຳຫຼວດສູນ', 'vi': 'Khám phá Hub'
    },
    'components.truck.protection': {
        'en': 'Protection', 'th': 'การปกป้อง',
        'zh': '保护', 'lo': 'ການປົກປ້ອງ', 'vi': 'Bảo vệ'
    },
    'components.truck.tradeAssurance': {
        'en': 'Trade Assurance', 'th': 'การรับประกันการค้า',
        'zh': '贸易保障', 'lo': 'ການຮັບປະກັນການຄ້າ', 'vi': 'Đảm bảo giao dịch'
    },
    'components.truck.tradeAssuranceDesc': {
        'en': 'Every order distributed through our network is covered by our proprietary shield, protecting your global trade interests.',
        'th': 'ทุกคำสั่งซื้อที่กระจายผ่านเครือข่ายของเรามีโล่ป้องกัน ปกป้องผลประโยชน์การค้าทั่วโลกของคุณ',
        'zh': '通过我们网络分销的每一个订单都受到我们专有屏障的保护，守护您的全球贸易利益。',
        'lo': 'ທຸກຄຳສັ່ງຊື້ທີ່ກະຈາຍຜ່ານເຄືອຂ່າຍຂອງເຮົາໄດ້ຮັບການປົກປ້ອງ ປ້ອງກັນຜົນປະໂຫຍດການຄ້າທົ່ວໂລກ',
        'vi': 'Mọi đơn hàng phân phối qua mạng lưới của chúng tôi đều được bảo vệ bởi lá chắn độc quyền, bảo vệ lợi ích thương mại toàn cầu của bạn.'
    },
    'components.truck.paymentProtection': {
        'en': '100% Payment Protection', 'th': 'รับประกันการชำระเงิน 100%',
        'zh': '100% 付款保护', 'lo': 'ປ້ອງກັນການຊຳລະເງິນ 100%',
        'vi': 'Bảo vệ thanh toán 100%'
    },
    'components.truck.qualitySafeguard': {
        'en': 'Product Quality Safeguard', 'th': 'รับประกันคุณภาพสินค้า',
        'zh': '产品质量保障', 'lo': 'ການຮັບປະກັນຄຸນນະພາບສິນຄ້າ',
        'vi': 'Đảm bảo chất lượng sản phẩm'
    },
    'components.truck.onTimeShipment': {
        'en': 'On-time Shipment Guarantee', 'th': 'รับประกันการจัดส่งตรงเวลา',
        'zh': '准时发货保障', 'lo': 'ການຮັບປະກັນສົ່ງສິນຄ້າຕາມເວລາ',
        'vi': 'Đảm bảo giao hàng đúng hẹn'
    },
    'components.truck.liveNetworkStatus': {
        'en': 'Live Network Status', 'th': 'สถานะเครือข่ายแบบเรียลไทม์',
        'zh': '实时网络状态', 'lo': 'ສະຖານະເຄືອຂ່າຍສົດ',
        'vi': 'Trạng thái mạng lưới trực tiếp'
    },
    'components.truck.operational': {
        'en': 'Operational', 'th': 'ใช้งานได้',
        'zh': '运行中', 'lo': 'ໃຊ້ງານໄດ້', 'vi': 'Đang hoạt động'
    },
    'components.truck.europeanHub': {
        'en': 'European Hub', 'th': 'ฮับยุโรป',
        'zh': '欧洲枢纽', 'lo': 'ສູນຢູໂຣບ', 'vi': 'Trung tâm châu Âu'
    },
    'components.truck.aseanHub': {
        'en': 'ASEAN Hub', 'th': 'ฮับอาเซียน',
        'zh': '东盟枢纽', 'lo': 'ສູນອາຊຽນ', 'vi': 'Trung tâm ASEAN'
    },
    'components.truck.naHub': {
        'en': 'NA Hub', 'th': 'ฮับอเมริกาเหนือ',
        'zh': '北美枢纽', 'lo': 'ສູນອາເມລິກາເໜືອ', 'vi': 'Trung tâm Bắc Mỹ'
    },
    'components.truck.countryGermany': {
        'en': 'Germany', 'th': 'เยอรมนี', 'zh': '德国', 'lo': 'ເຢຍລະມັນ', 'vi': 'Đức'
    },
    'components.truck.countryThailand': {
        'en': 'Thailand', 'th': 'ไทย', 'zh': '泰国', 'lo': 'ໄທ', 'vi': 'Thái Lan'
    },
    'components.truck.countryUsa': {
        'en': 'USA', 'th': 'สหรัฐอเมริกา', 'zh': '美国',
        'lo': 'ສະຫະລັດອາເມລິກາ', 'vi': 'Mỹ'
    },
    'components.truck.warehouseSourcing': {
        'en': 'Warehouse Sourcing', 'th': 'การจัดหาคลังสินค้า',
        'zh': '仓储采购', 'lo': 'ການຈັດຫາສາງສິນຄ້າ', 'vi': 'Tìm nguồn kho'
    },
    'components.truck.warehouseSourcingDesc': {
        'en': 'Stock at any of our global warehouses',
        'th': 'สต็อกที่คลังสินค้าทั่วโลกของเรา',
        'zh': '在我们的全球仓库中存储',
        'lo': 'ເກັບໄວ້ໃນສາງສິນຄ້າທົ່ວໂລກຂອງເຮົາ',
        'vi': 'Lưu trữ tại các kho toàn cầu của chúng tôi'
    },
    'components.truck.pickPack': {
        'en': 'Pick & Pack', 'th': 'หยิบและบรรจุ',
        'zh': '拣货与包装', 'lo': 'ເລືອກ ແລະ ບັນຈຸ', 'vi': 'Chọn & Đóng gói'
    },
    'components.truck.pickPackDesc': {
        'en': 'Standardized packing and labeling',
        'th': 'การบรรจุและติดฉลากตามมาตรฐาน',
        'zh': '标准化包装和贴标',
        'lo': 'ການບັນຈຸ ແລະ ຕິດສະຫຼາກມາດຕະຖານ',
        'vi': 'Đóng gói và dán nhãn tiêu chuẩn'
    },
    'components.truck.localDelivery': {
        'en': 'Local Delivery', 'th': 'การจัดส่งในพื้นที่',
        'zh': '本地配送', 'lo': 'ການສົ່ງໃນທ້ອງຖິ່ນ', 'vi': 'Giao hàng địa phương'
    },
    'components.truck.localDeliveryDesc': {
        'en': 'Last-mile delivery partners integrated',
        'th': 'พันธมิตรจัดส่งระยะสุดท้ายแบบบูรณาการ',
        'zh': '集成最后一公里配送合作伙伴',
        'lo': 'ຮ່ວມມືກັບຄູ່ຮ່ວມສົ່ງສິນຄ້າສຸດທ້າຍ',
        'vi': 'Tích hợp đối tác giao hàng chặng cuối'
    },
    'components.truck.bangkokHub': {
        'en': 'Bangkok Hub', 'th': 'ฮับกรุงเทพ',
        'zh': '曼谷枢纽', 'lo': 'ສູນບາງກອກ', 'vi': 'Trung tâm Bangkok'
    },
    'components.truck.bangkokHubSub': {
        'en': 'Processing Time: 2h Avg', 'th': 'เวลาดำเนินการ: เฉลี่ย 2 ชม.',
        'zh': '处理时间：平均 2 小时', 'lo': 'ເວລາດຳເນີນການ: ສະເລ່ຍ 2 ຊມ.',
        'vi': 'Thời gian xử lý: trung bình 2 giờ'
    },
    'components.truck.networkLoad': {
        'en': 'Network Load', 'th': 'โหลดเครือข่าย',
        'zh': '网络负载', 'lo': 'ການໂຫລດເຄືອຂ່າຍ', 'vi': 'Tải mạng lưới'
    },
    'components.truck.networkLoadSub': {
        'en': '92% Delivery Success', 'th': 'อัตราการจัดส่งสำเร็จ 92%',
        'zh': '92% 配送成功率', 'lo': 'ສຳເລັດການສົ່ງ 92%',
        'vi': 'Tỷ lệ giao thành công 92%'
    },
    'components.truck.transitStatus': {
        'en': 'Transit Status', 'th': 'สถานะการขนส่ง',
        'zh': '运输状态', 'lo': 'ສະຖານະການຂົນສົ່ງ', 'vi': 'Trạng thái vận chuyển'
    },
    'components.truck.transitStatusSub': {
        'en': 'All Routes Normal', 'th': 'เส้นทางทั้งหมดปกติ',
        'zh': '所有路线正常', 'lo': 'ເສັ້ນທາງທັງໝົດປົກກະຕິ',
        'vi': 'Tất cả tuyến đường bình thường'
    },

    # me/products/add.tsx (productsAdd2 extensions)
    'pages.productsAdd2.materialDefault': {
        'en': 'Material', 'th': 'วัสดุ', 'zh': '材质', 'lo': 'ວັດສະດຸ', 'vi': 'Chất liệu'
    },
    'pages.productsAdd2.warrantyDefault': {
        'en': 'Warranty', 'th': 'การรับประกัน', 'zh': '保修',
        'lo': 'ການຮັບປະກັນ', 'vi': 'Bảo hành'
    },
    'pages.productsAdd2.tierAll': {
        'en': 'All approved creators', 'th': 'ครีเอเตอร์ที่ได้รับอนุมัติทั้งหมด',
        'zh': '所有已批准的创作者', 'lo': 'ຄຣີເອເຕີທີ່ໄດ້ຮັບອະນຸມັດທັງໝົດ',
        'vi': 'Tất cả nhà sáng tạo được duyệt'
    },
    'pages.productsAdd2.tierBronze': {
        'en': 'Bronze and above', 'th': 'บรอนซ์ขึ้นไป',
        'zh': '青铜及以上', 'lo': 'ບຣອນສ໌ ແລະ ສູງກວ່າ', 'vi': 'Đồng trở lên'
    },
    'pages.productsAdd2.tierSilver': {
        'en': 'Silver and above', 'th': 'ซิลเวอร์ขึ้นไป',
        'zh': '白银及以上', 'lo': 'ເງິນ ແລະ ສູງກວ່າ', 'vi': 'Bạc trở lên'
    },
    'pages.productsAdd2.tierGold': {
        'en': 'Gold only', 'th': 'โกลด์เท่านั้น', 'zh': '仅黄金',
        'lo': 'ທອງເທົ່ານັ້ນ', 'vi': 'Chỉ Vàng'
    },

    # transfer.tsx
    'pages.transfer.bankLabel': {
        'en': 'Bank', 'th': 'ธนาคาร', 'zh': '银行', 'lo': 'ທະນາຄານ', 'vi': 'Ngân hàng'
    },
    'pages.transfer.accountNumberLabel': {
        'en': 'Account number', 'th': 'เลขที่บัญชี',
        'zh': '账号', 'lo': 'ເລກບັນຊີ', 'vi': 'Số tài khoản'
    },
    'pages.transfer.accountNameLabel': {
        'en': 'Account name', 'th': 'ชื่อบัญชี',
        'zh': '账户名', 'lo': 'ຊື່ບັນຊີ', 'vi': 'Tên tài khoản'
    },
    'pages.transfer.walletQrFallback': {
        'en': 'Wallet QR', 'th': 'QR วอลเล็ต', 'zh': '钱包二维码',
        'lo': 'QR ກະເປົາເງິນ', 'vi': 'QR ví'
    },
    'pages.transfer.scanWithBankApp': {
        'en': 'Scan with any bank app · amount ฿{{amount}} baked in',
        'th': 'สแกนด้วยแอปธนาคารใดก็ได้ · จำนวนเงิน ฿{{amount}} ถูกกำหนดไว้แล้ว',
        'zh': '使用任何银行应用扫描 · 已嵌入金额 ฿{{amount}}',
        'lo': 'ສະແກນດ້ວຍແອັບທະນາຄານໃດກໍ່ໄດ້ · ຈຳນວນ ฿{{amount}} ຖືກກຳນົດໄວ້ແລ້ວ',
        'vi': 'Quét bằng bất kỳ ứng dụng ngân hàng nào · số tiền ฿{{amount}} đã được nhúng sẵn'
    },
    'pages.transfer.slipPreviewAlt': {
        'en': 'Slip preview', 'th': 'ตัวอย่างสลิป',
        'zh': '凭证预览', 'lo': 'ຕົວຢ່າງສະລິບ', 'vi': 'Xem trước biên lai'
    },
    'pages.transfer.promptPayQrAlt': {
        'en': 'PromptPay QR', 'th': 'QR พร้อมเพย์',
        'zh': 'PromptPay 二维码', 'lo': 'QR PromptPay', 'vi': 'QR PromptPay'
    },
    'pages.transfer.qrAlt': {
        'en': 'QR', 'th': 'QR', 'zh': '二维码', 'lo': 'QR', 'vi': 'QR'
    },
    'pages.transfer.guestName': {
        'en': 'Guest', 'th': 'แขก', 'zh': '访客', 'lo': 'ແຂກ', 'vi': 'Khách'
    },

    # openshop.tsx
    'pages.openshopPanel.failedSubmit': {
        'en': 'Failed to submit application',
        'th': 'ส่งใบสมัครไม่สำเร็จ',
        'zh': '提交申请失败',
        'lo': 'ສົ່ງໃບສະໝັກບໍ່ສຳເລັດ',
        'vi': 'Gửi đơn không thành công'
    },

    # Step4Warehouse.tsx
    'pages.openshopStep4.fieldBusinessType': {
        'en': 'Business Type', 'th': 'ประเภทธุรกิจ',
        'zh': '业务类型', 'lo': 'ປະເພດທຸລະກິດ', 'vi': 'Loại hình kinh doanh'
    },
    'pages.openshopStep4.fieldName': {
        'en': 'Name', 'th': 'ชื่อ', 'zh': '名称', 'lo': 'ຊື່', 'vi': 'Tên'
    },
    'pages.openshopStep4.fieldCategory': {
        'en': 'Category', 'th': 'หมวดหมู่', 'zh': '类别', 'lo': 'ໝວດໝູ່', 'vi': 'Danh mục'
    },
    'pages.openshopStep4.fieldEmail': {
        'en': 'Email', 'th': 'อีเมล', 'zh': '邮箱', 'lo': 'ອີເມວ', 'vi': 'Email'
    },
    'pages.openshopStep4.fieldPhone': {
        'en': 'Phone', 'th': 'โทรศัพท์', 'zh': '电话',
        'lo': 'ໂທລະສັບ', 'vi': 'Điện thoại'
    },
    'pages.openshopStep4.fieldTinTax': {
        'en': 'Tax ID (TIN)', 'th': 'หมายเลขประจำตัวผู้เสียภาษี (TIN)',
        'zh': '税号 (TIN)', 'lo': 'ເລກປະຈຳຕົວເສຍພາສີ (TIN)',
        'vi': 'Mã số thuế (TIN)'
    },
    'pages.openshopStep4.fieldIdPassport': {
        'en': 'ID / Passport', 'th': 'บัตรประชาชน / หนังสือเดินทาง',
        'zh': '身份证 / 护照', 'lo': 'ບັດປະຈຳຕົວ / ໜັງສືຜ່ານແດນ',
        'vi': 'CMND / Hộ chiếu'
    },
    'pages.openshopStep4.fieldRepresentative': {
        'en': 'Representative', 'th': 'ผู้แทน',
        'zh': '代表人', 'lo': 'ຜູ້ຕາງໜ້າ', 'vi': 'Đại diện'
    },
    'pages.openshopStep4.fieldAddress': {
        'en': 'Address', 'th': 'ที่อยู่', 'zh': '地址', 'lo': 'ທີ່ຢູ່', 'vi': 'Địa chỉ'
    },
    'pages.openshopStep4.viewDoc': {
        'en': 'View', 'th': 'ดู', 'zh': '查看', 'lo': 'ເບິ່ງ', 'vi': 'Xem'
    },
    'pages.openshopStep4.reviewWithin23Days': {
        'en': 'We will review your information within 2-3 business days. If we need more information or have questions, we will contact you via your registered email or phone number.',
        'th': 'เราจะตรวจสอบข้อมูลของคุณภายใน 2-3 วันทำการ หากต้องการข้อมูลเพิ่มเติมหรือมีคำถาม เราจะติดต่อคุณผ่านอีเมลหรือเบอร์โทรที่ลงทะเบียนไว้',
        'zh': '我们将在 2-3 个工作日内审核您的信息。如果需要更多信息或有疑问，我们将通过您注册的邮箱或电话联系您。',
        'lo': 'ເຮົາຈະກວດກາຂໍ້ມູນຂອງທ່ານພາຍໃນ 2-3 ວັນລັດຖະການ. ຫາກຕ້ອງການຂໍ້ມູນເພີ່ມເຕີມ ເຮົາຈະຕິດຕໍ່ທ່ານຜ່ານອີເມວ ຫຼື ເບີໂທທີ່ລົງທະບຽນ',
        'vi': 'Chúng tôi sẽ xem xét thông tin của bạn trong vòng 2-3 ngày làm việc. Nếu cần thêm thông tin hoặc có thắc mắc, chúng tôi sẽ liên hệ qua email hoặc số điện thoại bạn đã đăng ký.'
    },

    # Step1BusinessType.tsx
    'pages.openshopStep1.businessTypeIndividual': {
        'en': 'Individual', 'th': 'บุคคลธรรมดา',
        'zh': '个人', 'lo': 'ບຸກຄົນ', 'vi': 'Cá nhân'
    },
    'pages.openshopStep1.businessTypeIndividualDesc': {
        'en': 'Use your ID card or passport. You are selling as a private individual and not a registered business.',
        'th': 'ใช้บัตรประชาชนหรือหนังสือเดินทาง คุณขายในนามบุคคลธรรมดา ไม่ใช่ธุรกิจจดทะเบียน',
        'zh': '使用您的身份证或护照。您以个人身份销售，而非注册企业。',
        'lo': 'ໃຊ້ບັດປະຈຳຕົວ ຫຼື ໜັງສືຜ່ານແດນ. ທ່ານກຳລັງຂາຍໃນຖານະບຸກຄົນ ບໍ່ແມ່ນທຸລະກິດທີ່ຈົດທະບຽນ',
        'vi': 'Dùng CMND hoặc hộ chiếu. Bạn bán với tư cách cá nhân, không phải doanh nghiệp đã đăng ký.'
    },
    'pages.openshopStep1.businessTypeSoleProprietor': {
        'en': 'Sole Proprietor', 'th': 'เจ้าของกิจการคนเดียว',
        'zh': '独资经营者', 'lo': 'ເຈົ້າຂອງກິດຈະການຄົນດຽວ',
        'vi': 'Hộ kinh doanh'
    },
    'pages.openshopStep1.businessTypeSoleProprietorDesc': {
        'en': 'Requires a business registration certificate. You are the sole owner of a legally registered business.',
        'th': 'ต้องมีใบทะเบียนพาณิชย์ คุณเป็นเจ้าของกิจการที่จดทะเบียนถูกต้องตามกฎหมาย',
        'zh': '需要营业执照。您是合法注册企业的唯一所有者。',
        'lo': 'ຕ້ອງມີໃບທະບຽນວິສາຫະກິດ. ທ່ານເປັນເຈົ້າຂອງເທົ່ານັ້ນຂອງທຸລະກິດທີ່ຈົດທະບຽນຖືກກົດໝາຍ',
        'vi': 'Cần có giấy chứng nhận đăng ký kinh doanh. Bạn là chủ sở hữu duy nhất của doanh nghiệp đã đăng ký hợp pháp.'
    },
    'pages.openshopStep1.businessTypeCorporate': {
        'en': 'Corporate', 'th': 'บริษัท',
        'zh': '法人企业', 'lo': 'ບໍລິສັດ', 'vi': 'Công ty'
    },
    'pages.openshopStep1.businessTypeCorporateDesc': {
        'en': 'A legal entity in the form of a company, clearly separated from its owners.',
        'th': 'นิติบุคคลในรูปแบบบริษัท แยกจากเจ้าของอย่างชัดเจน',
        'zh': '以公司形式存在的法律实体，与其所有者明确分开。',
        'lo': 'ນິຕິບຸກຄົນໃນຮູບແບບບໍລິສັດ ແຍກອອກຈາກເຈົ້າຂອງຢ່າງຊັດເຈນ',
        'vi': 'Pháp nhân dưới hình thức công ty, tách biệt rõ ràng với chủ sở hữu.'
    },
    'pages.openshopStep1.businessTypePartnership': {
        'en': 'Partnership', 'th': 'หุ้นส่วน',
        'zh': '合伙企业', 'lo': 'ຫຸ້ນສ່ວນ', 'vi': 'Hợp danh'
    },
    'pages.openshopStep1.businessTypePartnershipDesc': {
        'en': 'A business operated jointly by two or more individuals.',
        'th': 'ธุรกิจที่ดำเนินการร่วมกันโดยบุคคลตั้งแต่สองคนขึ้นไป',
        'zh': '由两个或多个个人共同经营的企业。',
        'lo': 'ທຸລະກິດທີ່ດຳເນີນຮ່ວມກັນໂດຍບຸກຄົນສອງຄົນຂຶ້ນໄປ',
        'vi': 'Doanh nghiệp do hai cá nhân trở lên cùng vận hành.'
    },
    'pages.openshopStep1.asXSeller': {
        'en': 'As a', 'th': 'ในฐานะผู้ขายประเภท',
        'zh': '作为', 'lo': 'ໃນຖານະຜູ້ຂາຍປະເພດ', 'vi': 'Là người bán'
    },
    'pages.openshopStep1.youWillNeed': {
        'en': 'seller, you will need:', 'th': 'คุณจะต้องมี:',
        'zh': '销售商，您需要：', 'lo': 'ທ່ານຈະຕ້ອງມີ:', 'vi': ', bạn sẽ cần:'
    },

    # withdraw.tsx (me/menu)
    'pages.withdrawShop.title': {
        'en': 'shop withdraw', 'th': 'ถอนเงินร้านค้า',
        'zh': '店铺提现', 'lo': 'ຖອນເງິນຮ້ານຄ້າ', 'vi': 'rút tiền cửa hàng'
    },
    'pages.withdrawShop.withdrawals': {
        'en': 'withdrawals', 'th': 'การถอนเงิน',
        'zh': '提现', 'lo': 'ການຖອນເງິນ', 'vi': 'lịch sử rút tiền'
    },
    'pages.withdrawShop.pendingCount': {
        'en': 'Pending ({{count}})', 'th': 'รอดำเนินการ ({{count}})',
        'zh': '待处理 ({{count}})', 'lo': 'ກຳລັງລໍຖ້າ ({{count}})',
        'vi': 'Đang chờ ({{count}})'
    },
    'pages.withdrawShop.historyCount': {
        'en': 'History ({{count}})', 'th': 'ประวัติ ({{count}})',
        'zh': '历史 ({{count}})', 'lo': 'ປະຫວັດ ({{count}})',
        'vi': 'Lịch sử ({{count}})'
    },
    'pages.withdrawShop.feeNet': {
        'en': 'Fee ฿{{fee}} → Net ฿{{net}}',
        'th': 'ค่าธรรมเนียม ฿{{fee}} → สุทธิ ฿{{net}}',
        'zh': '手续费 ฿{{fee}} → 净额 ฿{{net}}',
        'lo': 'ຄ່າທຳນຽມ ฿{{fee}} → ສຸດທິ ฿{{net}}',
        'vi': 'Phí ฿{{fee}} → Thực nhận ฿{{net}}'
    },
    'pages.withdrawShop.noPending': {
        'en': 'No pending withdrawals', 'th': 'ไม่มีคำขอถอนเงินที่รอดำเนินการ',
        'zh': '没有待处理的提现', 'lo': 'ບໍ່ມີຄຳຮ້ອງຂໍຖອນເງິນທີ່ກຳລັງລໍຖ້າ',
        'vi': 'Không có lệnh rút đang chờ'
    },
    'pages.withdrawShop.noHistoryYet': {
        'en': 'No history yet', 'th': 'ยังไม่มีประวัติ',
        'zh': '暂无历史', 'lo': 'ຍັງບໍ່ມີປະຫວັດ', 'vi': 'Chưa có lịch sử'
    },
    'pages.withdrawShop.tooltipRules': {
        'en': 'Withdrawal rules', 'th': 'กฎการถอนเงิน',
        'zh': '提现规则', 'lo': 'ກົດການຖອນເງິນ', 'vi': 'Quy tắc rút tiền'
    },
    'pages.withdrawShop.posRevenueLabel': {
        'en': 'POS revenue ฿{{amount}} · in-store, not withdrawable',
        'th': 'รายได้ POS ฿{{amount}} · ในร้าน ถอนไม่ได้',
        'zh': 'POS 收入 ฿{{amount}} · 店内不可提现',
        'lo': 'ລາຍຮັບ POS ฿{{amount}} · ໃນຮ້ານ ຖອນບໍ່ໄດ້',
        'vi': 'Doanh thu POS ฿{{amount}} · tại cửa hàng, không rút được'
    },
    'pages.withdrawShop.maxBtn': {
        'en': 'Max', 'th': 'สูงสุด', 'zh': '最高', 'lo': 'ສູງສຸດ', 'vi': 'Tối đa'
    },
    'pages.withdrawShop.minMaxFeeShort': {
        'en': 'Min ฿{{min}} • Max ฿{{max}} • Fee {{fee}}%',
        'th': 'ขั้นต่ำ ฿{{min}} • สูงสุด ฿{{max}} • ค่าธรรมเนียม {{fee}}%',
        'zh': '最低 ฿{{min}} • 最高 ฿{{max}} • 手续费 {{fee}}%',
        'lo': 'ຂັ້ນຕ່ຳ ฿{{min}} • ສູງສຸດ ฿{{max}} • ຄ່າທຳນຽມ {{fee}}%',
        'vi': 'Tối thiểu ฿{{min}} • Tối đa ฿{{max}} • Phí {{fee}}%'
    },
    'pages.withdrawShop.processingBtn': {
        'en': 'Processing...', 'th': 'กำลังดำเนินการ...',
        'zh': '处理中...', 'lo': 'ກຳລັງດຳເນີນການ...', 'vi': 'Đang xử lý...'
    },
    'pages.withdrawShop.withdrawNowBtn': {
        'en': 'withdraw now', 'th': 'ถอนเงินทันที',
        'zh': '立即提现', 'lo': 'ຖອນເງິນດຽວນີ້', 'vi': 'rút ngay'
    },
    'pages.withdrawShop.pinDescAmount': {
        'en': 'Please enter your 6-digit PIN to confirm withdrawal of ฿{{amount}}',
        'th': 'กรุณาป้อน PIN 6 หลักเพื่อยืนยันการถอนเงิน ฿{{amount}}',
        'zh': '请输入 6 位 PIN 码以确认提现 ฿{{amount}}',
        'lo': 'ກະລຸນາໃສ່ PIN 6 ຫຼັກເພື່ອຢືນຢັນການຖອນເງິນ ฿{{amount}}',
        'vi': 'Vui lòng nhập mã PIN 6 chữ số để xác nhận rút ฿{{amount}}'
    },
    'pages.withdrawShop.verifying': {
        'en': 'Verifying...', 'th': 'กำลังตรวจสอบ...',
        'zh': '正在验证...', 'lo': 'ກຳລັງກວດກາ...', 'vi': 'Đang xác minh...'
    },
    'pages.withdrawShop.withdrawalDestination': {
        'en': 'withdrawal destination', 'th': 'ปลายทางการถอนเงิน',
        'zh': '提现目的地', 'lo': 'ປາຍທາງການຖອນເງິນ',
        'vi': 'điểm đến rút tiền'
    },
    'pages.withdrawShop.paymentMethodsHdr': {
        'en': 'payment methods', 'th': 'วิธีการชำระเงิน',
        'zh': '付款方式', 'lo': 'ວິທີຊຳລະເງິນ', 'vi': 'phương thức thanh toán'
    },
    'pages.withdrawShop.pendingHistoryBtn': {
        'en': 'pending & history', 'th': 'รอดำเนินการ & ประวัติ',
        'zh': '待处理与历史', 'lo': 'ກຳລັງລໍຖ້າ & ປະຫວັດ',
        'vi': 'đang chờ & lịch sử'
    },
    'pages.withdrawShop.afterReceipt': {
        'en': 'after buyer confirms receipt, web sales will be transferred within',
        'th': 'หลังจากผู้ซื้อยืนยันการรับสินค้า ยอดขายออนไลน์จะถูกโอนภายใน',
        'zh': '买家确认收货后，网店销售款将在以下时间内转账',
        'lo': 'ຫຼັງຈາກຜູ້ຊື້ຢືນຢັນການຮັບສິນຄ້າ ຍອດຂາຍອອນລາຍຈະຖືກໂອນພາຍໃນ',
        'vi': 'sau khi người mua xác nhận nhận hàng, doanh thu web sẽ được chuyển trong vòng'
    },
    'pages.withdrawShop.businessDaysSuffix': {
        'en': '{{days}} business days', 'th': '{{days}} วันทำการ',
        'zh': '{{days}} 个工作日', 'lo': '{{days}} ວັນລັດຖະການ',
        'vi': '{{days}} ngày làm việc'
    },
    'pages.withdrawShop.verifyBankInfo': {
        'en': 'please verify bank info to avoid delays.',
        'th': 'กรุณาตรวจสอบข้อมูลธนาคารเพื่อหลีกเลี่ยงความล่าช้า',
        'zh': '请核实银行信息以避免延误。',
        'lo': 'ກະລຸນາກວດກາຂໍ້ມູນທະນາຄານເພື່ອຫຼີກລ້ຽງຄວາມຊັກຊ້າ',
        'vi': 'vui lòng xác minh thông tin ngân hàng để tránh chậm trễ.'
    },
    'pages.withdrawShop.webSalesOnly': {
        'en': 'Web sales only — POS revenue is non-withdrawable.',
        'th': 'เฉพาะยอดขายเว็บเท่านั้น — รายได้ POS ถอนไม่ได้',
        'zh': '仅限网络销售 — POS 收入不可提现。',
        'lo': 'ສະເພາະຍອດຂາຍເວັບເທົ່ານັ້ນ — ລາຍຮັບ POS ຖອນບໍ່ໄດ້',
        'vi': 'Chỉ doanh thu web — doanh thu POS không thể rút.'
    },
    'pages.withdrawShop.setPinFirst': {
        'en': 'Set a 6-digit PIN before your first withdrawal.',
        'th': 'ตั้ง PIN 6 หลักก่อนการถอนเงินครั้งแรก',
        'zh': '首次提现前请先设置 6 位 PIN 码。',
        'lo': 'ຕັ້ງ PIN 6 ຫຼັກກ່ອນການຖອນເງິນຄັ້ງທຳອິດ',
        'vi': 'Đặt mã PIN 6 chữ số trước lần rút đầu tiên.'
    },

    # ShopDetailSection.tsx
    'pages.shopDetailPanel2.approvedTitle': {
        'en': 'Approved', 'th': 'อนุมัติแล้ว', 'zh': '已批准',
        'lo': 'ອະນຸມັດແລ້ວ', 'vi': 'Đã duyệt'
    },
    'pages.shopDetailPanel2.approvedDesc': {
        'en': 'Your shop is verified and live.',
        'th': 'ร้านของคุณได้รับการยืนยันและเปิดให้บริการแล้ว',
        'zh': '您的店铺已通过验证并上线。',
        'lo': 'ຮ້ານຄ້າຂອງທ່ານໄດ້ຮັບການຢັ້ງຢືນ ແລະ ເປີດໃຫ້ບໍລິການແລ້ວ',
        'vi': 'Cửa hàng của bạn đã được xác minh và hoạt động.'
    },
    'pages.shopDetailPanel2.pendingTitle': {
        'en': 'Pending review', 'th': 'รอตรวจสอบ',
        'zh': '待审核', 'lo': 'ກຳລັງລໍກວດກາ', 'vi': 'Đang chờ duyệt'
    },
    'pages.shopDetailPanel2.pendingDesc': {
        'en': "Our team is reviewing your submission. You'll be notified once approved.",
        'th': 'ทีมงานกำลังตรวจสอบการส่งของคุณ คุณจะได้รับการแจ้งเตือนเมื่อได้รับการอนุมัติ',
        'zh': '我们的团队正在审核您的提交。批准后将通知您。',
        'lo': 'ທີມງານກຳລັງກວດກາການສົ່ງຂອງທ່ານ. ທ່ານຈະຖືກແຈ້ງເຕືອນເມື່ອອະນຸມັດແລ້ວ',
        'vi': 'Đội ngũ của chúng tôi đang xem xét. Bạn sẽ được thông báo khi được duyệt.'
    },
    'pages.shopDetailPanel2.rejectedTitle': {
        'en': 'Rejected', 'th': 'ถูกปฏิเสธ', 'zh': '已拒绝',
        'lo': 'ຖືກປະຕິເສດ', 'vi': 'Bị từ chối'
    },
    'pages.shopDetailPanel2.rejectedDesc': {
        'en': 'Your KYC submission was rejected. See the reviewer note below.',
        'th': 'การส่ง KYC ของคุณถูกปฏิเสธ ดูหมายเหตุของผู้ตรวจสอบด้านล่าง',
        'zh': '您的 KYC 提交被拒绝。请查看下方的审核员备注。',
        'lo': 'ການສົ່ງ KYC ຂອງທ່ານຖືກປະຕິເສດ. ເບິ່ງໝາຍເຫດຂອງຜູ້ກວດກາຂ້າງລຸ່ມ',
        'vi': 'Hồ sơ KYC của bạn bị từ chối. Xem ghi chú của người duyệt bên dưới.'
    },
    'pages.shopDetailPanel2.reasonLabel': {
        'en': 'Reason: {{note}}', 'th': 'เหตุผล: {{note}}',
        'zh': '原因：{{note}}', 'lo': 'ເຫດຜົນ: {{note}}', 'vi': 'Lý do: {{note}}'
    },
    'pages.shopDetailPanel2.submittedReviewed': {
        'en': 'Submitted {{submitted}}', 'th': 'ส่งเมื่อ {{submitted}}',
        'zh': '提交于 {{submitted}}', 'lo': 'ສົ່ງເມື່ອ {{submitted}}',
        'vi': 'Đã gửi {{submitted}}'
    },
    'pages.shopDetailPanel2.reviewedSuffix': {
        'en': '· reviewed {{reviewed}}',
        'th': '· ตรวจสอบเมื่อ {{reviewed}}',
        'zh': '· 审核于 {{reviewed}}',
        'lo': '· ກວດກາເມື່ອ {{reviewed}}',
        'vi': '· đã duyệt {{reviewed}}'
    },
    'pages.shopDetailPanel2.idDocLabel': {
        'en': '{{idType}} document', 'th': 'เอกสาร {{idType}}',
        'zh': '{{idType}} 文件', 'lo': 'ເອກະສານ {{idType}}',
        'vi': 'Giấy tờ {{idType}}'
    },
    'pages.shopDetailPanel2.idDocFallback': {
        'en': 'ID', 'th': 'บัตรประจำตัว', 'zh': '身份证',
        'lo': 'ບັດປະຈຳຕົວ', 'vi': 'CMND'
    },
    'pages.shopDetailPanel2.businessLicense': {
        'en': 'Business license', 'th': 'ใบอนุญาตประกอบธุรกิจ',
        'zh': '营业执照', 'lo': 'ໃບອະນຸຍາດທຸລະກິດ',
        'vi': 'Giấy phép kinh doanh'
    },
    'pages.shopDetailPanel2.supportingDoc': {
        'en': 'Supporting document', 'th': 'เอกสารประกอบ',
        'zh': '支持文件', 'lo': 'ເອກະສານສະໜັບສະໜູນ',
        'vi': 'Tài liệu hỗ trợ'
    },

    # PaymentSection.tsx
    'pages.paymentPanel.verified': {
        'en': 'Verified', 'th': 'ยืนยันแล้ว', 'zh': '已验证',
        'lo': 'ຢືນຢັນແລ້ວ', 'vi': 'Đã xác minh'
    },
    'pages.paymentPanel.pendingApproval': {
        'en': 'Pending Approval', 'th': 'รอการอนุมัติ',
        'zh': '待批准', 'lo': 'ກຳລັງລໍຖ້າອະນຸມັດ', 'vi': 'Chờ phê duyệt'
    },

    # SecuritySection.tsx
    'pages.securityPanel2.verifyBtn': {
        'en': 'Verify', 'th': 'ยืนยัน', 'zh': '验证', 'lo': 'ຢືນຢັນ', 'vi': 'Xác minh'
    },

    # creator_prodcut.tsx
    'pages.creatorProducts2.priceLabel': {
        'en': 'Price', 'th': 'ราคา', 'zh': '价格', 'lo': 'ລາຄາ', 'vi': 'Giá'
    },
    'pages.creatorProducts2.earnLabel': {
        'en': 'Earn', 'th': 'รายได้', 'zh': '收益', 'lo': 'ລາຍຮັບ', 'vi': 'Thu nhập'
    },
    'pages.creatorProducts2.done': {
        'en': 'Done', 'th': 'เสร็จ', 'zh': '完成', 'lo': 'ສຳເລັດ', 'vi': 'Xong'
    },
    'pages.creatorProducts2.linkBtn': {
        'en': 'Link', 'th': 'ลิงก์', 'zh': '链接', 'lo': 'ລິ້ງ', 'vi': 'Liên kết'
    },
    'pages.creatorProducts2.shareBtn': {
        'en': 'Share', 'th': 'แชร์', 'zh': '分享', 'lo': 'ແບ່ງປັນ', 'vi': 'Chia sẻ'
    },
    'pages.creatorProducts2.removeBtn': {
        'en': 'Remove', 'th': 'ลบ', 'zh': '移除', 'lo': 'ລຶບ', 'vi': 'Xóa'
    },
    'pages.creatorProducts2.checkThis': {
        'en': 'Check this out', 'th': 'ดูอันนี้สิ',
        'zh': '看看这个', 'lo': 'ເບິ່ງອັນນີ້', 'vi': 'Xem cái này'
    },

    # u/[id].tsx
    'pages.publicShop.postsTab': {
        'en': 'Posts', 'th': 'โพสต์', 'zh': '帖子', 'lo': 'ໂພສ', 'vi': 'Bài viết'
    },
    'pages.publicShop.shopTab': {
        'en': 'Shop', 'th': 'ร้านค้า', 'zh': '商店',
        'lo': 'ຮ້ານຄ້າ', 'vi': 'Cửa hàng'
    },
    'pages.publicShop.postsCount': {
        'en': 'posts', 'th': 'โพสต์', 'zh': '帖子', 'lo': 'ໂພສ', 'vi': 'bài viết'
    },
    'pages.publicShop.followersCount': {
        'en': 'followers', 'th': 'ผู้ติดตาม',
        'zh': '关注者', 'lo': 'ຜູ້ຕິດຕາມ', 'vi': 'người theo dõi'
    },
    'pages.publicShop.followingCount': {
        'en': 'following', 'th': 'กำลังติดตาม',
        'zh': '关注中', 'lo': 'ກຳລັງຕິດຕາມ', 'vi': 'đang theo dõi'
    },
    'pages.publicShop.userFallback': {
        'en': 'user', 'th': 'ผู้ใช้', 'zh': '用户',
        'lo': 'ຜູ້ໃຊ້', 'vi': 'người dùng'
    },
    'pages.publicShop.profileOptions': {
        'en': 'Profile options', 'th': 'ตัวเลือกโปรไฟล์',
        'zh': '个人资料选项', 'lo': 'ຕົວເລືອກໂປຣໄຟລ໌',
        'vi': 'Tùy chọn hồ sơ'
    },

    # AddTostore.tsx
    'pages.creatorAddToStore2.priceLabel': {
        'en': 'Price', 'th': 'ราคา', 'zh': '价格', 'lo': 'ລາຄາ', 'vi': 'Giá'
    },
    'pages.creatorAddToStore2.earnLabel': {
        'en': 'Earn', 'th': 'รายได้', 'zh': '收益', 'lo': 'ລາຍຮັບ', 'vi': 'Thu nhập'
    },
    'pages.creatorAddToStore2.soldLabel': {
        'en': 'Sold', 'th': 'ขายแล้ว', 'zh': '已售',
        'lo': 'ຂາຍແລ້ວ', 'vi': 'Đã bán'
    },
    'pages.creatorAddToStore2.addedBtn': {
        'en': 'Added', 'th': 'เพิ่มแล้ว', 'zh': '已添加',
        'lo': 'ເພີ່ມແລ້ວ', 'vi': 'Đã thêm'
    },
    'pages.creatorAddToStore2.addBtn': {
        'en': 'Add +', 'th': 'เพิ่ม +', 'zh': '添加 +',
        'lo': 'ເພີ່ມ +', 'vi': 'Thêm +'
    },

    # orderpage/order.tsx
    'pages.creatorOrder.statusAll': {
        'en': 'All', 'th': 'ทั้งหมด', 'zh': '全部',
        'lo': 'ທັງໝົດ', 'vi': 'Tất cả'
    },
    'pages.creatorOrder.statusPending': {
        'en': 'Pending', 'th': 'รอดำเนินการ', 'zh': '待处理',
        'lo': 'ກຳລັງລໍຖ້າ', 'vi': 'Đang chờ'
    },
    'pages.creatorOrder.statusShipped': {
        'en': 'Shipped', 'th': 'จัดส่งแล้ว', 'zh': '已发货',
        'lo': 'ສົ່ງແລ້ວ', 'vi': 'Đã gửi'
    },
    'pages.creatorOrder.statusCompleted': {
        'en': 'Completed', 'th': 'เสร็จสิ้น', 'zh': '已完成',
        'lo': 'ສຳເລັດ', 'vi': 'Đã hoàn tất'
    },
    'pages.creatorOrder.statusCanceled': {
        'en': 'Canceled', 'th': 'ยกเลิก', 'zh': '已取消',
        'lo': 'ຍົກເລີກ', 'vi': 'Đã hủy'
    },
    'pages.creatorOrder.qtyLabel': {
        'en': 'Qty: {{qty}}', 'th': 'จำนวน: {{qty}}',
        'zh': '数量：{{qty}}', 'lo': 'ຈຳນວນ: {{qty}}', 'vi': 'SL: {{qty}}'
    },
    'pages.creatorOrder.priceLabel': {
        'en': 'Price', 'th': 'ราคา', 'zh': '价格', 'lo': 'ລາຄາ', 'vi': 'Giá'
    },
    'pages.creatorOrder.totalCommissionTracked': {
        'en': 'Total commission tracked: ฿{{amount}}',
        'th': 'ค่าคอมมิชชั่นที่ติดตาม: ฿{{amount}}',
        'zh': '已跟踪佣金总额：฿{{amount}}',
        'lo': 'ຄ່ານາຍໜ້າທີ່ຕິດຕາມ: ฿{{amount}}',
        'vi': 'Tổng hoa hồng theo dõi: ฿{{amount}}'
    },

    # promo.tsx
    'pages.promo.fetchingCoupons': {
        'en': 'Fetching your coupons...', 'th': 'กำลังดึงคูปอง...',
        'zh': '正在获取您的优惠券...', 'lo': 'ກຳລັງດຶງຄູປອງ...',
        'vi': 'Đang tải mã giảm giá...'
    },

    # me/products/[id].tsx
    'pages.productsEdit.failedToLoad': {
        'en': 'Failed to load product', 'th': 'โหลดสินค้าไม่สำเร็จ',
        'zh': '加载产品失败', 'lo': 'ໂຫລດສິນຄ້າບໍ່ສຳເລັດ',
        'vi': 'Tải sản phẩm thất bại'
    },

    # SocialPost.tsx
    'pages.social.likeOne': {
        'en': 'like', 'th': 'ถูกใจ', 'zh': '点赞', 'lo': 'ມັກ', 'vi': 'thích'
    },
    'pages.social.likeMany': {
        'en': 'likes', 'th': 'ถูกใจ', 'zh': '赞', 'lo': 'ມັກ', 'vi': 'lượt thích'
    },

    # MediaUpload.tsx
    'pages.socialUpload.uploadFailed': {
        'en': 'Upload failed', 'th': 'อัปโหลดไม่สำเร็จ',
        'zh': '上传失败', 'lo': 'ອັບໂຫລດບໍ່ສຳເລັດ', 'vi': 'Tải lên thất bại'
    },

    # profile/followers/[username].tsx
    'pages.followersPage.searchPlaceholder': {
        'en': 'Search followers...', 'th': 'ค้นหาผู้ติดตาม...',
        'zh': '搜索关注者...', 'lo': 'ຄົ້ນຫາຜູ້ຕິດຕາມ...',
        'vi': 'Tìm người theo dõi...'
    },
    'pages.followersPage.failedToLoad': {
        'en': 'Failed to load followers', 'th': 'โหลดผู้ติดตามไม่สำเร็จ',
        'zh': '加载关注者失败', 'lo': 'ໂຫລດຜູ້ຕິດຕາມບໍ່ສຳເລັດ',
        'vi': 'Tải danh sách theo dõi thất bại'
    },
    'pages.followersPage.appearHere': {
        'en': "Once people follow @{{username}}, they'll appear here",
        'th': 'เมื่อมีคนติดตาม @{{username}} พวกเขาจะปรากฏที่นี่',
        'zh': '当有人关注 @{{username}} 时，他们会出现在这里',
        'lo': 'ເມື່ອມີຄົນຕິດຕາມ @{{username}} ພວກເຂົາຈະປະກົດທີ່ນີ້',
        'vi': 'Khi có người theo dõi @{{username}}, họ sẽ xuất hiện ở đây'
    },
    'pages.followersPage.titleSuffix': {
        'en': 'Followers of @{{username}} | SupplyNet',
        'th': 'ผู้ติดตามของ @{{username}} | SupplyNet',
        'zh': '@{{username}} 的关注者 | SupplyNet',
        'lo': 'ຜູ້ຕິດຕາມຂອງ @{{username}} | SupplyNet',
        'vi': 'Người theo dõi @{{username}} | SupplyNet'
    },

    # posts/create-post.tsx
    'pages.posts2.privacyTitle': {
        'en': 'Privacy', 'th': 'ความเป็นส่วนตัว', 'zh': '隐私',
        'lo': 'ຄວາມເປັນສ່ວນຕົວ', 'vi': 'Quyền riêng tư'
    },
    'pages.posts2.visEveryoneLabel': {
        'en': 'Everyone', 'th': 'ทุกคน', 'zh': '所有人',
        'lo': 'ທຸກຄົນ', 'vi': 'Mọi người'
    },
    'pages.posts2.visEveryoneDesc': {
        'en': 'Public visibility', 'th': 'มองเห็นได้สาธารณะ',
        'zh': '公开可见', 'lo': 'ມອງເຫັນສາທາລະນະ', 'vi': 'Hiển thị công khai'
    },
    'pages.posts2.visFriendsLabel': {
        'en': 'Friends', 'th': 'เพื่อน', 'zh': '朋友', 'lo': 'ໝູ່', 'vi': 'Bạn bè'
    },
    'pages.posts2.visFriendsDesc': {
        'en': 'Followers you follow back', 'th': 'ผู้ติดตามที่คุณติดตามกลับ',
        'zh': '互相关注的关注者', 'lo': 'ຜູ້ຕິດຕາມທີ່ທ່ານຕິດຕາມກັບ',
        'vi': 'Người theo dõi mà bạn theo dõi lại'
    },
    'pages.posts2.visSelectedLabel': {
        'en': 'Selected', 'th': 'ที่เลือก', 'zh': '选定的人',
        'lo': 'ທີ່ເລືອກ', 'vi': 'Đã chọn'
    },
    'pages.posts2.visSelectedDesc': {
        'en': 'Choose specific people', 'th': 'เลือกบุคคลที่ระบุ',
        'zh': '选择特定的人', 'lo': 'ເລືອກບຸກຄົນສະເພາະ',
        'vi': 'Chọn người cụ thể'
    },
}


def main():
    for lang in LOCALES:
        p = ROOT / lang / 'common.json'
        data = json.loads(p.read_text(encoding='utf-8-sig'))
        for key, vals in NEW.items():
            set_nested(data, key, vals[lang])
        p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'{lang}: added/updated {len(NEW)} keys')


if __name__ == '__main__':
    main()
