# Rightway — Flutter Android

## Chuyến xe dành cho nhân viên

Tài khoản staff có quyền `operator.access` và `operator.work` sẽ thấy **Chuyến xe của nhà xe** trong khu vực làm việc. Chọn ngày để xem lịch, mở sơ đồ ghế rồi chọn ghế đã đặt để xem mã vé, tên khách, điện thoại và trạng thái thanh toán. API `/operator/trip-board` và `/operator/trip-board/:id/seats` luôn lấy nhà xe từ quyền đăng nhập, không nhận `companyId` từ app.

Đã bỏ mục **Quét QR xem vé**; QR trên vé và **Xác nhận lên xe** vẫn giữ. Các thẻ dùng chung chiều rộng và khoảng cách; hộp thoại giới hạn chiều rộng, có thể cuộn khi nội dung dài hoặc bàn phím mở. Theo yêu cầu, không tích hợp Firebase/thông báo đẩy trong bản này.

Ứng dụng mở màn hình đăng nhập trước. Sau khi đăng nhập hoặc đăng ký thành công, app chuyển vào khu vực tương ứng với quyền tài khoản. Khi đăng xuất hoặc phiên kết thúc, màn hình chính yêu cầu đăng nhập lại.

## Khôi phục mật khẩu và tài khoản cá nhân

Trong màn Đăng nhập, chọn **Quên mật khẩu?**, nhập email đăng ký, rồi nhập mã 8 chữ số và mật khẩu mới. Trong trang Tài khoản cũng có nút **Đặt lại mật khẩu qua email**. Mã dùng một lần, hết hạn sau 10 phút, tối đa 5 lần nhập; yêu cầu mã mới cách nhau ít nhất 60 giây. Đổi mật khẩu thành công sẽ kết thúc mọi phiên đăng nhập cũ.

Backend cần áp dụng migration `20261103000000_password_reset` và chạy `npx prisma generate` trước khi khởi động lại. Nếu tài khoản database của ứng dụng không có quyền tạo bảng, quản trị viên database cần áp dụng migration. Cấu hình SMTP tại `backend/.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`. Không đặt thông tin SMTP trong Flutter. Khi chưa cấu hình gửi email, API trả lỗi `EMAIL_UNAVAILABLE`.

Trang Tài khoản hiển thị ảnh đại diện mặc định, họ tên, email đăng nhập, loại tài khoản và nhà xe (nếu có), cùng phần bảo mật, đặt lại mật khẩu và đăng xuất. Chỉ bỏ mục kết nối máy chủ và URL cấu hình. Chưa có tính năng sửa hồ sơ.

Kết quả tìm vé chỉ hiển thị các chuyến đang mở bán và chưa khởi hành theo giờ Việt Nam; admin vẫn có thể thấy các lịch đã qua giờ chạy. Có thể bấm **Đổi ngày đi** ngay trên màn kết quả; khi hôm nay hết chuyến, bấm **Xem chuyến ngày mai** để giữ nguyên tuyến và tìm ngày tiếp theo.

## Chat trực tiếp với nhân viên

Khách hàng và nhân viên nhận cập nhật hội thoại qua WebSocket `/api/support/socket`, không cần bấm tải lại. Flutter dùng WebSocket có sẵn trong Dart; backend dùng `ws`. Kết nối đầu tiên gửi JSON `{ "token": "<accessToken>", "staff": false }` (`true` cho nhân viên), sau đó nhận `support.ready` hoặc `support.updated` cùng `conversationId`. Tin nhắn vẫn được gửi/lưu qua các API HTTP hiện có. Khi kết nối lại, app tải trạng thái mới nhất để lấy các tin bị lỡ; rời màn hình hoặc đăng xuất sẽ đóng socket.

Proxy cần chuyển tiếp WebSocket với `proxy_http_version 1.1`, `Upgrade` và `Connection: upgrade`. Backend hiện phát sự kiện trong một tiến trình; cần pub/sub chung khi triển khai nhiều tiến trình API. Frontend web cũng nhận sự kiện socket, giữ polling hiện có làm dự phòng.

Frontend đặt vé xe sử dụng API của `C:\QLDA\DatVeXe\backend`, UX/UI từ frontend React Rightway và cấu trúc Flutter từ `C:\LTDD\NguyenXuanPhu_KTGK_LTDD\FrontEnd`.

## Cấu hình duy nhất: .env

Chỉnh file `C:\QLDA\DatVeXe\Flutter\.env`:

```dotenv
API_BASE_URL=http://10.0.2.2:3000/api
APP_NAME=Rightway • Đặt vé xe
CONNECT_TIMEOUT_SECONDS=15
REQUEST_TIMEOUT_SECONDS=20
BOOKING_ADVANCE_DAYS=365
```

| Biến | Ý nghĩa |
| --- | --- |
| API_BASE_URL | URL backend, bao gồm `/api` |
| APP_NAME | Tên ứng dụng trong Flutter MaterialApp |
| CONNECT_TIMEOUT_SECONDS | Thời gian tối đa để mở kết nối, số giây nguyên dương |
| REQUEST_TIMEOUT_SECONDS | Thời gian tối đa cho mỗi giai đoạn gửi/nhận HTTP, số giây nguyên dương |
| BOOKING_ADVANCE_DAYS | Số ngày cho phép chọn trước trong lịch tìm chuyến |

Android Emulator dùng `10.0.2.2` để truy cập máy Windows. Điện thoại thật dùng IP LAN của máy chạy backend, ví dụ đặt `API_BASE_URL=http://192.168.1.10:3000/api` trong `.env`. Nếu dùng USB, chạy `adb reverse tcp:3000 tcp:3000` và đặt URL thành `http://127.0.0.1:3000/api`.

Ứng dụng nạp `.env` trước khi khởi chạy và kiểm tra URL, giá trị bắt buộc, số nguyên dương. Sau khi sửa, dừng và chạy lại ứng dụng; APK đã cài cần được build/cài lại để nhận cấu hình mới. Không dùng `--dart-define` cho các biến này nữa. `.env` được đóng gói thành Flutter asset và chỉ chứa cấu hình phía client. Khóa VNPAY, thông tin database và bí mật backend nằm ở backend.

Các đường dẫn tương đối như `/trips/search` được ghép vào API_BASE_URL. Liên kết thanh toán VNPAY được backend cấp theo từng booking.

## Chạy và kiểm tra

1. Khởi động SQL Server và backend theo README của `DatVeXe`.
2. Trong `C:\QLDA\DatVeXe\backend`, chạy `npm run dev`.
3. Chỉnh `.env`, sau đó trong `C:\QLDA\DatVeXe\Flutter` chạy:

```powershell
flutter pub get
flutter run
```

```powershell
flutter analyze
flutter test
flutter build apk --debug
```

APK: `build\app\outputs\flutter-apk\app-debug.apk`.

## Cấu trúc

- `.env`: các URL và cấu hình hệ thống phía client.
- `lib/main.dart`: nạp `.env`, kiểm tra cấu hình và khởi chạy MaterialApp.
- `lib/config/config_api.dart`: đọc, chuẩn hóa và kiểm tra cấu hình.
- `lib/config/app_theme.dart`: theme, màu thương hiệu.
- lib/services/customer_service.dart: endpoint tập trung khớp với frontend web.
- lib/utils/booking_rules.dart: thời hạn và điều kiện thanh toán/QR.
- lib/services/api_service.dart: HTTP, bearer token, refresh cookie, timeout, lỗi, đăng xuất.
- `lib/screens/`: dashboard, home, search, seat selection, passenger info, login, account, my bookings, booking lookup, booking detail, news.
- `lib/widgets/`: thẻ, tiêu đề, thông báo, điều hướng và tải dữ liệu dùng chung.
- `lib/utils/formatters.dart`: định dạng ngày, tiền Việt, trạng thái.
- `test/`: kiểm thử HTTP, refresh phiên, ghế trùng, cấu hình và giao diện.

## Chức năng

Tìm chuyến, sắp xếp theo giờ/giá/đánh giá, chọn nhiều ghế theo ngày, đăng nhập/đăng ký, đặt vé, vé của tôi, tra cứu bằng mã và điện thoại, cập nhật/hủy vé, tin tức/ưu đãi và thanh toán VNPAY sandbox.

Dữ liệu lấy trực tiếp từ backend. Đặt vé yêu cầu đăng nhập. Tiền mặt/chuyển khoản cần nhà xe xác nhận. VNPAY mở trình duyệt Android; khi quay về bấm cập nhật trạng thái. Backend cần cấu hình VNPAY theo hướng dẫn trong DatVeXe. Không tự đánh dấu đã trả tiền. Phiên chỉ lưu trong bộ nhớ, đóng ứng dụng cần đăng nhập lại.

Hiện hỗ trợ Android; chưa cấu hình iOS/Web. Đã bổ sung khu vực nhân viên/quản lý trên Flutter; đã có trang admin và quản lý xe/chuyến/doanh thu riêng cho chủ nhà xe theo quyền API. HTTP được cho phép để kết nối backend local; khi phát hành dùng HTTPS và cấu hình signing riêng. Chưa xác minh đặt vé/thanh toán xuyên suốt với SQL Server thật vì backend chưa chạy trong các lần kiểm tra trước.

## Đồng bộ với web

Chi tiết đối chiếu, thay đổi và cách chạy kiểm thử với router Express thật: [docs/API_SYNC.md](docs/API_SYNC.md).

Flutter hiện hỗ trợ bộ lọc backend, xem chi tiết chuyến, theo dõi thời hạn giữ ghế, VNPAY theo capabilities, QR cho từng vé đã thanh toán và kiểm tra/gửi lại email vé. Khi quay lại từ trình duyệt thanh toán, ứng dụng tự đọc lại trạng thái; máy chủ vẫn quyết định kết quả.

Kiểm thử trực tiếp router web (không ghi DB):

```powershell
flutter test --dart-define=BACKEND_ROOT=C:/QLDA/DatVeXe/backend
```

## Điện thoại qua ngrok

Cấu hình hiện tại: `API_BASE_URL=https://handed-employer-radio.ngrok-free.dev/api` trong `.env`. Tunnel hiện trỏ tới Vite 5173; `vite.config.js` proxy `/api` sang backend 3000. Cần cả backend, frontend Vite và ngrok đang chạy. Nếu chuyển tunnel trực tiếp sang backend 3000, URL Flutter vẫn phải kết thúc bằng `/api`.

`10.0.2.2` chỉ dùng cho Android Emulator, không dùng trên điện thoại thật. Bật ngrok không tự thay đổi URL trong Flutter. `.env` là asset đóng gói trong APK: sửa xong phải chạy lại bằng `flutter run` hoặc build và cài APK mới; đóng/mở APK cũ không cập nhật cấu hình. Trong tab Tài khoản, xem **Kết nối máy chủ** để xác nhận URL thực tế của bản đang cài. Khi domain ngrok đổi cần cập nhật `.env` và build/cài lại.

Kiểm tra đọc API thật theo `.env`, không tạo đơn:

```powershell
flutter test tool/check_api_test.dart
```

## Nhân viên và quản lý

Tài khoản staff/manager có quyền nhà xe sẽ có tab **Làm việc** sau đăng nhập: quản lý vé/khách hàng, thu tiền, bán và đổi vé tại quầy, QR, email vé. Quản lý có thêm trang nhân viên và đối soát thanh toán. Camera chỉ xin quyền khi mở quét QR; có thể dán dữ liệu QR khi không dùng camera.

Xem [hướng dẫn trang và phân quyền](docs/OPERATOR_GUIDE.md). Cần cài APK mới để có các trang này.

## Đồng bộ Develops

Xem [báo cáo đồng bộ](docs/DEVELOPS_SYNC.md) để biết phạm vi, phiên bản nguồn và kiểm thử mới nhất.

