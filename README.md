# DatVeXe API

Backend API cho ứng dụng đặt vé xe, xây dựng bằng Express, TypeScript, Prisma và Microsoft SQL Server.

## Chức năng

- Đăng ký tài khoản, băm mật khẩu bằng bcrypt và đăng nhập.
- Access token JWT thời hạn 15 phút; refresh token dạng ngẫu nhiên chỉ lưu hash trong session.
- Làm mới token có xoay vòng; logout thu hồi session và access token của session đó mất hiệu lực ngay.
- Role/permission lưu trong database. Tài khoản mới nhận role `USER`; role `ADMIN` được khởi tạo qua seed.
- Middleware xác thực JWT/session, kiểm tra role Admin và kiểm tra permission.

## Cấu trúc MVC

- `src/modules/*/*.routes.ts`: khai báo URL, middleware và controller.
- `src/modules/*/*.controller.ts`: nhận request, validate input và định dạng response.
- `src/modules/*/*.service.ts`: nghiệp vụ xác thực, session và phân quyền.
- `src/models/**/*.model.ts`: truy cập dữ liệu SQL Server qua Prisma.
- `prisma/schema.prisma`: định nghĩa các model và quan hệ database.

## Chạy local

Yêu cầu Node.js 20+, npm và Docker Compose (hoặc SQL Server 2019+ tương thích).

1. Sao chép `.env.example` thành `.env`. Đổi `MSSQL_SA_PASSWORD`, dùng cùng mật khẩu đó trong `DATABASE_URL`, thay `JWT_ACCESS_SECRET` bằng secret ngẫu nhiên dài tối thiểu 32 ký tự, và thiết lập `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
2. Khởi động SQL Server bằng `docker compose up -d db`.
3. Tạo database `DatVeXe` một lần bằng SQL Server Management Studio hoặc `sqlcmd`:

   ```sql
   IF DB_ID(N'DatVeXe') IS NULL
       CREATE DATABASE [DatVeXe];
   ```

4. Cài dependencies, tạo schema và seed dữ liệu:

	```sh
	npm install
	npx prisma migrate dev --name init
	npm run db:seed
	```

5. Chạy API bằng `npm run dev`. Mặc định API ở `http://localhost:3000`.

## API

Các endpoint nằm dưới `/api`:

| Method | Path | Mô tả |
| --- | --- | --- |
| POST | `/auth/register` | Tạo tài khoản `USER` |
| POST | `/auth/login` | Đăng nhập, trả access token và đặt refresh cookie HttpOnly |
| POST | `/auth/refresh` | Xoay vòng refresh token cookie, trả access token mới |
| POST | `/auth/logout` | Thu hồi session hiện tại và xóa refresh cookie |
| GET | `/auth/me` | Lấy user hiện tại; yêu cầu Bearer access token |
| GET | `/admin/users` | Liệt kê user; yêu cầu role `ADMIN` và `users:read` |
| PUT | `/admin/users/:userId/roles` | Cập nhật role user; yêu cầu role `ADMIN` và `users:manage` |
| GET | `/admin/roles` | Liệt kê role/permission; yêu cầu role `ADMIN` và `roles:read` |

Gửi access token qua `Authorization: Bearer <token>`. Refresh cookie chỉ áp dụng trên đường dẫn `/api/auth`; client trình duyệt cần gửi request với credentials. Cấu hình `CORS_ORIGIN`, `COOKIE_SECURE` và `COOKIE_SAME_SITE` phù hợp khi deploy. Nếu frontend và API khác site, dùng HTTPS, `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none` và bổ sung cơ chế CSRF phù hợp.

Định dạng lỗi: `{ "error": { "code": "...", "message": "..." } }`.

## Kiểm tra bằng Postman

Import `postman/DatVeXe.postman_collection.json`. Đặt `adminEmail` và `adminPassword` trong collection variables theo tài khoản đã seed, sau đó chạy API và chọn **Run collection** theo thứ tự. Collection tự sinh email đăng ký mới, lưu access token/user ID, giữ refresh cookie trong Postman cookie jar và kiểm tra cả quyền `USER`/`ADMIN`, refresh cùng logout.
