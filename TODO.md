# TODO

Danh sách công việc **còn mở**. Các mục đã hoàn thành được liệt kê ở cuối
file; những ghi chú nghiên cứu cũ nằm trong `docs/archive/`.

## Việc còn mở

- [ ] Kiểm tra bằng mắt trên trình duyệt thật cho các trang đã thiết kế lại:
      xem lại bố cục, khoảng cách, độ tương phản và hành vi trên màn hình
      nhỏ lẫn màn hình lớn. *(Đã rà tự động bằng ảnh chụp ở 1440px và đã sửa
      những điểm không đều: cube trang trí che nút, tiêu đề trang thiếu ở Lịch
      sử/Phòng thi, biểu đồ quá cao, ô số liệu xếp dọc, tương phản chữ trên
      nền tím. Vẫn cần người xem bằng mắt trên thiết bị thật, và ở kích thước
      điện thoại thật.)*

## Đã hoàn thành

- Tailwind CSS migration (A0)
- A1–A5: Bảo mật & vận hành (errorFormatter, giới hạn body, Docker, health check, headers/cache)
- B1–B5: Toàn vẹn dữ liệu (multi-session, competition integrity, cloud sync tombstones, WCA, avatar storage)
- C1: Giới hạn thời gian solver
- C2: Tách worker solve/validate
- C3: BLDDB ghim theo commit SHA + cache offline (Cache API), bộ giải đóng gói cùng ứng dụng để chạy offline
- D1: Gỡ dependency không dùng + thống nhất pnpm (đã làm lại sau merge Dependabot #23)
- D2: Dọn thành phần Manus khỏi build production
- D3: Tài liệu (FEATURES.md, TODO.md, THIRD_PARTY_NOTICES.md, README.md, README.en.md)
- D4: CI/e2e (audit, Playwright Chromium, kịch bản e2e mới, checklist chủ repo)
- D5: Ảnh chụp màn hình thật cho README (`docs/screenshots/`, script `pnpm screenshots`)
- E1: Bộ giải viết lại bằng Rust/WebAssembly (`packages/solver`): Cross, F2L,
  OLL/PLL, XCross..XXXXCross, ZBLL/1LLL, BLD 3-Style; Docker đa tầng và CI
  cho Rust; gỡ runtime cũ (xem `docs/validation/rust-wasm-solver.md`)
- Phòng thi: ngưỡng thời gian cứng theo từng thể thức (`HARD_MIN_MS` trong `server/services/competitionIntegrity.ts`), kết quả giữa ngưỡng cứng và ngưỡng gắn cờ chỉ bị gắn cờ `too_fast`
