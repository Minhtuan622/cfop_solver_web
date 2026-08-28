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
| UI | React 19, TypeScript, Vite 7, Bootstrap 5.3, Bootstrap Icons, Wouter |
| Data fetching | tRPC 11, TanStack Query, SuperJSON |
| Backend | Node.js, Express 4, tRPC server |
| Database | MySQL/TiDB, Drizzle ORM và Drizzle Kit |
| Rubik | Cubing.js, Three.js, Pyodide Web Worker, solver bundle Python đã nhúng |
| Kiểm thử | Vitest, Testing Library, Playwright E2E |
| Build | Vite cho frontend và esbuild cho Express server |
| Deploy mẫu | `railway.json` dùng Railpack, `pnpm build`, `pnpm start` |

Ứng dụng thông thường chạy dưới dạng **một Node process**: Express mount tRPC tại `/api/trpc`, phục vụ SPA và các route OAuth/WCA; trong development process này dùng Vite middleware, còn production phục vụ `dist/public`.

## 3. Yêu cầu môi trường

| Công cụ | Phiên bản khuyến nghị | Ghi chú |
|---|---:|---|
| Node.js | 22 LTS trở lên | Dùng cho Vite, server và build. |
| pnpm | 10 trở lên | Phải dùng lockfile hiện tại; không trộn npm/yarn trong project. |
| Git | Phiên bản mới | Dùng để clone và quản lý thay đổi. |
| MySQL/TiDB | MySQL 8 hoặc tương thích | Cần khi bật tài khoản, cloud sync, WCA account và Rooms. |
| Python | 3.11 trở lên | Chỉ cần nếu sửa hoặc tái tạo solver Python; không cần để chạy bundle web đã có. |
| Chromium | Bản cài hệ thống | Cần cho `pnpm test:e2e`; cấu hình hiện tại dùng `/usr/bin/chromium`. |

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
DATABASE_URL=mysql://username:password@127.0.0.1:3306/cfop_solver
JWT_SECRET=replace-with-a-long-random-secret
```

`DATABASE_URL` và `JWT_SECRET` cần thiết cho account CFOP, cloud sync, profile và Rooms. Luồng solver, Timer và History local có thể chạy mà không cần database, nhưng các route server vẫn nên được kiểm tra với cấu hình đầy đủ.

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

### 5.5. Các biến Manus/OAuth hệ thống

Khi chạy trong hosting tích hợp, các biến hệ thống có thể đã được cấp sẵn. Khi tự host, chỉ cấu hình những biến mà flow tương ứng sử dụng:

```dotenv
VITE_APP_ID=
OAUTH_SERVER_URL=
OWNER_OPEN_ID=
VITE_OAUTH_PORTAL_URL=
VITE_FRONTEND_FORGE_API_URL=
VITE_FRONTEND_FORGE_API_KEY=
```

Không tự đặt giá trị giả cho production. Auth Manus và account CFOP là hai ranh giới khác nhau; account CFOP dùng email/mật khẩu và bảng `cfop_*`, không dùng `openId` của Manus.

## 6. Database và migration

Schema nằm trong `drizzle/schema.ts`; migration SQL nằm trong `drizzle/`. Database hiện có các nhóm dữ liệu sau:

| Nhóm bảng | Vai trò |
|---|---|
| `users` | Bảng tương thích Manus/platform auth. |
| `cfop_accounts`, `cfop_account_sessions` | Account CFOP riêng và session hash. |
| `cfop_account_cloud_states` | Snapshot versioned của Timer/Study để đồng bộ tài khoản. |
| `cfop_password_reset_tokens`, `cfop_wca_oauth_states` | Token reset/OAuth dạng hash, có thời hạn. |
| `cfop_competition_rooms`, `members`, `rounds`, `results`, `messages` | Phòng thi, thành viên, lượt thi, kết quả và chat. |
| `cfop_competition_moderation_logs` | Nhật ký moderator loại spectator. |

Với môi trường self-host có quyền chạy migration:

```bash
pnpm drizzle-kit migrate
```

Hoặc dùng script hiện có:

```bash
pnpm db:push
```

`db:push` chạy `drizzle-kit generate && drizzle-kit migrate`. Trước migration production, hãy backup database, đọc SQL được sinh ra và chạy thử trên staging. Không dùng lệnh destructive hoặc tự động migration trong bước deploy nếu chưa có quy trình backup/rollback.

## 7. Chạy development

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

## 8. Scripts thường dùng

| Lệnh | Mục đích |
|---|---|
| `pnpm dev` | Chạy Express + Vite development server. |
| `pnpm check` | TypeScript check, không tạo output. |
| `pnpm test` | Chạy toàn bộ Vitest server/client. |
| `pnpm test:e2e` | Chạy Playwright bằng Chromium hệ thống. |
| `pnpm build` | Build frontend và bundle Express server production. |
| `pnpm start` | Chạy `dist/index.js` ở production mode. |
| `pnpm run embed-solver` | Tái tạo bundle solver từ Python source bên ngoài; chỉ cần khi sửa Python solver. |
| `pnpm db:push` | Generate và apply Drizzle migration; không chạy tự động trong deploy nếu chưa kiểm soát. |
| `pnpm format` | Format bằng Prettier. |

### Lưu ý quan trọng về `pnpm build`

`pnpm build` **không gọi** `embed-solver`. Lý do là source Python solver lịch sử nằm ngoài repository web; container production không có đường dẫn đó. File `client/src/lib/embeddedSolver.ts` hiện là bundle đã được theo dõi trong repository và được dùng trực tiếp khi build.

Khi thực sự sửa Python solver, cần có workspace đúng cấu trúc:

```text
rubik-workspace/
├── cfop_solver_web/
│   └── scripts/embed-solver.mjs
└── cfop_solver/
    └── cfop_solver/
        ├── __init__.py
        ├── cube.py
        ├── solver.py
        └── ...
```

Sau khi sửa và kiểm thử Python:

```bash
cd rubik-workspace/cfop_solver_web
pnpm run embed-solver
pnpm check
pnpm test
pnpm build
```

Không chỉnh sửa thủ công `client/src/lib/embeddedSolver.ts`; đây là output được sinh từ solver source.

## 9. Kiểm thử trước khi commit

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

## 10. Persistence và dữ liệu người dùng

Các dữ liệu Timer, History, Settings, Study/SRS, mastered case và BLD profile được lưu local bằng các helper trong `client/src/lib/browserStorage.ts`. Helper này có guard cho SSR/private mode và giữ nguyên key/schema cũ.

Account CFOP lưu profile/session trong MySQL. Khi người dùng đăng nhập, cloud sync có thể lưu snapshot versioned gồm Timer, Last Layer, BLD profile và learning path vào `cfop_account_cloud_states`. Dữ liệu local và cloud cần được xem như hai lớp khác nhau:

1. Local browser là nguồn thao tác nhanh và vẫn phải được export trước khi đổi origin hoặc thiết bị.
2. Cloud account là snapshot đồng bộ, không nên bị ghi đè bằng payload chưa kiểm tra.
3. Không thay đổi key localStorage, shape cloud payload hoặc version mà không có migration và regression.
4. Trước migration database hoặc thay đổi sync, phải backup dữ liệu và kiểm tra conflict/last-write behavior.

## 11. Build production và Railway

Build production:

```bash
pnpm install --frozen-lockfile
pnpm build
NODE_ENV=production PORT=3000 pnpm start
```

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

## 12. Cấu trúc thư mục bàn giao

```text
cfop_solver_web/
├── client/
│   ├── index.html
│   └── src/
│       ├── components/       # AppNav, Bootstrap UI, Cube/3D, Account, Study, Rooms...
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
├── refactor-audit.md          # Ranh giới và lịch sử refactor
├── todo.md                    # Checklist thay đổi
└── README.md
```

`server/_core/` là framework plumbing của template, gồm bootstrap, OAuth, Vite bridge, tRPC context và storage proxy. Không chỉnh sửa thư mục này trong feature work nếu chưa hiểu rõ contract runtime.

## 13. Quy tắc phát triển an toàn

Khi thêm tính năng, trước hết xác định module sở hữu state và data contract. Tách pure helper khỏi page/component lớn, tái sử dụng metadata trong `shared/` hoặc `client/src/lib/`, và giữ UI feature ở `components/`/`pages/` phù hợp.

Tất cả backend call phải đi qua tRPC hiện có; không thêm fetch/Axios wrapper riêng cho API app. Database schema phải được cập nhật trước, migration phải được review và feature cần regression server/client tương ứng. Các thao tác auth, cloud sync, avatar, WCA và Rooms phải được kiểm tra với trạng thái lỗi, loading, unauthorized và dữ liệu rỗng.

Khi thay đổi solver, giữ invariant direct search: XCross đến XXXXCross chỉ được ghi nhận nếu chuỗi direct từ state ban đầu đồng thời đạt Cross và đủ slot mục tiêu. Khi thay đổi Timer/History, giữ event ID, storage key, penalty và format export hiện có.

## 14. Chiến lược scale Rooms

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

## 15. Tài liệu tham khảo kỹ thuật

- [React documentation](https://react.dev/learn)
- [Vite guide](https://vite.dev/guide/)
- [Bootstrap documentation](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
- [tRPC documentation](https://trpc.io/docs)
- [Drizzle ORM documentation](https://orm.drizzle.team/docs/overview)
- [Playwright documentation](https://playwright.dev/docs/intro)
- [Railway configuration reference](https://docs.railway.com/config-as-code/reference)
- [MySQL indexing documentation](https://dev.mysql.com/doc/refman/8.4/en/mysql-indexes.html)

## 16. Checklist bàn giao

- [ ] Clone đúng repository và cài bằng `pnpm install --frozen-lockfile`.
- [ ] Đã cấu hình `DATABASE_URL` và `JWT_SECRET` nếu dùng account/Rooms.
- [ ] Đã chạy migration trên database staging trước production.
- [ ] `pnpm check` đạt.
- [ ] `pnpm test` đạt.
- [ ] `pnpm test:e2e` đạt với Chromium.
- [ ] `pnpm build` đạt trong môi trường không có source Python ngoài repository.
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
