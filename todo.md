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

## State gần đây, học liệu phase và PNG cá nhân hóa

- [x] Khảo sát State Editor, tooltip phase và pipeline PNG export hiện có.
- [x] Lưu danh sách state hợp lệ gần đây cục bộ, có nhãn nhận diện và thao tác nạp/xóa nhanh.
- [x] Gắn liên kết trực tiếp từ tooltip Cross/F2L/OLL/PLL đến bài học hoặc công thức tóm tắt tương ứng.
- [x] Cho phép đặt tên cá nhân và chọn màu nền trước khi tải PNG report.
- [x] Kiểm tra local storage client-side, deep link, responsive, TypeScript và production build; export dùng Blob/Canvas trong trình duyệt.

## Nghiên cứu XCross và F2L bốn hướng

- [x] Đọc search/cubie model hiện tại để xác định predicate Cross, XCross và các slot F2L.
- [x] Thu thập nguồn kỹ thuật về XCross, slot orientation và heuristic/search F2L.
- [x] Thiết kế state target, invariant, coordinate/heuristic và thứ tự fallback cho XCross.
- [x] Đề xuất thuật toán giải bốn slot F2L theo orientation/cross color, có so sánh hiệu năng và lộ trình tích hợp.
- [x] Viết báo cáo nghiên cứu có citation và danh sách thay đổi mã nguồn đề xuất.

## Implementation XCross, opening auto và F2L bốn hướng

- [x] Thiết kế API `opening`, budget search XCross, fallback Cross và bộ scramble benchmark cố định.
- [x] Thêm predicate XCross, solver tracked-cubie Cross+slot và chọn candidate slot tốt nhất.
- [x] Viết module sinh macro F2L `FR → FL/BL/BR` bằng y-conjugation được cube engine kiểm chứng.
- [x] Tích hợp `opening="auto"` vào solve pipeline, commit XCross và chạy ba slot F2L còn lại.
- [x] Viết test XCross, symmetry macro, six cross colors (2-look), fallback và regression 57 OLL/21 PLL.
- [x] Chạy benchmark Cross thường/XCross trên cùng scramble, ghi latency/move count/fallback rate.

## Tích hợp XCross vào CFOP Studio

- [x] Đồng bộ source Python XCross/F2L symmetry vào Pyodide worker và mở rộng protocol `opening`.
- [x] Thêm control Studio chọn Cross thường hoặc Auto XCross, giữ mặc định tương thích.
- [x] Hiển thị phase XCross, slot F2L được hoàn tất, fallback Cross và move count trong báo cáo.
- [x] Đồng bộ playback Cube 3D và điều hướng phase với tên `xcross_<slot>`.
- [x] Kiểm tra solve end-to-end qua web worker, responsive Studio, typecheck, build và checkpoint.

## Auto XCross tùy biến slot và Studio tối giản

- [x] Khảo sát selection XCross Python, mapping slot F2L lên sticker Cube 3D và hierarchy control hiện có.
- [x] Mở rộng API `opening="auto"` với ưu tiên một slot và loại trừ nhiều slot, có fallback Cross an toàn.
- [x] Thêm control Studio chọn Auto XCross tự do/slot ưu tiên và toggle loại trừ từng slot.
- [x] Highlight rõ corner/edge thuộc slot F2L XCross đã hoàn tất trong 3D stage và báo cáo phase.
- [x] Tối giản control/telemetry phụ giữ nguyên ngôn ngữ workbench, phase ladder và Solver Mint.
- [x] Kiểm tra Python/worker/browser end-to-end, responsive, TypeScript, production build và checkpoint.

## XXCross: Cross cộng hai slot F2L

- [x] Khảo sát predicate/coordinate Cross + hai slot và xác định budget khả thi cho tracked meet-in-the-middle.
- [x] Thêm search XXCross cho sáu cặp F2L, ưu tiên/loại trừ slot và fallback Auto XXCross → XCross → Cross.
- [x] Viết regression invariant XXCross, fallback, macro symmetry và benchmark mở đầu bằng fixture cố định.
- [x] Mở rộng protocol Pyodide/Studio để chọn Auto XXCross, hiển thị hai slot và highlight kép trên Cube 3D.
- [x] Kiểm tra end-to-end, responsive, TypeScript, production build và checkpoint.

## Chuyển bước Cube 3D mượt hơn

- [x] Rà soát pipeline playback, layer-turn và điểm chuyển phase hiện có.
- [x] Thêm hoạt ảnh chuyển nước xoay/phase mượt, có chỉ báo tiến trình dễ theo dõi và tôn trọng reduced motion.
- [x] Kiểm tra điều khiển phát, bước trước/sau, chuyển phase, responsive, TypeScript, build và checkpoint.

## XXXCross: Cross cộng ba slot F2L

- [x] Khảo sát predicate, coordinate và benchmark budget cho Cross + ba slot F2L trong Python/Pyodide.
- [x] Thiết kế search trên bốn bộ ba slot, ưu tiên/loại trừ slot và fallback XXXCross → XXCross → XCross → Cross.
- [x] Triển khai solver, test invariant/regression sáu màu và benchmark latency/move count.
- [x] Mở rộng protocol Pyodide/Studio, báo cáo phase và Cube 3D highlight ba slot F2L.
- [x] Kiểm tra browser end-to-end, responsive, TypeScript, production build và checkpoint.

## CSS audit và XXXXCross: Cross cộng đủ F2L

- [x] Rà soát lỗi CSS desktop/mobile, overflow selector opening và hierarchy panel Studio.
- [x] Khảo sát coordinate Cross + bốn F2L, chốt budget và fallback XXXXCross → XXXCross → XXCross → XCross → Cross.
- [x] Triển khai solver XXXXCross, predicate, regression sáu màu và benchmark latency.
- [x] Mở rộng Pyodide/Studio/report/Cube 3D để hiển thị XXXXCross và bốn slot F2L.
- [x] Kiểm tra browser end-to-end, responsive, TypeScript, production build và checkpoint.

## Opening fallback minh bạch và Studio gọn hơn

- [x] Tái tạo lỗi XX/XXX/XXXXCross và truy vết pipeline chọn phase opening thực tế.
- [x] Chuẩn hóa metadata requested/achieved/fallback để phân biệt rõ cấp solver đã đạt.
- [x] Bổ sung regression cho từng cấp opening, fallback tuần tự và trường hợp giới hạn depth.
- [x] Thay hàng nút opening bằng dropdown; hiển thị telemetry fallback và tinh gọn control liên quan.
- [x] Kiểm tra browser, responsive, TypeScript, production build và checkpoint.

## Last Layer: OLL/PLL, ZBLL và 1LLL

- [x] Khảo sát database OLL/PLL hiện có, nguồn ZBLL/1LLL và phạm vi case có thể kiểm chứng.
- [x] Thiết kế option `oll_pll` / `zbll` / `1lll` / `auto`, luật chọn theo trạng thái OLL và fallback invariant.
- [x] Triển khai matcher/solver Last Layer, metadata strategy và regression cho OLL solved/chưa solved.
- [x] Tích hợp dropdown Last Layer, telemetry strategy, report và copy song ngữ Studio.
- [x] Kiểm tra case, browser, responsive, TypeScript, production build và checkpoint.

## Last Layer Explorer và Studio tối giản

- [x] Rà soát catalog ZBLL/1LLL, component Cube 3D, report/move list và editor 6 mặt hiện có.
- [x] Thêm tra cứu theo loại, nhóm và ID; nạp case vào Studio cùng highlight sticker tương ứng trên Cube 3D.
- [x] Hợp nhất report CFOP và danh sách move thành một record; bỏ panel Kiểm tra lời giải riêng.
- [x] Tối giản chế độ Màu 6 mặt thành sơ đồ 2D có thể tô sticker trực tiếp, không lặp ảnh minh họa cube.
- [x] Kiểm tra browser, responsive, TypeScript, production build và checkpoint.

## CubeNet 2D trực tiếp và UI tối giản

- [x] Rà soát layout Màu 6 mặt, editor sticker và mật độ control/label ở Studio.
- [x] Khôi phục CubeNet 2D lớn cạnh Cube 3D trong Màu 6 mặt, cho tô sticker trực tiếp ngay trên đó.
- [x] Tối giản tab Chuỗi xoay: giữ input, lựa chọn cốt lõi và CTA; gom/giảm control, label phụ.
- [x] Áp dụng nguyên tắc tối giản tương tự cho các panel Studio liên quan.
- [x] Kiểm tra browser, responsive, TypeScript, production build và checkpoint.

## Last Layer Explorer, sticker counter và Cube 3D gọn hơn

- [x] Rà soát component Explorer, CubeNet, Cube3DGuide và các panel Studio có hành động/copy trùng lặp.
- [x] Hiển thị case ZBLL/1LLL đang chọn với notation lớn phía trên CubeNet 2D; lưu trạng thái đã thuộc cục bộ.
- [x] Thêm bộ đếm sáu màu cạnh palette, nêu rõ chênh lệch với mục tiêu 9 sticker mỗi màu.
- [x] Tối giản control trong Cube 3D, sửa zoom để scale đồng đều ba chiều và gom các UI Studio trùng lặp.
- [x] Kiểm tra interaction, localStorage, zoom, responsive, TypeScript, build và checkpoint.

## Last Layer học theo tiến độ

- [x] Rà soát catalog ZBLL/1LLL, master marker và cấu trúc Explorer hiện tại.
- [x] Bổ sung bộ lọc chỉ hiển thị case chưa thuộc.
- [x] Thêm phiên luyện ngẫu nhiên, chỉ nạp case chưa thuộc theo family/nhóm/bộ lọc đang chọn.
- [x] Hiển thị thanh tiến độ và phần trăm đã thuộc cho từng nhóm ZBLL/1LLL.
- [x] Kiểm tra filter, random, persistence, responsive, TypeScript, build và checkpoint.

## Phòng luyện ZBLL/1LLL trong Timer Lab

- [x] Rà soát Timer Lab, case catalog, history timer và master marker hiện có.
- [x] Thiết kế lặp lại ngắt quãng, xếp hạng case yếu và backup tiến độ có version.
- [x] Tạo khu vực luyện riêng trong Timer Lab, có timer, case queue và chấm mức độ nhớ case.
- [x] Thêm xuất/nhập tiến độ, mục tiêu số case mỗi ngày và thông báo hoàn thành.
- [x] Kiểm tra queue, timer, backup/import, localStorage, responsive, TypeScript, build và checkpoint.

## Lịch ôn tập tuần của Study Bay

- [x] Rà soát StudyRecord/dueAt và bố cục right rail của Study Bay.
- [x] Tính số case đến hạn cho bảy ngày, gồm case quá hạn trong ngày hiện tại.
- [x] Hiển thị lịch tuần dạng record-sheet, nhấn ngày hiện tại và số case cần ôn.
- [x] Kiểm tra số liệu, responsive, TypeScript, build và checkpoint.

## Timer arm–release theo thao tác Space

- [x] Rà soát SolveTimer và mọi điểm dùng keyboard timer trong Competition/Study Bay.
- [x] Thiết kế state machine giữ Space để arm, thả Space để bắt đầu, giữ nguyên stop/split an toàn.
- [x] Áp dụng feedback visual arm cho toàn bộ timer, giữ click fallback hoạt động.
- [x] Kiểm tra inspection, start/stop, split, Study Bay, input focus, TypeScript, build và checkpoint.

## Timer Competition tối giản và input đa nền tảng

- [x] Nghiên cứu interaction webtimer phổ biến, rà soát SolveTimer và layout Competition hiện tại.
- [x] Bổ sung Enter và touch arm–release cho mọi SolveTimer, giữ Space/inspection/split/click fallback.
- [x] Tái thiết kế Competition để scramble + stopwatch là visual apex, gom control phụ.
- [x] Chuyển thống kê/cấu hình/history thành panel thứ cấp hoặc details theo nhu cầu.
- [x] Kiểm tra keyboard, touch, inspection, split, desktop/mobile, TypeScript, build và checkpoint.

## Timer Lab gọn và Cube 3D click-safe

- [x] Rà soát pointer handler Cube3DGuide và các control Timer Lab đang rải rác.
- [x] Thêm ngưỡng drag để click/tap không làm camera Cube 3D xoay ngoài ý muốn.
- [x] Đặt Cube 3D cạnh stopwatch trong cùng apparatus tối, vẫn có preview/zoom cần thiết.
- [x] Gom control Competition thành Cài đặt rõ ràng, giữ lịch sử và analytics truy cập có chủ đích.
- [x] Kiểm tra click/drag, timer, settings, desktop/mobile, TypeScript, build và checkpoint.

## Sửa dứt điểm Timer Lab Settings và Cube 3D

- [x] Phân tích lại pointer/touch của Cube3DGuide và tất cả accordion Timer Competition.
- [x] Chuyển camera Cube sang chế độ kéo có chủ ý, click/tap tuyệt đối không xoay.
- [x] Xây dựng Settings panel thật cho Timer Competition, không dùng dropdown để giấu thao tác cốt lõi.
- [x] Đưa analytics/history vào record-sheet rõ ràng, bỏ accordion không cần thiết.
- [x] Kiểm tra click/tap/drag, Settings, desktop/mobile, TypeScript, build và checkpoint.

## Navigation gọn và Cài đặt hợp nhất

- [x] Rà soát header/navigation cùng mọi control thiết lập hiện có trên Studio, Timer và Study.
- [x] Thiết kế app shell nén với route Studio, Timer, Study và Cài đặt ở cùng một navigation.
- [x] Tạo Settings hub một nơi duy nhất, có nhóm Solver, Timer và hiển thị Cube 3D.
- [x] Di chuyển hoặc loại bỏ control/accordion thiết lập rải rác sau khi có Settings hub.
- [x] Kiểm tra routes, persistence, desktop/mobile, TypeScript, build và checkpoint.

## Điều hướng Study, ngôn ngữ và Speed split phụ thuộc

- [x] Rà soát route query Study, navigation chung và control ngôn ngữ hiện tại.
- [x] Chuyển lựa chọn ngôn ngữ vào Cài đặt duy nhất.
- [x] Sửa Study mở đúng route và chỉ hiển thị nội dung/phân tích Split khi Speed split bật.
- [x] Ẩn các tính năng Timer phụ thuộc split khi Speed split tắt, không ảnh hưởng solve thường.
- [x] Kiểm tra route, language, split on/off, responsive, TypeScript, build và checkpoint.

## Route Timer–Study và Settings gọn có tooltip

- [x] Rà soát nguyên nhân Timer–Study không chuyển được và các heading/khối thừa ở Settings/Study.
- [x] Chuyển route bằng điều hướng tin cậy, không phụ thuộc query hoặc state nội bộ cũ.
- [x] Thu gọn Settings, thêm tooltip giải thích cho người mới.
- [x] Bỏ heading thừa ở Settings/Study, giữ thông tin cần thiết ở vị trí gọn hơn.
- [x] Kiểm tra điều hướng, tooltip, desktop/mobile, TypeScript, build và checkpoint.

## Tinh gọn Studio, Timer và Last Layer Explorer

- [x] Rà soát heading, scramble controls, CFOP report và Last Layer Explorer hiện có để xác định luồng dữ liệu cần giữ.
- [x] Loại bỏ heading thừa ở Studio/Timer; đưa tạo scramble và copy thành icon nhỏ dưới chuỗi scramble.
- [x] Dời Last Layer Explorer sang Study Bay, gom bộ lọc/case/progress/mastery và tránh trùng với SRS hiện có.
- [x] Chuyển CFOP report vào vùng Explorer cũ ở Studio, đảm bảo report vẫn giữ phase, invariant, move và export cần thiết.
- [x] Kiểm tra luồng solver, Study Explorer, Timer scramble, responsive, TypeScript, production build và checkpoint.

## Benchmark XXXXCross và scramble mặc định

- [x] Rà soát pipeline opening Cross/XCross/XXCross/XXXCross/XXXXCross và telemetry fallback với scramble kiểm thử mới.
- [x] Benchmark từng cấp opening, xác minh slot F2L thực tế đạt được và truy vết nguyên nhân nếu lùi cấp.
- [x] Điều chỉnh search/macro/depth hoặc metadata fallback để XXXXCross có cơ hội tìm nghiệm đúng thay vì luôn dừng XCross.
- [x] Đổi scramble mặc định Studio thành scramble ngẫu nhiên hợp lệ, không cố định R U R' U'.
- [x] Chạy regression solver, nhúng lại Pyodide worker, kiểm tra giao diện opening và build production trước checkpoint.

## Strict opening, Last Layer direct và report gọn

- [x] Rà soát staged opening vừa thêm để bảo đảm không ghi nhận Cross → F2L tuần tự là XX/XXX/XXXXCross.
- [x] Benchmark scramble D2 B' R' F2 D2 L' B L B' D2 B' F L' R' U2 F' D U' L F và kiểm tra phase/invariant thực tế.
- [x] Truy vết điều kiện nhận diện ZBLL/1LLL, catalog lookup và telemetry fallback trước khi sửa router Last Layer.
- [x] Chỉnh typography/bố cục CFOP report để label dài không tràn hoặc vỡ nhịp cột hẹp.
- [x] Bổ sung regression strict opening/Last Layer, nhúng worker, kiểm tra browser và production build trước checkpoint.

## Case direct, opening depth và orientation Cross

- [x] Rà soát payload telemetry Last Layer để bổ sung mã case direct cụ thể khi ZBLL/1LLL nhận diện thành công.
- [x] Thêm cài đặt depth cho direct opening, truyền từ Settings qua Studio/worker đến solver với giới hạn hợp lý.
- [x] Rà soát Cube 3D input và orientation để click/tap không spin, đồng thời căn Cross đã chọn cố định về D.
- [x] Bổ sung regression case ID/depth và kiểm thử click-drag, đổi Cross màu, desktop/mobile, TypeScript/build.
- [x] Checkpoint sau khi xác minh solver worker, Settings và camera hoạt động nhất quán.

## Phase title và drag theo Cross

- [x] Rà soát typography của title trong danh sách phase/report ở cột hẹp và mobile.
- [x] Rà soát mapping drag Cube 3D để loại bỏ giả định trục vàng/D khi Cross là màu khác.
- [x] Áp dụng title phase compact không tràn và phép drag tương đối theo preset Cross-down.
- [x] Kiểm tra report có 6+ phase, drag/click theo nhiều Cross, desktop/mobile, TypeScript/build.
- [x] Checkpoint sau khi xác minh report và điều khiển Cube 3D nhất quán.

## Kiểm thử Cube 3D sáu màu

- [x] Lập ma trận kiểm thử Cross U/R/F/D/L/B cho mount, click, drag ngang/dọc, reset và đổi màu liên tiếp.
- [x] Thay preset/trục đặc biệt bằng orientation xác định từ mặt Cross nếu ma trận phát hiện bất nhất.
- [x] Bảo đảm Cross luôn ở D khi orbit, click/tap không thay camera và drag theo cùng quy ước trực quan ở sáu màu.
- [x] Kiểm tra desktop/mobile, TypeScript, production build và ghi bằng chứng kiểm thử trước checkpoint.

## Cube 3D thẳng theo Cross

- [x] Rà soát phép quay CSS hiện tại và mapping state sticker cần dùng cho Cross U/R/F/D/L/B.
- [x] Chuyển việc đặt Cross về D từ transform mô hình sang adapter state, giữ camera thẳng mặc định.
- [x] Giới hạn drag chỉ orbit quanh trục đứng, không làm lật/xoắn geometry sticker.
- [x] Kiểm thử sáu màu bằng state thật, screenshot desktop/mobile, TypeScript và production build trước checkpoint.

## Orbit 360° quanh Cross

- [x] Rà soát giới hạn góc drag hiện tại và cơ chế reset camera.
- [x] Bỏ giới hạn orbit, giữ phép chuẩn hóa state Cross-to-D và camera thẳng.
- [x] Kiểm thử kéo qua nhiều vòng, reset, click/tap và six-cross orientation.
- [x] Chạy TypeScript, production build và checkpoint sau khi xác minh 360°.

## Quan sát mặt trên/dưới

- [x] Rà soát camera hiện tại và xác định pitch range không làm lật hoặc méo Cube 3D.
- [x] Thêm drag dọc, reset hai trục và copy hướng dẫn thao tác ngắn gọn.
- [x] Kiểm thử yaw 360°, pitch trên/dưới, Cross U/R/F/D/L/B, desktop/mobile và build.
- [x] Checkpoint sau khi xác minh Cube 3D hai trục ổn định.

## Camera tự do không auto-reset

- [x] Rà soát lifecycle camera khi đổi Cross/state/phase để xác định nguyên nhân góc drag bị trả về gốc.
- [x] Tách camera người dùng khỏi orientation state và chỉ reset khi bấm nút reset.
- [x] Giữ pitch anti-flip nhưng không clamp/wrap theo cách làm nhảy góc khi kéo liên tục.
- [x] Kiểm thử kéo tự do dài, click/tap, chuyển phase, TypeScript/build và checkpoint.

## Camera mặt D thẳng và inertia

- [x] Rà soát base transform khiến Cube 3D lệch so với mặt D ở góc mặc định.
- [x] Đặt góc camera gốc thẳng theo D và thêm inertia hai trục có suy giảm.
- [x] Hủy inertia khi pointer down/reset/reduced motion, giữ drag click-safe và pitch anti-flip.
- [x] Kiểm thử default alignment, inertia, drag/reset, TypeScript/build và checkpoint.

## 3-Style BLD và highlight Last Layer

- [x] Rà soát CubieView, permutation/memo hiện có và xác định data contract Speffz với UF/UBL buffer.
- [x] Thiết kế 3-Style BLD: edge/corner cycle breaks, letter-pair memo, parity, flip/twist và execution commutator catalog.
- [x] Tích hợp chế độ BLD vào Studio/worker/report mà không làm thay đổi pipeline CFOP hiện có.
- [x] Sửa highlight Last Layer Study để lớp OLL nằm ở mặt đối diện Cross sau orientation Cross-to-D.
- [x] Thêm regression BLD/CFOP và xác minh memo, report, highlight, TypeScript/build trước checkpoint.

## BLD special catalog, Memo SRS và profile cá nhân

- [x] Rà soát BLDDB parity/flip/twist catalog, định nghĩa exact key direction-safe và contract profile thuật toán ưa thích.
- [x] Mở rộng report BLD để chỉ gợi ý algorithm special-case khi exact match; cho phép override bằng preferred algorithm trong profile.
- [x] Tạo profile memo BLD lưu local, nhập/xuất JSON có validation và tương thích dữ liệu cũ.
- [x] Tạo BLD Memo Lab có prompt chữ cái hoặc Web Speech, chấm recall và lịch lặp lại ngắt quãng theo từng memo item.
- [x] Kiểm thử exact-match, special-key direction, profile import/export, SRS due queue, TypeScript/build và checkpoint.

## Drill Mode, học 3-Style và cỡ chữ

- [x] Rà contract special-case BLDDB, Memo Lab, Study và app settings để tái sử dụng data/SRS không tạo bản sao rời rạc.
- [x] Thiết kế Drill Mode parity, 2-flip, corner twist; queue chỉ nhận exact case và chấm SRS theo loại.
- [x] Tạo luồng học 3-Style theo memo → cycle/execution key → algorithm exact match → recall, có tiếp tục từ profile.
- [x] Thêm cài đặt cỡ chữ nhỏ/vừa/lớn, lưu local và áp dụng nhất quán toàn website.
- [x] Kiểm thử queue drill, profile/SRS, luồng học, cỡ chữ, TypeScript/build và checkpoint.

## Drill Mode trực quan và Speffz cá nhân

- [x] Rà profile BLD, Training Rack, Cube3DGuide và persistence hiện tại để khóa contract keyword/image/analytics.
- [x] Thêm thẻ Speffz cho từng letter-pair với keyword, URL hình ảnh an toàn, validation và import/export profile.
- [x] Hiển thị Cube 3D cho parity, 2-flip và corner twist đang drill mà không ngụ ý cube state/algorithm sai.
- [x] Thêm timer, kết quả từng lượt và bảng accuracy/duration theo loại Drill Mode, lưu cùng profile.
- [x] Kiểm thử thẻ, Cube 3D, timer/analytics, persistence, TypeScript/build và checkpoint.

## Dark Mode

- [x] Rà display settings, global CSS tokens và bề mặt workbench cần đổi màu.
- [x] Thiết kế palette tối vẫn giữ mint rails, giấy kỹ thuật và độ tương phản chữ/formula.
- [x] Thêm toggle Dark Mode vào Settings, persistence local và áp dụng theme toàn trang từ startup.
- [x] Kiểm thử Studio, Timer, Study, Settings, responsive, TypeScript/build và checkpoint.

## System theme, accent color và Dark Mode hoàn thiện

- [x] Rà persistence theme/accent, ThemeProvider và tất cả bề mặt còn sáng trong Studio, Timer, Study, Settings, BLD.
- [x] Thiết kế chế độ Light/Dark/System cùng palette accent có độ tương phản phù hợp trên hai theme.
- [x] Triển khai đồng bộ system preference, accent cục bộ và token/override cho các surface Dark Mode còn sáng.
- [x] Kiểm thử live switch, system change, accent, contrast các route, TypeScript/build và checkpoint.

## Custom accent picker và preview

- [x] Rà display settings, accent token và Display Settings để xác định schema custom color tương thích profile hiện có.
- [x] Thiết kế color picker có validation/contrast guard và preview workbench cho Light, Dark, System.
- [x] Triển khai custom accent, persistence, reset và áp dụng token màu toàn ứng dụng.
- [x] Kiểm thử preview, persistence, theme modes, TypeScript/build và checkpoint.

## Theme consistency audit

- [x] Lập inventory colors hard-code và các component/route có surface hoặc text dễ lẫn Light/Dark.
- [x] Chuẩn hóa token semantic cho nền, sheet, control, chữ chính/phụ, border và trạng thái active.
- [x] Sửa Studio, Timer, BLD panels, Study và Settings để không còn surface lẫn theme.
- [x] Kiểm tra desktop/mobile ở Light, Dark, System; TypeScript/build và checkpoint.

## Theme transition và Studio Dark coverage

- [x] Rà Studio Dark để xác định chính xác các surface chưa phủ token hoặc bị light rule ghi đè.
- [x] Thiết kế transition background, color, border, shadow an toàn; reduced-motion không animate.
- [x] Thêm transition theme toàn app và override Studio Dark cho report, input, rail, playback, BLD controls.
- [x] Kiểm thử chuyển Light/Dark/System, Studio desktop/mobile, TypeScript/build và checkpoint.

## Font scale dạng số

- [x] Rà display settings, CSS font token và Display Settings hiện dùng preset nhỏ/vừa/lớn.
- [x] Thiết kế scale phần trăm, giới hạn accessibility, preview và migration preference preset cũ.
- [x] Thay preset bằng input số/range và nút tăng giảm/reset; lưu giá trị phần trăm toàn app.
- [x] Kiểm thử persistence, Light/Dark/System, desktop/mobile nhiều mức chữ, TypeScript/build và checkpoint.

## Formula-only scale và preset nhanh

- [x] Rà selector thuật toán, memo và formula ở Studio, Study, BLD để áp dụng scale riêng không ảnh hưởng navigation.
- [x] Thiết kế phạm vi scale công thức, persistence độc lập và preset 100/120/140% cho tỷ lệ giao diện chung.
- [x] Thêm slider scale công thức, áp dụng CSS semantic và preset nhanh cạnh thanh trượt chính.
- [x] Kiểm thử Studio, Study, BLD, Light/Dark/System, TypeScript/build và checkpoint.

## Typography dễ đọc, Study và Timer gọn hơn

- [x] Kiểm toán các nhãn telemetry, helper text và control đang quá nhỏ ở global scale 100–140%.
- [x] Chuẩn hóa typography tối thiểu, wrapping/overflow và formula scale để nội dung phóng to vẫn đọc được.
- [x] Tái cấu trúc Study thành layout ưu tiên case trainer, rail thông tin dễ quét và catalog không bị dồn hẹp.
- [x] Tái cấu trúc Timer để stopwatch/scramble nổi bật, loại giảm mật độ UI thừa và giữ thao tác nhanh.
- [x] Kiểm thử Light/Dark/System, global/formula scale lớn, desktop/mobile, TypeScript/build và checkpoint.

## Timer density và scramble kế tiếp

- [x] Rà persistence display/timer, luồng timer complete và API sinh scramble đang dùng.
- [x] Thiết kế cài đặt mật độ Compact/Standard cùng hành vi đổi scramble sau solve không làm mất history.
- [x] Thêm control Compact/Standard, persistence và class layout cho Timer.
- [x] Tự tạo scramble mới ngay khi solve hoàn thành, đồng thời giữ kết quả vừa lưu trong lịch sử.
- [x] Kiểm thử interaction, persistence, desktop/mobile, TypeScript/build và checkpoint.

## Hiệu ứng kỷ lục cá nhân Timer

- [x] Rà cơ chế PB single, Ao5/Ao12/Ao50/Ao100 và thời điểm tạo history entry.
- [x] Định nghĩa điều kiện PB, copy tiếng Việt/Anh và hiệu ứng chúc mừng có reduced-motion fallback.
- [x] Thêm phát hiện kỷ lục sau solve cùng overlay/toast chúc mừng không chặn lượt kế tiếp.
- [x] Kiểm thử single/Ao5 mới, DNF, persistence, desktop/mobile, TypeScript/build và checkpoint.

## Dashboard Timer một màn hình

- [x] Kiểm toán vùng scramble, timer/cube, thành tích cá nhân và log để xác định layout nén phù hợp.
- [x] Thiết kế hierarchy dashboard: scramble luôn thấy, clock/cube apparatus trung tâm, metric rail luôn thấy.
- [x] Triển khai layout responsive gọn cho Standard/Compact, giữ analytics và log ở vùng phụ.
- [x] Kiểm thử desktop/mobile, global font scale lớn, Compact/Standard, TypeScript/build và checkpoint.

## Drill-down scramble từ thành tích Timer

- [x] Rà mapping PB/Ao5/Ao12/Ao50/Ao100 sang lượt history và cửa sổ average cụ thể.
- [x] Thiết kế metric clickable, panel chi tiết accessible và copy cho lượt/DNF/scramble.
- [x] Thêm panel hiển thị scramble và kết quả của từng lượt cấu thành metric đã chọn.
- [x] Kiểm thử PB, average, metric chưa đủ lượt, DNF, desktop/mobile, TypeScript/build và checkpoint.

## Chi tiết Ao có annotation, copy và CubeNet

- [x] Rà luật loại best/worst ở Ao có hoặc không có DNF và dữ liệu CubeNet từ scramble.
- [x] Thiết kế annotation rõ ràng, nút copy từng lượt và thumbnail CubeNet không làm panel quá nặng.
- [x] Thêm highlight best/worst loại khỏi Ao, copy scramble và hình CubeNet cho từng card detail.
- [x] Kiểm thử Ao5/Ao12, DNF, thao tác copy, desktop/mobile, TypeScript/build và checkpoint.

## Ao detail: zoom, replay, toggle CubeNet và export ảnh

- [x] Rà dialog metric, luồng replay, thư viện export hiện có và persistence preference CubeNet.
- [x] Thiết kế zoom CubeNet, toggle gọn, replay per-card và asset export Ao5 có annotation/ghi chú.
- [x] Thêm controls, preview phóng to, replay, xuất PNG Ao5 và lưu lựa chọn hiển thị CubeNet.
- [x] Kiểm thử thao tác, file ảnh export, responsive, persistence, TypeScript/build và checkpoint.

## Làm rõ replay, Esc inspection và export Ao5 dễ đọc

- [x] Rà state/keyboard handler inspection, layout metric khi ẩn CubeNet và tỷ lệ canvas export Ao5.
- [x] Thiết kế Escape chỉ hủy inspection, nhãn replay rõ nghĩa, compact single-column và export lớn hơn.
- [x] Thêm Esc hủy inspection, sửa layout ẩn CubeNet và tăng CubeNet/chữ cho PNG Ao5.
- [x] Kiểm thử keyboard, toggle, export ảnh, desktop/mobile, TypeScript/build và checkpoint.

## Solution thực tế, export Ao5 ngang và 3-Style mở rộng

- [x] Rà schema history, luồng nhập solution, canvas export và layout 3-Style Studio hiện tại.
- [x] Thiết kế lưu solution có validation, replay solution-first, export ngang và layout 3-Style expandable.
- [x] Thêm ghi/lưu solution thực tế, replay theo solution, Ao5 canvas phủ ngang và cấu trúc 3-Style mới.
- [x] Kiểm thử dữ liệu legacy, solution hợp lệ/không hợp lệ, export, Studio desktop/mobile, TypeScript/build và checkpoint.

## 3-Style Studio: chống tràn và tận dụng không gian

- [x] Kiểm tra lại layout desktop/mobile, xác định panel tràn và vùng trống trong tab 3-Style.
- [x] Tái phân bổ report, profile, memo và training thành các vùng có tỷ lệ phù hợp.
- [x] Thêm giới hạn/wrapping cho memo, algorithm, control và Cube 3D để không phá grid.
- [x] Kiểm thử với memo thực tế, desktop/mobile, TypeScript/build và checkpoint.

## Tái thiết kế toàn diện Studio theo mẫu tham khảo

- [x] Nghiên cứu các mẫu workbench/solver/tool kỹ thuật chất lượng và ghi nhận nguyên tắc phù hợp.
- [x] Kiểm toán CFOP và 3-Style Studio để khóa luồng thao tác và content hierarchy cần giữ.
- [x] Thiết kế lại bố cục, typography, surface và responsive model cho toàn bộ Studio.
- [x] Triển khai Studio mới, giữ đầy đủ solver, Cube 3D, state editor, playback và BLD.
- [x] Kiểm thử Studio với CFOP/3-Style thực, desktop/mobile, TypeScript/build và checkpoint.

## Hệ giao diện tối giản, mềm mại

- [x] Kiểm toán component, luồng Rubik và các thiết lập cá nhân hóa cần gỡ.
- [x] Thiết kế token, primitives và quy tắc Dark Mode dùng lại được, không dùng border trang trí.
- [x] Tái thiết kế Studio desktop-first, bảo toàn CFOP, 3-Style, Cube 3D và state editor.
- [x] Gỡ accent picker/chỉnh cỡ chữ; giữ Dark Mode và mọi thiết lập phục vụ Rubik.
- [x] Mở rộng hệ giao diện sang Timer, Study, Settings và breakpoint màn hình nhỏ.
- [x] Kiểm thử luồng Rubik, Dark Mode, responsive, TypeScript/build và checkpoint.

## Motion Cube 3D, nhịp desktop và Timer

- [x] Kiểm toán layer-turn animation, orbit/zoom Cube 3D, spacing desktop và structure Timer.
- [x] Thiết kế easing, duration, shadow/settle cho turn; chốt scale spacing desktop và hierarchy Timer.
- [x] Triển khai chuyển động Cube 3D mượt/chân thực, căn lại margin/padding và chỉnh lại Timer.
- [x] Kiểm thử drag, orbit, zoom, playback, Timer desktop/mobile, Dark Mode, TypeScript/build.

## Visual refinement: bo góc, surface và hover

- [x] Kiểm toán radius, shadow/viền legacy, sticky metrics Timer và hover state hiện có.
- [x] Định nghĩa palette mềm, bo góc vừa phải, hover nhẹ và quy tắc không shadow.
- [x] Gỡ shadow/viền cứng, sửa metrics Timer cuộn tự nhiên và áp dụng visual pass toàn app.
- [x] Kiểm thử scroll Timer, hover, desktop/mobile, Dark Mode, TypeScript/build và checkpoint.

## CubeNet Studio và surface Timer

- [x] Kiểm tra scale CubeNet 2D ở Studio, corner thẻ scramble và surface Timer chưa đồng đều.
- [x] Chốt kích thước CubeNet desktop-first và corner radius nhất quán cho scramble/surface Timer.
- [x] Tăng CubeNet, sửa corner scramble và tinh chỉnh tiếp UI Timer.
- [x] Kiểm thử Studio/Timer desktop/mobile, TypeScript/build và checkpoint.

## Studio 2D/3D, hover Timer và Study

- [x] Kiểm tra viewport Studio, hover button Timer và cấu trúc Study hiện có.
- [x] Thiết kế chuyển 2D/3D, hover mềm nhất quán và hierarchy Study tối giản.
- [x] Triển khai toggle Studio, motion hover Timer và Study surface mới.
- [x] Kiểm thử Studio/Timer/Study desktop/mobile, TypeScript/build và checkpoint.

## Chuyển luyện tập 3-Style sang Study

- [x] Kiểm kê component 3-Style, Drill Mode, Memo SRS, profile và state cục bộ đang dùng trong Studio.
- [x] Thiết kế điểm vào 3-Style trong Study, giữ Last Layer và BLD có luồng rõ ràng, không trùng tính năng.
- [x] Di chuyển training rack, memo, profile và drill sang Study; gỡ các khu luyện tập tương ứng khỏi Studio.
- [x] Kiểm thử timer, SRS, Drill Mode, import/export profile, desktop/mobile, TypeScript/build và checkpoint.

## 3-Style nhập môn và Studio tối giản

- [x] Nghiên cứu timer Rubik phổ biến và kiểm kê các nhãn, bước, khái niệm 3-Style gây khó hiểu cho người mới.
- [x] Thiết kế lộ trình bắt đầu từ khái niệm BLD, chữ cái, memo, algorithm rồi mới đến drill/timer; giảm mỗi màn hình còn một mục tiêu.
- [x] Triển khai hướng dẫn 3-Style theo bước trong Study, chuyển thuật ngữ kỹ thuật thành giải thích dễ hiểu và nén mode 3-Style ở Studio.
- [x] Kiểm thử lộ trình người mới, memo/SRS/profile cũ, responsive, TypeScript/build và checkpoint.

## Chuyển giao diện sang Bootstrap

- [x] Xác minh Bootstrap phiên bản mới nhất và kiểm kê lớp CSS/component cũ trên Studio, Timer, Study và Settings.
- [x] Thiết kế system Bootstrap chung gồm navbar, card, tab, form, table, modal, spacing và Light/Dark Mode.
- [x] Tích hợp Bootstrap, thay shell và các trang giao diện, đồng thời giữ nguyên toàn bộ hành vi solver, timer, Study và lưu dữ liệu cục bộ.
- [x] Kiểm thử các luồng Rubik chính, responsive desktop/mobile, theme, TypeScript, regression/build và checkpoint.

## Baseline Bootstrap không tùy biến

- [x] Kiểm kê và xác định các token, font, palette, rule layout, class UI tự custom đang ghi đè Bootstrap.
- [x] Đặt baseline Bootstrap mặc định cho navigation, button, form, card, nav/tab, table, modal và Light/Dark Mode.
- [x] Gỡ CSS/component UI tùy biến, giữ nguyên markup và logic Rubik; chỉ bổ sung class Bootstrap chuẩn khi cần để layout còn đọc được.
- [x] Kiểm thử solver, Cube 3D, Timer, Study/3-Style, Settings, desktop/mobile, TypeScript/build và checkpoint.

## Toàn bộ giao diện tối đa hai cột

- [x] Kiểm kê mọi grid/layout Studio, Timer, Study, 3-Style và Settings đang xuất hiện từ ba cột ngang trở lên.
- [x] Định nghĩa quy ước Bootstrap chung: desktop chỉ `col-12` hoặc một cặp hai cột; mobile luôn một cột.
- [x] Chuyển toàn bộ trang và các khối con theo quy ước hai cột, giữ nguyên nội dung và tương tác Rubik.
- [x] Kiểm thử solver, timer, Study/3-Style, Settings, desktop/mobile, TypeScript/build và checkpoint.

## UX/UI audit & Bootstrap redesign toàn diện

- [x] Kiểm kê route, layout, navigation, form, dialog, table/list, feedback state, component tái sử dụng, CSS và interaction hiện có.
- [x] Lập UX/UI audit Critical/High/Medium/Low, xác định rủi ro tới logic, dữ liệu cục bộ và flow Rubik.
- [x] Đề xuất design system Bootstrap, kiến trúc component và thứ tự redesign; trình người dùng xác nhận trước khi sửa code.
- [x] Chuẩn hóa global layout, navigation, states và component dùng chung sau khi được xác nhận.
- [x] Redesign từng route/module, kiểm thử responsive, accessibility, loading/empty/error/success state và regression rồi checkpoint.

## Migration Bootstrap thực sự — làm lại theo ảnh hồi quy

- [x] Lập danh mục mọi `className` legacy/Tailwind và mọi class rỗng đang render trên bốn route chính cùng component con.
- [x] Viết lại Studio theo `container`, `row/col`, `card`, `nav`, `form-*`, `btn`, `table/list-group` Bootstrap; không giữ panel, badge hay telemetry legacy.
- [x] Viết lại Timer, lịch sử, filter, analytics, dialog và sheet theo Bootstrap; loại bỏ hoàn toàn spacing/card/control legacy còn nhìn thấy trong ảnh.
- [x] Viết lại Study, 3-Style, Settings và component chung theo Bootstrap; giữ riêng CSS hình học Cube/charts bắt buộc.
- [x] Kiểm tra bằng ảnh desktop và mobile từng route, grep class legacy, rồi mới chạy regression/build/checkpoint.

## Studio 3-Style — sửa Cube và Bootstrap

- [x] Tái hiện và xác định nguyên nhân Cube 3D bị cắt trong stage 3-Style theo ảnh người dùng.
- [x] Sửa vùng chứa 3D Cube để đủ kích thước, không che/cắt mô hình và giữ thao tác xoay/zoom/layer-turn.
- [x] Chuyển report, memo, special cases và profile 3-Style đang render sang card, alert, list-group, table-responsive, form và button Bootstrap.
- [x] Giảm Studio 3-Style còn input + Cube stage là hai cột desktop; mọi phần còn lại xếp toàn chiều ngang/1 cột mobile.
- [x] Kiểm tra 1440px/390px, tạo memo thực, TypeScript, tests và build trước checkpoint.

## Timer analytics — làm lại Bootstrap theo ảnh hồi quy

- [x] Thay `history-panel`, `tick-ruler`, viền đen, nền giấy và card custom trong phân tích Timer bằng Bootstrap card/row/col.
- [x] Chuyển mục tiêu pha, preset, phase Ao và hiệu quả solution sang form-control, button group, list-group, alert và card Bootstrap.
- [x] Chuyển các empty state biểu đồ sang alert Bootstrap; chỉ giữ CSS bắt buộc của thư viện chart.
- [x] Xác minh desktop/mobile cùng TypeScript, Vitest và production build trước checkpoint.

## Bootstrap Icons

- [x] Kiểm kê mọi icon Lucide/SVG đang render trên navigation, Studio, Timer, Study, 3-Style, Settings, dialog và feedback.
- [x] Cài `bootstrap-icons`, nạp stylesheet chính thức và thay icon ở shell, Studio, Timer bằng class `bi` tương ứng.
- [x] Thay icon ở Study, 3-Style, Settings, modal và component con; giữ aria-label/title trên nút chỉ-icon.
- [x] Kiểm tra desktop/mobile, TypeScript, tests và build trước checkpoint.

## Chuẩn hóa kích thước Bootstrap Icons

- [x] Kiểm kê icon legacy còn import `lucide-react`, SVG icon cứng và mọi class kích thước icon không theo Bootstrap.
- [x] Chuẩn hóa icon navigation, action, form, card và feedback theo các class `fs-6`, `fs-5`, `fs-4` Bootstrap phù hợp.
- [x] Thay mọi import icon còn sót trong component legacy bằng lớp Bootstrap Icons; giữ aria-label và tooltip.
- [x] Kiểm tra TypeScript, grep không còn Lucide/SVG icon UI, screenshot và regression trước checkpoint.

## Chuẩn hóa controls Bootstrap

- [x] Kiểm kê các nút icon-only, icon trong nút có nhãn, disabled state và spacing icon hiện tại.
- [x] Áp dụng `text-body-secondary` cho disabled state; áp dụng utility margin/gap Bootstrap nhất quán cho icon.
- [x] Bổ sung Bootstrap tooltip cho mọi nút icon-only, giữ aria-label/title và không cản thao tác bàn phím.
- [x] Kiểm tra desktop/mobile, tooltip focus/hover, TypeScript, tests và build trước checkpoint.

## Sửa hồi quy Bootstrap theo ảnh người dùng

- [x] Dùng navbar-toggler-icon Bootstrap đúng chuẩn; không gắn tooltip tự động gây lỗi icon mở điều hướng.
- [x] Điều chỉnh stage Cube 3D 3-Style cân đối, hiển thị cube lớn/rõ mà không cắt hoặc dư nền đen.
- [x] Chuyển modal Cài đặt Timer và toàn bộ control bên trong sang modal/form/button Bootstrap, bỏ dark/paper/viền custom.
- [x] Chuyển thẻ Quét camera sang card/alert/button Bootstrap, bỏ nền giấy và viền đen custom.
- [x] Kiểm tra desktop/mobile, keyboard, TypeScript, tests và build trước checkpoint.

## Rà soát lại Timer và Study theo ảnh lỗi mới

- [x] Thay mọi lớp legacy trong Timer log: toolbar, filter, empty state, button và spacing bằng card/form/input-group/alert Bootstrap.
- [x] Bỏ toàn bộ panel inspection/practice legacy còn xuất hiện dưới Cube Timer; giữ tính năng trong modal Cài đặt Timer Bootstrap.
- [x] Chuyển Memo SRS và Hồ sơ BLD trong Study thành card/form/list-group/button Bootstrap, xóa nền giấy, border đen, mono nhỏ và spacing custom.
- [x] Kiểm tra toàn trang Timer/Study ở desktop và mobile, bao gồm empty state và khối mở rộng, trước khi xác nhận.
- [x] Chạy TypeScript, Vitest và build production rồi mới lưu checkpoint.

## Modal Timer, lịch sử thực tế và BLD Report Bootstrap

- [x] Kiểm kê tất cả modal Timer: chi tiết thành tích, CubeNet phóng to, chỉnh sửa solve, playback và xác nhận xóa.
- [x] Chuyển từng modal Timer còn legacy sang cấu trúc Bootstrap modal/header/body/footer, forms, cards, list-group và buttons.
- [x] Đọc dữ liệu lịch sử local hiện có theo chế độ chỉ đọc và kiểm tra hàng solve, badges, actions, note/tag, filter, desktop/mobile.
- [x] Viết lại BLD Report Studio: header, memo, execution, special cases, stats và algorithm preference bằng Bootstrap card/list-group/form/alert.
- [x] Xác minh browser desktop/mobile cho modal và BLD Report, chạy TypeScript, Vitest, build rồi mới checkpoint.

## Modal mobile và panel Studio còn lại

- [x] Kiểm kê các panel legacy còn render trong Studio ngoài BLD Report, gồm input, camera, run profile, playback, status và report shell.
- [x] Chuyển các panel Studio còn lại sang Bootstrap card/accordion/form/alert/list-group/button theo từng component.
- [x] Mở và kiểm tra các modal Timer trên viewport mobile: cài đặt, metric, CubeNet, chỉnh sửa, playback và xác nhận xóa.
- [x] Kiểm tra Studio mobile/desktop, TypeScript, Vitest và build trước checkpoint.

## History Bootstrap và modal solve thực tế

- [x] Kiểm kê page History cũ và đọc dữ liệu solve của trình duyệt ở chế độ chỉ đọc.
- [x] Chuyển History sang Bootstrap Navbar/Card/Row/List Group/Alert/Button và giữ biểu đồ Recharts là ngoại lệ chức năng.
- [x] Kiểm tra History desktop/mobile và modal metric/CubeNet/edit/replay với solve thật nếu có, không ghi hoặc xóa lịch sử. Phiên hiện có 0 solve, nên chỉ xác minh được cấu trúc/empty state và modal Settings responsive mà không tạo dữ liệu giả.
- [x] Chạy TypeScript, Vitest, build và lưu checkpoint sau khi hoàn tất.

## Đối chiếu solve thật và trang phụ legacy

- [x] Kiểm tra trực tiếp nguồn lịch sử solve người dùng đang xem, không suy luận từ một trạng thái browser khác.
- [ ] Mở các modal metric, CubeNet, edit và replay có dữ liệu solve thực tế trong viewport mobile; không ghi/xóa dữ liệu. Đã xác minh PB, CubeNet và Edit bằng 10 solve thật trên browser desktop; modal mobile dùng shared fullscreen shell đã kiểm tra với Settings, nhưng cần một solve có solution để xác minh Replay có nội dung thực tế.
- [x] Kiểm kê tất cả route/page legacy còn lại và chuyển từng trang sang Bootstrap thuần.
- [x] Kiểm tra desktop/mobile, TypeScript, Vitest và build cho phần chuẩn hóa hiện hoàn tất.

## Tối giản hóa trang Cài đặt

- [x] Kiểm kê các setting đang rời rạc, mô tả lặp và nhóm điều khiển có thể gộp.
- [x] Chuyển Settings sang bố cục Bootstrap một cột gọn với các section/card/accordion theo nhu cầu.
- [x] Kiểm tra lưu setting, desktop/mobile, TypeScript, Vitest và build trước checkpoint.

## Auto-save và Accordion Cài đặt mobile

- [x] Tách hàm ghi cấu hình dùng chung và thêm auto-save debounce cho các thay đổi Settings.
- [x] Hiển thị phản hồi Bootstrap ngắn khi auto-save hoàn tất; giữ nút Reset an toàn.
- [x] Mặc định đóng toàn bộ Accordion ở mobile, giữ nhóm Solver/Timer mở ở desktop.
- [x] Kiểm tra desktop/mobile, localStorage, TypeScript, Vitest và build trước checkpoint.
