# CFOP Solver Studio

CFOP Solver Studio là ứng dụng web hỗ trợ giải, luyện tập và thi đấu Rubik trực tuyến. Dự án gồm frontend React/Vite, backend Express/tRPC, database MySQL/TiDB, solver CFOP/BLD chạy trong trình duyệt, cùng các module Timer, History, Study, tài khoản CFOP, WCA và Rooms.

> **Mục tiêu của tài liệu này:** giúp lập trình viên mới có thể clone project, cài dependency, chạy local, kiểm thử, build production và hiểu các ranh giới dữ liệu trước khi thay đổi mã nguồn.

## 1. Tổng quan tính năng

| Khu vực | Phạm vi chính |
|---|---|
| **Studio / Solver** | Nhập scramble hoặc trạng thái sáu mặt, giải theo CFOP, Cross, F2L, OLL/PLL, XCross đến XXXXCross, ZBLL/1LLL và xem CubeNet/3D. |
| **Timer** | Inspection, solve, +2/DNF, split, thành tích cá nhân, nhiều loại Rubik, scramble preview, replay solution và thống kê theo event. |
| **History** | Lọc theo loại Rubik, analytics, chọn nhiều solve, export/import và quản lý dữ liệu solve tập trung. |
| **Study** | Last Layer và 3-Style BLD, catalog công thức, SRS, drill, streak, learning path, profile học tập và tự kiểm tra bằng scramble. FTO Study không còn trong sản phẩm. |
| **Profile / Account** | Đăng ký, đăng nhập, đổi mật khẩu, quên mật khẩu, avatar, mục tiêu cá nhân, đồng bộ Timer/Study và liên kết WCA. |
| **Rooms** | Tạo/tham gia phòng, Best of 3/Ao5/Ao12, MBLD, chat, spectator, moderator, moderation log, rematch, lịch sử phòng và leaderboard. |
| **WCA** | Lịch thi đấu, lọc quốc gia, hồ sơ WCA, OAuth WCA khi đủ cấu hình và so sánh thành tích. |

## 2. Stack công nghệ

| Lớp | Công nghệ |
|---|---|
| UI | React 19, TypeScript 7, Vite 8, Tailwind CSS 4, Studio UI, Wouter |
| Data fetching | tRPC 11, TanStack Query, SuperJSON |
| Backend | Node.js, Express 5, tRPC server |
| Database | MySQL/TiDB, Drizzle ORM và Drizzle Kit |
| Rubik | Cubing.js, Three.js, Pyodide Web Worker, solver bundle Python đã nhúng |
| Kiểm thử | Vitest, Testing Library, Playwright E2E |
| Build | Vite cho frontend và esbuild cho Express server |
| Deploy mẫu | `railway.json` dùng Railpack, `pnpm build`, `pnpm start` |

Ứng dụng thông thường chạy dưới dạng **một Node process**: Express mount tRPC tại `/api/trpc`, phục vụ SPA và các route OAuth/WCA; trong development process này dùng Vite middleware, còn production phục vụ `dist/public`.

## 2.1. Ranh giới module

Frontend được tổ chức theo hai lớp. `client/src/pages` giữ routing, state orchestration và kết nối tRPC; các component có tính trình bày hoặc thuộc một feature cụ thể nên đặt trong `client/src/features/<feature>/` và được xuất qua `index.ts`. Ví dụ, `client/src/features/timer/` chứa các metric card và dòng lịch sử Timer, trong khi `TimerLab.tsx` chỉ điều phối state và nghiệp vụ.

| Feature | Phạm vi |
|---|---|
| `features/timer/` | Metric card của Timer. |
| `features/rooms/` | Lobby, danh sách thành viên, panel lượt thi, sidebar và hộp thoại xoá spectator. |
| `features/profile/` | Điều khiển tài khoản, dropdown, hộp thoại đăng nhập/đăng ký, biểu đồ tiến bộ, cloud sync. |
| `features/puzzle-3d/` | Canvas 3D, toán camera, framing theo puzzle, hình học Square-1/Clock. |
| `features/solver/` | Thanh công cụ, panel nhập khối, panel lời giải, tuỳ chọn F2L, state gần đây và báo cáo CFOP của trang Giải Rubik. |
| `features/settings/` | Nhóm cài đặt, panel theo nhóm và state tự lưu của trang Cài đặt. |
| `features/competition/` | Bộ lọc bảng xếp hạng, lễ kỳ hoàn thành phòng, bảng xếp hạng toàn hệ thống. |
| `features/bld/` | Catalog 3-Style, lộ trình học, bảng công thức BLD. |
| `features/last-layer/` | Thanh công cụ Study, panel luyện case, panel lịch ôn, catalog Last Layer và preview 2D. |
| `features/wca/` | Bộ lọc lịch giải WCA, danh sách theo tháng và dòng từng giải. |

**Quy tắc import.** Bên trong một feature dùng đường dẫn tương đối (`./X`, `../lib/X`); chỉ dùng barrel `@/features/<x>` khi import từ **bên ngoài** feature đó. Nhờ vậy không phát sinh cycle barrel↔member. Khi code shell chỉ cần persistence helper (cloud sync, Settings, Profile), import từ `@/features/bld/lib` hoặc `@/features/last-layer/lib` thay vì barrel đầy đủ — barrel component sẽ kéo toàn bộ Study UI vào entry chunk. Riêng đường dẫn 3D có ngoại lệ: import động của Three.js/Cubing phải trỏ **module path cụ thể**, không bao giờ trỏ barrel, để giữ nguyên ranh giới chunk — `e2e/lazy-3d-loading.spec.ts` khóa hành vi này.

Backend tách theo domain và hạ tầng. `server/routers/` chứa procedure Account, Competition và WCA; `server/db/` chứa helper truy vấn theo domain; `server/infrastructure/` chứa các tiện ích dùng chung như cache. Các file barrel (`server/routers.ts`, `server/db.ts`, `server/cache.ts`) được giữ lại để bảo toàn import cũ và giảm rủi ro khi mở rộng module.

Khi thêm tính năng mới, ưu tiên tạo module trong boundary phù hợp, expose API qua barrel của feature/domain và bổ sung regression cho import boundary trước khi thay đổi page hoặc router hiện hữu.

## 2.2. Quy ước UI/UX

### Design token

Mọi màu mới của app phải là **CSS token** trong `client/src/index.css`, không hardcode hex trong TSX. Token bắt đầu bằng `--cfop-` và khai báo cho **cả hai** palette: block `:root, [data-bs-theme="light"]` và block `[data-bs-theme="dark"]`.

| Token | Dùng cho |
|---|---|
| `--cfop-chart-1..6` | Màu series của mọi biểu đồ Recharts. Bản dark được nâng sáng để giữ tương phản. |
| `--cfop-export-*` (13 token) | Bản xuất PNG của Timer; đọc qua `features/timer/lib/exportPalette.ts`. |
| `--cfop-shadow-card` | Đổ bóng của panel. |
| `--cfop-stage-*`, `--cfop-accent*`, `--cfop-cube-bg` | Nền khối 3D và màu nhấn của Studio. |

Hai nơi khác thường cần nhớ:

- **`.card` của Bootstrap không dùng được.** `.border-0` và `.shadow-sm` là `!important`, nên rule `.card` toàn cục không bao giờ áp dụng cho các panel đang dùng chúng. Panel cần bề mặt nổi thì dùng class opt-in **`.cfop-card-surface`**.
- **Dark mode** do `data-bs-theme` trên `<html>` điều khiển (`client/src/lib/theme.ts`, script inline trong `client/index.html` chạy trước first paint). Dùng biến Bootstrap (`bg-body-tertiary`, `text-body`) thay cho class cứng `bg-dark`/`text-white`.

### Primitive

Component trình bày dùng chung nằm ở `client/src/components/ui/`. Dùng lại thay vì viết lần thứ hai:

| Primitive | Thay cho |
|---|---|
| `EmptyState` | Trạng thái rỗng tự dựng. |
| `StatTile` | 6 bản thẻ số liệu trùng lặp. |
| `Field` | Label + control + help/error. |
| `IconButton` | Nút chỉ có icon (trước đây vá DOM runtime). |
| `PendingButton` | Nút đang chờ: disable + spinner + `aria-busy`. |
| `StatusFeedback` | Alert/empty/error banner. |
| `PageHeader`, `Eyebrow`, `SectionCard` | Tiêu đề trang và tiêu đề section. |
| `SkeletonCard`, `SkeletonList`, `SkeletonTable` | Trạng thái loading. |
| `Dialog` + `DialogContent/Header/Title/Description/Footer` | Hộp thoại theo WAI-ARIA dialog pattern. |
| `ConfirmDialog` | Xác nhận thay cho `window.confirm`. |
| `Dropdown` | Menu thả xuống dùng chung (`role="menu"`, đóng bằng Escape và bấm ra ngoài). |
| `Switch` | Công tắc bật/tắt (`role="switch"`) kèm nhãn và phần giải thích. |

Quy tắc khi viết primitive:

- **Không import Three.js/Cubing** — primitive nằm trong chunk eagerly-loaded, import 3D sẽ phá ranh giới chunk (`e2e/lazy-3d-loading.spec.ts`).
- **Không thêm `<main>`/`<h1>`** — `App.tsx` đã sở hữu `<main id="main-content">` và mỗi trang chỉ có **đúng một `<h1>`**.
- Mọi form control phải có `<label>` nhìn thấy được hoặc `aria-label`; mọi nút icon phải có accessible name.
- Không dùng `window.confirm`/`window.alert`; dùng `Dialog`/`ConfirmDialog`.

### i18n

Một convention duy nhất: **`t("namespace.key")`**.

- Từ điển nằm ở `client/src/lib/i18n/`, mỗi file là một namespace (`timer`, `history`, `profile`, `rooms`, `settings`, `solver`, `competition`, `wca`, `shell`, `common`); `index.ts` gộp chúng thành một dictionary.
- Mỗi key có **hai** giá trị: `[tiếng Việt, tiếng Anh]`. Thêm key mới thì phải đủ cả hai.
- `useLanguage()` trả `{ language, vi, setLanguage, t }`; chỉ dùng `vi` khi cần nhánh nhị phân, còn lại dùng `t()`.
- Placeholder là `{name}`: `t("timer.generating", { event: eventLabel })`.
- Khách chọn ngôn ngữ ở navbar và ở trang cài đặt (`components/LanguageSwitcher.tsx`); lựa chọn được nhớ trong `localStorage["cfop-language"]`, `<html lang>` đi theo và được set trước first paint trong `client/index.html`.
- **Câu của server phải có trong `shared/serverMessages.ts`.** Server viết bằng tiếng Việt, nên client tra bảng này rồi hiện theo ngôn ngữ của giao diện; câu không có trong bảng không bao giờ hiện nguyên văn. `server/serverMessages.test.ts` quét mã nguồn server, nên thêm câu mới mà quên dịch sẽ fail.

### Thông báo

`sonner` là toast service duy nhất, mount một lần qua `<AppToaster />` trong `AppShell`. Màu toast được tie vào Bootstrap token trong `index.css` nên đọc đúng ở cả hai palette. Không tự dựng banner toast trong page.

### Điều hướng

Navbar theo phong cách **tối giản**: chỉ những gì cần để biết "mình đang ở đâu" và "chuyển sang đâu".

- **4 route dùng hằng ngày** nằm trực tiếp trên thanh: Giải · Bấm giờ · Kết quả · Học thêm.
- **4 route còn lại** (Thi đấu, Xếp hạng, Giải WCA, Cài đặt) nằm trong menu **“Thêm”** ngay trên thanh — không giấu sau avatar, nên vẫn tới được khi chưa đăng nhập.
- Nút **ngôn ngữ** và **giao diện** chỉ còn **một biểu tượng** (`aria-label` vẫn đầy đủ cho screen reader); tên hiện tại hiện ở dạng đầy đủ trong trang Cài đặt.
- Nút tài khoản hiện avatar, chỉ hiện **tên bị cắt 10 ký tự** từ `xl` trở lên; `aria-label` là tên đầy đủ nên locator E2E `getByRole("button", { name: displayName })` vẫn khớp.
- Menu nào cũng dùng chung primitive `Dropdown` (`components/ui/Dropdown.tsx`) — `role="menu"`, `menuitem`/`menuitemradio`, đóng bằng Escape và bấm ra ngoài.

### Trang cài đặt

Trang Cài đặt chia theo **nhóm** thay vì một dải cài đặt dài:

- Danh sách nhóm là `role="tablist"` (`features/settings/components/SettingsGroupTabs.tsx`), mỗi nhóm một `role="tabpanel"`; **chỉ một panel hiện tại một lúc**, điều hướng bằng phím mũi tên.
- Bốn nhóm: **Lời giải** (solver) · **Bấm giờ** (timer) · **Học tập** (study) · **Giao diện** (appearance).
- Mọi thay đổi vẫn **tự lưu** (debounce 350 ms) — xem `features/settings/lib/useSettingsState.ts`; trạng thái lưu nằm ở `actions` của `PageHeader`.
- Giải thích dài được **gập lại** trong `<details class="cfop-settings-note">` thay vì để nguyên một khối màu xanh.
- Nút “Khôi phục mặc định” hạ xuống thành **link** dưới danh sách nhóm, không còn nút lớn ở giữa trang.

### Trang lịch giải WCA

Trang `/wca` đọc lịch giải như một **lịch**, không phải một bức tường thẻ:

- Giải được gom theo **tháng bắt đầu**; mỗi tháng là một `<section>` có `<h2>` riêng và một pill đếm số giải.
- Mỗi giải là **một dòng**: cột ngày (số ngày + tháng) · tên giải · dòng meta (cờ quốc gia, thành phố, nước, địa điểm).
- **Tên giải là link** tới trang giải của WCA — không còn 21 nút “Trang giải WCA” giống hệt nhau.
- Địa điểm trong feed WCA viết dạng markdown `[Tên](url)`; `features/wca/lib/wcaCalendar.ts` bóc ra **tên + link** để raw markdown không bao giờ lộ lên giao diện.
- Bộ lọc gồm **khoảng thời gian** (3 preset + 2 ô ngày), **quốc gia** và **tìm kiếm tức thì**; số kết quả hiện bằng `role="status"` để screen reader nghe được.
- Badge trạng thái chỉ hiện khi giải **không** ở trạng thái “đã duyệt”; badge “Đã duyệt” lặp lại ở mọi dòng chỉ là nhiễu.

### Trang giải Rubik

Trang `/` là một **không gian làm việc** hai cột, không phải một card chồng card:

- **Thanh công cụ gọn** ở trên: hai nhóm nút `aria-pressed` (chế độ solver · nguồn đầu vào) và trạng thái `role="status" aria-live="polite"`. Dưới hàng là dòng gợi ý + link “Đặt lại”.
- **Cột trái — “Khối của bạn”**: ô nhập có `<label>` thật, badge nhị phân theo chế độ, nút “Scramble ngẫu nhiên”, và các khối gập bằng `<details>` native (cài đặt slot F2L · quét camera · dán 54 sticker).
- **Cột phải — “Lời giải”**: khối cube 2D/3D và **khối phát lại chỉ hiện khi đã có lời giải** — trước đó có một dòng nhắc bấm nút.
- **Báo cáo CFOP** nằm full-width dưới cả hai cột; số lượt và số chặng gộp vào header của chính báo cáo nên không còn thẻ số liệu trùng lặp.
- Các khối gập dùng `<details>` native, không dựa vào JS của Bootstrap accordion.

### Trang học thêm

Trang `/study` là **một màn hình làm việc**, không phải một bảng tra cứu dài:

- **Thanh gọn** ở trên gộp hết phần số liệu: đổi làn (Last Layer · 3-Style BLD), mục tiêu ôn hôm nay kèm thanh tiến độ, và hai con số (hàng đợi · đã thuộc). Trước đây nằm cạnh nhau năm thẻ số liệu.
- **Cột trái — case đang học**: khối 2D/3D, nút xem/ẩn công thức, timer luyện nhớ và bốn nút tự chấm (Quên · Khó · Nhớ · Dễ) để SRS lên lịch lần gặp lại.
- **Cột phải — lịch ôn**: bảy ngày tới, hôm nay được tô đậm; nút “Ôn case yếu nhất” đưa thẳng tới case yếu nhất.
- **Catalog** gập trong `<details>` và **đóng mặc định**; mở ra là **lưới bốn cột các nhóm case**, bấm vào một nhóm mới xem các case trong nhóm đó.
- Toàn bộ copy của trang nằm trong namespace i18n `study.*` (`client/src/lib/i18n/study.ts`).

## 3. Yêu cầu môi trường

| Công cụ | Phiên bản khuyến nghị | Ghi chú |
|---|---:|---|
| Node.js | 22 LTS trở lên | Dùng cho Vite, server và build. |
| pnpm | 10.34.5 | Phiên bản được khai báo trong `packageManager`; phải dùng lockfile hiện tại, không trộn npm/yarn trong project. |
| Git | Phiên bản mới | Dùng để clone và quản lý thay đổi. |
| MySQL/TiDB | MySQL 8 hoặc tương thích | Cần khi bật tài khoản, cloud sync, WCA account và Rooms. |
| Python | 3.11 trở lên | Chỉ cần nếu sửa hoặc tái tạo solver Python; không cần để chạy bundle web đã có. |
| Chromium | Chromium của Playwright hoặc bản cài hệ thống | `pnpm test:e2e` ép dùng `/usr/bin/chromium`; nếu máy không có Chromium ở đường dẫn đó thì chạy `npx playwright test` để dùng browser do Playwright quản lý. |

Kiểm tra nhanh:

```bash
node --version
pnpm --version
git --version
mysql --version
python3 --version       # chỉ cần cho Python solver
```

Nếu không dùng Python solver, dòng `python3 --version` có thể bỏ qua.

## 4. Clone và cài dependency

```bash
git clone <URL_REPOSITORY> cfop_solver_web
cd cfop_solver_web
corepack enable
pnpm install --frozen-lockfile
```

Không commit các file sau:

```text
.env
.env.local
.env.*.local
node_modules/
dist/
test-results/
```

Các file media lớn không nên đặt trong `client/public` hoặc `client/src/assets`. Dùng object storage/CDN phù hợp và chỉ lưu URL/metadata trong ứng dụng.

## 5. Cấu hình biến môi trường

Tạo `.env.local` cho local development. Không commit file này vào Git.

### 5.1. Tối thiểu cho server full-stack

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://cfop:cfop_local@127.0.0.1:3307/cfop_solver
```

`DATABASE_URL` cần thiết cho account CFOP, cloud sync, profile và Rooms. Luồng solver, Timer và History local có thể chạy mà không cần database, nhưng các route server vẫn nên được kiểm tra với cấu hình đầy đủ. Account CFOP dùng `scrypt` để băm mật khẩu và SHA-256 cho session token nên **không cần secret nào** — không có `JWT_SECRET` trong cấu hình.

### 5.2. WCA OAuth tùy chọn

```dotenv
WCA_CLIENT_ID=
WCA_CLIENT_SECRET=
WCA_OAUTH_REDIRECT_URI=https://your-domain.example/api/wca/oauth/callback
```

Chỉ điền các giá trị này sau khi đã đăng ký OAuth application tương ứng. Redirect URI phải trùng với domain đang chạy; local và production thường cần hai cấu hình riêng.

### 5.3. Quên mật khẩu tùy chọn

```dotenv
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CFOP_APP_URL=http://localhost:3000
```

Nếu thiếu một trong ba biến này, tài khoản vẫn có thể đăng ký/đăng nhập nhưng email đặt lại mật khẩu sẽ không được bật.

### 5.4. Storage tùy chọn

```dotenv
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
```

Các biến này phục vụ storage proxy/tích hợp storage đã cấu hình. Không đưa key thật vào README, `.env.example` hoặc commit.

### 5.5. TRUST_PROXY

```dotenv
# Bật khi máy chủ đứng sau một reverse proxy (Railway, nginx, Cloudflare…)
TRUST_PROXY=1
```

`X-Forwarded-For` do chính client gửi lên nên **không đáng tin** nếu máy chủ
không đứng sau proxy đã cấu hình. Vì vậy:

- **Bật** (`TRUST_PROXY=1`): địa chỉ client lấy từ hop cuối cùng của
  `X-Forwarded-For` — đó là địa chỉ proxy vừa ghi, không thể giả.
- **Không bật**: địa chỉ client lấy từ địa chỉ socket, header bị bỏ qua.

Hệ quả trực tiếp lên hạn mức tần suất:

| Tình huống | Hậu quả |
|---|---|
| Có proxy nhưng quên bật `TRUST_PROXY` | Mọi người dùng dùng chung một địa chỉ ⇒ dùng chung hạn mức (đăng nhập, tra lịch sử, gọi WCA). |
| Bật `TRUST_PROXY=1` | Mỗi người dùng có hạn mức riêng. |

Vì vậy khi triển khai sau reverse proxy, **luôn đặt `TRUST_PROXY=1`**.

## 6. Database local nhanh bằng Docker

Để tránh phải cài MySQL/MariaDB riêng trên cả macOS và Windows, môi trường phát triển dùng **MariaDB trong Docker Compose**. Schema và query vẫn giữ dialect MySQL hiện tại, vì vậy không tạo thêm nhánh SQLite khác với production.

Yêu cầu duy nhất là [Docker Desktop](https://www.docker.com/products/docker-desktop/) đang chạy. Từ thư mục project, chạy:

```bash
pnpm install
pnpm db:setup
pnpm dev
```

`pnpm db:setup` sẽ tự động:

1. Khởi động container MariaDB local trên `127.0.0.1:3307`.
2. Tạo `.env.local` nếu chưa có với `DATABASE_URL` trỏ vào container local.
3. Chờ database healthy.
4. Sinh và áp dụng Drizzle migration.

Dữ liệu được giữ trong Docker volume `cfop_solver_local_db`, nên có thể tắt/mở Docker Desktop mà không mất dữ liệu. Các lệnh hữu ích:

```bash
pnpm db:stop   # dừng container, giữ dữ liệu
pnpm db:logs   # xem log MariaDB
pnpm db:reset  # xóa container và toàn bộ database local rồi tạo lại
```

Không cần chạy các lệnh này trong production. Khi deploy production, chỉ cần cung cấp `DATABASE_URL` MySQL/TiDB thật và chạy migration theo quy trình backup/staging.

## 7. Database và migration

Schema nằm trong `drizzle/schema.ts`; migration SQL nằm trong `drizzle/`. Database hiện có các nhóm dữ liệu sau:

| Nhóm bảng | Vai trò |
|---|---|
| `cfop_accounts`, `cfop_account_sessions` | Account CFOP riêng và session hash. |
| `cfop_account_cloud_states` | Snapshot versioned của Timer/Study để đồng bộ tài khoản. |
| `cfop_password_reset_tokens`, `cfop_wca_oauth_states` | Token reset/OAuth dạng hash, có thời hạn. |
| `cfop_competition_rooms`, `members`, `rounds`, `results`, `messages` | Phòng thi, thành viên, lượt thi, kết quả và chat. |
| `cfop_competition_moderation_logs` | Nhật ký moderator loại spectator. |

Với môi trường self-host có quyền chạy migration:

```bash
pnpm drizzle-kit migrate
```

Đây là lệnh nên dùng khi triển khai production: nó chỉ áp dụng các file SQL trong `drizzle/` (đã được review) lên database.

Không dùng `pnpm db:push` trong deploy: script này chạy `drizzle-kit generate` trước, tức là vừa sinh lại SQL mới trong lúc deploy, vừa có thể ghi đè nội dung file migration đang track trong repository. `db:push` chỉ dành cho máy dev khi đang thử nghiệm schema.

Quy trình triển khai database:

1. Backup database trước mọi lần migration.
2. Xoá lại các file SQL mới trong `drizzle/` đã được review trước khi chạy `drizzle-kit migrate` (vì vậy dùng `drizzle-kit migrate`, không dùng `db:push`).
3. Đọc các SQL chuẩn bị áp dụng và chạy thử trên staging nếu có thay đổi phá vỡ schema (đổi cột, đổi kiểu dữ liệu).
4. Không đặt migration tự động trong bước deploy nếu chưa có quy trình backup/rollback.

## 8. Chạy development

```bash
pnpm dev
```

Server mặc định bắt đầu từ `PORT` hoặc cổng `3000`. Nếu cổng ưu tiên bận, bootstrap hiện tại tìm một cổng trống trong phạm vi kế tiếp. Development dùng Vite middleware và vẫn mount API tại `/api/trpc`.

Các route chính:

```text
/              Studio / CFOP Solver
/timer         Timer Lab
/study         Study Lab
/history       History
/settings      Settings
/profile       Profile và account CFOP
/rooms         Danh sách/tạo phòng
/rooms/:code   Phòng thi cụ thể
/wca           WCA competitions
```

## 9. Scripts thường dùng

| Lệnh | Mục đích |
|---|---|
| `pnpm dev` | Chạy Express + Vite development server. |
| `pnpm check` | TypeScript check, không tạo output. |
| `pnpm test` | Chạy toàn bộ Vitest server/client. |
| `pnpm test:e2e` | Chạy Playwright bằng Chromium hệ thống tại `/usr/bin/chromium`; dùng `npx playwright test` nếu máy không có Chromium ở đường dẫn đó. |
| `pnpm build` | Build frontend và bundle Express server production. |
| `pnpm start` | Chạy `dist/index.js` ở production mode. |
| `pnpm run embed-solver` | Tái tạo bundle solver từ `solver-python/cfop_solver`; chỉ cần khi sửa Python solver. |
| `pnpm db:push` | Generate và apply Drizzle migration; không chạy tự động trong deploy nếu chưa kiểm soát. |
| `pnpm format` | Format bằng Prettier. |

### Lưu ý quan trọng về `pnpm build`

`pnpm build` **không gọi** `embed-solver` để giữ build production nhanh và deterministic. Source Python solver hiện nằm công khai tại `solver-python/cfop_solver`; file `client/src/lib/embeddedSolver.ts` là bundle đã được theo dõi trong repository và được dùng trực tiếp khi build.

Khi thực sự sửa Python solver, cần có workspace đúng cấu trúc:

```text
cfop_solver_web/
├── scripts/embed-solver.mjs
└── solver-python/
    └── cfop_solver/
        ├── __init__.py
        ├── cube.py
        ├── solver.py
        └── ...
```

Sau khi sửa và kiểm thử Python:

```bash
cd cfop_solver_web
pnpm run embed-solver
pnpm check
pnpm test
pnpm build
```

Không chỉnh sửa thủ công `client/src/lib/embeddedSolver.ts`; đây là output được sinh từ solver source.

### Dữ liệu thuật toán BLD (BLDDB)

Catalog thuật toán 3-Style được tải từ repo
[nbwzx/blddb](https://github.com/nbwzx/blddb) vào trình duyệt. Toàn bộ URL
nằm trong một module duy nhất:
`client/src/features/bld/lib/bldCatalogSource.ts`.

Hai điều cần nhớ khi sửa module này:

- **URL phải ghim theo commit SHA**, không dùng tên nhánh (`main`, `v2`). Nhánh
  upstream là điểm di chuyển: một lần cập nhật có thể đổi hoặc xoá thuật toán mà
  app đã phân giải. Muốn nâng cấp dữ liệu thì lấy SHA mới từ GitHub rồi sửa
  `BLDDB_COMMITS`.
- **Response được cache bằng Cache API** để app vẫn dùng được khi offline và
  không tải lại ~13 MB catalog mỗi lần mở. Khi mạng lỗi, module tự dùng bản
  cache; khi không có cả cache thì ném `BldCatalogUnavailableError` để UI báo
  lỗi thay vì hiện dữ liệu sai.

Có CSP cho phép `connect-src https://raw.githubusercontent.com`, nên không cần
mở thêm origin nào.

### Pyodide chạy offline

Bộ giải CFOP chạy bằng Pyodide ngay trong trình duyệt (Web Worker). Bản phân
phối Pyodide được tải về `client/public/pyodide` (~14 MB) bởi
`scripts/fetch-pyodide.mjs`, và script này chạy trước cả `pnpm dev` lẫn
`pnpm build`:

```bash
pnpm fetch-pyodide            # tải nếu thiếu hoặc sai phiên bản
pnpm fetch-pyodide --force    # tải lại từ đầu
```

Nhờ vậy bộ giải chạy được khi offline. Loader
(`client/src/lib/pyodideLoader.ts`) ưu tiên bản cục bộ và chỉ dùng CDN làm
dự phòng khi bản cục bộ chưa có.

Những điều cần nhớ:

- **Phiên bản phải khớp ở hai nơi**: `PYODIDE_VERSION` trong
  `client/src/lib/pyodideLoader.ts` và trong `scripts/fetch-pyodide.mjs`. Đổi
  phiên bản thì sửa cả hai rồi chạy lại `pnpm fetch-pyodide --force`.
- **Thư mục `client/public/pyodide` bị gitignore**, nên repo không phình;
  bản build trên CI có nó vì script tải chạy trước khi build.
- **Ở chế độ dev, Vite gắn `?import` vào mọi dynamic import** và từ chối
  transform file trong `/public`. Vì vậy `vite.config.ts` có plugin
  `localPyodidePlugin` tự phục vụ các file đó. Bỏ plugin này thì dev server
  sẽ âm thầm lùi về CDN.


## 10. Kiểm thử trước khi commit

Chạy tối thiểu:

```bash
pnpm check
pnpm test
pnpm test:e2e
pnpm build
git diff --check
```

Playwright dùng `playwright.config.ts`, tự khởi động hoặc tái sử dụng `pnpm dev`, chạy Chromium headless và mặc định truy cập `http://127.0.0.1:3000`. E2E account/Room dùng fixture tRPC trong bộ nhớ, không ghi account, cloud state hoặc phòng thật. E2E lazy-load kiểm tra Studio không tải Cubing/Three.js ban đầu, Timer tải Cubing khi cần scramble và event 3D tải Three.js khi mở canvas.

Khi thay đổi schema, router hoặc Room state, cần bổ sung regression tương ứng trước khi chạy full suite. Khi thay đổi localStorage, phải giữ nguyên key/schema hiện hữu hoặc viết migration có test; không dùng `localStorage.clear()`.

## 11. Persistence và dữ liệu người dùng

Các dữ liệu Timer, History, Settings, Study/SRS, mastered case và BLD profile được lưu local bằng các helper trong `client/src/lib/browserStorage.ts`. Helper này có guard cho SSR/private mode và giữ nguyên key/schema cũ.

Account CFOP lưu profile/session trong MySQL. Khi người dùng đăng nhập, cloud sync có thể lưu snapshot versioned gồm Timer, Last Layer, BLD profile và learning path vào `cfop_account_cloud_states`. Dữ liệu local và cloud cần được xem như hai lớp khác nhau:

1. Local browser là nguồn thao tác nhanh và vẫn phải được export trước khi đổi origin hoặc thiết bị.
2. Cloud account là snapshot đồng bộ, không nên bị ghi đè bằng payload chưa kiểm tra.
3. Không thay đổi key localStorage, shape cloud payload hoặc version mà không có migration và regression.
4. Trước migration database hoặc thay đổi sync, phải backup dữ liệu và kiểm tra conflict/last-write behavior.

## 12. Build production và Railway

Build production:

```bash
pnpm install --frozen-lockfile
pnpm build
NODE_ENV=production PORT=3000 pnpm start
```

`pnpm build` chạy Vite với `NODE_ENV=production` tường minh, nên `.env.local` không thể vô tình biến build thành development bundle. Manus preview runtime chỉ được chèn khi chạy dev server hoặc khi đặt `MANUS_RUNTIME=1`; build Railway mặc định không kèm runtime đó.

Output:

```text
dist/
├── index.js       # Express/tRPC production server
└── public/        # Vite static assets
```

`railway.json` đã có sẵn cấu hình mẫu:

```text
builder: Railpack
build:   pnpm build
start:   pnpm start
restart: ON_FAILURE, tối đa 3 lần
```

Khi deploy, cần khai báo secret/database trong dashboard của nhà cung cấp, không commit vào repository. Phải chạy production Node server; static host thuần như GitHub Pages hoặc Cloudflare Pages chỉ phù hợp cho `dist/public` nếu tách backend riêng, không đủ cho account, sync và Rooms.

## 13. Cấu trúc thư mục bàn giao

```text
cfop_solver_web/
├── client/
│   ├── index.html
│   └── src/
│       ├── components/       # AppNav, Bootstrap UI, Cube/3D, Account, Study, Rooms...
│       ├── features/         # Feature boundary: timer, rooms, profile, puzzle-3d, solver, settings, bld, competition, wca
│       ├── contexts/         # Language/theme và context dùng chung
│       ├── hooks/             # React hooks dùng chung
│       ├── lib/               # persistence, solver, scramble, analytics, download, presentation
│       ├── pages/             # Home, TimerLab, History, Settings, Profile, Rooms, WCA
│       ├── App.tsx            # App shell, routes, lazy page loading
│       ├── main.tsx           # React providers và tRPC client
│       └── index.css          # Global styles Bootstrap-compatible
├── server/
│   ├── _core/                # Framework/runtime; không sửa tùy tiện
│   ├── db.ts                 # Query helpers và data access
│   ├── routers.ts            # tRPC contracts và feature procedures
│   ├── competition.ts        # Rule/score helper cho Rooms
│   ├── cfopAccountAuth.ts    # Hash/session/account helper
│   ├── cfopPasswordResetMail.ts
│   ├── wcaApi.ts
│   ├── wcaOAuth.ts
│   ├── storage.ts
│   └── *.test.ts              # Backend regression
├── shared/
│   ├── timerEvents.ts        # Event IDs/metadata dùng chung
│   ├── multiBlind.ts
│   └── types.ts
├── drizzle/
│   ├── schema.ts              # MySQL schema và types
│   ├── *.sql                  # Migration đã sinh
│   └── meta/                  # Drizzle metadata
├── scripts/
│   ├── embed-solver.mjs       # Tái tạo solver bundle khi có Python source
│   └── ...                    # Validation/build utilities
├── e2e/                       # Playwright browser workflows
├── railway.json               # Deploy config mẫu cho Node/Express
├── playwright.config.ts
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── package.json
├── pnpm-lock.yaml
├── docs/architecture/refactor-audit.md # Ranh giới và lịch sử refactor
├── docs/planning/TODO.md     # Checklist thay đổi
└── README.md                  # Entry point; tài liệu chi tiết nằm trong docs/
```

`server/_core/` là framework plumbing của template, gồm bootstrap, Vite bridge, tRPC context, cookie helper và storage proxy. Không chỉnh sửa thư mục này trong feature work nếu chưa hiểu rõ contract runtime.

## 14. Quy tắc phát triển an toàn

Khi thêm tính năng, trước hết xác định module sở hữu state và data contract. Tách pure helper khỏi page/component lớn, tái sử dụng metadata trong `shared/` hoặc `client/src/lib/`, và giữ UI feature ở `components/`/`pages/` phù hợp.

Tất cả backend call phải đi qua tRPC hiện có; không thêm fetch/Axios wrapper riêng cho API app. Database schema phải được cập nhật trước, migration phải được review và feature cần regression server/client tương ứng. Các thao tác auth, cloud sync, avatar, WCA và Rooms phải được kiểm tra với trạng thái lỗi, loading, unauthorized và dữ liệu rỗng.

Khi thay đổi solver, giữ invariant direct search: XCross đến XXXXCross chỉ được ghi nhận nếu chuỗi direct từ state ban đầu đồng thời đạt Cross và đủ slot mục tiêu. Khi thay đổi Timer/History, giữ event ID, storage key, penalty và format export hiện có.

## 15. Chiến lược scale Rooms

Rooms hiện là mô hình server-backed trong MySQL. State quan trọng gồm room, member, round, result, message và moderation log; presence hiện dựa trên `lastSeen` với cửa sổ online ngắn. Vì vậy, điểm nghẽn đầu tiên khi số người thi tăng thường là polling state, các lần cập nhật presence, query lặp lại theo room và kết nối database, không phải renderer 3D phía client.

### Giai đoạn 1: ổn định trên một service Node

Giữ API Node stateless ở mức có thể, đặt pool kết nối MySQL có giới hạn, bật timeout và đo p95 latency. Bổ sung metric cho `competition.state`, `startRound`, `submit`, `sendMessage`, số member/room, lỗi database và thời gian query. Xác nhận các index room/member/round/result/message hiện có bằng `EXPLAIN`; bổ sung index theo workload thực tế, không tạo index tùy tiện.

Giới hạn tần suất gửi chat và state refresh ở server. Presence không cần ghi database ở mọi request nếu có thể gom nhịp; giữ MySQL làm nguồn sự thật cho membership, result và moderation. Đặt giới hạn `maxPlayers`, độ dài message và kích thước cloud payload như validation hiện có.

### Giai đoạn 2: giảm tải polling

Khi polling bắt đầu chiếm nhiều request, chuyển notification state sang WebSocket hoặc SSE. Database vẫn lưu round/result/message; kênh realtime chỉ phát event như `round_started`, `result_submitted`, `member_joined` và `message_created`. Nếu chạy nhiều instance Node, dùng Redis Pub/Sub hoặc dịch vụ realtime managed để fan-out event; không giữ state phòng duy nhất trong RAM của một process.

Tách presence ngắn hạn sang Redis với TTL nếu `lastSeen` trở thành write hotspot. Chỉ ghi snapshot/presence tổng hợp vào database khi cần audit. Đây là thay đổi hạ tầng, cần E2E cho reconnect, duplicate event, tab đóng đột ngột và moderator removal.

### Giai đoạn 3: scale ngang

Đặt load balancer trước nhiều instance API. Mỗi instance phải đọc state từ database/cache chung; không phụ thuộc sticky session nếu session là HTTP-only cookie và state phòng nằm ở MySQL/Redis. Cache dữ liệu ít thay đổi như event metadata, country list và leaderboard theo period; không cache kết quả submit theo cách có thể gây race.

Dùng optimistic concurrency hoặc unique constraint hiện có để bảo vệ submit một lần/người/lượt. Khi start round hoặc submit đồng thời, kiểm tra transaction/isolation và retry có giới hạn. Giữ kết quả bất biến sau submit; việc chốt round/room cần idempotency để retry không tạo round hoặc result trùng.

### Giai đoạn 4: tách workload

Khi Rooms và WCA tăng cùng lúc, tách các workload đọc nặng: leaderboard/history có thể đi qua read replica hoặc bảng aggregate; WCA calendar có thể cache theo khoảng ngày/quốc gia; chat có thể archive theo room. Các tác vụ không cần phản hồi tức thì như aggregate thống kê, email reset và cleanup token nên đi qua worker/queue.

CDN chỉ nên phục vụ static assets và chunk Cubing/Three.js. Lazy-load theo event hiện có giúp giảm tải ban đầu nhưng không giải quyết database contention. Không đưa dữ liệu auth, room state hoặc kết quả thi vào CDN cache công khai.

### Thứ tự ưu tiên đề xuất

| Ưu tiên | Việc nên làm | Điều kiện kích hoạt |
|---:|---|---|
| 1 | Metrics, slow query log, EXPLAIN, connection pool và rate limit | Ngay trước khi tăng traffic |
| 2 | Giảm polling/presence writes, thêm cache event/leaderboard | p95 state hoặc DB write tăng |
| 3 | WebSocket/SSE + Redis Pub/Sub, test reconnect/idempotency | Cần nhiều instance hoặc polling quá lớn |
| 4 | Load balancer, worker queue, read replica/aggregate | DB/API trở thành bottleneck ổn định |
| 5 | Sharding theo room/event và data retention | Chỉ khi một database/partition không còn đủ |

Đừng sharding quá sớm. Với dữ liệu thi đấu cần tính toàn vẹn, một MySQL primary có index và transaction đúng thường dễ vận hành hơn nhiều database phân mảnh. Hãy load-test các flow `state → startRound → submit → state` bằng dữ liệu tổng hợp trước khi chọn ngưỡng scale thực tế.

## 16. Tài liệu tham khảo kỹ thuật

- [React documentation](https://react.dev/learn)
- [Vite guide](https://vite.dev/guide/)
- [Bootstrap documentation](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
- [tRPC documentation](https://trpc.io/docs)
- [Drizzle ORM documentation](https://orm.drizzle.team/docs/overview)
- [Playwright documentation](https://playwright.dev/docs/intro)
- [Railway configuration reference](https://docs.railway.com/config-as-code/reference)
- [MySQL indexing documentation](https://dev.mysql.com/doc/refman/8.4/en/mysql-indexes.html)

## 17. Checklist bàn giao

- [ ] Clone đúng repository và cài bằng `pnpm install --frozen-lockfile`.
- [ ] Đã cấu hình `DATABASE_URL` nếu dùng account/Rooms.
- [ ] Đã chạy migration trên database staging trước production.
- [ ] `pnpm check` đạt.
- [ ] `pnpm test` đạt.
- [ ] `pnpm test:e2e` đạt với Chromium.
- [ ] `pnpm build` đạt trong môi trường checkout mới với source Python trong repository.
- [ ] Đã kiểm tra `git diff --check`.
- [ ] Đã backup/export dữ liệu local quan trọng trước khi đổi origin/domain.
- [ ] Đã kiểm tra redirect URI, cookie domain, CORS và secrets trên host thật.
- [ ] Đã xác nhận rollback/checkpoint trước thay đổi schema hoặc realtime Rooms.

## License

Giữ license hiện có của repository khi phát hành hoặc fork dự án. Nếu chưa có policy riêng, hãy bổ sung license và quy tắc đóng góp trước khi mở repository công khai.

---

**Maintainer note:** `README.md` mô tả cấu trúc và scripts tại thời điểm bàn giao. Khi thay đổi package scripts, environment variables, schema, routes hoặc deployment provider, hãy cập nhật README và bổ sung regression tương ứng trong cùng một pull request.


### References

[1]: https://react.dev/learn "React documentation"
[2]: https://vite.dev/guide/ "Vite guide"
[3]: https://getbootstrap.com/docs/5.3/getting-started/introduction/ "Bootstrap documentation"
[4]: https://trpc.io/docs "tRPC documentation"
[5]: https://orm.drizzle.team/docs/overview "Drizzle ORM documentation"
[6]: https://playwright.dev/docs/intro "Playwright documentation"
[7]: https://docs.railway.com/config-as-code/reference "Railway configuration reference"
[8]: https://dev.mysql.com/doc/refman/8.4/en/mysql-indexes.html "MySQL indexing documentation"
