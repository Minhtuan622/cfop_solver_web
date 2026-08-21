# Checklist mở rộng CFOP Studio

## Hướng dẫn 3D, timer, biểu đồ và song ngữ

- [x] Tạo cube 3D CSS với hiệu ứng hướng dẫn theo move đang chọn trong lời giải.
- [x] Bổ sung timer giải cube độc lập, hỗ trợ start, stop, reset và phím Space.
- [x] Lưu lịch sử luyện tập theo thời gian và hiển thị biểu đồ tốc độ OLL/PLL bằng dữ liệu localStorage.
- [x] Thêm chuyển đổi Việt/Anh cho các nhãn chính, hướng dẫn và PDF exporter.
- [x] Rút gọn tên gọi kỹ thuật, kiểm tra desktop/mobile, build production và cập nhật checkpoint.

## Cube 3D tương tác, lịch sử và case trực quan

- [x] Nâng cube 3D để kéo xoay bằng chuột/cảm ứng, zoom bằng bánh xe/pinch và đặt lại góc nhìn.
- [x] Lưu các lần giải hoàn chỉnh vào lịch sử cục bộ, gồm thời gian timer, scramble, số bước và ngày giờ.
- [x] Tạo trang Lịch sử với biểu đồ thời gian từng lần, thời gian trung bình và danh sách lời giải gần đây.
- [x] Hiển thị sơ đồ top-layer của case OLL/PLL, chuỗi tạo case, cách giải và timer luyện case riêng.
- [x] Kiểm tra toàn bộ tương tác desktop/mobile, build production và lưu checkpoint.

## Bản vá cube 3D

- [x] Chụp snapshot dữ liệu drag trước khi đưa vào state updater để tránh truy cập ref đã bị xóa.
- [x] Kiểm tra handler pointer/cảm ứng, TypeScript và production build.
- [ ] Lưu checkpoint bản vá sau khi xác minh không còn crash khi kéo cube.

## Cube sáu mặt và preview scramble tức thì

- [x] Dựng đủ 6 mặt U/R/F/D/L/B trong cube 3D, bao gồm backface và shading đồng nhất.
- [x] Tạo bảng hoán vị facelet tĩnh và parser cho 18 move cơ bản để tạo state từ scramble trực tiếp ở frontend.
- [x] Đồng bộ preview tức thì với ô nhập scramble, không chờ Pyodide/solver chạy.
- [x] So sánh state engine frontend với solver Python bằng scramble `B L R B2 U2 R U2 L F2 R F2 D' R F U' R F L2 R`.
- [x] Kiểm tra desktop/mobile, build production và lưu checkpoint.

## Tối ưu solver CFOP

- [ ] Ghi benchmark theo từng pha trên scramble `D' R2 U' B2 F2 D R2 B2 D2 F2 R2 B' R D L F2 L' U F' D' B'`.
- [ ] Giảm không gian tìm kiếm Cross/F2L bằng canonical move pruning, transposition cache và heuristic admissible.
- [ ] Bổ sung giới hạn node/thời gian cùng thông báo fallback để không làm treo giao diện.
- [ ] Thêm kiểm thử hồi quy hiệu năng và kiểm tra invariant sau tối ưu.
- [ ] Đối chiếu kết quả với scramble người dùng, cập nhật frontend nhúng và lưu checkpoint.

- [x] Thiết kế hướng dẫn quét sáu mặt cube, lấy mẫu 9 sticker mỗi mặt và kiểm tra state 54 ký tự.
- [x] Tạo camera scanner chạy cục bộ bằng `getUserMedia`, canvas và phân loại màu dựa trên tâm mặt.
- [x] Tạo Practice Lab cho OLL/PLL với chọn case, countdown/timer, kết quả đúng/sai và thống kê lưu cục bộ.
- [x] Tạo PDF exporter chứa scramble/state, move count, từng phase, case OLL/PLL và algorithm.
- [x] Kiểm tra camera fallback, responsive mobile, interaction practice, PDF download và build production.

## Tái cấu trúc Studio và Timer Lab

- [x] Kiểm tra cấu trúc route, solver runtime, Cube3D và timer hiện tại.
- [x] Thiết kế lựa chọn màu Cross, mặc định trắng, và quy tắc chuẩn hóa hướng cube khi giải.
- [x] Thêm lựa chọn màu Cross vào pipeline solver và UI.
- [x] Tạo route Timer Lab riêng, có scramble tạo mới và ô nhập solution của người chơi.
- [x] Ghi nhận và đối chiếu solution người chơi trong Timer Lab.
- [x] Loại bỏ Practice Lab OLL/PLL và toàn bộ PDF export khỏi giao diện.
- [x] Loại bỏ panel Tình trạng · LOCAL và cập nhật điều hướng.
- [x] Đổi nhãn hướng dẫn thành Cross, F2L 1–4, OLL, PLL.
- [x] Nâng cấp animation cube 3D và kiểm tra reduced motion.
- [x] Chạy typecheck, build, kiểm tra luồng browser và lưu checkpoint.

## Timer Lab nâng cao và inspection Cross

- [x] Khảo sát schema lịch sử timer, component Cube3D và luồng Timer Lab hiện có.
- [x] Sửa animation để chỉ mặt/lớp theo move quay, không xoay cả khối.
- [x] Thêm inspection làm nổi sticker/cubie thuộc màu Cross đang chọn trên cube 3D.
- [x] Tự lưu lượt solve khi timer dừng, không phụ thuộc solution.
- [x] Hiển thị lịch sử solve, PB và Ao5 ngay trong Timer Lab; bỏ route History độc lập.
- [x] Thêm xuất CSV cho lịch sử Timer Lab.
- [x] Tạo nhập solution qua bàn phím move/chips, vẫn cho phép dán chuỗi notation.
- [x] Bỏ khu vực hướng dẫn sử dụng timer.
- [x] Kiểm tra typecheck, build, browser flows và lưu checkpoint.
