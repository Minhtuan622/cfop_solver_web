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

## Timer Lab competition log và layer-turn cube

- [x] Khảo sát schema lịch sử, component chart và các vùng CSS đang cần sửa.
- [x] Thêm trạng thái penalty +2/DNF, cập nhật thống kê và lưu cục bộ tương thích dữ liệu cũ.
- [x] Thêm chỉnh sửa và xóa từng lượt lịch sử.
- [x] Tính Ao5/Ao12 theo chuẩn loại best/worst, thêm biểu đồ tiến độ theo thời gian.
- [x] Thêm inspection Timer trực quan trên trạng thái scramble.
- [x] Thay animation face turn bằng animation layer-turn theo hàng/cột sticker phù hợp từng move.
- [x] Khắc phục CSS overflow, tỷ lệ, responsive và hierarchy ở Studio/Timer Lab.
- [x] Kiểm tra typecheck, build, luồng browser và lưu checkpoint.

## Inspection pre-solve và history backup mở rộng

- [x] Khảo sát lỗi preview/animation và schema lịch sử để xác định điểm can thiệp.
- [x] Đưa scramble lên đầu, timer phía dưới; thiết kế inspection pre-solve hiển thị cube đầy đủ với góc nhìn/phóng to/màu Cross.
- [x] Ẩn composer solution mặc định; chuyển thành tùy chọn theo một solve trong lịch sử.
- [x] Thay animation lỗi bằng layer-turn ổn định có face và các dải sticker kề quay cùng pivot.
- [x] Bổ sung Ao50/Ao100 vào cards và chart tiến độ.
- [x] Thêm ghi chú/tag theo từng solve trong form chỉnh sửa và danh sách history.
- [x] Thêm export/import JSON có kiểm tra cấu trúc và tương thích dữ liệu cũ.
- [x] Kiểm tra typecheck, build, browser flows, responsive và lưu checkpoint.

## Inspection penalty, history filter và solution playback

- [x] Khảo sát luồng inspection, schema history và các helper cube playback hiện có.
- [x] Tự gắn +2 nếu inspection vượt 15 giây và DNF nếu vượt 17 giây khi lượt solve được lưu.
- [x] Tạo bộ lọc tag và ô tìm nội dung ghi chú cho solve log.
- [x] Hiển thị trạng thái lọc, empty state và tổng lượt khớp trong scorecard history.
- [x] Tạo playback cho solution đã lưu, dùng scramble của solve làm trạng thái đầu và điều khiển 3D theo move.
- [x] Kiểm tra TypeScript, build và browser flow cho timer penalty/filter/playback, rồi lưu checkpoint.

## Timer Lab speedcubing controls và history theo filter

- [x] Khảo sát component timer, playback, Cube3D và thống kê theo filter hiện tại.
- [x] Đưa timer vào ngay dưới scramble, bỏ phần hướng dẫn/reset/làm lại khỏi UI.
- [x] Cài cảnh báo âm thanh inspection tại 8 và 12 giây, có fallback an toàn khi âm thanh bị chặn.
- [x] Thêm điều chỉnh tốc độ playback và readout TPS theo solution đã lưu.
- [x] Tự xoay hướng hiển thị cube để màu Cross đang chọn ở mặt D.
- [x] Tính lại PB/Ao5/Ao12/Ao50/Ao100 và biểu đồ từ history đã lọc.
- [x] Thêm checkbox từng lượt, chọn tất cả lượt đang lọc và xóa hàng loạt có xác nhận.
- [x] Kiểm tra typecheck, build, browser interactions, responsive UI và lưu checkpoint.

## Playback TPS theo pha và timer tối giản

- [x] Khảo sát layout Timer Lab, metadata solution và orbit control Cube3D hiện có.
- [x] Di chuyển readout timer vào panel scramble, loại bỏ nút bắt đầu và để Space là thao tác khởi động duy nhất.
- [x] Thêm công tắc bật/tắt âm cảnh báo inspection, lưu tùy chọn cục bộ.
- [x] Tính TPS Cross/F2L/OLL/PLL từ solution đã lưu và hiển thị biểu đồ playback theo pha.
- [x] Giữ drag orbit, zoom và reset góc của cube hoạt động trong dialog playback.
- [x] Kiểm tra TypeScript, build, luồng Space/audio/TPS/cube và lưu checkpoint.

## Luyện speedcubing với bấm mốc pha

- [x] Cài chế độ Split bằng Space sau inspection: Space khởi động inspection, Space tiếp bắt đầu solve; bốn Space tiếp theo chốt Cross, F2L, OLL và dừng solve/chốt PLL.
- [x] Thêm công tắc bật/tắt Split bằng Space, khi tắt duy trì Space bắt đầu/dừng như timer hiện tại.
- [x] Hiển thị pha sắp ghi và các mốc đã ghi trong khi solve; không thêm hoàn tác theo quyết định người dùng.
- [x] Mở rộng schema history để lưu split từng pha, thời điểm mốc và tương thích dữ liệu cũ.
- [x] Tính trực tiếp duration Cross/F2L/OLL/PLL từ mốc timer; TPS theo pha vẫn dùng metadata solution khi người dùng có lưu notation.
- [x] Hiển thị phân tích phase split trong lịch sử, CSV export và playback.
- [x] Kiểm tra keyboard focus, TypeScript, production build và render giao diện Split bằng Space; cơ chế +2/DNF inspection được giữ nguyên.

## Speedcubing analytics, practice modes và Cube 3D

- [x] Khảo sát phase split hiện có, composer solution, lifecycle inspection và hành vi Cube3D sau đổi Cross/zoom.
- [x] Lưu cấu hình mục tiêu thời gian Cross, F2L, OLL, PLL cục bộ và tương thích history hiện có.
- [x] Thêm biểu đồ tiến bộ duration theo từng phase từ các lượt có split; phản ánh dữ liệu theo bộ lọc history.
- [x] Hiển thị mục tiêu từng phase và cảnh báo màu khi split vượt ngưỡng đã đặt.
- [x] Tạo hai practice mode riêng Cross và Last Layer, có timer/chỉ dẫn phase rõ ràng.
- [x] Thay ô solution thủ công bằng composer move trực quan, hỗ trợ thêm/xóa move và dán notation.
- [x] Sửa Cube3D: animation layer sau đổi Cross, zoom/pinch có giới hạn chính xác, và control inspect hoạt động hoặc được loại bỏ.
- [x] Tách công tắc hiển thị highlight Cross khỏi inspection 15 giây để tắt highlight không tắt pre-solve timer.
- [x] Kiểm tra keyboard/touch, inspection +2/DNF, responsive, TypeScript, production build và checkpoint.

## Phase averages, target presets và solution efficiency

- [x] Khảo sát dữ liệu phase split đang lọc, rolling average và parser solution/move count.
- [x] Tính Ao5/Ao12 Cross, F2L, OLL, PLL trên các lượt có split tương ứng.
- [x] Thêm preset mục tiêu Beginner, Intermediate, Advanced và cập nhật nhanh toàn bộ ngưỡng phase.
- [x] Tính move count, TPS tổng và đánh giá efficiency cho solution đã lưu.
- [x] Hiển thị insight efficiency trong dashboard phase, giữ hierarchy stopwatch và scorecard phụ nhẹ hơn.
- [x] Kiểm tra dữ liệu cũ, filter, responsive, TypeScript, production build và checkpoint.

## Trọng tâm CFOP Studio

- [x] Kiểm toán luồng nhập cube, solver Pyodide, kết quả Cross/F2L/OLL/PLL và Cube 3D ở Studio.
- [x] Xác định các điểm nghẽn về phản hồi lỗi, trạng thái solver và khả năng theo dõi từng bước.
- [x] Thiết kế ưu tiên cải tiến cho thao tác nhập, kết quả CFOP, playback và điều khiển Cube 3D.
- [x] Triển khai các cải tiến Studio được ưu tiên thay vì mở rộng Timer Lab.
- [x] Kiểm tra solver với scramble hợp lệ, nhập trạng thái, animation 3D, responsive, TypeScript và production build.

### Thứ tự phát triển đã chốt

- [x] Tạo Cube State Editor sáu mặt: palette màu, chọn sticker, khóa tâm, reset và fill từng face.
- [x] Gọi validation khi state thay đổi, hiển thị lỗi sticker/cubie/parity rõ trước khi chạy solver.
- [x] Trình bày báo cáo Cross/F2L/OLL/PLL: move count, case ID, thuật toán và invariant theo phase.
- [x] Thêm điều khiển playback theo phase, chọn tốc độ và làm nổi phase đang phát trên Cube 3D.

## Hoàn thiện State Editor và báo cáo CFOP

- [x] Khảo sát state editor, báo cáo CFOP và utility export hiện có để tái sử dụng an toàn.
- [x] Thêm lịch sử thao tác sticker với undo/redo, phím tắt và giới hạn 80 trạng thái.
- [x] Bổ sung tooltip song ngữ giải thích Cross/F2L/OLL/PLL, case và invariant.
- [x] Xuất báo cáo CFOP dạng JSON có cấu trúc và ảnh PNG có thể chia sẻ.
- [x] Kiểm tra keyboard/tooltip, responsive, TypeScript và production build; download dùng Blob client-side.
