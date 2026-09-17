# Bản đồ refactor

## Baseline

Dự án hiện có khoảng **19.471 dòng TypeScript/TSX** trong `client/src`, `server`, `shared` và `drizzle`, cùng **32 file regression**. Đợt refactor sẽ bảo toàn hành vi trước, thực hiện từng nhóm nhỏ và chỉ loại bỏ mã sau khi đã kiểm tra import, route và test liên quan.

| Khu vực | Quan sát đã xác nhận | Hướng refactor an toàn |
|---|---|---|
| `client/src/components` | Chứa 104 file, gồm component tính năng và component UI có sẵn. | Chỉ refactor component của ứng dụng; không chỉnh các primitives UI khi chưa có lỗi cụ thể. |
| `client/src/lib` | Có 33 module nghiệp vụ; `practiceCases.ts` đang là module lớn nhất trong nhóm này. | Chuẩn hóa exports/types và tách dữ liệu tĩnh khỏi logic biến đổi khi có dấu hiệu trùng lặp. |
| `client/src/pages` | `Home.tsx` và `TimerLab.tsx` là các page lớn của ứng dụng. | Tách theo feature boundaries, không đổi route hoặc persisted data trong cùng lượt đầu tiên. |
| `server` | `routers.ts` và `db.ts` đã tương đối lớn; `server/_core` là hạ tầng template. | Không thay đổi `server/_core`; chỉ tách router/helper ứng dụng khi có test bao phủ. |
| Bundle | Build vẫn có cảnh báo một số chunk lớn liên quan Three.js/Cubing. | Giữ lazy loading hiện có, đo import graph trước khi thay đổi chunking. |

## Thứ tự dự kiến

Đợt đầu tập trung vào bản đồ route và dependency, công cụ tiện ích dùng chung, cùng các component có dấu hiệu trùng lặp rõ ràng. Sau mỗi nhóm sẽ chạy `pnpm test`, `pnpm check`, `pnpm build` và kiểm tra giao diện các route chính trước khi tạo checkpoint.

## Kết quả audit dependency đợt 1

`ComponentShowcase.tsx` là page demo 1.437 dòng và không có tham chiếu tĩnh nào trong `client/src`; router hiện cũng không đăng ký route cho component này. Đây là ứng viên đầu tiên để loại bỏ sau một lượt kiểm tra build.

Các thao tác `localStorage` trực tiếp hiện nằm trong cả context, lib và một vài page/component. Đợt refactor tiếp theo sẽ chỉ hợp nhất các truy cập thuộc cùng miền dữ liệu vào helper sẵn có; không thay đổi key hoặc format persisted data trong khi người dùng đang sử dụng ứng dụng.

Các component `AIChatBox`, `DashboardLayout`, `DashboardLayoutSkeleton` và `ManusDialog` chỉ tự tham chiếu lẫn nhau hoặc không có tham chiếu ngoài file định nghĩa. Chúng là phần template không được router hay feature hiện tại sử dụng, nên có thể gỡ trong chặng dọn dẹp đầu tiên. `SystemLeaderboard` đang được `Rooms.tsx` sử dụng và được giữ lại.

## Hoàn thành: nền persistence và tiện ích Timer

Đã thêm `client/src/lib/browserStorage.ts` làm biên truy cập browser storage có xử lý SSR, private mode và JSON lỗi. Sáu miền dữ liệu đang lưu lâu dài — cài đặt Solver, tín hiệu cloud sync, History, Last Layer Study, lộ trình BLD và BLD profile — cùng các preference của TimerLab đã chuyển sang helper này. **Toàn bộ key và schema cũ được giữ nguyên**, nên dữ liệu local/cloud hiện có không cần migration.

`client/src/lib/timerEvents.ts` hiện dùng tập/map bất biến cho phân loại event 3×3 và puzzle preview. Generator scramble 3×3 dùng chung đã tách về `cubeScramble.ts`, thay cho hai bản sao trong Studio và Timer. Các phép tính progress, phase stability, TPS và hiệu suất solution được tách từ `TimerLab.tsx` sang `timerAnalysis.ts`; phần page chỉ giữ state, tương tác và trình bày. Regression mới khóa hành vi storage, Last Layer persistence, scramble và Timer analytics.

Các caller `localStorage` còn lại ngoài phạm vi này cần được đánh giá theo từng miền (theme/language, cache auth và trạng thái UI), không gộp mù quáng vì một số có semantics session hoặc hydration riêng.

## Hoàn thành: tách theo feature và dọn dependency

Studio hiện lấy metadata trình bày, nhãn mode, liên kết học liệu và JSON export từ `solverPresentation.ts`; generator scramble dùng chung phục vụ cả Studio, Timer và Study/BLD. Timer và History dùng chung `browserDownload.ts` cho download/CSV, trong khi `timerAnalysis.ts` chỉ giữ các phép tính analytics độc lập với JSX. Dữ liệu quiz notation BLD cũ không còn render sau yêu cầu xóa quiz đã được gỡ hẳn.

Profile/WCA dùng `profilePresentation.ts` cho initials, mapping event, ranks và chênh lệch Timer/WCA. Navbar tài khoản dùng lại cùng formatter initials/error. Rooms dùng `competitionPresentation.ts` cho nhãn thể thức, event và result; state phòng, polling, quyền moderator và tất cả procedure tRPC không thay đổi.

Sau hai lượt audit import, đã gỡ `Map.tsx` và toàn bộ `client/src/components/ui/` của template shadcn vì không có import từ code ứng dụng. Các thành phần Bootstrap và feature Rubik được giữ. `server/_core` không bị sửa; các test router/competition tiếp tục bảo vệ contract backend.

## Độ ổn định E2E và tải 3D theo nhu cầu

`playwright.config.ts` và `e2e/account-sync-competition.spec.ts` kiểm tra trong Chromium một happy path xuyên UI: tạo tài khoản, mở Hồ sơ, đồng bộ thủ công, tạo phòng, bắt đầu lượt và nộp kết quả. Toàn bộ `/api/trpc` của kịch bản này được mô phỏng trong bộ nhớ nên không tạo tài khoản, session, cloud payload hoặc phòng thật. `e2e/lazy-3d-loading.spec.ts` kiểm tra Studio ban đầu không tải Cubing/Three.js, Timer mới tải Cubing để tạo scramble và event 4×4 mới tải Three.js khi canvas preview thực sự được yêu cầu.

`PuzzleScramblePreview` nay dùng `React.lazy`/`Suspense` cho `Puzzle3DCanvas`: 2×2/3×3 CSS preview không kéo canvas chunk. Trong canvas, Square-1/Clock chỉ động tải `SideEvent3DObject` và dependency Cubing của side-event; các event còn lại động tải `cubing/twisty` cùng Three.js. Không thay đổi mapping event, renderer, fallback hoặc controls.

## Refactor cấu trúc: feature timer

Đợt này tạo boundary `client/src/features/timer/` với public barrel `index.ts`. `MetricButton`, `MetricDark` và `TimerHistoryRow` được chuyển khỏi `TimerLab.tsx`; page chỉ giữ state, orchestration và các hàm nghiệp vụ, còn feature folder giữ presentation có props typed. Không đổi route `/timer`, `/study`, persistence key, timer event mapping, replay, penalty hay response API. Các feature tiếp theo có thể mở rộng cùng mẫu `features/<domain>/index.ts` mà không cần làm phình page hoặc import trực tiếp file nội bộ.

## Refactor practice case catalog

`client/src/lib/practiceCases.ts` hiện là compatibility barrel. Dữ liệu được tách thành `client/src/lib/practiceCases/types.ts`, các module cấp danh mục `oll.ts`/`pll.ts`, và các module shape bên dưới `oll/` và `pll/`. OLL hiện được chia theo 15 nhóm hình dạng (`dot`, `cross`, `fish-shape`, `p-shape`, `t-shape`, `awkward-shape`, `small-l-shape`, `small-lightning-bolt`, `big-lightning-bolt`, `knight-move-shape`, `c-shape`, `w-shape`, `i-shape`, `square-shape`, `corners-oriented`); PLL được chia thành `edges-only`, `adjacent-corner-swap` và `diagonal-corner-swap`.

`catalog.ts` cung cấp `LAST_LAYER_CASES`, `practiceCasesByKind` và `practiceCasesByGroup` để caller không tự ghép hoặc lọc dữ liệu. Public barrel giữ nguyên API cũ; Timer/Study tiếp tục nhận cùng catalog tổng hợp với 57 OLL và 21 PLL, tổng cộng 78 case, giữ nguyên thứ tự OLL trước PLL, mã case, thuật toán, setup và kind. Regression kiểm tra cả identity của compatibility barrel, số lượng từng nhóm hình dạng, thứ tự và bộ lọc typed. Cấu trúc này cho phép thêm hoặc chỉnh một nhóm thuật toán mà không làm phình một file dữ liệu duy nhất.
