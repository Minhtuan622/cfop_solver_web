# Kiểm kê tính năng trùng lặp — CFOP Solver Studio

**Phạm vi rà soát:** các route đang hoạt động (`Studio`, `Timer`, `History`, `Study`, `Cài đặt`) và những component được render từ các route đó. Báo cáo này chỉ chỉ ra **chức năng trùng hoặc chồng chéo theo trải nghiệm người dùng**; các component kỹ thuật dùng lại như Cube 2D/3D, button, modal hoặc localStorage helper không bị coi là tính năng trùng.

> **Kết luận ngắn:** website hiện có ba vùng chồng chéo lớn nhất: **phân tích lịch sử solve**, **học/tra cứu Last Layer**, và **nhập–tạo memo 3-Style**. Ngoài ra, cùng một bộ cài đặt đang xuất hiện ở Cài đặt, Studio và Timer, khiến người dùng khó biết thay đổi nào là mặc định toàn cục và thay đổi nào chỉ áp dụng cho phiên đang mở.

## 1. Các chức năng trùng hoàn toàn hoặc gần như hoàn toàn

| # | Chức năng bị trùng | Nơi đang xuất hiện | Mức độ | Tác động hiện tại | Khuyến nghị hợp nhất |
|---:|---|---|---|---|---|
| 1 | **Nhật ký solve, lọc và xem kết quả** | `TimerLab.tsx` có Nhật ký lượt giải; `History.tsx` có danh sách solve, tìm kiếm, tag và chỉ số | Cao | Có hai nơi để người dùng tìm lịch sử. Người dùng không biết nên thao tác ở Timer hay History. | **History** là chủ sở hữu dữ liệu chi tiết, filter và phân tích. Timer chỉ giữ 3–5 solve gần nhất cùng liên kết “Mở History”. |
| 2 | **Phân tích hiệu năng solve** | Timer có analytics, PB/Ao, phase targets và biểu đồ; History có best/average/penalty/trend | Cao | Chỉ số và biểu đồ bị phân tán; nguy cơ hiển thị hai cách tính khác nhau. | **History** giữ toàn bộ analytics, biểu đồ, filter và drill-down. Timer chỉ giữ tóm tắt PB/Ao5/Ao12. |
| 3 | **Catalog ZBLL/1LLL và tra cứu công thức** | Studio (`Home.tsx`) có catalog, group, search, case detail; Study có `LastLayerExplorer` cùng catalog | Cao | Tra cứu case xuất hiện hai lần; luồng học bị lẫn với luồng giải. | **Study** sở hữu catalog, filter, progress và luyện case. Studio chỉ hiện case được solver nhận diện và nút “Mở trong Study”. |
| 4 | **Đánh dấu case Last Layer đã thuộc / chưa thuộc** | Studio lưu `cfop-studio-mastered-last-layer-v1`; Study dùng dữ liệu mastered của `lastLayerStudy` | Rất cao | Cùng một trạng thái “đã thuộc” có thể tách thành hai bộ localStorage khác nhau, làm sai progress. | Chuẩn hóa về **một storage master** của Study; Studio chỉ đọc/ghi qua helper dùng chung. Đây là ưu tiên kỹ thuật cao nhất. |
| 5 | **Luyện case chưa thuộc ngẫu nhiên** | Studio có `startUnmasteredPractice`; Study có queue, due/weak cases, random case và SRS | Cao | Hai cách chọn case cạnh tranh; Studio không có đầy đủ SRS. | Giữ random và SRS tại **Study**; Studio chỉ deep-link sang case tương ứng. |
| 6 | **Nhập scramble/state để tạo memo 3-Style** | Studio 3-Style phân tích `BldReport`; Study `BldStudyLab` cũng nhận scramble hoặc 54 sticker và tạo memo | Cao | Hai màn hình tạo cùng kết quả Edge/Corner memo. Người mới không biết bắt đầu ở đâu. | Ưu tiên **Study** làm điểm vào học 3-Style. Studio giữ chế độ “phân tích kỹ thuật” và nút chuyển memo sang Study, không dựng một memo builder thứ hai. |
| 7 | **Thuật toán parity, 2-flip và corner twist** | Studio `BldReport` tra exact algorithm; Study `BldTrainingLab` drill các nhóm parity/flip/twist | Trung bình | Cùng nội dung thuật toán xuất hiện dưới hai mục đích nhưng hiện chưa phân vai rõ. | Giữ cả hai nhưng tách vai trò: Studio = **nhận diện từ state**; Study = **drill/SRS**. Tách catalog fetch/cache dùng chung để không tải hai lần. |
| 8 | **Ưu tiên thuật toán 3-Style cá nhân** | `BldReport` cho nhập preferred algorithm; `BldProfilePanel` là nơi quản lý hồ sơ/thuật toán ưa thích | Trung bình | Người dùng vừa có thể sửa preference trong report, vừa quản lý profile ở Study. | Hồ sơ Study là nơi **quản lý** preference; BLD Report chỉ hiển thị preference đang chọn và liên kết sang Study để sửa. |
| 9 | **Cài đặt solver: Cross, opening, Last Layer, F2L slots** | Trang Cài đặt và accordion Cài đặt Solver trong Studio | Cao | Cả hai cùng ghi `read/writeSolverSettings`; người dùng khó phân biệt “mặc định” và “tạm thời”. | Settings sở hữu **mặc định toàn cục**. Studio chỉ là **override cho solve hiện tại**, có nhãn rõ và nút “Đặt lại về mặc định”. |
| 10 | **Cài đặt Timer: inspection sound, speed split, Cross highlight, mục tiêu phase** | Trang Cài đặt; modal/khối Cài đặt Timer và analytics trong Timer | Cao | Nhiều vị trí bật/tắt cùng hành vi. | Settings là nơi lưu mặc định. Timer chỉ giữ phần “Cài đặt nhanh cho lượt hiện tại”, hoặc thay bằng liên kết gọn sang Settings. |

## 2. Các chức năng chồng chéo một phần

| # | Nhóm chức năng | Phần chồng chéo | Phần nên giữ riêng | Quyết định đề xuất |
|---:|---|---|---|---|
| 11 | **Hiển thị công thức Last Layer** | Studio Formula Strip và Study “Xem công thức” đều hiển thị algorithm của case. | Studio cần công thức để giải thích kết quả solver; Study cần che/hiện để luyện nhớ. | Không xóa hoàn toàn. Studio chỉ hiển thị tham chiếu ngắn; Study giữ tương tác “xem đáp án”. |
| 12 | **Cube 2D/3D cho cùng một state** | Studio, Timer và Study đều dựng CubeNet/Cube3DGuide. | Mỗi nơi phục vụ mục đích khác: kiểm tra solver, xem scramble/replay, nhận biết case luyện tập. | **Giữ riêng**; chỉ tái dùng component Cube và controls chung. Không coi đây là trùng tính năng UX. |
| 13 | **Timer chính và timer luyện case** | Timer Lab và `SolveTimer` trong Last Layer Study đều đếm thời gian. | Timer Lab lưu solve chính/inspection/splits; Study timer phục vụ tự chấm case và SRS. | **Giữ riêng**, nhưng dùng cùng engine/keyboard semantics để nhất quán. |
| 14 | **Nhập state 54 sticker và quét camera** | Cả `CubeStateEditor` và `CameraScanner` đều tạo state 54 sticker. | Một luồng là nhập tay/chỉnh sửa chính xác; luồng kia là thu ảnh tự động. | Gộp dưới một panel “Nhập state” với hai tab **Tô tay** / **Quét camera**. Không loại bỏ nguồn nào. |
| 15 | **Scramble mới** | Studio CFOP, Timer và Study BLD đều có tạo scramble. | Mỗi scramble phục vụ solve, timed solve hoặc memo practice. | Giữ các generator theo ngữ cảnh; trích helper random scramble chung nếu chưa có. |
| 16 | **Import/export dữ liệu** | Timer history JSON, Last Layer Study backup, BLD profile backup, CFOP report JSON. | Các payload và mục đích khác nhau. | Không gộp thành một nút đơn. Có thể tạo một “Sao lưu toàn bộ” ở Settings để gom các export/import hiện hữu. |
| 17 | **Export report** | CFOP report xuất JSON/PNG; Timer xuất JSON/CSV; Study export progress/profile. | Nội dung export khác nhau. | Giữ riêng theo ngữ cảnh; chuẩn hóa nhãn và nơi đặt nút. |

## 3. Các tính năng không nên gọi là trùng

| Nhóm | Lý do nên giữ |
|---|---|
| Solver CFOP theo phase và BLD 3-Style analyzer | Cùng nhận scramble/state nhưng đầu ra khác hoàn toàn: một bên giải theo CFOP, một bên tạo memo/execution BLD. |
| Last Layer catalog và BLD Drill | Đều là học Rubik nhưng case database, mục tiêu và SRS khác nhau. Chỉ phần tổ chức học cần đồng nhất. |
| History page và Timer | Sau khi tách vai trò, Timer là thao tác solve thời gian thực; History là phân tích sau solve. Đây là hai bước khác nhau. |
| Cube 2D, Cube 3D và biểu đồ | Là các biểu diễn chức năng khác nhau của state/dữ liệu, không phải bản sao cùng một feature. |

## 4. Thứ tự hợp nhất được khuyến nghị

1. **Gộp trạng thái mastered Last Layer.** Chuyển Studio dùng cùng helper/storage với Study để progress không bị tách đôi.
2. **Chuyển catalog và luyện ZBLL/1LLL về Study.** Studio chỉ nhận diện case, hiển thị kết quả ngắn và deep-link sang Study.
3. **Đưa analytics History thành nguồn chính.** Giảm Timer xuống tóm tắt và danh sách solve gần nhất.
4. **Phân vai Settings/Studio/Timer.** Settings = mặc định lưu lâu dài; Studio/Timer = override tạm thời có nhãn rõ.
5. **Phân vai Studio BLD/Study BLD.** Studio = chẩn đoán từ cube state; Study = tạo memo cho người học, drill, SRS và profile.

## 5. Bản đồ sở hữu tính năng sau khi hợp nhất

| Khu vực | Nên sở hữu chính | Chỉ hiển thị tham chiếu |
|---|---|---|
| Studio | CFOP solve, chỉnh state, BLD state analysis | Case Last Layer nhận diện; nút mở Study; BLD memo summary |
| Timer | Stopwatch, inspection, solve hiện tại, PB/Ao tóm tắt | 3–5 solve gần nhất; nút mở History |
| History | Lịch sử đầy đủ, filter, tags, analytics, charts, export | Không cần control Timer hay setting phức tạp |
| Study | Last Layer catalog/SRS, 3-Style lesson/drill/SRS/profile | Deep-link quay Studio khi cần phân tích state nâng cao |
| Cài đặt | Mặc định solver/timer/study/appearance và backup tổng | Không lặp controls phiên tạm thời |

## 6. Nguồn kiểm kê trong mã nguồn

| Khu vực | File chính |
|---|---|
| Route và navigation | `client/src/App.tsx`, `client/src/components/AppNav.tsx` |
| Studio CFOP/3-Style/Last Layer | `client/src/pages/Home.tsx`, `client/src/components/BldReport.tsx` |
| Timer và solve history | `client/src/pages/TimerLab.tsx`, `client/src/lib/solveHistory.ts` |
| History analytics | `client/src/pages/History.tsx` |
| Study Last Layer/3-Style | `client/src/components/LastLayerStudyLab.tsx`, `client/src/components/BldStudyLab.tsx`, `client/src/components/BldTrainingLab.tsx` |
| Cài đặt | `client/src/pages/Settings.tsx` |
