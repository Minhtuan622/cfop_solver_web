# Xác minh CubeNet 2D trực tiếp

- Tab **Màu 6 mặt** hiển thị CubeNet 2D lớn cạnh mô hình Cube 3D.
- Palette sidebar đổi được màu tô; click sticker trên CubeNet lớn cập nhật state và validation tức thì.
- Tâm sticker khóa; nhãn mặt là thao tác tô cả mặt.
- Undo khôi phục sticker vừa tô và đưa state trở về hợp lệ.
- Tab **Chuỗi xoay** chỉ giữ vùng nhập và CTA chính; các chiến lược Cross/Last Layer và F2L slot ở mục **Tùy chọn solver** gập được.

## Xác minh Last Layer Explorer và Cube 3D

- Chọn một ZBLL nạp state F2L-complete, đưa notation cỡ lớn lên ngay phía trên CubeNet 2D và vẫn highlight lớp cuối trong Cube 3D.
- Nút **Đánh dấu đã thuộc** đổi trạng thái trực tiếp, thêm dấu ✓ vào list case và cập nhật chỉ số tiến độ Explorer; dữ liệu lưu cục bộ.
- Palette sáu màu hiển thị số sticker hiện tại trên mục tiêu 9, giúp phát hiện lệch màu trước khi solve.
- Cube 3D chỉ còn kéo/pinch/cuộn và một nút đặt lại góc; zoom dùng scale3d đồng đều theo ba trục.
- Render desktop và mobile giữ bố cục workbench, công thức/Explorer không làm tràn layout, và control Cube 3D đã giảm về thao tác quan sát thiết yếu.

## Xác minh Last Layer học theo tiến độ

- Explorer tải đúng tổng case theo family, tính số case chưa thuộc từ master marker cục bộ và hiển thị số nhóm có tiến độ.
- Với ZBLL đã đánh dấu một case, UI hiện 1/519 đã thuộc và 518 case chưa thuộc, sẵn sàng cho filter hoặc random practice.
- Khi bật **Chỉ chưa thuộc**, case đã đánh dấu biến mất khỏi list và tổng hiển thị giảm còn 518.
- **Luyện ngẫu nhiên** đã nạp một case ZBLL chưa thuộc khác (ZBLLPi-079) lên CubeNet cùng công thức lớn, không chọn lại case đã đánh dấu.
- Bảng tiến độ hiển thị từng nhóm ZBLL với phần trăm, ví dụ AS là 1/57 tương ứng 2%.
- Chuyển sang 1LLL vẫn giữ filter chưa thuộc, hiển thị 1.163 case chưa thuộc và 49 nhóm với thanh/tỷ lệ riêng; xác nhận cùng luồng áp dụng cho hai catalog.
- Screenshot desktop và mobile xác nhận Explorer vẫn giữ rail/score-strip gọn, controls luyện tập không tràn layout, và progress được thu gọn mặc định để không che danh sách case.
