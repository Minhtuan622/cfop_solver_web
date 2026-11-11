# TODO

Danh sách công việc còn mở (các mục đã hoàn thành được lưu vào `docs/archive/`).

## Đang xem xét

- [ ] C3: Đóng gói Pyodide vào `public/` để chạy offline (tùy chọn)
- [ ] D5: Ảnh chụp màn hình thật cho README (`docs/screenshots/`) — cần chạy app
      trên máy có dữ liệu mẫu

## Đã hoàn thành

- Tailwind CSS migration (A0)
- A1–A5: Bảo mật & vận hành (errorFormatter, giới hạn body, Docker, health check, headers/cache)
- B1–B5: Toàn vẹn dữ liệu (multi-session, competition integrity, cloud sync tombstones, WCA, avatar storage)
- C1: Giới hạn thời gian solver + pytest
- C2: Tách worker solve/validate
- C3: BLDDB ghim theo commit SHA + cache offline (Cache API)
- D1: Gỡ dependency không dùng + thống nhất pnpm (đã làm lại sau merge Dependabot #23)
- D2: Dọn thành phần Manus khỏi build production
- D3: Tài liệu (FEATURES.md, TODO.md, THIRD_PARTY_NOTICES.md, README.md, README.en.md)
- D4: CI/e2e (pytest, embed-solver drift check, audit, Playwright Chromium, kịch bản e2e mới, checklist chủ repo)
