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
- Giao diện dùng Bootstrap 5 và Bootstrap Icons; không thêm custom CSS khi Bootstrap hoặc primitive dùng chung đã đáp ứng được nhu cầu.
- UI mới phải hỗ trợ tiếng Việt và tiếng Anh qua `client/src/lib/i18n/`.
- Màu mới phải dùng CSS token `--cfop-*` cho cả light và dark theme.
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
