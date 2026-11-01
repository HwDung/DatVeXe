// Operator/route identity is sourced; departures, fares, seat counts and fleet IDs are demo fixtures.
const companies = [
  {
    key: 'futa', name: 'Phương Trang', website: 'https://futabus.vn/',
    description: 'FUTA Bus Lines – vận tải hành khách liên tỉnh. Hotline công bố: 1900 6067.',
    sourceUrl: 'https://futabus.vn/',
    image: '/images/buses/phuong-trang.png',
    imageSourceUrl: 'https://futabus.vn/tin-tuc/cong-ty-phuong-trang-nang-cap-dong-xe-tuyen-sai-gon-soc-trang',
    imageDownloadUrl: 'https://storage.googleapis.com/futa-busline-web-cms-prod/Xe_khach_Kim_Long_do_tai_ben_xe_zonnang_1_4364a02684/Xe_khach_Kim_Long_do_tai_ben_xe_zonnang_1_4364a02684.png',
    type: 'Limousine giường nằm 34 chỗ', seats: 34,
    routes: [
      { origin: 'TP.HCM', destination: 'Đà Lạt', minutes: 480, price: 300000 },
      { origin: 'TP.HCM', destination: 'Cần Thơ', minutes: 210, price: 195000 },
      { origin: 'TP.HCM', destination: 'Sóc Trăng', minutes: 360, price: 250000, sourceUrl: 'https://futabus.vn/tin-tuc/cong-ty-phuong-trang-nang-cap-dong-xe-tuyen-sai-gon-soc-trang' },
    ],
  },
  {
    key: 'thanhbuoi', name: 'Thành Bưởi', website: 'https://thanhbuoi.com.vn/',
    description: 'Nhà xe Thành Bưởi. Tuyến tham khảo từ trang chính thức; lịch trong hệ thống chỉ phục vụ demo.',
    sourceUrl: 'https://thanhbuoi.com.vn/',
    image: '/images/buses/thanh-buoi.jpg',
    imageSourceUrl: 'https://thanhbuoi.com.vn/he-thong-doi-xe/xe-khach',
    imageDownloadUrl: 'https://thanhbuoi.com.vn/wp-content/uploads/2023/12/x1-46569_thumb.jpg',
    type: 'Giường nằm 36 chỗ', seats: 36,
    routes: [
      { origin: 'TP.HCM', destination: 'Đà Lạt', minutes: 450, price: 320000 },
      { origin: 'TP.HCM', destination: 'Cần Thơ', minutes: 210, price: 200000 },
    ],
  },
  {
    key: 'hanhcafe', name: 'Hạnh Cafe', website: 'https://nhaxehanhcafe.vn/',
    description: 'Hạnh Cafe – Hà Phương Limousine. Tuyến TP.HCM, Mũi Né, Nha Trang và các điểm du lịch miền Trung.',
    sourceUrl: 'https://nhaxehanhcafe.vn/',
    image: '/images/buses/hanh-cafe.webp',
    imageSourceUrl: 'https://nhaxehanhcafe.vn/',
    imageDownloadUrl: 'https://nhaxehanhcafe.vn/upload/partner/2898anh-34-phong-6.webp',
    type: 'Limousine 34 phòng', seats: 34,
    routes: [
      { origin: 'TP.HCM', destination: 'Nha Trang', minutes: 480, price: 300000 },
      { origin: 'TP.HCM', destination: 'Mũi Né', minutes: 270, price: 200000 },
      { origin: 'Mũi Né', destination: 'Nha Trang', minutes: 300, price: 220000 },
    ],
  },
];

function arrivalTime(departureTime, minutes) {
  const [hours, mins] = departureTime.split(':').map(Number);
  const total = (hours * 60 + mins + minutes) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

module.exports = { companies, arrivalTime };
