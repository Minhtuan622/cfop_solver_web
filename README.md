# CFOP Solver Studio

Ứng dụng web mã nguồn mở cho giải, luyện tập, bấm giờ và thi đấu Rubik trực tuyến.

[![CI](https://github.com/Minhtuan622/cfop_solver_web/actions/workflows/ci.yml/badge.svg)](https://github.com/Minhtuan622/cfop_solver_web/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Tính năng chính

- Solver CFOP/BLD với nhập scramble, trạng thái sáu mặt, báo cáo theo phase và CubeNet/3D.
- Timer đa event với inspection, +2/DNF, split, replay, history và thống kê.
- Study cho Last Layer và 3-Style BLD.
- Tài khoản, đồng bộ dữ liệu, WCA, phòng thi đấu và bảng xếp hạng.

## Chạy local nhanh

Yêu cầu Node.js 22+, pnpm 10+, Docker và Git.

```bash
git clone https://github.com/Minhtuan622/cfop_solver_web.git
cd cfop_solver_web
pnpm install
pnpm db:setup
pnpm dev
```

Mở `http://localhost:3000`. Database local chạy qua MariaDB trong Docker Compose; xem [hướng dẫn phát triển](docs/development/project-guide.md) nếu cần cấu hình tài khoản, WCA hoặc production.

## Kiểm tra trước khi mở Pull Request

```bash
pnpm check
pnpm test --run
pnpm test:e2e
pnpm build
```

## Tài liệu

- [Mục lục tài liệu](docs/README.md)
- [Hướng dẫn phát triển chi tiết](docs/development/project-guide.md)
- [Đóng góp cho dự án](CONTRIBUTING.md)
- [Quy tắc cộng đồng](CODE_OF_CONDUCT.md)
- [Báo cáo lỗ hổng bảo mật](SECURITY.md)

Source Python của solver nằm tại [`solver-python/cfop_solver`](solver-python/cfop_solver). Sau khi chỉnh sửa source, chạy `pnpm run embed-solver` để tái tạo bundle Pyodide được dùng trong trình duyệt; không chỉnh sửa thủ công `client/src/lib/embeddedSolver.ts`.

## Đóng góp

Issue, tài liệu, kiểm thử và Pull Request đều được chào đón. Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) trước khi bắt đầu.

## License

[MIT](LICENSE)
