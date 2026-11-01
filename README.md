# Rightway - Hệ thống Đặt Vé Xe Trực Tuyến & Trang Quản Trị Admin

Dự án fullstack đặt vé xe khách Rightway gồm **Backend Express (JavaScript + Prisma + SQL Server)** và **Frontend React (Vite + React Router)** mô phỏng sát 100% thiết kế giao diện Figma, kèm theo **Trang Quản trị Admin**.

---

## Tổng quan giao diện

1. **Trang chủ (`/`)**:
   - Hero banner "Hành trình đẹp hơn cùng Rightway", các huy hiệu bảo đảm dịch vụ.
   - Thanh tìm kiếm chuyến xe (Điểm đi, Điểm đến, Ngày đi, Số hành khách).
   - Thao tác nhanh: Tra cứu vé, Đổi/Hủy vé, Vé của tôi, Hỗ trợ khách hàng.
   - Ưu đãi nổi bật với các thẻ khuyến mãi.
   - Tuyến xe phổ biến dạng bảng biểu có gắn thẻ trạng thái.
   - Tin tức mới nhất và Footer chuẩn nhận diện thương hiệu.

2. **Tìm vé & Bộ lọc (`/search`)**:
   - Thanh tóm tắt lộ trình tìm kiếm.
   - Bộ lọc chi tiết: Khung giờ khởi hành, Hãng xe, Khoảng giá, Đánh giá sao.
   - Danh sách thẻ chuyến xe (giờ đi - thời gian - giờ đến, nhà xe, hạng ghế, giá vé).

3. **Chọn chỗ ngồi (`/booking/seats`)**:
   - Quy trình 4 bước: Chọn chuyến -> Chọn chỗ -> Thông tin hành khách -> Thanh toán.
   - Sơ đồ ghế tầng dưới / tầng trên, hiển thị trực quan trạng thái ghế: *Trống*, *Đang chọn*, *Đã đặt*.
   - Khung thông tin đặt vé tóm tắt ở cột phải.

4. **Thông tin hành khách (`/booking/passenger`)** & **Thanh toán (`/booking/payment`)**.

5. **Trang Quản trị Admin (`/admin`)**:
   - Bảng điều khiển (Dashboard) thống kê đặt vé, doanh thu, thành viên, chuyến xe.
   - Quản lý chuyến xe (`/admin/trips`)
   - Quản lý tuyến đường (`/admin/routes`)
   - Quản lý nhà xe (`/admin/companies`)
   - Quản lý đơn đặt vé (`/admin/bookings`)
   - Quản lý khuyến mãi (`/admin/promotions`)
   - Quản lý tin tức (`/admin/news`)
   - Quản lý người dùng (`/admin/users`)


---

## Cài đặt & Khởi chạy

### 1. Yêu cầu môi trường
- **Node.js**: 22.12+ hoặc 24.x, kèm npm. Vite hiện tại yêu cầu Node `^20.19.0 || >=22.12.0`.
- **Database**: Microsoft SQL Server; có thể chạy bằng Docker Compose.

### 2. Cài đặt thư viện dependencies

Mở terminal tại thư mục gốc `DatVeXe`, cài riêng cho cả backend và frontend:

```powershell
cd backend
npm ci
cd ../frontend
npm ci
cd ..
```

`npm ci` cài cả `dependencies` và `devDependencies` theo `package-lock.json`. Nếu có lệnh lỗi, xử lý lỗi trước khi tiếp tục. Không cần cài từng thư viện thủ công hoặc cài global.

| Thư mục | Các thư viện chính |
| --- | --- |
| `backend` | Express, Prisma và `@prisma/client`, bcryptjs, JWT, Zod, Nodemailer, ExcelJS, pdfmake, qrcode |
| `frontend` | React, React Router, Axios, Bootstrap Icons, xlsx, `@zxing/browser`, `@zxing/library`; Vite và ESLint để phát triển/build |

Khi chủ động thêm/cập nhật dependency, dùng `npm install <tên-thư-viện>` trong đúng thư mục, hoặc `npm install -D <tên-thư-viện>` cho công cụ phát triển, rồi lưu cả `package.json` và `package-lock.json`.

Nếu Vite báo không tìm thấy `@zxing/library`, chạy `npm ci` trong `frontend`, sau đó khởi động lại `npm run dev`. Dependency này đã được khai báo sẵn trong dự án.

### 3. Cấu hình môi trường và SQL Server

Từ thư mục gốc, tạo file môi trường nếu chưa có (PowerShell):

```powershell
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

Sửa `backend/.env` theo môi trường của bạn:

- `DATABASE_URL`: kết nối SQL Server. `integratedSecurity=true` trong file mẫu dành cho Windows Authentication; Docker/Ubuntu cần tài khoản và mật khẩu SQL Server.
- `JWT_ACCESS_SECRET`: đặt khóa riêng tối thiểu 32 ký tự. Có thể tạo bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `PORT=3000`, `CORS_ORIGIN=http://localhost:5173` cho môi trường local.
- `DEMO_SEED_PASSWORD`: tùy chọn, áp dụng cho tài khoản demo **mới**; tối thiểu 12 ký tự, tối đa 72 byte UTF-8.

Nếu dùng Docker, đặt `MSSQL_SA_PASSWORD` trong `backend/.env` thành mật khẩu đủ mạnh và sửa `DATABASE_URL` tương ứng, ví dụ (thay giá trị mẫu ở cả hai dòng):

```dotenv
MSSQL_SA_PASSWORD="CHANGE_ME_StrongPassword123!"
DATABASE_URL="sqlserver://localhost:1433;database=DatVeXe;user=sa;password=CHANGE_ME_StrongPassword123!;encrypt=true;trustServerCertificate=true;schema=dbo"
```

Khởi động Docker SQL Server từ thư mục gốc:

```powershell
docker compose --env-file backend/.env up -d db
```

Chờ SQL Server sẵn sàng trước khi migrate. Nếu dùng SQL Server đã cài trên máy, bỏ qua bước Docker. Không chạy hai SQL Server cùng chiếm cổng 1433.

### 4. Tạo schema và seed dữ liệu

Từ thư mục gốc, chạy lần lượt trong `backend`:

```powershell
cd backend
npx prisma migrate deploy
npm run db:generate
npm run db:seed
```

`migrate deploy` áp dụng các migration và có thể tạo DB `DatVeXe` nếu chưa tồn tại, khi tài khoản SQL có quyền tạo database. `db:generate` tạo Prisma Client theo schema hiện tại.

| File seed | Cách chạy / nội dung |
| --- | --- |
| `backend/prisma/seed.js` | `npm run db:seed`: điểm chạy chính, tạo tài khoản, nhà xe, xe, tuyến, chuyến, booking/ticket demo, biên nhận, ghế, khuyến mãi và tin tức |
| `backend/prisma/seed-catalog.js` | Danh mục nhà xe/tuyến/ảnh được `seed.js` sử dụng; không cần chạy riêng |
| `backend/prisma/seed-rbac.js` | `seed.js` gọi `seedRbac` để ghi 5 vai trò và quyền vào DB; không cần chạy riêng |
| `backend/prisma/seed-bookings.js` | Script bổ sung 24 booking lịch sử và 24 ticket; chạy riêng nếu cần |

Trên DB mới, seed chính tạo **11 tài khoản, 5 vai trò, 12 quyền, 3 nhà xe, 3 xe, 6 tuyến, 24 chuyến, 6 booking và 6 ticket**. Để thêm bộ booking lịch sử, tiếp tục trong thư mục `backend`:

```powershell
node -r dotenv/config prisma/seed-bookings.js
```

Script bổ sung bỏ qua nếu tổng booking đã từ 10 trở lên. Nếu chạy ngay sau seed chính trên DB mới, kết quả là **30 booking và 30 ticket**. Booking lịch sử không có biên nhận hoặc bản ghi giữ ghế; xem giới hạn chi tiết trong [SEED_DEMO.md](SEED_DEMO.md).

Tài khoản admin mặc định là `admin.seed@rightway.test`, mật khẩu `RightwayDemo@2026` **chỉ khi không đặt `DEMO_SEED_PASSWORD`**. VPS có cấu hình mật khẩu riêng trong `backend/.env`; không dùng mật khẩu mặc định của local để suy ra mật khẩu VPS. Chạy seed lại giữ nguyên mật khẩu tài khoản đã tồn tại, kể cả khi bạn đổi biến môi trường.

Seed chính bị chặn khi `NODE_ENV=production`; chỉ khi chủ động nạp dữ liệu demo mới chạy `ALLOW_DEMO_SEED=true npm run db:seed` trên Ubuntu, hoặc đặt `$env:ALLOW_DEMO_SEED='true'` trước lệnh seed trên PowerShell và xóa biến sau khi dùng. Không reset DB để seed bổ sung vì reset sẽ xóa dữ liệu hiện có.

### 5. Khởi chạy Backend API

Mở terminal tại thư mục gốc:

```powershell
cd backend
npm run dev
```
API server chạy tại: `http://localhost:3000`

### 6. Khởi chạy Frontend

Mở một terminal mới tại thư mục gốc:

```powershell
cd frontend
npm run dev
```
Trang web mở tại: `http://localhost:5173`

- Truy cập trang khách hàng: `http://localhost:5173/`
- Truy cập trang quản trị Admin: `http://localhost:5173/admin`

Frontend mặc định gọi API tại `http://localhost:3000/api`. Nếu backend chạy ở địa chỉ khác, đặt `VITE_API_URL` trong `frontend/.env` rồi khởi động lại Vite. Kiểm tra build bằng `npm run build` trong `frontend`.

## Dữ liệu đặt chỗ

- `Booking` là đơn đặt chỗ, liên kết người dùng, chuyến và ngày đi; lưu thông tin liên hệ, tổng tiền, trạng thái đơn và thanh toán.
- `Ticket` là vé cho từng ghế trong một booking; mỗi vé có mã riêng, ghế, bản chụp thông tin hành khách, giá tại thời điểm đặt và trạng thái vé. Một booking có thể chứa nhiều ticket.
- `SeatStatus` quản lý tính khả dụng của ghế theo chuyến và ngày, đồng thời liên kết booking/ticket đang giữ ghế. Booking, ticket và thao tác giữ ghế được lưu trong cùng một transaction.

Sau khi cập nhật cấu trúc Prisma, chạy `npx prisma db push` trong thư mục `backend` để cập nhật cơ sở dữ liệu.

Tài khoản người dùng có trạng thái hoạt động hoặc bị khóa. Sau khi cập nhật schema, chạy lại `npx prisma db push` và `npx prisma generate` trong thư mục `backend`. Quản trị viên có thể dùng `GET /api/admin/users/:userId/status`, `POST /api/admin/users/:userId/lock` và `POST /api/admin/users/:userId/unlock`. Khóa tài khoản sẽ thu hồi các phiên đang hoạt động; tài khoản bị khóa không thể đăng nhập, làm mới phiên hoặc gọi API được bảo vệ.

### API quản lý booking dành cho Admin

- `GET /api/admin/bookings` trả về danh sách booking kèm khách hàng, chuyến, xe, vé và ghế. Hỗ trợ lọc bằng `search`, `status`, `paymentStatus`, `date` (ngày khởi hành) hoặc `fromDate`/`toDate` (khoảng ngày khởi hành).
- `GET /api/admin/bookings/:id` trả về chi tiết booking và các dữ liệu liên quan.
- `PATCH /api/admin/bookings/:id/status` nhận JSON `{ "status": "confirmed" }`. Trạng thái cho phép chuyển `pending` sang `confirmed` hoặc `cancelled`, `confirmed` sang `completed` hoặc `cancelled`. Hủy booking đã thanh toán sẽ chuyển thanh toán thành `refunded`; ghế và vé được cập nhật trong cùng transaction.

Trạng thái không hợp lệ hoặc không thể chuyển sẽ trả HTTP 409 cùng mã lỗi cụ thể; booking không tồn tại trả HTTP 404.

### Phát hiện vé trùng lặp và bất thường

- [x] Xác định các thuộc tính dùng để đánh giá khả năng trùng vé.

Các thuộc tính đã được sử dụng trong `backend/src/modules/admin/anomalies.service.js` (`bookingAnomalySelect`, `scoreBookings`):

| Nhóm thuộc tính | Thuộc tính | Cách đánh giá hiện tại |
| --- | --- | --- |
| Chuyến, ngày và ghế | `tripId`, `tripDate`, `tickets[].seatCode` (dự phòng bằng `Booking.seatCode`) | Cùng chuyến, cùng ngày và cùng ghế ở nhiều booking đang hoạt động: +70 điểm. Mã ghế được bỏ khoảng trắng đầu/cuối và chuyển thành chữ hoa. |
| Danh tính, liên hệ | `passengerPhone`, `passengerEmail`, `userId` | Trùng ít nhất một thuộc tính ở nhiều booking cùng chuyến/ngày: +25 điểm, không cộng lặp theo từng thuộc tính. Điện thoại chỉ giữ chữ số; email bỏ khoảng trắng đầu/cuối và chuyển thành chữ thường. |
| Tên hành khách | `passengerName` kết hợp điện thoại/email | Tên trùng hoặc có độ tương đồng bigram từ 0,84 trong cùng chuyến/ngày, nhưng có thông tin liên hệ khác nhau: +15 điểm. Tên được chuẩn hóa chữ thường, bỏ dấu và ký tự ngoài chữ/số. |
| Thời điểm đặt | `createdAt` kết hợp điện thoại/email/tài khoản | Cùng danh tính tạo ít nhất 4 booking đang hoạt động trong cửa sổ 10 phút: +35 điểm; có thể thuộc các chuyến khác nhau. |
| Trạng thái đơn | `status` | Chỉ `pending`, `confirmed`, `completed` tham gia đối chiếu trùng ghế, lặp danh tính, tên tương tự và đặt dồn; booking `cancelled` được loại khỏi các đối chiếu này. |

Các trường `totalPrice`, giá vé, thông tin hành khách trên vé, `paymentStatus`, trạng thái vé và liên kết `SeatStatus` còn được dùng để phát hiện dữ liệu bất nhất. Đây là các tín hiệu bất thường bổ sung, không phải khóa xác định trùng ghế. `bookingCode` và `ticketCode` phục vụ tra cứu/hiển thị.

Đã xác minh bằng `node --test tests/anomalies.service.test.js` trong thư mục `backend`: 11/11 kiểm thử đạt (27/10/2026).

- Trang `/admin/anomalies` phân tích booking, vé và trạng thái ghế; API `GET /api/admin/anomalies` hỗ trợ tìm kiếm, lọc theo `tripId`, ngày khởi hành/mức rủi ro/trạng thái rà soát và phân trang. `GET /api/admin/anomalies/:bookingId` trả chi tiết vé nghi vấn, điểm, lý do và booking liên quan cùng chuyến; nếu booking không tồn tại hoặc không có phát hiện thì trả HTTP 404. Các endpoint yêu cầu xác thực và vai trò `admin`.
- Điểm nghi ngờ cộng theo tín hiệu: ghế trùng giữa booking đang hoạt động (+70), thông tin liên hệ lặp lại cùng chuyến/ngày (+25), 4+ booking trong cửa sổ 10 phút (+35), tên tương tự/trùng nhưng liên hệ khác nhau (+15), ghế/giá/thông tin hành khách/trạng thái vé không nhất quán (+25–35). Điểm hiển thị giới hạn 100; mức thấp 15–39, trung bình 40–69, cao từ 70.
- Chỉ thông tin tên đã che một phần được trả về từ API; số điện thoại và email chỉ được dùng nội bộ để so khớp, không đưa vào kết quả. Hệ thống quét tối đa 2.000 booking gần nhất mỗi lần; lọc ngày hoặc tìm kiếm để thu hẹp phạm vi khi được cảnh báo giới hạn.
- `PATCH /api/admin/anomalies/:bookingId/review` nhận `{ "status": "open" }` (chưa xử lý), `{ "status": "in_review" }` (đang kiểm tra), `{ "status": "reviewed" }` (đã xác nhận) hoặc `{ "status": "false_positive" }` (không phải bất thường), kèm `note` tùy chọn tối đa 500 ký tự. Trạng thái rà soát được lưu riêng trong `BookingAnomalyReview`; việc gắn cờ/đánh dấu không tự động hủy, sửa trạng thái booking hay giải phóng ghế.
- Sau khi cập nhật schema, chạy `npx prisma db push` và `npx prisma generate` trong thư mục `backend` để tạo bảng trạng thái rà soát. Cơ chế này là kiểm tra hậu kiểm, không thay thế unique constraint của `SeatStatus` hoặc transaction đặt ghế SERIALIZABLE.

### Thống kê Dashboard Admin

`GET /api/admin/dashboard` trả tổng số người dùng, booking, chuyến và nhà xe; số chuyến đang hoạt động; booking theo trạng thái; booking theo trạng thái thanh toán; doanh thu; 7 ngày, 8 tuần và 6 tháng thống kê booking/doanh thu; 5 tuyến có doanh thu cao nhất; 5 nhà xe có nhiều chuyến nhất và 10 booking mới nhất. Booking và doanh thu theo thời gian được nhóm theo ngày tạo booking (`createdAt`, UTC). Doanh thu chỉ tính booking có `paymentStatus: "paid"`; booking đã hoàn tiền không còn được tính. Schema hiện không có bản ghi giao dịch hoặc thời điểm thanh toán riêng, nên biểu đồ dùng ngày tạo booking làm mốc thời gian.

### Import chuyến xe từ Excel

- `POST /api/admin/trips/import/preview` đọc và kiểm tra file multipart Excel, field tên `file`; `POST /api/admin/trips/import` import các dòng hợp lệ. Cả hai endpoint nhận query `sheetName`; nếu bỏ trống sẽ dùng sheet đầu tiên.
- Chấp nhận `.xlsx`, giới hạn 5 MB, 20 MB sau giải nén và 300 dòng dữ liệu. Header bắt buộc: `routeId`, `busId`, `companyId`, `departureTime`, `arrivalTime`, `duration`, `price`. Header tùy chọn: `availableDate`, `isActive`. Ví dụ: `routeId=route_1`, `busId=bus_1`, `companyId=company_1`, `departureTime=08:30`, `arrivalTime=13:00`, `duration=4h30`, `price=250000`, `availableDate=2026-10-25`, `isActive=true`.
- ID tuyến/xe/nhà xe phải tồn tại và xe phải thuộc đúng nhà xe. Giá phải là số nguyên dương; thời gian dùng `HH:mm`; ngày có dạng `YYYY-MM-DD` hoặc ô ngày Excel; `isActive` chấp nhận boolean hoặc `1`/`0`. Bỏ trống `availableDate` nghĩa là chuyến định kỳ.
- Preview trả `totalRows`, `validRows`, `invalidRows` và tối đa 100 dòng xem trước kèm lỗi từng dòng. Import kiểm tra lại file, bỏ qua dòng sai/trùng và trả `importedRows`, `failedRows`, `validationFailures`, `importFailures`. Trùng lịch được xác định theo tuyến, xe, nhà xe, giờ khởi hành và ngày chạy; dòng lỗi không được ghi vào database.
- Giao diện tại `/admin/trips` cho phép chọn file, chọn sheet tùy chọn, xem lỗi theo dòng/cột trước khi ghi, xác nhận import và xem số dòng thành công/thất bại. Backend tests chạy bằng `npm test` trong thư mục `backend`.

### Xuất chuyến xe ra Excel

- `GET /api/admin/trips/export-excel` xuất danh sách chuyến xe ra `.xlsx`. Endpoint nằm trong router Admin, yêu cầu xác thực và vai trò `admin`; workbook gồm mã chuyến, tuyến, xe, nhà xe, giờ đi/đến, thời lượng, giá vé, ngày chạy và trạng thái.
- Trang `/admin/trips` có nút **Xuất Excel** để tải file về. Nếu không có chuyến xe, API trả HTTP 404 với mã `NO_TRIPS_TO_EXPORT`; các lỗi khác được chuyển qua error handler chung.


### Khu vực nhà xe và nhân viên

Mỗi tài khoản có tối đa một `CompanyMembership`, tách khỏi vai trò admin toàn hệ thống. Đăng ký công khai không được tự gán quyền nhà xe.

| Vai trò | Khu vực | Quyền |
| --- | --- | --- |
| Chủ nhà xe (`owner`) | `/company/bookings`, `/company/buses`, `/company/trips`, `/company/employees`, `/company/revenue` | Quản lý xe, chuyến, vé, thu tiền, nhân viên và doanh thu trong nhà xe; cấp quyền quản lý hoặc nhân viên thường. |
| Quản lý (`manager`) | `/staff/bookings`, `/staff/customers`, `/staff/employees` | Quản lý vé, thu tiền, sửa liên hệ hành khách; tạo, sửa tên, khóa/mở quyền làm việc của nhân viên thường. Không tự nâng quyền hoặc chỉnh sửa quản lý/chủ nhà xe. |
| Nhân viên thường (`staff`) | `/staff/bookings`, `/staff/customers` | Duyệt/hủy/hoàn thành vé, xác nhận thu tiền, tìm và cập nhật thông tin khách trên vé đang hoạt động. |
| Admin | `/admin/company-access`, `/admin/payments` | Gán tài khoản hiện có vào nhà xe và vai trò; thu hồi quyền; ghi nhận khoản thu cho booking. |

**Bắt đầu:** cập nhật schema bằng `npm run db:push`, tạo Prisma Client bằng `npm run db:generate`, rồi đăng nhập admin và mở **Phân quyền nhà xe**. Chọn tài khoản và nhà xe, gán vai trò chủ nhà xe. Người đó đăng nhập lại để vào khu vực làm việc và tạo nhân viên. Backend kiểm tra membership hiện hành trong mọi request nghiệp vụ, nên khóa/thu hồi có hiệu lực ở request kế tiếp, kể cả khi token chưa hết hạn.

API `/api/operator/*` luôn lấy `companyId` từ membership đã xác thực; client không được chọn nhà xe để mở rộng phạm vi. Quản lý/nhân viên không được gọi các endpoint xe, chuyến và doanh thu. Thông tin khách được sửa theo từng đơn, đồng bộ các ticket trong transaction; không thay đổi hồ sơ tài khoản khách hàng toàn hệ thống. Xe có vé đang hoạt động không được đổi số ghế. Chuyến có lịch sử booking không được đổi xe/tuyến/ngày/giờ khởi hành hoặc xóa; có thể tạm dừng bán.

### Ghi nhận thanh toán và tra cứu an toàn

- Trang đặt vé hỗ trợ `cash` (tiền mặt) và `bank_transfer` (chuyển khoản xác nhận thủ công). Đã tích hợp MoMo merchant (cấu hình ở phần dưới); chưa tích hợp VNPAY/thẻ. Lựa chọn phương thức không tự đánh dấu đã trả tiền.
- Sau khi kiểm tra tiền thực nhận, người có quyền mở **Quản lý vé → Ghi nhận thu tiền**, chọn phương thức và nhập mã tham chiếu nếu chuyển khoản. `POST /api/operator/bookings/:id/payment` hoặc `/api/admin/bookings/:id/payment` nhận `{ "method": "bank_transfer", "reference": "BANK-001" }` hoặc `{ "method": "cash" }`. API lấy số tiền từ booking, ghi `PaymentReceipt` với người xác nhận và thời điểm; ngăn thu trùng và thu trên đơn đã hủy.
- Thống kê nhà xe lọc theo ngày thu tiền (giờ Việt Nam), chỉ tính biên nhận có booking còn `paid`; hiển thị riêng khoản đã ghi nhận hoàn tiền. Booking cũ được seed `paid` nhưng không có biên nhận không nằm trong thống kê khoản thu của nhà xe. Dashboard admin hiện có vẫn theo ngày tạo booking như đã mô tả ở trên.
- Hủy đơn đã thu tiền ghi nhận `refunded` trong sổ theo dõi; ứng dụng không tự chuyển tiền qua ngân hàng. Nhà xe thực hiện hoàn tiền bên ngoài hệ thống.
- `/api/bookings/my` và `/my-bookings` yêu cầu đăng nhập, chỉ lấy `userId` từ phiên. Xem/tra cứu/hủy một booking cần tài khoản sở hữu hoặc đúng điện thoại đặt vé. Khách vãng lai cần nhập mã vé và điện thoại. Booking `completed` không được hủy; ngày khởi hành đã qua (theo múi giờ Việt Nam) không được đặt.
- Frontend có thể cấu hình URL API bằng `VITE_API_URL`, mặc định `http://localhost:3000/api`.


### Giữ ghế 5 phút, vé tại quầy và QR

- Tạo booking là thời điểm bắt đầu giữ ghế: `expiresAt = now + 5 phút`, SeatStatus là `held`. Mọi đơn chưa thanh toán (kể cả đã duyệt) hết hạn sẽ chuyển `cancelled`, vé bị hủy, ghế giải phóng trong cùng transaction. Không gia hạn khi tải lại trang hoặc thử thanh toán. Đơn cũ chưa có `expiresAt` tính hạn bằng `createdAt + 5 phút`.
- Worker giải phóng ghế chạy mỗi 5 giây khi khởi động bằng `npm start`/`npm run dev`; việc tìm chuyến, xem ghế, tạo đơn và thu tiền cũng kiểm tra hạn. Hạn thanh toán được kiểm tra tại giao dịch, không dựa vào đồng hồ trình duyệt. Worker email chạy riêng, SMTP chậm không làm chậm giải phóng ghế.
- Trang `/staff/counter` (chủ nhà xe: `/company/counter`) bán vé tại quầy. Nhân viên chọn chuyến/ngày/ghế, nhập tên, điện thoại, email, xác nhận đã thu đủ tiền mặt/chuyển khoản. Booking, tickets, ghế, biên nhận và job gửi email được ghi cùng transaction; vé được xác nhận ngay.
- `/staff/exchange` hoặc `/company/exchange`: tìm vé đã thanh toán, chưa lên xe và chưa khởi hành, chọn chuyến/ghế mới trong cùng nhà xe, giữ nguyên số vé. API báo giá trước khi đổi; xác nhận số tiền thu thêm hoặc hoàn lại tại quầy. BookingChange lưu lịch sử, người xử lý, chênh lệch và mã tham chiếu. Biên nhận gốc được giữ nguyên; thống kê cộng/trừ các khoản chênh lệch đúng ngày xử lý. QR cũ bị vô hiệu; QR mới được gửi lại qua email.
- `/staff/qr-info` hoặc `/company/qr-info`: quét camera, chọn ảnh QR hoặc dán nội dung mã để xem thông tin, không thay đổi trạng thái vé.
- `/staff/qr-board` hoặc `/company/qr-board`: chọn chuyến hôm nay, quét, kiểm tra thông tin và nhấn **Xác nhận khách đã lên xe**. API kiểm tra chữ ký, phiên bản QR, nhà xe, chuyến, ngày, trạng thái thanh toán, trạng thái vé và chống xác nhận trùng. Camera cần HTTPS hoặc localhost và quyền camera của trình duyệt; chọn ảnh là phương án thay thế.
- QR được ký HMAC-SHA256, chứa mã vé, ghế, tên hành khách, chuyến, tuyến, ngày/giờ và phiên bản. Không chứa email/điện thoại hoặc khóa bí mật. Trạng thái hiệu lực luôn lấy từ database; không tin thông tin tự khai trong mã QR. QR của booking cũ không có hiệu lực sau đổi vé/sửa liên hệ.
- Sau thu tiền hoặc IPN MoMo hợp lệ, đơn tự chuyển `confirmed/paid`, ticket được xác nhận và `TicketEmailJob` được tạo trong cùng transaction. Job email chứa phiên bản vé, tự thử lại khi SMTP lỗi, không làm mất giao dịch thanh toán. Job của phiên bản cũ bị bỏ qua. Có thể tải QR tại trang tra cứu và yêu cầu gửi lại email tới đúng địa chỉ đã lưu trên đơn. Trong trường hợp tiến trình dừng sau khi SMTP nhận thư nhưng trước khi ghi trạng thái, email có thể được gửi lặp; tính hợp lệ và chống quét trùng vẫn theo database.

### Tích hợp VNPAY (hiện hành)

- `POST /api/ticketing/bookings/:id/vnpay`: tạo URL đã ký HMAC-SHA512, lấy số tiền từ database nhân 100, thời gian GMT+7, `vnp_ExpireDate` bằng hạn giữ ghế gốc.
- `GET /api/ticketing/vnpay/ipn`: xác minh chữ ký, TmnCode, mã giao dịch, số tiền và cả ResponseCode/TransactionStatus. Trả JSON RspCode theo giao thức VNPAY: 00 đã ghi nhận, 02 đã xử lý, 01 không tìm thấy, 04 sai số tiền, 97 sai chữ ký, 99 lỗi. Chỉ IPN hợp lệ ghi khoản thu/cấp QR/xếp lịch email; `/payment/vnpay-return` chỉ đọc trạng thái.
- PaymentAttempt có `provider` để cách ly VNPAY và giao dịch lịch sử MoMo. URL tạo thanh toán MoMo đã đóng; callback MoMo cũ được giữ cho đối soát lịch sử.
- Trang đối soát dùng tên chung **Đối soát thanh toán**, admin tại `/admin/payment-issues`, nhà xe/quản lý tại khu vực riêng. Khoản trả muộn không lấy lại ghế đã giải phóng, được gắn cờ cần hoàn tiền thủ công.
- Test SQL Server dùng fixture riêng; bộ kiểm thử chạy nối tiếp vì dùng chung database phát triển. `npm test` kiểm tra mock/unit, `$env:RUN_DB_TESTS='1'; npm test` bật cả tích hợp. Không tạo giao dịch ở cổng thật.


### Vận hành VNPAY và email

Admin có trang `/admin/integrations`; nhà xe/nhân viên có `/company/email-jobs` và `/staff/email-jobs`. Trang quản trị cho kiểm tra kết nối, gửi thư thử tới chính email tài khoản quản trị, xem giao dịch và hàng đợi. Gửi lại email luôn kiểm tra trạng thái paid, phiên bản QR, nhà xe và thời gian chờ; không cho truyền email nhận tùy ý. Khách có API `/api/ticketing/bookings/:id/delivery` được bảo vệ bằng tài khoản sở hữu hoặc số điện thoại đúng để xem trạng thái gửi vé.

Chạy `npm run integrations:check` trong backend để kiểm tra các kết nối mà không gửi thư/thu tiền. Cổng 587 dùng `SMTP_SECURE=false` + STARTTLS; cổng 465 dùng `true`. Hướng dẫn đầy đủ: [HUONG_DAN_VNPAY_EMAIL.md](HUONG_DAN_VNPAY_EMAIL.md). Khi chạy integration tests với database phát triển, tạm dừng server/worker dùng cùng DB để worker thật không xử lý fixture email của tests.

## Bộ seed và tài khoản demo

Xem [SEED_DEMO.md](SEED_DEMO.md) để biết 5 vai trò lưu trong database, tài khoản demo, cách chạy migration/seed và nguồn dữ liệu/ảnh nhà xe.
