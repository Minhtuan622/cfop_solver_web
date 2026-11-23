# Tính năng của CFOP Solver Studio

Danh sách tính năng thực sự có trong mã nguồn.

## Solver

- Giải khối CFOP 3×3 (và 4×4, 5×5, 6×6, 7×7) theo chuỗi xáo trộn hoặc trạng
  thái 54 sticker.
- Chọn màu cross và kiểu mở đầu: Cross, XCross, XXCross, XXXCross, XXXXCross
  hoặc Tự động.
- Báo cáo theo từng phase (Cross, F2L, OLL, PLL), kèm cube 2D/3D và thước đo thời
  gian.
- Chạy hoàn toàn trong trình duyệt bằng bộ giải Rust biên dịch ra WebAssembly;
  file `.wasm` được phục vụ cùng ứng dụng và được lưu lại sau lần dùng đầu, nên
  bộ giải vẫn dùng được khi offline.

## Quét màu qua camera

Camera Scanner dùng `getUserMedia`, hiển thị một lưới lấy mẫu 3 × 3 và yêu cầu
quét lần lượt các mặt `U → R → F → D → L → B`. Mỗi mặt được lấy chín vùng
pixel; màu tâm của sáu mặt là calibration reference, sau đó các sticker được gán
cho tâm gần nhất theo khoảng cách màu chuẩn hoá. Tất cả diễn ra ở trình duyệt.
State 54 ký tự được đưa trở lại workbench ở chế độ `State 54`; solver hiện có
tiếp tục chịu trách nhiệm xác nhận tính hợp lệ cubie/parity.

## Timer

- Đa sự kiện: 3×3, 2×2, 4×4, 5×5, 6×6, 7×7, 3×3 Thế mắt (3BLD) và thêm.
- Inspection, +2/DNF, chia split theo phase, lịch sử solve, biểu đồ tốc độ
  OLL/PLL và replay.

## Lịch sử

- Lưu từng lần giải ở máy người dùng: thời gian, xáo trộn, số bước, ngày giờ.
- Thống kê theo ngày và theo tuần, lọc theo thể thức.

## Study

- Last Layer: nhận diện và luyện OLL/PLL với bộ dữ liệu 57 OLL và 21 PLL đã xác
  minh, hiển thị case ID và nhóm pattern, chạy timer theo case.
- 3-Style BLD: ghi nhớ, drill và lịch sử ôn tập.
- Theo dõi tiến độ ôn tập và streak hàng ngày.

## Tài khoản

- Đăng ký/đăng nhập bằng email và mật khẩu, đổi mật khẩu, quên mật khẩu.
- Hồ sơ: tên hiển thị, tiểu sử, ảnh đại diện, mục tiêu solve.
- Đồng bộ dữ liệu Timer/Study/BLD giữa nhiều thiết bị qua cloud, có gộp theo
  tombstone nên không mất dữ liệu khi hai thiết bị cùng ghi.
- Liên kết tài khoản WCA qua OAuth.

## WCA

- Lịch thi đấu WCA theo ngày và quốc gia, hồ sơ và thành tích WCA của người
  chơi, bảng kỷ lục thế giới.

## Phòng thi đấu

- Tạo/tham gia phòng, chọn thể thức và số lượt thi, gửi kết quả theo lượt.
- Chat trong phòng, quản lý khán giả và trọng tài, đấu lại.

## Bảng xếp hạng

- Bảng xếp hạng theo tuần và tháng, dựa trên kết quả thi đấu đã hoàn tất.

## Cài đặt

- Giao diện sáng/tối, ngôn ngữ Việt/Anh, khóa bí mật (passkey) và các tuỳ
  chọn thiết bị.

## Đã được gộp hoặc gỡ bỏ

- Trang luyện tập OLL/PLL cũ đã được gộp vào phần Study, không còn là một trang riêng.
- Trình xuất PDF bằng chứng solve không tồn tại.

## Chạy mà không cần Database

Ứng dụng chạy được phần lớn tính năng phía client (Solver, Timer, Study, xem
scramble) mà không cần Database. Database chỉ cần cho tài khoản CFOP, đồng bộ
cloud, phòng thi đấu và WCA OAuth. Xem thêm ở
[hướng dẫn phát triển](../development/project-guide.md).
