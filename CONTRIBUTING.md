# Đóng góp cho CFOP Solver Studio

Cảm ơn bạn muốn cải thiện CFOP Solver Studio. Bạn có thể đóng góp bằng code, test, tài liệu, bản dịch, báo lỗi hoặc đề xuất UX.

## Quy trình đề xuất

1. Tìm Issue hiện có hoặc mở Issue mới trước khi làm thay đổi lớn.
2. Fork repository và tạo branch ngắn, ví dụ `feat/rooms-rematch` hoặc `fix/timer-scramble`.
3. Giữ thay đổi tập trung; tránh trộn refactor không liên quan vào cùng Pull Request.
4. Chạy các kiểm tra phù hợp trước khi push:

   ```bash
   pnpm check
   pnpm test --run
   pnpm test:e2e
   pnpm build
   ```

5. Mở Pull Request, mô tả vấn đề, cách sửa, các route/feature bị ảnh hưởng và kết quả kiểm thử.

## Quy ước code

- TypeScript strict; ưu tiên module theo feature trong `client/src/features/`.
- Giao diện dùng **Tailwind CSS 4** và các primitive trong
  `client/src/components/ui/`. Không thêm custom CSS khi utility Tailwind hoặc
  primitive dùng chung đã đáp ứng được nhu cầu.
- **Không dùng class của Bootstrap.** Repo đã bỏ hẳn Bootstrap, nên các class
  như `card`, `col-lg-4`, `row`, `btn btn-primary`, `d-flex`, `form-control`,
  `text-muted` hay `rounded-pill` không tồn tại và sẽ **không có tác dụng
  gì** — giao diện sẽ hỏng mà không báo lỗi. Dùng utility Tailwind tương đương
  (`rounded-card`, `lg:col-span-4`, `grid`, `flex`, `text-sm`, `rounded-full`).
  Lệnh `node scripts/audit-bootstrap-classes.mjs` liệt kê class Bootstrap còn
  sót; `server/tailwindLayout.test.ts` chặn chúng quay lại.
- UI mới phải hỗ trợ tiếng Việt và tiếng Anh qua `client/src/lib/i18n/`.
- Màu mới phải dùng CSS token của theme (`--canvas`, `--surface`, `--ink`,
  `--muted`, `--line`, `--primary`, `--success`, `--warning`, `--danger`,
  `--info` và các biến `-soft`/`-hover` tương ứng) cho cả light và dark theme;
  khai báo trong `client/src/index.css` và expose qua `@theme inline`.
- Cỡ chữ theo vùng chứa phải dùng **container query** (`@container` + `cqw`),
  không dùng `vw`: đặt trong một cột hẹp thì `vw` làm chữ tràn ra ngoài.
- Không import Three.js/Cubing vào chunk eager; giữ các module 3D trong dynamic import.
- Form control phải có label hoặc accessible name; không dùng `window.alert`/`window.confirm`.
- Không commit secret, file `.env`, dữ liệu tài khoản hoặc artifact build.

## Issue và Pull Request

Dùng template tương ứng trong GitHub. Với bug, cung cấp bước tái hiện, event Rubik, trình duyệt/hệ điều hành và log đã ẩn thông tin nhạy cảm. Với feature, giải thích người dùng nào được hưởng lợi và vì sao cách tiếp cận đề xuất phù hợp.

PR có thể được yêu cầu cập nhật test, tài liệu, bản dịch hoặc accessibility trước khi merge. Maintainer sẽ review tính đúng đắn, phạm vi thay đổi, hiệu năng và khả năng bảo trì.

## Database local

Dùng MariaDB trong Docker Compose để môi trường macOS và Windows nhất quán:

```bash
pnpm db:setup
pnpm db:stop
pnpm db:reset
```

Không chạy migration hoặc script có thao tác ghi trên database production để kiểm thử.

## Code of Conduct

Mọi đóng góp phải tuân theo [Code of Conduct](CODE_OF_CONDUCT.md). Hành vi quấy rối, phân biệt đối xử, công kích cá nhân hoặc tiết lộ dữ liệu riêng tư không được chấp nhận.
