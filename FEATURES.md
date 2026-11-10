# Tính năng CFOP Solver Studio

Danh sách tính năng thực sự có trong mã nguồn (không chứa Practice Lab hay PDF Evidence Sheet — hai tính năng này không còn được triển khai).

## 1. Bộ giải CFOP (Solver)

- Giải khối Rubik 3×3 theo phương pháp CFOP từ scramble (chuỗi quay) hoặc trạng thái sáu mặt (cube state).
- Hỗ trợ màu ramo tùy chọn (cross color) và nhiều kiểu mở đầu: Cross, XCross, XXCross, XXXCross, XXXXCross,_auto_.
- Hiển thị báo cáo từng phase (Cross, F2L, OLL, PLL) với số node, thời gian và trạng thái trung gian.
- Xem lại scramble từng bước và effect 3D (Three.js).
- Bộ giải chạy trong trình duyệt nhờ Pyodide (Web Worker), không gửi scramble lên server.

## 2. Bấm giờ (Timer Lab)

- Đa sự kiện: 3×3, 2×2, 4×4, 5×5, 6×6, 7×7, 3×3 Thế mắt (3BLD), v.v.
- Bộ đếm ngược inspection, phạt +2/DNF, chia split (F2L, OLL, PLL).
- Lịch sử solve, thống kê (best, average ao5/ao12, mittler, deviation) và replay solve.

## 3. Học tập (Study)

- Học Last Layer (OLL/PLL) và 3-Style BLD (m记住 cácケース, đánh dấu đã thành thạo).
- Theo dõi tiến độ ôn tập và streak hàng ngày.

## 4. Tài khoản CFOP (Account)

- Đăng ký/đăng nhập, đổi mật khẩu, quên mật khẩu (email reset).
- Hồ sơ: tên hiển thị, tiểu sử, avatar, mục tiêu solve.
- Đồng bộ dữ liệu (cloud state): Timer, Study, BLD giữa nhiều thiết bị (tùy chọn, cần cấu hình storage).
- Liên kết tài khoản WCA qua OAuth (chỉ qua OAuth, không nhập mã WCA tay).

## 5. Phòng thi đấu (Rooms)

- Tạo/tham gia phòng thi, chọn sự kiện và số vòng.
- Chat trong phòng, gửi kết quả, bảng xếp hạng phòng.
- Quản lý spectator/moderator, xóa spectator, rematch.

## 6. WCA

- Xem lịch thi đấu WCA (theo ngày, quốc gia).
- Xem hồ sơ và thành tích WCA của cầu thủ.
- Liên kết tài khoản WCA với CFOP qua OAuth (https).

## 7. Cài đặt & Khác

- Chọn chủ đề sáng/tối, ngôn ngữ (Tiếng Việt/Tiếng Anh).
- Khóa bí mật (passkey) tùy chọn.
- Trang strips/thông tin về dự án.

## Không có (đã loại)

- **Practice Lab** — tính năng này đã được gộp vào Timer/Study, không còn tồn tại như một trang riêng.
- **PDF Evidence Sheet** — không có xuất PDF bằng chứng solve.

## Chạy mà không cần Database

Ứng dụng có thể chạy phần lớn tính năng phía client (Solver, Timer, Study, xem scramble) mà không cần Database. Database chỉ cần cho: tài khoản CFOP, đồng bộ cloud, phòng thi đấu, WCA OAuth. Xem thêm tại [Môi trường phát triển](docs/development/project-guide.md).
