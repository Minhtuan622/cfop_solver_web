# Tính năng mở rộng CFOP Studio

## Quét màu qua camera

Camera Scanner dùng `getUserMedia`, hiển thị một lưới lấy mẫu 3 × 3 và yêu cầu quét lần lượt các mặt `U → R → F → D → L → B`. Mỗi mặt được lấy chín vùng pixel; màu trung tâm của sáu mặt là calibration reference, sau đó các sticker được gán cho tâm gần nhất theo khoảng cách màu chuẩn hóa. Tất cả diễn ra ở trình duyệt. State 54 ký tự được đưa trở lại workbench ở chế độ `State 54`; solver hiện có tiếp tục chịu trách nhiệm xác nhận tính hợp lệ cubie/parity.

## Practice Lab

Practice Lab dùng đúng tập dữ liệu 57 OLL và 21 PLL đã xác minh. Mỗi drill hiển thị case ID và nhóm pattern, chạy timer khi bắt đầu case mới, chỉ hiện algorithm khi được yêu cầu và lưu `attempts`, `accuracy`, `mistakes` và `average time` trong `localStorage` của trình duyệt.

## PDF Evidence Sheet

PDF exporter tạo file client-side sau khi solver trả lời giải. Mỗi sheet gồm input, tổng move, toàn bộ phases, case ID, algorithm, postcondition/invariant và chuỗi move đầy đủ. Không có state hoặc ảnh camera nào được tải lên dịch vụ bên ngoài.
