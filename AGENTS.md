# AGENTS.md

Hướng dẫn ngắn cho agent (và người) sửa code trong repo này. Chi tiết nằm trong
`docs/`; file này chỉ tóm lại những gì đã có, kèm đường dẫn.

## Ràng buộc chung

- Không tự commit hoặc push. Báo danh sách file đã đổi và kết quả lệnh kiểm tra thật.
- File tạm đặt trong `tmp/` hoặc `temp/` (đã có trong `.gitignore`), không rải ở thư mục gốc.
- Không sửa `server/_core/` nếu chưa hiểu contract runtime của nó ([project-guide §13](docs/development/project-guide.md)).
- Giữ nguyên key `localStorage`, event ID, format export và shape cloud payload; đổi thì phải có migration và test ([project-guide §11](docs/development/project-guide.md)).
- Không commit secret, file `.env`, dữ liệu tài khoản hoặc artifact build ([CONTRIBUTING.md](CONTRIBUTING.md)).

## Task → tài liệu cần đọc

| Task | Đọc |
|---|---|
| Bắt đầu, cài đặt, chạy local | [README.md](README.md), [docs/development/project-guide.md](docs/development/project-guide.md) |
| Giao diện, token màu, primitive | [project-guide §2.2](docs/development/project-guide.md), [CONTRIBUTING.md](CONTRIBUTING.md) |
| Ranh giới feature, import | [project-guide §2.1](docs/development/project-guide.md), [docs/architecture/refactor-audit.md](docs/architecture/refactor-audit.md) |
| Bộ giải Rust/WASM | [project-guide §9](docs/development/project-guide.md), [docs/validation/rust-wasm-solver.md](docs/validation/rust-wasm-solver.md) |
| Tương phản, a11y | [docs/validation/contrast-report.md](docs/validation/contrast-report.md) |
| Database, migration, deploy | [project-guide §6, §7, §12](docs/development/project-guide.md) |
| Phòng thi (Rooms) | [project-guide §15](docs/development/project-guide.md) |
| Việc còn mở | [TODO.md](TODO.md) |
| Mục lục toàn bộ tài liệu | [docs/README.md](docs/README.md) |

## Quy ước cốt lõi

- Import barrel `@/features/<x>` chỉ dùng từ bên ngoài feature; bên trong dùng đường dẫn tương đối ([project-guide §2.1](docs/development/project-guide.md)).
- Import động Three.js/Cubing phải trỏ module cụ thể, không trỏ barrel; `e2e/lazy-3d-loading.spec.ts` khoá ranh giới chunk.
- Màu mới là CSS token (`--canvas`, `--surface`, `--ink`, `--muted`, `--primary`…) khai báo cho cả light và dark trong `client/src/index.css`, expose qua `@theme inline`; không hardcode hex trong TSX.
- Giao diện phẳng: không bóng, không viền, không `outline-none`; `server/flatUi.test.ts` chặn.
- Dùng primitive trong `client/src/components/ui/` (`Button`, `Input`, `Select`, `Dialog`…); `server/uiPrimitives.test.ts` chặn chuỗi class tự viết.
- i18n: `t("namespace.key")`, mỗi key đủ tiếng Việt và tiếng Anh, từ điển ở `client/src/lib/i18n/` (`client/src/lib/i18n/index.test.ts` kiểm).
- Câu server gửi cho người dùng phải có trong `shared/serverMessages.ts` (`server/serverMessages.test.ts` kiểm).
- Mọi backend call đi qua tRPC (`server/routers/`); không thêm fetch/Axios wrapper riêng ([project-guide §14](docs/development/project-guide.md)).

## Quy tắc bộ giải

- Invariant direct search: XCross..XXXXCross chỉ được ghi nhận khi một chuỗi trực tiếp từ trạng thái ban đầu đạt Cross và đủ slot mục tiêu cùng lúc ([project-guide §14](docs/development/project-guide.md)).
- Sửa Rust trong `packages/solver/` xong thì chạy `pnpm build:solver` để build lại `packages/solver/solver-wasm/pkg` (không commit thư mục này).
- Nâng phiên bản toolchain Rust thì đổi cùng lúc ở `.github/workflows/ci.yml`, `Dockerfile` và `packages/solver/Cargo.lock` ([project-guide §9](docs/development/project-guide.md)).

## Kiểm tra trước khi báo xong

```bash
pnpm check
pnpm test
pnpm test:e2e
pnpm build
```

Nếu sửa Rust, chạy thêm:

```bash
cd packages/solver
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```
