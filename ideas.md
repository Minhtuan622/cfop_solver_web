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
- Timer Competition có stopwatch là apparatus ink/shadow/grid cường độ cao duy nhất. Scramble, setup, analytics và nhật ký chỉ là record-sheet giấy nhạt; header luôn là nameplate nén.
- Mark Timer Lab dùng dấu cube 3×3 vuông sắc như technical stamp; wordmark CFOP đọc liên tục và O mint-notch vẫn là điểm nhận diện duy nhất.
- Lockup luôn đọc liền thành “CFOP Solver Studio” bên cạnh cube mark; chữ CFOP không được xuống dòng hoặc tách nhịp, chỉ O có notch Solver Mint.
- Mỗi route chỉ có một apparatus dark-ink/shadow/grid ở cường độ tối đa; số liệu, log, empty state và khối điều khiển chuyển thành ruled-paper score sheet phẳng hơn.
- Settings là tờ hiệu chuẩn: nhóm đánh số, mint rail dọc, ruled row, trạng thái mono; không sử dụng cảm giác card dashboard độc lập.
- Panel phụ luôn là ruled-paper record: border nhẹ, shadow tối thiểu; chỉ apparatus chính của route được dùng dark ink hoặc material shadow mạnh.
- Vùng chờ và khoảng trống phải là field đo lường có rule/tick/telemetry, không là canvas trắng chưa hoàn tất.
- Hệ cube dùng chung sticker-plane isometric sắc nét và controlled shadow; tránh glow trang trí hoặc phong cách render không thống nhất.
- Study Bay chỉ dùng CubeNet/case trainer làm apparatus đậm; Cube 3D và stopwatch chuyển thành telemetry giấy kỹ thuật có rail đo liên kết.
- Right rail của Study nối mục tiêu, lịch ôn và catalog thành một measurement ladder liên tục bằng mint rail, ruled row, counter và case ID mono.
- Nameplate toàn cục tăng nhận diện bằng cube stamp vuông, wordmark CFOP liền mạch và O-notch mint/đường tick nhỏ; không tăng chiều cao header.
- Settings là calibration record sheet phẳng: rail dọc, numbered rule và status mono mang hierarchy; Solver Mint chỉ đánh dấu lựa chọn, action hợp lệ hoặc phép đo, không phủ nền tiêu đề/row chung.
- Right rail nối case, counter, lịch và catalog bằng ruled ladder liên tục; khoảng trống giữ grid/rule rất nhẹ để đọc như bàn đo đã chuẩn bị.
- Apparatus chính dùng geometry instrument-plate sắc hoặc chỉ chamfer rất nhẹ; không dùng khối card bo mềm. Space Grotesk là nameplate/command/headline, IBM Plex Mono dành cho move, counter, case ID và telemetry.
- Timer luôn có stopwatch plate tối là visual apex; scramble, cube, log, filter và empty state là record-sheet telemetry nối bằng rail/tick mint. Wordmark giữ dạng equipment label liên tục, O-notch là accent mint độc nhất.
- Mỗi route chỉ giữ một apparatus có dark ink, grid và material shadow mạnh; record sheet phụ ưu tiên paper surface, rule mảnh và nhãn mono nhẹ.
- Rail bên phải là một measurement ladder liên tục: mint rail dọc nối counter, phase, case và report thay vì các dashboard card tách rời.
- Cube/state dùng sticker-plane sắc cạnh với inset material shadow thống nhất giữa 3D guide, CubeNet và state surface; không dùng treatment icon phẳng tách rời apparatus.
- Nameplate toàn cục dùng cube stamp vuông, CFOP liền mạch bằng Space Grotesk và O-notch mint rõ nét; Solver Studio là telemetry mono nhỏ, không cạnh tranh với stage.
- Rail mint nổi bật phải kết thúc ở phase, counter, case, tiến độ hoặc validation có nhãn; rail không gắn phép đo chỉ lùi thành texture giấy.
- Sidecar 3-Style là chuỗi record sheet phẳng theo luồng Drill → Memo → Profile; chỉ stage cube/solver được giữ material shadow và grid đậm.

## Studio Reset — Command Deck

**Design Movement:** Command-center minimalism lấy từ DevTools/CAD, kết hợp Swiss hierarchy; không còn mô hình ba card cạnh tranh nhau.

**Core Principles:** Workspace là một shell liên tục thay vì một chuỗi cards. Command bar định nghĩa context; input drawer chỉ chứa dữ liệu vào; canvas cube/solver là vùng thao tác lớn nhất; inspector chỉ cho state đang liên quan; report chuyển thành record drawer toàn chiều ngang dưới workspace. Một action chính duy nhất được giữ nổi bật theo mode đang chọn.

**Layout Paradigm:** Desktop dùng grid 12 cột và ba vùng chức năng: input drawer 3 cột, canvas 6 cột, inspector 3 cột. Command bar chạy ngang toàn shell; report drawer chạy ngang toàn chiều dưới canvas. BLD dùng report 7/12 + sidecar 5/12 ở record drawer, CFOP dùng report full-width có chiều cao đọc được. Tablet giảm thành input + canvas, inspector thành strip; mobile là command bar → input → canvas → inspector → record.

**Color Philosophy:** Giữ giấy ngà, mực than và Solver Mint, nhưng bỏ rail lớn rời rạc. Mint chỉ báo mode hoạt động, validation, action và tiến độ. Vùng phụ phẳng, rule mảnh; canvas được phép dùng grid/ink mạnh.

**Interaction Philosophy:** Mode/nguồn input luôn đọc được ở command bar. Input drawer giữ action Tạo memo/Giải ngay tại nơi nhập. Inspector chuyển từ dashboard card thành danh sách state/metric ngắn. Report drawer có một title bar, section rõ và chứa toàn bộ dữ liệu dài để không phá canvas.

**Typography System:** Space Grotesk cho context/action, IBM Plex Mono cho token move, case ID, buffer, state và counter. Header command dùng title nhỏ gọn, không còn headline display chiếm chỗ.

**Brand Voice:** “Workspace đã sẵn sàng.”, “Nhập state. Chạy pipeline.”, “Record chưa có dữ liệu.” — dứt khoát, vận hành, không mô tả app chung chung.

### Style Decisions

- Studio dùng tiếng Việt vận hành kỹ thuật: Bàn giải, Bảng nhập, Cấu hình chạy, Bảng kiểm tra; tiếng Anh chỉ giữ cho CFOP, 3-Style, Speffz, case ID và notation.
- Canvas solver/cube là apparatus duy nhất có material border/shadow nặng. Input drawer, cấu hình, inspector và record phụ phải là ruled-sheet phẳng hơn.
- Wordmark toàn cục giữ header nén nhưng tăng độ đọc của cube stamp, CFOP liền mạch và O-notch mint ở lần nhìn đầu.

## Soft Minimal Reset

### Ba hướng tiếp cận

#### 1. Soft Focus Workspace

**Very Brief Intro:** Bề mặt sáng dịu, khoảng trắng rộng, các khối chức năng bo mềm vừa phải và cube là vật thể có sắc độ mạnh nhất. Hướng này ưu tiên sự bình tĩnh khi luyện tập dài.

**Probability:** 0.06

#### 2. Calm Study Desk

**Very Brief Intro:** Cảm giác bàn học kỹ thuật tối giản với các cụm nội dung như giấy ghi chú mờ, nhịp chữ lớn và bộ điều khiển ít nhiễu. Hướng này tập trung đọc thuật toán và theo dõi từng state.

**Probability:** 0.08

#### 3. Gentle Dark Instrument

**Very Brief Intro:** Nền charcoal dịu với các surface mềm và cube nổi vừa đủ, hướng tới cảm giác tập trung trong Dark Mode. Hướng này tránh neon, grid cứng và dashboard dày đặc.

**Probability:** 0.04

### Hướng được chọn: Soft Focus Workspace

**Design Movement:** Japanese-inspired calm productivity kết hợp product minimalism; không dùng soft-neumorphism quá mức và không có border trang trí.

**Core Principles:** Một mục tiêu chính trên mỗi vùng nhìn; khoảng trắng được dùng để phân nhóm; surface phân biệt bằng nền, radius, elevation mờ và spacing thay vì đường viền; các control Rubik giữ notation/metadata rõ nhưng không biến toàn trang thành dashboard.

**Color Philosophy:** Light Mode dùng nền pearl ấm, surface trắng sữa, ink xanh-than dịu và xanh sage cố định làm tín hiệu hợp lệ. Dark Mode dùng slate than mềm với surface nâng sáng vừa đủ. Sáu màu cube chỉ thuộc về cube/sticker/legend.

**Layout Paradigm:** Desktop-first dùng content rail rộng, left input compact, visual cube stage là lõi, và result desk lùi xuống dưới. Các panel dùng cùng Shell, Surface, SectionHeading, SegmentedControl, PrimaryAction và MetricChip. Không tạo card mới chỉ vì nội dung khác.

**Signature Elements:** Gradient surface mờ rất nhẹ; corner radius 16–24px; shadow diffused thấp; tiny status dot dành cho trạng thái Rubik hợp lệ. Không có border đường thẳng, rail, tick, grid hay offset shadow làm trang trí.

**Interaction Philosophy:** Thao tác ứng dụng dùng press state 140ms và focus ring mềm; không có entrance animation. Cube 3D giữ animation xoay tầng vì đó là phản hồi thao tác trực tiếp.

**Typography System:** Giữ Space Grotesk cho title/CTA và IBM Plex Mono cho notation, move, case ID, timer. Mọi nội dung UI dùng cỡ chữ cố định, đọc tốt ngay ở 100%; không còn preference scale.

**Brand Essence:** Một workspace Rubik bình tĩnh, trực quan và chính xác để giải, quan sát và luyện tập các state phức tạp. **Dịu, tập trung, tin cậy.**

**Brand Voice:** “Nhập state, xem cube, chạy lời giải.” và “Memo đã sẵn sàng để ôn.” — ngắn, hành động rõ, không có jargon không cần thiết.

**Wordmark & Logo:** Cube mark còn lại như dấu nhận diện nhỏ trên nền mềm; wordmark đọc gọn, không dùng effect hoặc marker kỹ thuật.

**Signature Brand Color:** **Sage Teal #42A897**.

### Style Decisions

- Header luôn đọc liên tục là **CFOP Solver Studio**; chữ O là chữ thật, dùng Sage Teal cố định và không bị thu nhỏ thành dấu trang trí.
- Surface phụ dùng nền giấy phẳng và elevation rất thấp; chỉ Cube/primary apparatus của từng route được phép có shadow rõ hơn.
- Không dùng rail, tick, grid hoặc border làm trang trí. Trạng thái Rubik được truyền bằng màu Sage Teal, khoảng cách, hàng metadata và nội dung thực.

## Motion & Rhythm Calibration

**Cube Motion:** Layer turn mô phỏng một động tác có lực: tăng tốc ngắn, phần quay chính xác ở giữa và giảm tốc nhỏ trước khi state mới ổn định. Layer chuyển động giữ opacity đến sát cuối để tránh cảm giác “biến mất”, nhận elevation/shadow rất nhẹ khi tách lớp, và toàn bộ animation tắt theo reduced-motion.

**Desktop Rhythm:** Dùng bậc spacing 8px: 8/16/24/32/48. Mỗi route có một content rail chung; bên trong, panel phụ cách nhau 16px, cụm thao tác cách nhau 24px, và main apparatus cách record/history 32px. Timer dùng một device lớn bên trái, bảng thành tích hẹp bên phải, sau đó mới đến log/analytics toàn chiều rộng.

## Surface Refinement

**Corner Geometry:** Dùng một thang bo góc vừa phải: 10px cho control/chip, 14px cho field và metric, 18px cho panel, 22px cho apparatus chính. Không còn góc sắc, pill quá tròn hay radius quá lớn.

**Color Balance:** Nền pearl ấm, surface trắng ngà, inset sage-grey nhẹ và Sage Teal chỉ dành cho action/trạng thái hợp lệ. Dark Mode dùng charcoal dịu, không dùng outline sáng hoặc shadow đen.

**Elevation & Hover:** Không dùng shadow, viền đen, offset hoặc glow trên UI. Surface được phân tầng bằng color. Thành phần có thể tương tác chỉ đổi background nhẹ, chữ/icon sang ink/accent và dịch `translateY(-1px)` trong 140ms; reduced-motion tắt translate.

## Studio View & Study Focus

**Studio View Toggle:** Một segmented control nhỏ đặt ngay trong viewport, chỉ có `2D` và `3D`. Mỗi thời điểm chỉ hiển thị một mô hình; lựa chọn giữ trong phiên để Canvas bớt dày đặc mà controls playback không đổi.

**Study Hierarchy:** Trainer case là apparatus chính. Timer và model tham chiếu nằm trong cùng một support stack; mục tiêu ngày, lịch SRS và catalog trở thành hai record sheet ở hàng sau. Filter catalog nằm trên một hàng có thể quét, danh sách case là vùng cuộn chủ động thay vì kéo dài bề mặt.

## 3-Style trong Study

**Placement:** Luyện 3-Style trở thành một desk riêng dưới Last Layer trên cùng route Study, được mở bằng control `LAST LAYER` / `3-STYLE BLD`. Chỉ desk đang chọn được render để desktop không thành một trang dài dày đặc.

**Hierarchy:** `DRILL` là apparatus chính cho parity, 2-flip và corner twist; `MEMO SRS` và `HỒ SƠ` là hai support surface nhỏ. Một input gọn tạo memo từ scramble/state ngay tại Study để luồng Học 3-Style không lệ thuộc quay lại Studio.

**Continuity:** Các component BLD hiện có được tái sử dụng cùng contract localStorage; không đổi SRS, kết quả Drill, Speffz cards, profile import/export hay algorithm ưu tiên. Studio chỉ giữ BLD analysis/report, không còn sidecar luyện tập.
