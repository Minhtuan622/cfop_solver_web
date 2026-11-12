# UX/UI Audit — CFOP Solver Studio

> **Lưu ý:** tài liệu này là bản audit tại thời điểm đã viết. Repo đã bỏ hẳn Bootstrap và dùng Tailwind CSS 4; các class Bootstrap được nhắc ở đây không còn tồn tại trong mã nguồn. Xem [hướng dẫn phát triển](../development/project-guide.md) cho quy ước giao diện hiện hành.

**Ngày audit:** 24/08/2026  
**Phạm vi:** Studio CFOP/3-Style, Timer, Study, Settings, navigation và các component dùng chung.  
**Ràng buộc bất biến:** Không thay đổi thuật toán solver, timer/inspection, state Cube 2D/3D, SRS, 3-Style, localStorage, import/export, routes hoặc flow nghiệp vụ khi chưa có lý do UX bắt buộc và kiểm thử hồi quy.

## 1. Tổng quan hiện trạng

Website là một ứng dụng React/Vite phía client với bốn điểm vào chính: **Studio**, **Timer**, **Study** và **Cài đặt**. `/study` được route vào `TimerLab` theo ngữ cảnh route, vì vậy Timer và Study chia sẻ shell/logic trang cấp cao. Giao diện đã có Bootstrap 5.3.8, nhưng nhiều component nghiệp vụ vẫn dùng utility Tailwind, class lịch sử và markup dày đặc; điều này khiến các quy tắc spacing, label, action và state không nhất quán.

Quy tắc bố cục hiện hành là **tối đa hai cột desktop và một cột mobile**. Đây là ràng buộc sẽ được giữ nguyên trong toàn bộ redesign. Cube 2D/3D, chart và các visual theo state là ngoại lệ chức năng: chúng giữ CSS riêng chỉ để render chính xác, không làm nền tảng cho một hệ style UI riêng.

| Khu vực | Hiện trạng chức năng | Quan sát UX/UI |
|---|---|---|
| Studio | Nhập scramble/state, solver CFOP/3-Style, 2D/3D, playback, report/export | Luồng chính khả dụng nhưng label, input setup, playback, telemetry và report chưa có hierarchy thống nhất; nhiều thuật ngữ xuất hiện trước ngữ cảnh giải thích. |
| Timer | Scramble, inspection, split, Cube 3D, thành tích, history/import/export | Stopwatch rõ nhưng setting/analytics/history có mật độ cao; action icon và trạng thái penalty cần chuẩn hóa nhãn, feedback và pattern table/list. |
| Study | Last Layer catalog/SRS, 3-Style nhập môn, memo, profile | Hướng học đã có, nhưng catalog/filter/timer/mục tiêu chưa cùng pattern form–feedback–empty state; một số vùng vẫn dùng text mono rất nhỏ. |
| Settings | Solver, timer, study và display preference | Section dài, nhiều button group khác hành vi; cần cấu trúc form/group/description/validation đồng nhất. |
| Navigation | Bootstrap navbar với responsive collapse thủ công | Route hiện rõ, nhưng chưa có current-page description, không có điều hướng ngữ cảnh/breadcrumb tại page level, và mobile menu cần mục tiêu chạm/lifecycle focus rõ ràng hơn. |

## 2. Các vấn đề cần xử lý

| Mức độ | Vấn đề | Ảnh hưởng người dùng | Hướng xử lý |
|---|---|---|---|
| **Critical** | Không có lỗi vỡ flow nghiệp vụ được xác nhận trong audit hiện tại. | Không áp dụng. | Giữ regression suite trước/sau từng nhóm thay đổi. |
| **High** | Hierarchy và ngôn ngữ UI không thống nhất giữa Bootstrap mặc định, utility Tailwind và class lịch sử. | Người mới khó nhận diện action chính, trạng thái và nơi bắt đầu trên từng route. | Chuẩn hóa button, card, label, spacing, alert, tab, form và status theo Bootstrap semantic classes. |
| **High** | Nhiều form/control dùng placeholder, `aria-label` hoặc label kỹ thuật thay vì nhãn/description nhìn thấy được. | Khó hiểu với người mới; giảm khả năng quét và hỗ trợ đọc màn hình. | Mỗi field có `label`, helper text và validation message gần field; placeholder chỉ làm ví dụ. |
| **High** | Màn hình Study/Timer chứa catalog, metric, list và setup nhưng thiếu pattern loading/empty/error/success nhất quán. | Người dùng không luôn biết là đang tải, không có dữ liệu, lọc rỗng hay đã lưu thành công. | Tạo feedback primitives Bootstrap: alert, spinner, empty-state panel, toast live region và button loading. |
| **Medium** | Một số text metadata/move label cỡ rất nhỏ và color-only state còn tồn tại trong component lịch sử. | Khó đọc trên mobile và không đáp ứng tốt accessibility. | Dùng body/caption Bootstrap, `text-body-secondary`, badge có nhãn văn bản, focus ring và tương phản kiểm thử. |
| **Medium** | Settings dài và action chọn mode có thể xuất hiện như nhiều CTA tương đương. | Tăng tải nhận thức, khó phân biệt lựa chọn hiện tại với hành động lưu. | Nhóm theo accordion/form section; dùng radio/button-check hoặc select phù hợp, summary state và một save/auto-save feedback rõ. |
| **Medium** | History/catalog dùng list/table lai, chưa quy định rõ mobile adaptation. | Table rộng dễ nén chữ hoặc lọc/action khó thao tác trên màn hình nhỏ. | Desktop dùng `.table-responsive`; mobile chuyển solve record thành stacked list/card semantic với actions theo thứ tự ưu tiên. |
| **Medium** | Navbar collapse do state React điều khiển nhưng chưa kiểm soát focus/close bằng Escape. | Trải nghiệm bàn phím/mobile chưa hoàn chỉnh. | Dùng Bootstrap Collapse/Offcanvas chính thức hoặc hoàn thiện focus return, Escape và close-on-route-change. |
| **Low** | CSS hiện chỉ còn cube geometry nhưng các JSX class lịch sử vẫn xuất hiện trong source. | Khó maintain và gây nhiễu khi sửa giao diện sau này. | Thay dần bằng Bootstrap semantic class/variant; tách CSS chức năng Cube, chart và scanner khỏi UI theme. |
| **Low** | Không có breadcrumb/page intro nhất quán. | Người dùng mới mất vài giây để hiểu bối cảnh sâu như Study 3-Style. | Dùng page header ngắn, optional breadcrumb chỉ ở luồng có cấp sâu; không thêm nếu không giúp điều hướng. |

> **Kết luận audit:** Tính năng Rubik hiện có là lợi thế và không nên thay đổi. Vấn đề trọng tâm là **cách trình bày và phản hồi**, không phải business logic. Redesign sẽ ưu tiên giảm mật độ, làm rõ action kế tiếp, hợp nhất feedback/state và mobile interaction.

## 3. Design System Bootstrap đề xuất

Design system sử dụng Bootstrap 5.3.8 làm nguồn chân lý. Không thêm framework UI và không tạo CSS custom khi Bootstrap utility/component đã đáp ứng được. CSS riêng chỉ dành cho Cube 3D, CubeNet, camera overlay và biểu đồ cần render theo state.

| Nhóm | Chuẩn đề xuất |
|---|---|
| Màu | `primary` cho action chính; `secondary` cho action phụ; `success`, `warning`, `danger`, `info` cho trạng thái có nhãn văn bản; `body`, `body-tertiary`, `border`, `text-body-secondary` cho surface và muted text. Light/Dark/System tiếp tục qua `data-bs-theme`. |
| Typography | Bootstrap system font; `h1` cho page title duy nhất, `h2` cho section, `h3` cho card title; `small`/`text-body-secondary` cho helper; `font-monospace` chỉ cho notation, timer, case ID, moves và số liệu. Không dùng metadata nhỏ hơn mức đọc được trên mobile. |
| Spacing | Chỉ dùng thang `gap`, `p`, `m` Bootstrap 2/3/4/5; mỗi page có `container-xxl py-4 py-lg-5`; section dùng `mb-4` hoặc `mb-5`; card body dùng `p-3 p-lg-4`. |
| Border/radius/shadow | Bootstrap default radius/border; shadow chỉ cho modal, dropdown/offcanvas hoặc primary apparatus thật sự cần phân tầng. Không dùng shadow như tín hiệu tương tác thường xuyên. |
| Buttons | Một `.btn-primary` mỗi vùng nhìn; action phụ `.btn-outline-secondary`; destructive `.btn-outline-danger`/confirmation; icon-only button có `aria-label`, tooltip và kích thước chạm tối thiểu. |
| Forms | `form-label`, `form-text`, `invalid-feedback`, `valid-feedback`, `input-group` khi có đơn vị/shortcut; radio/check button group chỉ khi chọn một trong ít lựa chọn rõ ràng. |
| Feedback | `alert` inline cho validation/task state; toast `aria-live` cho save/export/import; `.spinner-border`/disabled button khi action bất đồng bộ; empty state có title, explanation, next action. |
| Lists/tables | `.list-group` cho catalog/history nhanh; `.table-responsive` cho dữ liệu đa cột; mobile dùng stacked rows, không ép nhiều cột. |

## 4. Kiến trúc component đề xuất

| Component dùng chung | Trách nhiệm | Bootstrap building blocks |
|---|---|---|
| `AppShell` | Container, page spacing, skip link, region landmarks | `container-xxl`, `main`, spacing utilities |
| `PageHeader` | Title, description ngắn, action thứ cấp | flex utilities, breadcrumb tùy chọn |
| `SectionCard` | Card header/body/footer chuẩn, title/id nhất quán | `.card`, `.card-header`, `.card-body`, `.card-footer` |
| `ActionBar` | Gom primary/secondary/destructive action theo ưu tiên | `.btn-group`, flex/gap, dropdown when needed |
| `StatusFeedback` | Loading/empty/error/success có semantic live region | `.alert`, `.spinner-border`, `.placeholder-glow` |
| `FieldGroup` | Label, input, helper, validation | `.form-label`, `.form-control`, feedback classes |
| `ResponsiveRecordList` | History/catalog theo table desktop + stacked mobile | `.table-responsive`, `.list-group` |

Các component này chỉ làm presentation; state solver, localStorage, timer, BLD profile, import/export và Cube state được giữ ở contract hiện có.

## 5. Thứ tự redesign đề xuất

| Giai đoạn | Phạm vi | Tiêu chí hoàn tất |
|---|---|---|
| 1. Global shell | Navbar/offcanvas, container, page header, focus/skip link, theme sync | Mọi route có landmark và mobile navigation hoạt động bằng touch/keyboard. |
| 2. System & states | Button/form/status/list/table primitives | Có một pattern rõ cho loading, empty, error, success và disabled. |
| 3. Studio | Input solver, source mode, cube stage/playback, report | Một CTA chính, label rõ, action export phụ, report đọc được ở mobile. |
| 4. Timer | Scramble, stopwatch, inspection, metric, history/list, import/export | Readout là focal point; history responsive; penalty/record feedback rõ. |
| 5. Study & 3-Style | Lesson path, SRS, catalog, filter, timer, profile | Mỗi bước học có một action tiếp theo và empty/filter state rõ. |
| 6. Settings | Form grouping, descriptions, choice controls, save feedback | Mỗi setting có nhãn, giải thích, state đã lưu và focus order tốt. |
| 7. QA | Responsive, keyboard, contrast, screen reader labels, regression | Desktop/mobile/tablet pass, no console error, existing 8 tests + build pass. |

## 6. Rủi ro và biện pháp bảo toàn functionality

| Rủi ro | Biện pháp |
|---|---|
| Thay markup làm mất event handler Timer/inspection/split | Chỉ bọc lại presentation; test Space/Enter/touch/Escape trước và sau mỗi giai đoạn. |
| Chuyển list/table làm ảnh hưởng filter hoặc case selection | Giữ state/handler ở container, dùng component trình bày thuần props. |
| Điều chỉnh responsive làm cube hoặc canvas clip | Retain functional CSS geometry; kiểm tra 390px, tablet và desktop với Cube 2D/3D. |
| Thay navigation làm route Study/Timer dùng chung shell bị sai | Kiểm tra `/timer` và `/study` sau từng thay đổi navigation/context. |
| Thay feedback làm mất export/import thông báo | Reuse current toast/alert events, không đổi storage key hay data schema. |

## 7. Quyết định cần xác nhận

Tôi đề nghị bắt đầu theo đúng lộ trình trên, ưu tiên **Global shell + Design System + Studio** trước; các route còn lại được triển khai theo từng nhóm nhỏ và kiểm thử sau mỗi nhóm. Quy tắc tối đa hai cột desktop/một cột mobile vẫn là ràng buộc cố định trong mọi giai đoạn.
