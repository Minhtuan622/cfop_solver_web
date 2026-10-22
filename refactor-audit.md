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

## Đợt 1: dọn dead code và gom trùng lặp

Lượt này dựng import graph bằng TypeScript program (không phải grep) để tìm export không ai dùng, rồi xóa theo từng nhóm. Tổng cộng **2.100 dòng bị xóa, 85 dòng thêm**, trên 48 file; hành vi sản phẩm không đổi.

**Đã xóa.** Sáu module Manus trên server (`llm`, `map`, `imageGeneration`, `voiceTranscription`, `heartbeat`, `dataApi`) và sáu file client (`const.ts`, `contexts/ThemeContext.tsx`, `components/XxxxCrossPatternLibrary.tsx`, `hooks/useComposition.ts`, `hooks/useMobile.tsx`, `hooks/usePersistFn.ts`, `_core/hooks/useAuth.ts`) không còn importer nào sau khi luồng CFOP account thay thế OAuth. `shared/types.ts` cũng là file trống về mặt sử dụng. Các module server đã xóa chỉ chạm `ENV.forgeApiUrl`/`ENV.forgeApiKey`, mà `storageProxy`, `notification` và `services/storage` vẫn dùng riêng, nên `ENV` giữ nguyên.

**Dead export đã gỡ.** `clearSolveHistory`, `formatPhaseTarget`, `getCaseStateInBrowser`, `setPairCard`, `storageGet`, `storageGetSignedUrl`, alias `saveBlob`, và hai bảng `PHASE_COLORS`/`CROSS_COLORS`. `setPairCard` là nơi duy nhất ghi `profile.pairCards`, nhưng trường này vẫn nằm trong profile đã persist vì cloud sync còn merge nó. `AVATAR_OUTPUT_SIZE`, `FAST_MOVE_PERMS` và `CFOP_ACCOUNT_COOKIE` chuyển từ export sang phạm vi module. Trong `components/ui/`, 24 icon chết, `SkeletonChart`/`FieldGroup`/`BeginnerHint` và nhóm `Sheet*` của dialog đều bị xóa; class CSS `.beginner-hint` vẫn giữ vì `Home.tsx` áp trực tiếp.

**Trùng lặp đã gom.** `initialStateFor` (History + TimerLab) về `lib/solveHistory.ts`; `reviewedToday` (BldMemoLab + BldNextReview) về `features/bld/lib/bldProfile.ts`; `isSecureRequest` (bản copy trong `services/cfopAccountAuth.ts`) về `_core/cookies.ts`; formatter mili-giây (`SolveTimer` + `LastLayerStudyLab`) về `formatTimerReadout` cạnh `formatSolveTime`, giữ nguyên việc clamp âm; picker "algorithm đầu tiên của catalog entry" (`BldReport` + `BldTrainingLab`) về `firstCatalogAlgorithm` trong adapter BLDDB, chuẩn hoá về đã trim như catalog adapter vốn vậy.

**Cấu trúc.** `server/services/cache.ts` là barrel một dòng chỉ còn một test dùng, nên test chuyển cạnh module (`server/infrastructure/cache.test.ts`) và barrel bị xóa. Hai regression `competitionPresentation.test.ts` và `profilePresentation.test.ts` chuyển từ `client/src/lib/` về `features/competition/lib/` và `features/profile/lib/`.

**Xác minh.** `tsc --noEmit --noUnusedLocals` sạch; Vitest 54 file / 163 test đạt; production build đạt; Playwright 2 kịch bản đạt.

**Còn lại cho đợt 2.** `server/_core/sdk.ts` + `oauth.ts` vẫn chạy `authenticateRequest` trên mọi request dù không client nào gọi `trpc.auth.*`; đây là thay đổi kiến trúc auth nên tách riêng. `practiceMode` trong `TimerLab.tsx` giờ là hằng số `"full"`. Các file lớn còn tách: `pages/Rooms.tsx` (978 dòng), `features/profile/components/CfopAccountControl.tsx` (314), `components/common/SideEvent3DObject.ts` (398), `Puzzle3DCanvas.tsx` (391). Prettier chưa chạy vì baseline đã fail sẵn.

## Đợt 2: refactor cấu trúc

Nhánh `refactor/round-2-structure`, 8 commit, **68 file, +3.255 / −2.471 dòng**. Hành vi sản phẩm không đổi: route, persistence key, contract tRPC, event mapping và payload đồng bộ đều giữ nguyên.

**Gỡ hệ thống Manus OAuth.** `server/_core/sdk.ts` (350 dòng) gọi `authenticateRequest` trên **mọi** request tRPC và `server/_core/oauth.ts` giữ route `/api/oauth/callback`, nhưng không client nào gọi `trpc.auth.*` hay `trpc.system.*` — hệ thống thật là CFOP account (cookie `cfop_account_session`, scrypt, `timingSafeEqual`). Đã xoá `sdk.ts`, `oauth.ts`, `systemRouter.ts`, `notification.ts`, `manusTypes.ts`, `auth.logout.test.ts`; `server/_core/context.ts` chỉ còn đọc CFOP account. `server/routers.ts` còn đúng 3 router (`cfopAccount`, `competition`, `wca`); `shared/const.ts` và `shared/_core/errors.ts` rỗng nên bị xoá cùng thư mục `shared/_core/`. Bảng `users` gỡ khỏi Drizzle; `drizzle-kit generate` sinh `drizzle/0012_*.sql` có `DROP TABLE users` nên **nội dung file được ghi đè thành no-op** kèm chú thích — lần generate sau báo *"No schema changes"*, còn bảng vật lý trong production không mất dữ liệu. Bỏ dependency `axios` và `jose`; bỏ `JWT_SECRET` khỏi `.env.example` và `scripts/setup-local-db.mjs` vì CFOP account không dùng secret nào.

**Bỏ state chết trong `TimerLab.tsx`.** `practiceMode` luôn bằng `"full"` và `practiceCase` luôn bằng `null` — setter duy nhất là `setPracticeMode("full")`, nhánh `"last-layer"` không bao giờ chạy. Hệ quả: `practiceSplitPhases` chỉ có thể là `[]` hoặc `SPEED_PHASES`, `tags` luôn rỗng, `splitEnabled` không bao giờ bật qua practice. Mọi nhánh bị xoá đều là nhánh không-thể-xảy-ra nên hành vi giữ nguyên.

**Tách `pages/Rooms.tsx` (978 → 417 dòng).** Feature mới `client/src/features/rooms/` gồm `components/RoomLobby.tsx`, `RoomMemberRoster.tsx`, `RoomRoundPanel.tsx`, `RoomSidebar.tsx`, `RemoveSpectatorDialog.tsx` và `lib/roomTypes.ts`. Page giữ routing, 13 `useState`, 3 query, 14 `useMutation` và toàn bộ orchestration. `RemoveSpectatorDialog` là leaf thuần props — không import `trpc`, không import page. Đối chiếu toàn bộ string literal và `className` giữa bản cũ và bản mới cho kết quả **trùng khớp 100%**, chỉ khác ở đường dẫn import.

**Tách `CfopAccountControl.tsx` (314 → 217 dòng).** Thêm `AccountDropdown.tsx` (shell `<ul role="menu">` dùng chung cho cả hai nhánh), `CfopAuthDialog.tsx` và `lib/accountNavItems.ts`. `AccountNavItem` giữ nguyên chính tả trên barrel `@/features/profile`. Ba cycle barrel↔member đang tồn tại được đóng cùng lượt này (`ProfileProgressChart`, `SystemLeaderboard`, `CfopAccountControl`).

**Tách 3D thành `client/src/features/puzzle-3d/`.** `Puzzle3DCanvas.tsx` (391 dòng) và `SideEvent3DObject.ts` (398 dòng) được chia thành `lib/puzzleIds.ts`, `puzzleCamera.ts`, `puzzleFraming.ts`, `squareOneState.ts`, `squareOneGeometry.ts`, `clockGeometry.ts`, `sideEventAnimation.ts`, `sideEventShared.ts` cùng `components/Puzzle3DCanvas.tsx`. `isSideEvent3DPuzzle` và `isCustomSideEvent` là hai bản trùng nhau; chúng được hợp nhất qua `lib/puzzleIds.ts` — module **không import gì**, nên cả chunk eagerly-loaded lẫn chunk lazy đều dùng được mà không kéo Three.js vào chunk sớm. Dynamic import bên trong canvas vẫn là `import()` và trỏ **module path cụ thể** (`../lib/sideEventAnimation`), không bao giờ trỏ barrel. Build xác nhận `Puzzle3DCanvas-*.js` (12,7 kB), `sideEventAnimation-*.js` (9 kB) và `three.module-*.js` (688 kB) là ba chunk độc lập.

**Tách `pages/Home.tsx` (326 → 306 dòng).** Feature mới `client/src/features/solver/` với `components/CfopReport.tsx` (gộp `CFOPReport` + `CFOPPhaseRow`) và `components/SolverStat.tsx`. Đối chiếu className giữa bản cũ và (page mới + 2 component): **133/133 trùng khớp**.

**Vệ sinh.** `dev/palette.tsx` mất `ExampleLoaderComponent` — chỉ được tham chiếu bởi chính palette tree; `dev/` giữ nguyên vì `client/src/main.tsx` vẫn import `DevSupport`/`ComponentPreviews`/`useInitial`.

**Quy tắc import được chốt.** Bên trong một feature dùng đường dẫn tương đối; chỉ dùng barrel `@/features/<x>` khi import từ **bên ngoài** feature đó. Một detector cycle dựa trên TypeScript resolver báo **0 cycle** sau khi đóng 3 cycle ở Bước 5.

**Xác minh.** `tsc --noEmit` và `tsc --noEmit --noUnusedLocals` sạch; Vitest **57 file / 165 test** đạt; production build đạt; Playwright 2 kịch bản đạt (`account-sync-competition`, `lazy-3d-loading`). Lưu ý: script `pnpm test:e2e` ép `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`; trên máy không có Chromium ở đường dẫn đó thì chạy `npx playwright test` để dùng browser do Playwright quản lý.

**Còn lại → Đợt 3 (UI/UX).** Dark mode thật (CSS token đã có sẵn nhưng không JS nào bật), i18n song ngữ đủ 9/9 trang và gộp 4 convention về `t("namespace.key")`, bổ sung primitive `EmptyState`/`StatTile`/`IconButton`/`Field`, a11y dialog (accessible name + focus trap), bỏ `window.confirm` và thêm pending state cho 11 mutation còn thiếu trong `Rooms`, `sonner` làm toast service duy nhất, gom 4 bản khai báo palette khối, đưa 4 route thứ cấp ra khỏi dropdown avatar.

## Đợt 3: nâng cấp UI/UX

Nhánh `refactor/round-3-uiux`, 12 commit, **99 file, +4.086 / −1.155 dòng**. Đợt này biến audit UI/UX thành code chạy được: 10 lỗi HIGH, 17 lỗi MEDIUM và 3 mục LOW được chốt tay (dark mode, đưa route thứ cấp ra khỏi dropdown avatar, bộ primitive nền). **URL, route, contract tRPC, persistence key và locator E2E không đổi.**

**A11y dialog (H2, H3).** `BootstrapDialog` giờ theo đúng WAI-ARIA dialog pattern: `DialogTitle` sinh `id` bằng `useId()` và `ModalShell` gắn `aria-labelledby` trỏ tới đó, `aria-describedby` trỏ `DialogDescription` khi có mô tả, focus dồn vào dialog khi mở, Tab bị khoá trong dialog, Escape đóng, backdrop đóng và focus trả về đúng trigger. Lớp `modal-body` lồng nhau bị gỡ (wrapper ở `ModalShell`).

**Primitive nền (A2, A3).** `client/src/components/ui/BootstrapUI.tsx` bổ sung `EmptyState`, `StatTile`, `Field`, `IconButton`, `PendingButton` và slot `eyebrow` cho `PageHeader`; thêm `client/src/lib/useAsync.ts` (`{ pending, error, run }`). Sáu bản stat-tile trùng lặp (`TimerLab`, `Home`, `History`, `Profile`, `TimerMetricCards`, `BldReport`) gộp về `StatTile`. `BootstrapControlEnhancer` — bản vá DOM runtime gắn class cho ~18 nút chỉ có icon — bị xoá, thay bằng `IconButton` thật. `Alert` không tạo mới: `StatusFeedback` sẵn có được mở rộng.

**Dark mode thật (L1).** `client/src/lib/theme.ts` đọc/ghi `localStorage["cfop-theme"]` và set `data-bs-theme` trên `<html>`; script inline trong `client/index.html` chạy **trước first paint** nên reload không nháy trắng. `ThemeSwitcher` trong navbar cho 3 chế độ Sáng/Tối/Hệ thống, theo `prefers-color-scheme` khi chọn "Hệ thống". Các class cứng `bg-dark text-white` / `text-bg-dark` được thay bằng biến Bootstrap.

**Mở khoá analytics của timer (H1).** `TimerLab.tsx` giấu cả khối analytics trong `<details className="d-none" aria-hidden="true">` — không ai mở được; nay là `<section>` thật có `<h2>`. Bộ lọc History được gắn `<label class="visually-hidden">` (H4). `ErrorBoundary` không còn in `error.stack` ra UI và đã song ngữ (H8). Thứ bậc heading được chuẩn hoá: mỗi trang có **đúng một `<h1>`**, `Settings`/`History` không còn mở `<main>` thứ hai (M6), và menu tài khoản có arrow-key navigation, Escape-đóng và trả focus về trigger (B6).

**i18n (H5, L3, L4).** Cả 9 trang song ngữ; 4 convention cũ (`const vi = ...`, `label(v, e)`, `text(v, e)`, object `copy`) gộp về **một** convention `t("namespace.key")`. Từ điển nằm trong `client/src/lib/i18n/` (10 file namespace + `index.ts` gộp thành một dictionary, **687 key**); key chết bị gỡ.

**Pending state và bỏ `window.confirm` (H6, H7).** 14 `useMutation` của phòng thi trước đó chỉ 3 có `isPending` — 11 nút không phản hồi khi chờ. Nay tất cả dùng `PendingButton` (disable + spinner + `aria-busy`); `window.confirm` được thay bằng `ConfirmDialog` dựa trên `BootstrapDialog`.

**Một cơ chế thông báo, một palette (M9, M12, H10, M7).** `sonner` (đã có sẵn trong dependency nhưng chưa được import ở đâu) trở thành toast service duy nhất qua `<AppToaster />`; hai banner tự dựng ở `TimerLab` và `CompetitionOutcomeCelebration` bị xoá. Palette khối gom về một nguồn `features/puzzle-3d/lib/cubeColors.ts` (module thuần, không JSX, không import Three.js) — trước đó có 4 nơi khai báo 6 màu sticker. Chart dùng token `--cfop-chart-1..6` (có bản dark riêng), bản xuất PNG dùng 13 token `--cfop-export-*` đọc qua `exportPalette()`. `.card` của Bootstrap bị vô hiệu vì `.border-0`/`.shadow-sm` là `!important`, nên thay bằng class opt-in `.cfop-card-surface`.

**Điều hướng (L20).** Trước đây 4 trong 8 route chỉ tới được qua menu avatar — kể cả khi chưa đăng nhập. Nay cả 8 route nằm trong navbar (`navbar-expand-xl`), menu tài khoản chỉ còn hành động tài khoản.

**Vệ sinh (M8, M13).** `features/timer/TimerHistoryRow.tsx` (file chết) bị xoá; 8 nhóm class CSS không ai dùng bị gỡ (`.cfop-form-help`, `.cfop-toolbar`, `.cfop-action-row`, `.cfop-guide-pill`, `.cfop-step-badge`, `.cfop-section-divider`, 10 `.phase-badge-*`); `WcaCompetitions` dùng `SkeletonCard` sẵn có. Thang tiêu đề mobile được sửa: trước đó rule `h1/h2/h3` trần không bắt được **một** heading nào của app (mọi heading đều mang class heading của Bootstrap), nên tiêu đề trang vẫn 40px trên điện thoại — nay là 25.6px.

**Xác minh.** `tsc --noEmit` và `tsc --noEmit --noUnusedLocals` sạch; Vitest **65 file / 207 test** đạt; production build đạt; Playwright 2 kịch bản đạt (`account-sync-competition`, `lazy-3d-loading`). Ngoài ra đã kiểm tra bằng trình duyệt: không tràn ngang ở 1280/1440/1920px, navbar xuống hàng ở 1199px và bung ở 1200px, tiêu đề Timer Lab ở 390px, menu tài khoản chỉ còn hành động tài khoản.
