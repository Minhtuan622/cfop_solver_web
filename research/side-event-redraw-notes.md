# Ghi chú kiểm tra side-event

- Clock đã đổi sang khung tròn và render đủ lưới 3×3 dial trong browser.
- Probe chọn Square-1 qua `localStorage` đã reload quá sớm, nên ảnh đầu tiên còn hiển thị event 3×3; cần kiểm tra Square-1 bằng thao tác chọn event thực tế thay vì coi đó là lỗi renderer.
- MBLD phải không mount `Cube3DGuide`; UI thay bằng ghi chú tập trung vào bộ scramble riêng cho từng khối.
- Square-1 vuông ban đầu còn tạo wedge kéo dài ở góc; cần chuyển outer boundary sang superellipse vuông mềm và siết bán kính để giữ silhouette vuông nhưng không méo mảnh.
- Clock đã đạt silhouette tròn rõ ràng với lưới chín dial; giữ lại hình học tròn này.
