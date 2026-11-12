# Bản đồ refactor

> **Lưu ý:** tài liệu này là bản audit tại thời điểm đã viết. Repo đã bỏ hẳn Bootstrap và dùng Tailwind CSS 4; các class Bootstrap được nhắc ở đây không còn tồn tại trong mã nguồn. Xem [hướng dẫn phát triển](../development/project-guide.md) cho quy ước giao diện hiện hành.

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

## Sự cố: đăng nhập / đăng ký báo lỗi

Báo lỗi: không đăng nhập hay đăng ký được. **Nguyên nhân là môi trường, không phải hồi quy**: Docker daemon không chạy → container MariaDB `cfop-solver-db-local` (cổng 3307) dừng → mọi truy vấn tài khoản trả 500. Bật lại Docker là container tự lên (`restart: unless-stopped`), DB khoẻ, tính năng hoạt động trở lại.

Sự cố này lộ ra một lỗi thật: thông báo lỗi hiện **nguyên văn câu SQL của Drizzle** (`Failed query: select ... from `cfop_accounts``) — cùng loại rò rỉ nội bộ như stack của `ErrorBoundary` đã gỡ trước đó. `errorMessage` nay gộp ba quy tắc: lỗi 5xx dùng câu "máy chủ đang gặp sự cố" (song ngữ), payload zod được đọc lấy câu của trường đầu tiên thay vì in JSON, và nơi gọi có thể dịch theo mã lỗi tRPC (`CONFLICT` / `UNAUTHORIZED` / `BAD_REQUEST` / `TOO_MANY_REQUESTS`).

**Xác minh.** Vitest **65 file / 213 test** đạt; `tsc --noEmit` và `tsc --noEmit --noUnusedLocals` sạch; production build đạt; Playwright 2 kịch bản đạt. Ngoài ra đã chạy trình duyệt thật với backend thật: **10 bước đạt** (đăng ký → email trùng → sai mật khẩu → đăng nhập đúng → hồ sơ → đăng xuất → đăng nhập lại → thông báo lỗi tiếng Anh → đăng nhập tiếng Anh), ở cả tiếng Việt và tiếng Anh.

## Đợt 4: thông báo lỗi song ngữ và chọn ngôn ngữ

Nhánh `refactor/round-3-uiux`, 3 commit, **11 file, +800 / −90 dòng**. Hai việc còn tồn đọng từ đợt trước: (1) thông báo lỗi của server vẫn chỉ có tiếng Việt nên giao diện tiếng Anh hiện câu không đọc được; (2) giao diện đã song ngữ từ đợt 3 nhưng **không có cách nào chuyển ngôn ngữ** — người đọc phải sửa `localStorage` bằng tay.

**Vì sao không dịch được ở server.** tRPC v11 **không có** option `meta` trong `TRPCError` (chỉ `code`, `message`, `cause` — đã kiểm chứng trong `node_modules/@trpc/server`), nên không thể gửi kèm mã lý do của lỗi để client dịch. Cách làm được là **bảng tra theo câu**: `shared/serverMessages.ts` liệt kê 67 câu server có thể gửi (66 câu tiếng Việt + mã `CFOP_ACCOUNT_REQUIRED`) và trỏ tới key của từ điển song ngữ. Client tra bảng này trước khi hiện (`client/src/lib/apiError.ts`).

**Quy tắc hiện câu lỗi.** Ba câu hỏi theo thứ tự: lỗi 5xx dùng câu chung (không bao giờ để lộ SQL hay stack); lỗi có mã mà nơi gọi biết thì dịch theo mã; còn lại tra bảng. Câu không có trong bảng **không bao giờ hiện nguyên văn** — hiện câu chung. Câu có phần đuôi do người viết (lý do moderator loại khỏi phòng) giữ nguyên phần đuôi, vì đó là chữ của người. Payload zod được đọc lấy câu của trường đầu tiên thay vì in JSON.

**Bảng không thể trôi lệch với server.** `server/serverMessages.test.ts` quét mọi string literal có chữ tiếng Việt trong mã nguồn server (74 câu) và đòi mỗi câu phải có trong bảng. Ba câu không phải câu giao diện được danh sách riêng: tiêu đề email đặt lại mật khẩu, thân email, và tên phòng "Đấu lại". Chiều ngược lại cũng được kiểm: một câu có trong bảng mà server không hề gửi cũng bị báo.

**Từ điển.** Thêm 65 key: `common.error.*` (16), `rooms.error.*` (32), `wca.error*` (11), `profile.error*` (4), `account.error.*` (2). `client/src/lib/i18n/index.test.ts` kiểm từ điển: mỗi key đủ hai ngôn ngữ, không key nào nằm ở hai namespace, hai ngôn ngữ dùng cùng bộ placeholder, và mọi key trong bảng câu của server đều có mặt trong từ điển.

**Chọn ngôn ngữ.** `client/src/components/LanguageSwitcher.tsx` (menu `role="menu"` + `menuitemradio`, đóng bằng Escape và bấm ra ngoài) đặt ở navbar và ở trang cài đặt — cùng cách `ThemeSwitcher` làm. Lựa chọn nhớ trong `localStorage["cfop-language"]`; `<html lang>` đi theo (màn hình đọc đúng giọng), và script inline trong `client/index.html` set nó **trước first paint** như theme.

**Một test đang chập chờn được sửa.** `timerEvents.test.ts` đòi scramble 3×3 có ít nhất 20 nước, nhưng cubing.js sinh scramble ngẫu nhiên 17–21 nước (đo 300 lần: 17×1, 18×4, 19×15, 20×83, 21×197) — test fail khoảng 1 lần trong 20. Mốc hạ xuống 17 (scramble 17 nước vẫn xáo đủ).

**Xác minh.** `tsc --noEmit` và `tsc --noEmit --noUnusedLocals` sạch; Vitest **69 file / 234 test** đạt; production build đạt; Playwright 2 kịch bản đạt. Ngoài ra đã chạy trình duyệt thật: đổi sang tiếng Anh thì navbar đổi hết (Solve / Timer / History / Study / Rooms / Rankings / WCA / Settings), `<html lang>` đổi theo, tải lại vẫn giữ, đổi lại tiếng Việt thì trở về nguyên trạng, và trang cài đặt dịch theo; không có lỗi console.

## Đợt 5: thiết kế lại navbar và trang cài đặt

Nhánh `redesign/settings-navbar`, 27 file, **+917 / −219 dòng**. Yêu cầu: navbar gọn gàng theo phong cách tối giản, không lộ liễu nhiều thông tin lên giao diện; trang cài đặt được thiết kế lại từ đầu. **URL, route, contract tRPC, persistence key và locator E2E không đổi.**

**Navbar.** Trước đây thanh điều hướng để tên brand ("Giải Rubik") trùng với mục "Giải Rubik" của trang chính, và bốn route còn lại nằm dạng chữ trần rải rác cùng nhóm nút. Nay:

- **4 route dùng hằng ngày** nằm trực tiếp trên thanh — Giải · Bấm giờ · Kết quả · Học thêm.
- **4 route còn lại** (Thi đấu, Xếp hạng, Giải WCA, Cài đặt) nằm trong menu **"Thêm"** ngay trên thanh (`components/NavOverflowMenu.tsx`). Menu nằm trong navbar chứ không giấu sau avatar, nên vẫn tới được khi chưa đăng nhập.
- Nút **ngôn ngữ** và **giao diện** thu gọn còn **một biểu tượng** (`compact`), accessible name giữ nguyên nên screen reader vẫn đọc được. Trang cài đặt vẫn hiện tên đầy đủ.
- Nút tài khoản chỉ hiện **avatar** dưới `xl`; từ `xl` trở lên hiện thêm tên bị cắt ở 10 ký tự. `aria-label` là tên đầy đủ nên locator E2E `getByRole("button", { name: displayName })` vẫn khớp chính xác.
- `nav.solve` đổi từ "Giải Rubik" thành "Giải" để không lặp với brand.

**Một primitive dropdown dùng chung.** `components/ui/Dropdown.tsx` gom phần plumbing đã lặp ở bảy chỗ: `role="menu"` + `aria-expanded`/`aria-haspopup`/`aria-controls`, đóng bằng **Escape** và bấm ra ngoài, tự đóng sau khi chọn. `LanguageSwitcher`, `ThemeSwitcher` và menu "Thêm" nay dùng chung nó; mỗi menu vẫn có `menuLabel` riêng để không mất nhãn.

**Trang cài đặt.** Trước đây là ba section `accordion` dài, phần giải thích dài hơn phần điều khiển, và mọi thay đổi phải nhìn vào một khối text. Nay:

- Danh sách **4 nhóm** là `role="tablist"` (`features/settings/components/SettingsGroupTabs.tsx`) — Lời giải · Bấm giờ · Học tập · Giao diện — mỗi nhóm một `role="tabpanel"`, **chỉ một panel hiện tại một lúc**, có `roving tabindex` và điều hướng bằng phím mũi tên.
- Bốn panel nằm trong feature mới `client/src/features/settings/` (`SolverSettingsGroup`, `TimerSettingsGroup`, `StudySettingsGroup`, `AppearanceSettingsGroup`); state và cơ chế tự lưu (debounce 350 ms) gom vào `lib/useSettingsState.ts`. Trang `pages/Settings.tsx` còn lại đúng phần shell.
- Khối giải thích màu xanh về direct Opening (một `<aside class="alert alert-info">` riêng bên cạnh) được **gập lại** trong `<details class="cfop-settings-note">`; "Khôi phục mặc định" hạ xuống thành link dưới danh sách nhóm; trạng thái tự lưu chuyển vào `actions` của `PageHeader` với `role="status"`.
- Nhóm **Giao diện** gom ngôn ngữ và theme. Trước đó ngôn ngữ nằm lẫn trong nhóm "Học tập" còn theme chỉ nằm ở navbar, nên không có chỗ nào gom hai thứ quyết định cách nhìn giao diện lại với nhau.
- Switch dùng primitive `Switch` (`role="switch"`) mới trong `BootstrapUI.tsx` thay cho component `Switch` chỉ dùng trong trang này.

**Xác minh.** `tsc --noEmit` và `tsc --noEmit --noUnusedLocals` sạch; Vitest **72 file / 246 test** đạt (thêm `Dropdown.test.tsx`, `AppNav.test.tsx` viết lại, `Settings.test.tsx`, `features/settings/index.test.ts`); production build đạt; Playwright 2 kịch bản đạt (`account-sync-competition`, `lazy-3d-loading`). Ngoài ra đã chạy trình duyệt thật trên **bản production build**: không có lỗi trang, biểu tượng Bootstrap Icons hiện đúng (font được phát ra `/assets/bootstrap-icons-*.woff2`), menu "Thêm" mở đúng vị trí, trang cài đặt hiện đúng một panel mỗi lần, và bố cục 420 px không tràn ngang.

> Lưu ý khi chạy dev server **trong worktree tạm**: `node_modules` là symlink sang repo chính nên Vite chặn đường dẫn font nằm trong thư mục `.pnpm` (403 → biểu tượng hiện thành ô vuông). Đây là hiện tượng của `server.fs.deny` trong Vite dev, **không phải hồi quy** — bản production build phát font đúng và hiển thị chuẩn.

## Đợt 6: thiết kế lại trang lịch giải WCA

Nhánh `redesign/wca-calendar`, **URL `/wca`, route, contract tRPC và key i18n cũ không đổi** — chỉ cách hiển thị và cách lọc.

**Vấn đề của bản cũ.** Trang dựng 21 thẻ `card` giống hệt nhau: mỗi thẻ lặp lại một nút xanh "Trang giải WCA" và một badge "Đã duyệt" — 42 phần tử mang thông tin không phân biệt được giải nào. Địa điểm do feed WCA ghi dạng markdown `[Tên](url)` hiện **nguyên văn** trên giao diện. Trang dài 3629 px và phải cuộn qua từng thẻ để tìm một giải.

**Cấu trúc mới.** Trang trở thành một **lịch**:

- Giải gom theo **tháng bắt đầu** (`groupByMonth`), mỗi tháng là một `<section>` có `<h2>` riêng và một pill đếm số giải. Đọc lịch là quét tháng, không phải lướt thẻ.
- Mỗi giải là **một dòng** (`WcaCompetitionRow`): cột ngày (số ngày + tháng) · tên giải · dòng meta (cờ quốc gia, thành phố, nước, địa điểm). Chiều cao trang giảm còn 2473 px.
- **Tên giải là link** tới trang giải của WCA (kèm `<span class="visually-hidden">` nói rõ nó ra trang WCA) — 21 nút xanh giống hệt nhau biến mất.
- Badge trạng thái chỉ hiện khi giải **không** ở trạng thái "đã duyệt"; badge lặp ở mọi dòng chỉ là nhiễu.
- Cờ quốc gia dựng từ mã ISO2 (`flagEmoji`) để mắt quét nhanh theo vị trí.

**Markdown trong dữ liệu.** `parseVenue` bóc `[Tên](url)` thành tên + link; nếu còn chữ đằng sau thì giữ nguyên phần chữ đó. Địa điểm không phải link thì hiện dạng chữ thường. Nhờ vậy raw markdown **không bao giờ** lọt lên giao diện.

**Bộ lọc.** `WcaCalendarFilters` gồm **3 preset khoảng** (30 ngày / 3 tháng / 1 năm, `aria-pressed` để đọc được trạng thái) · 2 ô ngày (đổi tay thì bỏ trạng thái preset) · 1 select quốc gia · 1 ô tìm kiếm **lọc tức thì ngay trên client** (tên giải, thành phố, nước, địa điểm). Số kết quả hiện bằng `role="status" aria-live="polite"`: "25 giải" khi chưa lọc, "3 trong 25 giải" khi đang lọc.

**Trạng thái rỗng.** Hai khác biệt: **không có giải nào trong khoảng** (`EmptyState` + link tới lịch WCA) và **tìm kiếm không khớp** (`EmptyState` + nút "Xoá tìm kiếm"). Khoảng ngày sai thứ tự hiện `StatusFeedback tone="warning"` chứ không phải màn trắng.

**Feature mới.** `client/src/features/wca/` — `lib/wcaCalendar.ts` (parse venue, định dạng ngày theo ngôn ngữ, gom tháng, lọc tìm kiếm, cờ), `components/WcaCalendarFilters.tsx`, `components/WcaCompetitionList.tsx`, `components/WcaCompetitionRow.tsx`. Trang `pages/WcaCompetitions.tsx` còn lại đúng phần state + tRPC, theo đúng convention của repo.

**Ngôn ngữ.** Thêm 21 key `wca.*` (có đủ tiếng Việt và tiếng Anh). Tháng được định dạng bằng `Intl.DateTimeFormat` theo ngôn ngữ đang dùng; locale tiếng Việt viết "Tháng 10" hoa chữ đầu nên được hạ xuống "tháng 10" cho khớp với cách người Việt viết.

**Xác minh.** `tsc --noEmit` và `tsc --noEmit --noUnusedLocals` sạch; Vitest **75 file / 262 test** đạt (thêm `features/wca/lib/wcaCalendar.test.ts`, `features/wca/index.test.ts`, `pages/WcaCompetitions.test.tsx`); production build đạt; Playwright 2 kịch bản đạt (`account-sync-competition`, `lazy-3d-loading`). Ngoài ra đã chạy trình duyệt thật ở 1440 px và 420 px ở cả hai ngôn ngữ: không có lỗi trang, địa điểm hiện đúng link, bố cục không tràn ngang.

## Đợt 7: thiết kế lại trang giải Rubik

Nhánh `redesign/solver-workspace`, **URL `/`, route, contract tRPC và hành vi solver không đổi** — chỉ cách trình bày.

**Vấn đề của bản cũ.** Trang dựng nhiều lớp chrome cạnh tranh với nhau:

- Một card "không gian làm việc" bọc quanh mọi thứ, lại chứa **hai thanh chọn song song** (chế độ solver + nguồn đầu vào) ở hai nơi khác nhau, đọc như hai trang khác nhau.
- Số bước hiển thị sai: đếm "Bước 1 / Bước" cho cả hai nhánh solver lẫn nhánh state, dù nhánh state không có bước nào.
- Một pill xanh "Sẵn sàng" to đùng ngay trên đầu trang, chiếm chỗ mà không thêm thông tin.
- Cột trái bị một khoảng trống lớn (`h-100` trong khi card bên phải cao hơn nhiều), và một card "Thông tin khối" gần như trống.
- Card "Quét camera" trông như một ô nhập liệu hỏng, dù nó chỉ là tuỳ chọn.
- **Bộ điều khiển phát lại hiện trước khi có lời giải**: nút phát/trước/sau và thanh tua đều tồn tại dù chưa có gì để phát.
- **Ba thẻ số liệu** lặp lại đúng những gì header của báo cáo đã nói (số lượt, số chặng, trạng thái) — thông tin trùng.
- Badge "SCRAMBLE" viết cứng bằng tiếng Anh, không theo ngôn ngữ.

**Cấu trúc mới.** Trang chia làm ba tầng, mỗi tầng một việc:

- **Thanh công cụ gọn** (`SolverToolbar`): một hàng gồm hai nhóm nút `aria-pressed` (chế độ solver · nguồn đầu vào) và trạng thái `role="status" aria-live="polite"`. Dưới hàng là một dòng gợi ý + link "Đặt lại". Pill "Sẵn sàng" to đùng biến thành một chấm xanh nhỏ cạnh trạng thái.
- **Cột trái — "Khối của bạn"** (`SolverInputPanel`): ô nhập có `<label>` thật (trước chỉ có `aria-label`), badge nhị phân theo chế độ, nút **"Scramble ngẫu nhiên"** (bản cũ không có cách nào re-roll scramble), và các khối gập bằng `<details>` native: cài đặt slot F2L · quét camera · dán 54 sticker.
- **Cột phải — "Lời giải"** (`SolverSolutionPanel`): nút chuyển 2D/3D, số lượt, khối cube, và **khối phát lại chỉ xuất hiện khi đã có lời giải** (`hasResult`). Trước khi có kết quả, thay bằng một dòng nhắc "Bấm Tìm cách giải để xem lời giải từng bước".
- **Báo cáo CFOP** đưa xuống **full-width** dưới cả hai cột, và phần đếm số lượt / số chặng được gộp vào header của chính báo cáo — ba thẻ số liệu trùng lặp biến mất.

**Sửa lỗi hành vi.** Bản cũ dùng Bootstrap accordion (`data-bs-toggle="collapse"`), nhưng `main.tsx` chỉ import `bootstrap/js/dist/collapse` — mấy đoạn `data-bs-toggle="collapse"` đó **chưa bao giờ hoạt động**. Các khối gập giờ dùng `<details>` native, không cần JS.

**Feature mới.** `client/src/features/solver/` — `components/SolverToolbar.tsx`, `components/SolverInputPanel.tsx`, `components/SolverSolutionPanel.tsx`, `components/SolverDetails.tsx`, `components/SolverF2LOptions.tsx`, `components/SolverRecentStates.tsx`, `lib/recentStates.ts` (lưu state gần đây trong `localStorage`, đã rời khỏi page). Trang `pages/Home.tsx` còn lại đúng phần state + tRPC + điều phối solver, theo đúng convention của repo.

**Ngôn ngữ.** Thêm 14 key `home.*` và **xoá 10 key không còn dùng** (`input.scramble`, `input.state`, `input.label`, `home.section.solve`, `home.section.bld`, `home.stepInput`, `home.scrambleTitle`, `home.stateTitle`, `home.statTurns`, `home.statStages`, `home.statStatus`, `home.cubeInfo`). `guide.help` viết lại vì bản cũ nói "khối của bạn sẽ hiện ở đây" bên trái — bố cục mới không còn hai bên.

**Xác minh.** `tsc --noEmit` và `tsc --noEmit --noUnusedLocals` sạch; Vitest **78 file / 278 test** đạt (thêm `features/solver/lib/recentStates.test.ts`, `features/solver/components/SolverPanels.test.tsx`, `pages/Home.test.tsx`); production build đạt; Playwright 2 kịch bản đạt (`account-sync-competition`, `lazy-3d-loading`). Ngoài ra đã chạy trình duyệt thật ở 1440 px và 420 px: không có lỗi trang, không tràn ngang, báo cáo CFOP hiện đúng sau khi giải, khối phát lại chỉ xuất hiện khi đã có lời giải.

## Đợt 8: thiết kế lại trang học thêm

Trang `/study`, **URL, route và hành vi SRS không đổi** — chỉ cách trình bày.

**Vấn đề của bản cũ.** Trang dài **12 735 px**:

- Bốn thẻ số liệu (hôm nay · hàng đợi · catalog · đã thuộc) cộng thêm một card mục tiêu riêng — năm card chỉ để nói số liệu, trong khi nội dung luyện tập thì bị đẩy xuống dưới màn hình đầu tiên.
- **56 card nhóm** xếp chồng full-width, mỗi card một hàng — phải cuộn qua 56 hàng mới tới cuối.
- Ngay dưới đó lại là một **danh sách phẳng 48 dòng** chứa chính các case đó — hai cách hiển thị cùng một dữ liệu.
- Toàn bộ copy viết cứng dạng `vi ? "…" : "…"` rải rác trong JSX, không đi qua từ điển i18n của repo.

**Cấu trúc mới.** Trang chia làm ba tầng, mỗi tầng một việc:

- **Thanh gọn** (`StudyToolbar`): nhóm nút `aria-pressed` đổi làn (Last Layer · 3-Style BLD), mục tiêu hôm nay kèm `role="progressbar"`, và hai số đếm (hàng đợi · đã thuộc) trong một `<dl>`. Thay cho cả năm card.
- **Hai cột làm việc**: `StudyCasePanel` (`col-xl-8`) — case đang học, khối 2D/3D, timer và bốn nút tự chấm điểm nhớ — cạnh `StudySchedulePanel` (`col-xl-4`) — lịch ôn 7 ngày và nút "Ôn case yếu nhất".
- **Catalog gập lại**: `LastLayerExplorer` thành một `<details class="cfop-solver-details">` **đóng mặc định**. Mở ra thì hiện **lưới 4 cột các ô nhóm** (56 ô) thay cho 56 card xếp chồng; bấm một ô nhóm mới mở danh sách case của nhóm đó, kèm nút quay lại. Danh sách phẳng 48 dòng bị xoá.

**Đo lại:** **1 319 px** khi đóng, **3 514 px** khi mở catalog — trước là 12 735 px.

**Ngôn ngữ.** Toàn bộ copy của trang chuyển sang namespace mới `client/src/lib/i18n/study.ts` (~70 key, đủ VI + EN), đúng convention `t("namespace.key")` của repo. `PracticeGroupPreview` cũng chuyển từ prop `vi` sang `useLanguage()`.

**Dùng lại primitive.** Ba component mới dùng chung `.cfop-solver-panel__header`, `.cfop-solver-eyebrow` và `.cfop-solver-details` với trang giải, nên trang học và trang giải đọc như **một sản phẩm** chứ không phải hai trang dán nhau.

**Xác minh.** `tsc --noEmit` và `tsc --noEmit --noUnusedLocals` sạch; Vitest **78 file / 278 test** đạt; production build đạt; Playwright 2 kịch bản đạt. Chạy trình duyệt thật ở 1440 px và 420 px: không lỗi trang, không tràn ngang, catalog mở ra 56 ô nhóm, thanh tiến độ hiện đúng nền.
