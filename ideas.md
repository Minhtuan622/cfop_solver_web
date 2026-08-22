# Định hướng thiết kế — CFOP Solver Studio

## Ba hướng tiếp cận

### 1. Xưởng Cơ Khí Tốc Độ

**Very Brief Intro:** Một bàn thao tác kỹ thuật lấy cảm hứng từ hồ sơ giải đấu speedcubing: nền giấy ngà, mực đen, màu sticker nguyên bản và các thước đo dữ liệu sắc gọn. Cảm giác là một công cụ chính xác, có nhịp độ và dễ đọc.

**Probability:** 0.07

### 2. Phòng Thí Nghiệm Trạng Thái

**Very Brief Intro:** Giao diện dark-mode như một phòng quan sát thuật toán với khối cube phát sáng nhẹ và dữ liệu luân chuyển theo pha. Hướng này ưu tiên chiều sâu không gian và sự tập trung.

**Probability:** 0.04

### 3. Sổ Tay Nhìn Thấy Được

**Very Brief Intro:** Một cuốn sổ giải Rubik tương tác, dùng các khối màu rõ nét, nhãn viết tay có kiểm soát và bố cục bất đối xứng. Hướng này thân thiện hơn, phù hợp cho người học.

**Probability:** 0.09

## Hướng được chọn: Xưởng Cơ Khí Tốc Độ

**Design Movement:** Swiss editorial design kết hợp aesthetic của dụng cụ đo lường cơ khí và scorecard thi đấu speedcubing.

**Core Principles:** Thứ nhất, dữ liệu và trạng thái cube phải luôn có hierarchy rõ ràng. Thứ hai, màu sticker chỉ được dùng như tín hiệu chức năng, không làm nền trang trí tràn lan. Thứ ba, từng thao tác có phản hồi có thể dự đoán và ưu tiên tốc độ đọc. Thứ tư, mọi section sử dụng đường chia, khoảng trắng và tỷ lệ như một bảng điều khiển vật lý.

**Color Philosophy:** Nền giấy kỹ thuật #F4F0E8 và mực than #17221D tạo cảm giác đáng tin cậy, trong khi xanh mint #1BA77A là màu thương hiệu và trạng thái hợp lệ. Sáu màu Rubik chỉ xuất hiện trên stickers và legend để bảo toàn tính dễ đọc.

**Layout Paradigm:** Bố cục workbench bất đối xứng: sidebar điều khiển hẹp ở trái, sân khấu cube lớn ở giữa, bảng timeline/telemetry cố định theo dòng ở phải. Trên màn hình nhỏ, ba vùng xếp thành các mô-đun theo thứ tự thao tác.

**Signature Elements:** Thước đo move-count dạng dải khắc vạch; marker pha CFOP hình viên gạch màu; đường lưới kỹ thuật tinh tế 24px; cube isometric có sticker dạng tấm vật liệu.

**Interaction Philosophy:** Người dùng thao tác như đang kiểm soát một thiết bị đo: bấm nấc bước, hover để xem trước phase và cuộn nhanh một chuỗi move. Không dùng chuyển động trang trí dài; mọi motion thông báo thay đổi state.

**Animation:** Cube chuyển sticker trong 180ms với cubic-bezier(0.23, 1, 0.32, 1). Timeline trượt 160ms, button co 0.97 khi click, stage fade/translate 8px khi đổi phase. Toàn bộ animation không thiết yếu tắt khi `prefers-reduced-motion` bật.

**Typography System:** Space Grotesk cho display/headline và IBM Plex Mono cho thuật toán, số liệu, state. Headline đậm, tracking hẹp; code/move dùng mono 14–16px và các token move bọc trong capsule vuông nhẹ.

**Brand Essence:** CFOP Solver Studio là bàn thao tác trực quan giúp người học và lập trình viên kiểm chứng, xem và hiểu lời giải CFOP đầy đủ theo từng state. **Chính xác, hữu hình, tập trung.**

**Brand Voice:** Headline ngắn, chủ động, mang tính kỹ thuật; CTA mô tả hành động thực thay vì lời mời chung chung. Ví dụ: “Mở từng pha, không bỏ qua state.” và “Chạy lại sequence với full OLL/PLL.”

**Wordmark & Logo:** Mark là một khối 3×3 isometric tối giản với một sticker mint lệch ở góc trên-phải, gợi “state đã được nhận diện”; wordmark Space Grotesk Black với chữ O được cắt một rãnh vuông.

**Signature Brand Color:** **Solver Mint #1BA77A**.

## Style Decisions

- Panels dùng các lớp giấy kỹ thuật, đường rule rõ và offset material shadow; tránh cảm giác card SaaS mềm.
- Mọi khu vực chính phải mang ít nhất một cue đo lường: grid 24px, tick rail, phase brick hoặc telemetry mono.
- Wordmark luôn đi cùng cube mark; phần chữ O được mô phỏng bằng cut-notch mint để tăng nhận diện.
- Mọi route phụ giữ full brand mark CFOP Solver Studio với cube mark và chữ O mint notched.
- Lịch sử, log và empty states dùng scorecard có tick rail, telemetry và trạng thái thao tác, không dùng card trống tối giản.
- Wordmark là một lockup nhận diện: cube mark kết hợp chữ O mint notched thấy rõ ở mọi header.
- Tick rail, counter và phase brick chỉ dùng khi gắn với move, phase, timing hoặc trạng thái log; không dùng như trang trí rời rạc.
- Timer Lab ưu tiên stopwatch như cụm thiết bị chính; scramble và solution là telemetry hỗ trợ.
- Wordmark phải luôn đọc đầy đủ CFOP Solver Studio, với O mint notched hiển thị rõ như một ký hiệu nhận diện.
- Nhật ký và empty state dùng bố cục record sheet có ruled field, mono telemetry và trạng thái ghi nhận.
- CFOP trong wordmark luôn đọc thành một từ liên tục; chỉ O mang notch mint, không tạo khoảng cách tách chữ.
- Ở Timer Lab, scramble vẫn nằm trước để inspection theo luồng thao tác, nhưng stopwatch là readout lớn nhất và nặng nhất trong vùng timer.
- Panel phụ, placeholder và trạng thái chờ ưu tiên ruled paper scorecard thay cho card bo mềm; dark ink chỉ dành cho cube, scramble và state thiết bị.
- Vùng thiết bị chính dùng contrast và tỷ lệ lớn nhất; scorecard phụ giữ đường rule giấy kỹ thuật nhưng giảm shadow, grid và border cạnh tranh.
- Stopwatch là đối tượng thị giác lớn nhất trong Timer Lab; scramble/cube vẫn xuất hiện trước theo flow inspection nhưng đóng vai trò telemetry thiết lập.
- Lockup CFOP dùng nhịp chữ liền mạch, O mint-notched là điểm phân biệt duy nhất; không tạo cảm giác tách ba ký tự.
- Timer Lab ưu tiên stopwatch toàn bề ngang làm thiết bị chính; scramble giữ ở phía trên nhưng dùng ruled-paper telemetry thay cho mảng dark ink cạnh tranh.
- Mỗi route chỉ có một apparatus ở cường độ tối đa; panel phụ giảm shadow, grid và saturation để nhịp scorecard rõ hơn.
- Trong Timer Lab, stopwatch là readout lớn nhất; cube là thiết bị quan sát duy nhất dùng dark ink còn scramble, metrics và log là giấy kỹ thuật hỗ trợ.
- Empty-state phải đọc như record sheet đang chờ phép đo, dùng nhãn vận hành và telemetry rail thay vì lời nhắc app chung chung.
- Timer Lab chỉ để stopwatch làm visual apex; stage cube inspection giảm quy mô và saturation để trở thành thiết bị quan sát phụ trợ.
- Wordmark CFOP Solver Studio được ưu tiên rõ ở header; Solver Mint chỉ đánh dấu O, trạng thái hiện hành và action hợp lệ.
- CFOP lockup đọc như nhãn dụng cụ: CF và P dùng ink/paper tương phản cao, chỉ O có mint notch; telemetry phụ giảm shadow để nhường visual apex cho thiết bị chính.
- Mỗi route chỉ có một apparatus cường độ tối đa: Timer Lab là stopwatch; tick rail, shadow và grid ở scorecard phụ chỉ xuất hiện như thước đo gắn với dữ liệu thời gian, move hoặc phase.
- Studio đặt solver/cube stage làm apparatus duy nhất ở cường độ tối đa; input và phase sidebar dùng record-sheet nhạt hơn. Solver Mint chỉ báo state hiện hành, action hợp lệ và O-notch trong lockup.
- Giọng Studio là vận hành kỹ thuật: “Kiểm tra trạng thái. Chạy chuỗi CFOP.”, “Kiểm tra & giải CFOP”, “Bàn giải sẵn sàng”; tránh lời hứa học tập chung chung. Rail/tick chỉ gắn với phase, state, move hoặc device status.
- Studio không dùng ảnh cube stock ở panel nhập: cube mark isometric và state surface grid là hệ hình ảnh thống nhất. Move log là telemetry giấy nhạt; chỉ cube/solver stage được dùng dark-ink apparatus với shadow mạnh.
- Studio desktop luôn đọc thành workbench ba vùng bất đối xứng bằng CSS rõ ràng: control hẹp trái, solver/cube stage lớn giữa, phase ladder/telemetry hẹp phải; không để ba vùng dồn thành chuỗi card cùng trọng lượng.
- Phase guide ở Studio là measurement ladder: rail dọc mint, phase brick, counter và trạng thái invariant được gắn trực tiếp với từng pha; mọi placeholder cũng giữ cấu trúc score strip này.
- Wordmark Studio tăng cường độ như nhãn thiết bị; O-notch mint lớn vừa đủ để nhận diện ở lần đọc đầu mà không phá tính liên tục của CFOP.
- Header Studio là equipment label gọn, không cạnh tranh với solver/cube stage; dark ink lớn nhất luôn thuộc về apparatus trung tâm.
- Input, phase guide, validation và move log dùng chung record-sheet giấy nhạt, border/shadow tiết chế; Solver Mint chỉ biểu đạt action, state hợp lệ và O-notch.
- Lockup “CFOP Solver Studio” luôn đọc liền mạch; O-notch mint phải nhìn thấy ngay ở lần đọc đầu nhưng không tạo khoảng cách tách chữ.
- Studio chỉ giữ solver/cube stage ở cường độ thiết bị tối đa; header là equipment label gọn, còn input, telemetry và guide là record sheet nhạt hơn.
- Grid, tick và rail chỉ nổi bật khi đo move, phase, validation hoặc device state; texture nền ở panel phụ phải gần như lùi vào giấy.
- Phase ladder là dải đo CFOP liên tục: mint rail dọc mạnh, phase brick rõ và connection trực tiếp với tiến độ solver; không đọc như stack card độc lập.
- Header Studio giữ vai trò nameplate nén: O-notch mint vẫn rõ, nhưng shadow và chiều cao phải thấp hơn cube apparatus trung tâm.
- Stage gắn cube, move-count, playback và phase như một cụm đo thống nhất; mint rail/strong tick dành cho cụm này, còn panel phụ chỉ giữ rule giấy mờ.
- Studio dùng header như equipment nameplate nén; stage cube là vùng ink/shadow/grid cường độ cao duy nhất. Input, telemetry và log chỉ là record sheet phẳng với texture rất nhẹ.
- Empty log dùng câu trạng thái telemetry như “Chưa ghi nhận move trong sequence”, không dùng lời nhắc ứng dụng chung chung.
- Header Studio là nameplate nén: chỉ giữ lockup CFOP liền mạch và O-notch mint, giảm dark mass/grid để không cạnh tranh với apparatus trung tâm.
- Solver stage gắn readout, viewport cube, playback và move rail thành một cụm đo cơ khí; central apparatus là nơi duy nhất có rail/grid/shadow ở cường độ tối đa.
- Explorer, case list và telemetry phải bám cùng measurement rail dọc, dùng score-strip/case ID mono thay cho các card dashboard tách rời.
- Header Studio là equipment nameplate nén: dark ink, grid và shadow luôn nhẹ hơn central apparatus; chỉ giữ lockup, trạng thái route và điều khiển ngôn ngữ.
- Cube mark Studio là dấu kỹ thuật 3×3 isometric vuông sắc, không dùng silhouette app-icon mềm; wordmark CFOP đọc liền mạch và chỉ O mang Solver Mint notch.
- Input, Explorer và telemetry là record-sheet phẳng có rule/tick rất nhẹ; strong rail chỉ dùng khi nối trực tiếp với state, move, phase hoặc case telemetry.
- Readout, move rail, playback và case list phải đọc như các bộ phận của một dụng cụ đo liên kết, không phải các dashboard card độc lập.
- Header là nameplate nén tối đa: wordmark, route và trạng thái được phép hiện diện, còn dark mass/grid/shadow đậm chỉ thuộc về apparatus trung tâm.
- Right rail nối phase status, case ID, counter và Explorer thành một measurement ladder liên tục bằng mint rail, ruled row và mono telemetry.
- Case Explorer hiển thị như sổ record có các dòng score-strip; tránh cảm giác danh sách dashboard hoặc thẻ độc lập.
- Nameplate giảm chiều cao, contrast và shadow để stage là visual apex duy nhất; các panel nhập chỉ là record sheet nền giấy phẳng.
- Copy tiêu đề ưu tiên ngắn, chủ động và mang sắc thái thiết bị đo/solver bench; tránh cách gọi chung chung kiểu dashboard ứng dụng.
- Study Bay chọn active case trainer làm apparatus cường độ cao duy nhất; CubeNet là lõi, Cube 3D và stopwatch là telemetry hỗ trợ cho lượt đang luyện.
- Header Timer Lab và intro Study Bay là nameplate nén; right rail hiển thị mục tiêu, queue và trạng thái học qua tick/rule liên tục, không thành card thông tin độc lập.
