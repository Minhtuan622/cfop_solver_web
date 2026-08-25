# CFOP Solver Studio

Ứng dụng web hỗ trợ giải và luyện Rubik 3×3. Giao diện được xây bằng **React + TypeScript + Vite + Bootstrap**. Thuật toán CFOP/BLD viết bằng Python được đóng gói vào trình duyệt và chạy trong **Pyodide Web Worker**, vì vậy luồng giải chính không cần một API hay cơ sở dữ liệu riêng.

> **Mục tiêu triển khai:** sau khi sao chép đúng workspace gồm frontend và gói Python solver, bạn chỉ cần cài Node.js, `pnpm install`, rồi chạy `pnpm dev` hoặc `pnpm build`.

## Chức năng chính

| Khu vực | Nội dung |
|---|---|
| **Giải Rubik** | Nhập scramble hoặc tô trạng thái 6 mặt, xem Cube 2D/3D và phát lại từng nước xoay. |
| **CFOP** | Cross theo màu đã chọn, F2L, OLL/PLL; có lựa chọn XCross đến XXXXCross direct-only, ZBLL và 1LLL. |
| **Timer** | Inspection, +2/DNF, Speed splits, thành tích cá nhân, lịch sử và phát lại solution. |
| **Study** | Luyện Last Layer và 3-Style BLD, danh mục công thức, SRS, streak và drill. |
| **Cài đặt** | Cross color, Opening, Last Layer, direct depth/node budget, F2L slot, Timer/Inspection và mục tiêu Study. |

## Kiến trúc

```text
┌────────────────────────────────────────────────────────────┐
│ React 19 + TypeScript + Vite + Wouter + Bootstrap 5         │
│  client/src/pages  → màn hình chính                         │
│  client/src/lib    → worker, localStorage, cube utilities   │
└───────────────────┬────────────────────────────────────────┘
                    │ message
┌───────────────────▼────────────────────────────────────────┐
│ Pyodide Web Worker                                          │
│  client/src/lib/solverWorker.ts                             │
│  client/src/lib/embeddedSolver.ts (tự sinh)                │
└───────────────────┬────────────────────────────────────────┘
                    │ nạp mã Python đã nhúng
┌───────────────────▼────────────────────────────────────────┐
│ Python CFOP package (workspace anh em)                      │
│  ../cfop_solver/cfop_solver                                 │
└────────────────────────────────────────────────────────────┘
```

## Yêu cầu môi trường

| Công cụ | Phiên bản khuyến nghị | Dùng để làm gì |
|---|---:|---|
| Node.js | 22 LTS trở lên | Chạy Vite, build và production server. |
| pnpm | 10 trở lên | Cài dependency đúng theo lockfile. |
| Python | 3.11 trở lên | Chạy test cho thuật toán solver; không bắt buộc khi chỉ chạy bản web đã build. |
| Git | Bản mới | Sao chép/sync source code. |

Lệnh kiểm tra nhanh:

```bash
node --version
pnpm --version
python3 --version
git --version
```

## Cấu trúc workspace bắt buộc

Script `embed-solver` mặc định lấy Python package từ **thư mục anh em** của web project. Hãy giữ cấu trúc này khi chuyển sang máy hoặc máy chủ khác:

```text
rubik-workspace/
├── cfop_solver_web/              # repository này
│   ├── client/                    # React/Vite frontend
│   ├── server/                    # Express static server cho production
│   ├── scripts/embed-solver.mjs   # nạp Python source vào web bundle
│   ├── package.json
│   └── pnpm-lock.yaml
└── cfop_solver/                   # Python solver repository/package
    ├── cfop_solver/               # __init__.py, cube.py, search.py, solver.py, ...
    └── tests/                     # regression tests Python
```

> Nếu `cfop_solver` không nằm cùng cấp với `cfop_solver_web`, `pnpm run embed-solver` và `pnpm build` sẽ không tìm thấy Python source.

## Cài đặt lần đầu

### 1. Chuẩn bị source code

Sao chép hoặc clone cả hai thư mục vào cùng một workspace. Nếu dùng Git, hãy clone hai repository cạnh nhau; nếu dùng file nén, giải nén sao cho đường dẫn có dạng ở phần trên.

### 2. Cài dependency frontend

```bash
cd rubik-workspace/cfop_solver_web
corepack enable
pnpm install --frozen-lockfile
```

`pnpm-lock.yaml` cần được giữ nguyên để tái lập đúng dependency đã kiểm thử. Không dùng `npm install` hoặc `yarn install` trong cùng project vì sẽ tạo lockfile khác.

### 3. Đồng bộ Python solver vào frontend

```bash
pnpm run embed-solver
```

Lệnh này đọc 15 module Python từ `../cfop_solver/cfop_solver/` và sinh `client/src/lib/embeddedSolver.ts`.

> **Không chỉnh sửa thủ công `client/src/lib/embeddedSolver.ts`.** File này sẽ bị ghi đè ở lần chạy `embed-solver` hoặc `build` kế tiếp.

### 4. Chạy môi trường phát triển

```bash
pnpm dev
```

Mặc định ứng dụng chạy tại `http://localhost:3000`. Nếu cổng 3000 đang bận, Vite sẽ tự chọn cổng kế tiếp.

## Lệnh thường dùng

| Lệnh | Mục đích |
|---|---|
| `pnpm dev` | Mở Vite development server. |
| `pnpm run embed-solver` | Sinh lại Python solver đã nhúng sau khi sửa Python source. |
| `pnpm check` | Kiểm tra TypeScript, không tạo file build. |
| `pnpm exec vitest run` | Chạy toàn bộ test giao diện và thư viện TypeScript. |
| `pnpm build` | Nhúng solver, build frontend vào `dist/public`, rồi bundle static server vào `dist/index.js`. |
| `pnpm preview` | Xem nhanh Vite production bundle tại máy local. |
| `PORT=8080 pnpm start` | Chạy Express static server của bản build tại cổng 8080. |
| `pnpm format` | Format code bằng Prettier. |

## Kiểm thử trước khi commit hoặc triển khai

### Frontend

```bash
cd rubik-workspace/cfop_solver_web
pnpm check
pnpm exec vitest run
pnpm build
```

### Python solver

```bash
cd rubik-workspace/cfop_solver
PYTHONPATH=. pytest -q tests/test_xcross.py
```

Test Python này đặc biệt quan trọng khi sửa thuật toán Opening. Nó bảo vệ invariant: **XCross/XXCross/XXXCross/XXXXCross chỉ được ghi nhận nếu một chuỗi direct nguyên tử từ state ban đầu đạt Cross và đủ F2L slot mục tiêu; không được gắn nhãn cao cho Cross rồi F2L tuần tự.**

## Quy trình sửa thuật toán solver

1. Sửa mã tại `../cfop_solver/cfop_solver/`, thường là `search.py`, `solver.py`, `predicates.py` hoặc module database.
2. Chạy test Python ở repository solver.
3. Quay về `cfop_solver_web` và chạy `pnpm run embed-solver`.
4. Chạy `pnpm check`, `pnpm exec vitest run` và `pnpm build`.
5. Kiểm tra trực tiếp các scramble liên quan trong giao diện trước khi phát hành.

Các tệp Python được nhúng hiện tại là:

```text
__init__.py, cube.py, notation.py, validation.py, bld.py,
predicates.py, f2l_macros.py, f2l_symmetry.py, cross_table.py,
search.py, phases.py, solver.py, full_database.py,
one_look_database.py, full_last_layer.py
```

Nếu thêm module Python mới được import trong solver, hãy thêm tên module đó vào mảng `files` trong `scripts/embed-solver.mjs`, sau đó chạy lại build.

## Dữ liệu người dùng và localStorage

Ứng dụng hiện là client-side. Timer history, setting, tiến độ Study/SRS, mastered case và một số lựa chọn UI được lưu trong **`localStorage` của trình duyệt**.

Điều này có nghĩa là dữ liệu được tách theo trình duyệt, thiết bị và origin. Khi chạy ở domain khác hoặc xoá dữ liệu trình duyệt, lịch sử local có thể không còn hiện. Các chức năng xuất/nhập của History và Study nên được dùng để sao lưu định kỳ trước khi chuyển máy.

> Không chạy `localStorage.clear()` trong code production hoặc trong console của trình duyệt đang chứa dữ liệu người dùng.

## Build và chạy production

```bash
cd rubik-workspace/cfop_solver_web
pnpm build
PORT=3000 pnpm start
```

Sau build:

```text
dist/
├── index.js       # Express server với SPA fallback
└── public/        # HTML, JavaScript, CSS và assets tĩnh
```

`server/index.ts` chỉ phục vụ file tĩnh và gửi lại `index.html` cho các route SPA như `/timer`, `/history`, `/study` và `/settings`. Solver vẫn chạy ở trình duyệt thông qua Web Worker.

Nếu triển khai lên static host, hãy upload nội dung `dist/public/` và bật SPA fallback về `index.html`. Nếu host cần Node server, dùng `pnpm start` sau khi build.

## Biến môi trường

Luồng giải Rubik, Timer, History và Study **không cần secret** để hoạt động. Cấu hình Vite có một storage proxy phát triển tại `/manus-storage`; proxy đó chỉ cần biến `BUILT_IN_FORGE_API_URL` và `BUILT_IN_FORGE_API_KEY` khi dự án thực sự sử dụng asset trên storage tương ứng.

Không đưa key, token hoặc file `.env` thật vào Git. Nếu bổ sung tích hợp bên thứ ba về sau, hãy mô tả biến môi trường mới trong README này và cung cấp `.env.example` không chứa secret.

### Thiết lập local

`NODE_ENV` và `PORT` chỉ ảnh hưởng runner/server; `pnpm dev` vẫn chạy được nếu không có `.env.local`. Hai biến `BUILT_IN_FORGE_*` chỉ cần cho storage proxy, còn `VITE_OAUTH_PORTAL_URL` và `VITE_APP_ID` chỉ cần khi bạn tự tích hợp login. Để trống các biến tùy chọn nếu chưa dùng chúng.

Khi tự triển khai ngoài workspace được quản lý, tạo `.env.local` với các biến sau nếu cần:

```dotenv
NODE_ENV=development
PORT=3000

# Chỉ cần khi dùng /manus-storage/<path>
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=

# Chỉ cần khi tự tích hợp OAuth
VITE_OAUTH_PORTAL_URL=
VITE_APP_ID=
```

## Lưu ý về tài nguyên tĩnh

Không để ảnh, video hoặc file lớn trong `client/public/` hay `client/src/assets/`. Với môi trường Manus, asset lớn cần được đưa ra storage webdev. Với self-host độc lập, nên dùng CDN/object storage riêng và tham chiếu qua URL ổn định.

## Xử lý sự cố phổ biến

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `ENOENT` khi chạy `embed-solver` | Thiếu thư mục Python solver hoặc sai cấu trúc workspace. | Kiểm tra `../cfop_solver/cfop_solver/` từ thư mục web project. |
| Web chạy nhưng solver không tải | `embeddedSolver.ts` cũ hoặc build chưa chạy lại sau khi sửa Python. | Chạy `pnpm run embed-solver`, sau đó restart `pnpm dev`. |
| `pnpm install` khác với máy cũ | Dùng pnpm/version khác hoặc lockfile bị sửa. | Bật Corepack, dùng pnpm 10 và chạy `pnpm install --frozen-lockfile`. |
| Trang con trả 404 khi deploy static | Host chưa bật SPA fallback. | Cấu hình route fallback trả về `index.html`. |
| Lịch sử Timer biến mất | Đổi domain/browser hoặc xoá localStorage. | Import bản sao lưu JSON trước đó hoặc dùng cùng origin cũ. |
| Direct Opening chậm | Direct depth/node budget đang cao. | Hạ `node budget direct`, giảm depth hoặc chọn Opening tier thấp hơn. |

## Checklist chuyển dự án sang máy khác

- [ ] Có cả `cfop_solver_web/` và `cfop_solver/` ở cùng workspace.
- [ ] Node.js 22+ và pnpm 10+ đã sẵn sàng.
- [ ] `pnpm install --frozen-lockfile` chạy thành công.
- [ ] `pnpm run embed-solver` sinh được `client/src/lib/embeddedSolver.ts`.
- [ ] `pnpm check`, `pnpm exec vitest run` và `pnpm build` đều pass.
- [ ] Static host có SPA fallback hoặc Node host chạy `pnpm start`.
- [ ] Dữ liệu local quan trọng đã export trước khi đổi domain/trình duyệt.

## Tài liệu nền tảng

- [React documentation](https://react.dev/learn)
- [Vite documentation](https://vite.dev/guide/)
- [Bootstrap documentation](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
- [Pyodide documentation](https://pyodide.org/en/stable/)
