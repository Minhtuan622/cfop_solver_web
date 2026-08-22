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

## Xác minh phòng luyện Last Layer

- Timer Lab mở tab ZBLL / 1LLL Study riêng, không làm thay đổi tab timer competition hiện hữu.
- Catalog tải được case queue đầu tiên (ZBLL · AS · ZBLLAS-003), hiển thị song song CubeNet 2D và Cube 3D với lớp cuối được làm nổi bật.
- Stopwatch Study chạy ở chế độ không inspection; thêm trigger Bắt đầu/Dừng hiển thị để đảm bảo thao tác timer rõ ràng bên cạnh phím Space.
- Tab Study hiển thị đúng nhãn Space, readout và nút Bắt đầu cạnh stopwatch, không chồng lên công cụ visual case.
- Catalog và layout Study vẫn ổn định sau HMR; stopwatch được gắn với case queue hiện tại, tách biệt hoàn toàn với inspection của competition timer.
- Khi preview tự cập nhật DOM, thao tác browser theo snapshot cũ bị từ chối an toàn; kiểm thử sẽ tiếp tục trên snapshot mới để không đánh giá sai trạng thái timer.
- Nút **Bắt đầu** đã chuyển sang **Dừng** và readout tăng từ 00:00.38 lên 00:01.16, xác nhận stopwatch Study chạy trực tiếp, không có inspection.
- Dừng timer tại 00:19.79 mở đủ bốn mức tự đánh giá. Chấm **Nhớ** chuyển queue từ ZBLLAS-003 sang ZBLLAS-004, tăng mục tiêu ngày thành 1/12 và giảm pool ưu tiên còn 1.681 case.
- Sau khi loại các marker chưa có lần chấm khỏi queue yếu, **Lấy case cần ôn** đã chọn lại ZBLLAS-003 — case có dữ liệu 00:19.79 — thay vì case chỉ được đánh dấu thuộc.
- Production build và screenshot desktop/mobile xác nhận Study Bay mở trực tiếp qua `/timer?tab=study`, active case trainer là apparatus chính và right rail xếp dọc không tràn ở mobile.

## Xác minh lịch ôn tuần

- Lịch bảy ngày dùng `dueAt` từ StudyRecord; ngày hiện tại tính cả case quá hạn, các ngày tương lai tính theo khoảng due date địa phương.
- Trạng thái đã luyện xác nhận một case đến hạn vào CN 23, hiển thị tổng 1 case cần ôn trong tuần; screenshot desktop và mobile giữ đủ bảy ô ngày, nhấn rõ ngày hiện tại và không tràn right rail.

## Xác minh timer arm–release

- SolveTimer là điểm timer dùng chung cho Competition và Study Bay. Khi ở ready/completed/inspection, keydown Space chỉ đặt state `armed`; keyup Space mới khởi động inspection hoặc solve trực tiếp.
- Khi timer đang chạy, keydown Space vẫn chốt solve hoặc split tức thì; input, textarea, select, button và link được loại khỏi handler. Click fallback vẫn dùng toggle trực tiếp. TypeScript và production build đã pass.

## Xác minh Timer Competition đa nền tảng

- SolveTimer nhận Space hoặc Enter với cùng state arm–release; `pointerdown`/`pointerup` loại touch trên mặt timer dùng cùng state machine. Khi đang chạy, Enter hoặc chạm cũng chốt solve/split; click trên nút Start ở Study Bay không bị bubble thành touch timer.
- Screenshot desktop/mobile xác nhận scramble và stopwatch là hai bề mặt chính; setup, preview cube và analytics được thu gọn bằng details, còn log vẫn truy cập trực tiếp. TypeScript và production build pass.

## Xác minh Cube 3D click-safe và Timer Lab gọn

- Cube3DGuide chỉ thay đổi yaw/pitch sau khi pointer di chuyển ít nhất 7px; một click/tap không thể cập nhật camera. Pointer capture được giải phóng khi kết thúc thao tác.
- Stopwatch và Cube 3D hiện cùng một apparatus nền ink; desktop đặt cạnh nhau, mobile xếp dọc vẫn giữ bề mặt chạm/readout lớn. Cài đặt timer và Cài đặt Solver được gom dưới details, còn analytics/history nằm ở record-sheet phụ.
- TypeScript và production build pass; desktop và mobile render không tràn layout.

## Xác minh sửa dứt điểm Settings và tương tác Cube

- Pointer mouse chỉ orbit khi giữ nút trái, kéo quá 7px; touch phải nhấn giữ 180ms và kéo quá 14px. Click/tap ngắn không thể cập nhật camera; pinch/scroll/reset vẫn hoạt động.
- Timer Competition có nút Cài đặt mở Settings panel thật bên phải, gom Cross color, inspection, practice, split input và mục tiêu pha. Accordion setup cũ bị loại khỏi bố cục; analytics là record-sheet mở cố định, history riêng biệt.
- Screenshot desktop/mobile xác nhận apparatus Timer–Cube, Settings trigger và không có tràn layout. TypeScript và production build pass.
