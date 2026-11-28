# Báo cáo tương phản màu — CFOP Solver Studio

Bài kiểm tra tự động: `server/contrast.test.ts` (Vitest, môi trường Node).

## Kết quả: mọi cặp đều đạt WCAG AA

Palette đã được **làm lại** (2026-11, chủ sản phẩm yêu cầu "căn chỉnh lại độ
tương phản của mọi thứ trong trang web"). Sau khi đo từng cặp trong cả hai chế
độ sáng và tối, mọi cặp trong bảng đều đạt ngưỡng **4.5:1** cho chữ và **3:1**
cho vòng focus / biểu tượng trạng thái.

### Bảng token — trước → sau

| Token | Sáng (trước) | Sáng (sau) | Tối (trước) | Tối (sau) |
|---|---|---|---|---|
| `--primary` | `#5b5bd6` | `#504fd3` | `#8585f6` | `#8585f6` |
| `--primary-hover` | `#4a4ac2` | `#3f3e9f` | `#9d9dff` | `#9d9dff` |
| `--muted` | `#5f6884` | `#59617f` | `#9aa5c2` | `#9aa5c2` |
| `--success` | `#0f9f6e` | `#0c7e57` | `#34d399` | `#34d399` |
| `--danger` | `#e11d48` | `#ce1b42` | `#fb7185` | `#fb7185` |
| `--warning` | `#d97706` | `#cd7006` | `#fbbf24` | `#fbbf24` |
| `--accent` | `#0891b2` | `#077894` | `#22d3ee` | `#22d3ee` |
| **token mới:** `--on-primary` | — | `#ffffff` | — | `#0b1020` |
| **token mới:** `--on-success` | — | `#ffffff` | — | `#0b1020` |
| **token mới:** `--on-danger` | — | `#ffffff` | — | `#0b1020` |
| **token mới:** `--on-warning` | — | `#10142a` | — | `#0b1020` |
| **token mới:** `--placeholder` | — | `#59617f` | — | `#9aa5c2` |

### Vì sao đổi

- **Chế độ tối dùng chữ sáng trên nền tím sáng** (`--primary` = `#8585f6`):
  chữ trắng trên nền đó chỉ đạt **3.14:1** — đây chính là nhóm lỗi
  `color-contrast` mà `@axe-core/playwright` báo 11 lần trên trang thật (nút
  chính, nhãn, tab). Chế độ tối giờ dùng **chữ tối** (`--on-primary` =
  `#0b1020`) trên nền tím sáng — đạt **6.03:1**.
- **Nút success / danger ở chế độ tối**: nền sáng (`#34d399`, `#fb7185`) với
  chữ trắng chỉ đạt **1.92:1** và **2.69:1**. Dùng chữ tối thay cho chữ trắng:
  **9.85:1** và **7.03:1**.
- **Chữ gợi ý trong ô nhập** (`placeholder:text-muted/60`): chỉ đạt **2.34:1**
  (sáng) / **3.02:1** (tối). Giờ dùng token `--placeholder` đậm hơn:
  **5.37:1** / **5.69:1** cho `surface-3`, **5.75:1** / **6.48:1** cho
  `surface-2`.
- **Chữ phụ ở chế độ sáng** (`--muted`): vệt sáng trang trí `bg-primary/10` /
  `bg-accent/10` trên nền trang làm nền nhạt đi (`#e5e6f7`, `#dce9f1`) khiến
  chữ phụ tụt xuống **4.47:1** và **4.33:1** — chỉ vài đơn vị màu nữa là
  trượt ngưỡng. `--muted` được đậm lên một nấc (`#5f6884` → `#59617f`):
  **6.10:1** trên thẻ, **5.61:1** trên nền trang, **5.75:1** trên surface-2,
  **5.37:1** trên surface-3, **4.86:1** trên vệt accent/10.
- **Nút / nhãn tím ở chế độ sáng**: `--primary` tối lại một nấc (`#5b5bd6` →
  `#504fd3`) để chữ tím trên vệt sáng trang trí đạt **4.99:1** thay vì
  **4.33:1**.

Token mới được nối vào `@theme inline` (`--color-on-primary` …) nên các class
`text-on-primary`, `text-on-success`, `text-on-danger`, `text-on-warning`,
`text-placeholder` hoạt động như mọi màu khác của Tailwind.

## Bảng số đo

Mọi cặp đều **đạt** (ngưỡng: 4.5:1 cho chữ, 3:1 cho vòng focus / biểu tượng).

| # | Cặp màu | Nguồn trong mã nguồn | Sáng | Tối | Ngưỡng |
|---|---|---|---:|---:|---:|
| 1 | `ink` trên `canvas` | body | 16.70 | 16.34 | 4.5 |
| 2 | `ink` trên `surface` | Card.tsx | 18.17 | 14.78 | 4.5 |
| 3 | `ink` trên `surface-2` | Button `soft` | 17.14 | 13.63 | 4.5 |
| 4 | `muted` trên `canvas` | `text-muted` trên `bg-canvas` | 5.61 | 7.77 | 4.5 |
| 5 | `muted` trên `surface` | Button `ghost` | 6.10 | 7.03 | 4.5 |
| 6 | `muted` trên `surface-2` | `PillGroup` | 5.75 | 6.48 | 4.5 |
| 7 | `on-primary` trên `primary` (nút chính) | Button `primary` | 6.18 | 6.03 | 4.5 |
| 8 | `ink` trên `surface` (nút phụ) | Button `secondary` | 18.17 | 14.78 | 4.5 |
| 9 | `ink` trên `surface-2` (nút soft) | Button `soft` | 17.14 | 13.63 | 4.5 |
| 10 | `primary` trên `surface` (nút outline) | Button `outline` | 6.18 | 5.51 | 4.5 |
| 11 | `primary` trên `canvas` (nút outline) | Button `outline` trên nền trang | 5.68 | 6.08 | 4.5 |
| 12 | `muted` trên `surface` (nút ghost) | Button `ghost` | 6.10 | 7.03 | 4.5 |
| 13 | `muted` trên `canvas` (nút ghost) | Button `ghost` trên nền trang | 5.61 | 7.77 | 4.5 |
| 14 | `danger` trên `surface` (nút danger) | Button `danger` | 5.44 | 6.43 | 4.5 |
| 15 | `danger` trên `canvas` (nút danger) | Button `danger` trên nền trang | 5.00 | 7.10 | 4.5 |
| 16 | `on-danger` trên `danger` (nút dangerSolid) | Button `dangerSolid` | 5.44 | 7.03 | 4.5 |
| 17 | `success` trên `surface` (nút success) | Button `success` | 5.08 | 9.00 | 4.5 |
| 18 | `success` trên `canvas` (nút success) | Button `success` trên nền trang | 4.66 | 9.95 | 4.5 |
| 19 | `on-success` trên `success` (nút xanh đặc) | `bg-success text-on-success` | 5.08 | 9.85 | 4.5 |
| 20 | `on-warning` trên `warning` (nút warning) | Button `warning` | 5.12 | 11.34 | 4.5 |
| 21 | `surface` trên `ink` (nút inverse) | Button `inverse` | 18.17 | 14.78 | 4.5 |
| 22 | `primary` trên `surface` (nút link) | Button `link` | 6.18 | 5.51 | 4.5 |
| 23 | `primary` trên `canvas` (nút link) | Button `link` trên nền trang | 5.68 | 6.08 | 4.5 |
| 24 | `primary` trên `primary-soft` | IconBox | 5.35 | 4.67 | 4.5 |
| 25 | `accent` trên `accent-soft` | IconBox | 4.66 | 7.80 | 4.5 |
| 26 | `ink` trên `surface-3` (chữ trong ô nhập) | FormControls | 15.99 | 11.97 | 4.5 |
| 27 | `placeholder` trên `surface-3` (chữ gợi ý) | FormControls | 5.37 | 5.69 | 4.5 |
| 28 | `ink` trên `surface-2` (PillInput) | DesignSystem | 17.14 | 13.63 | 4.5 |
| 29 | `placeholder` trên `surface-2` (chữ gợi ý) | DesignSystem | 5.75 | 6.48 | 4.5 |
| 30 | `primary` trên `canvas` (vòng focus) | `:focus-visible` | 5.68 | 6.08 | 3 |
| 31 | `primary` trên `surface` (vòng focus) | như trên | 6.18 | 5.51 | 3 |
| 32 | `primary` trên `surface-2` (vòng focus) | như trên | 5.82 | 5.08 | 3 |
| 33 | `primary` trên `surface-3` (vòng focus) | như trên | 5.44 | 4.46 | 3 |
| 34 | `success` trên `success-soft` (biểu tượng) | Banner | 4.61 | 7.51 | 3 |
| 35 | `warning` trên `warning-soft` (biểu tượng) | Banner | 3.31 | 8.68 | 3 |

## Giới hạn của bài kiểm tra

- **Độ trong suốt**: phép đo chuẩn **bỏ qua alpha** (yêu cầu C5 của đề bài
  vòng 7): `muted/60` được tính như `muted`. Mọi màu chữ trong app giờ đều là
  màu đặc, nên giới hạn này không còn che giấu lỗi nào — phép đo có alpha
  (`measureWithAlpha`) vẫn được giữ lại để kiểm tra các lớp phủ trong tương
  lai. Kiểm tra trên trình duyệt thật (`e2e/contrast-a11y.spec.ts`,
  `@axe-core/playwright`) là lớp kiểm tra độc lập, đo trực tiếp trên DOM sau
  khi render.
- **Gradient, ảnh nền, hình ảnh**: không tính.
- **Font thực tế** không được mô phỏng (độ đậm, khoảng cách chữ).
- **Trạng thái hover/focus/disabled** chỉ đo ở trạng thái nền.
- **Kiểm tra trên trình duyệt thật** (`e2e/contrast-a11y.spec.ts`,
  `@axe-core/playwright`) phát hiện thêm các vi phạm không phải token
  (ví dụ lỗi gán tên truy cập) mà bài này không thấy. Hiện tại: **0** vi phạm
  tương phản; còn lại 16 lỗi không liên quan màu (`label-content-name-mismatch`,
  `aria-prohibited-attr`) được liệt kê trong
  `e2e/contrast-a11y.baseline.json`, không tự sửa.

## Cách bài kiểm tra bảo vệ palette

`server/contrast.test.ts` (9 test):

1. đọc được token của cả hai chế độ;
2. **mọi cặp trong bảng phải đạt ngưỡng** — đổi màu làm tụt một cặp thì test
   đỏ, và thông báo nêu đúng cặp, chế độ, tỉ lệ và ngưỡng;
3–5. cơ chế `KNOWN_FAILURES` để ghi nhận cặp chưa đạt (hiện đang **rỗng**);
6. **chữ gợi ý đạt chuẩn ở cả hai chế độ** (regression cho lỗi placeholder);
7–9. in bảng tương phản đầy đủ và các cặp tham khảo.

## Palette trước → sau (chế độ sáng)

- `--primary` `#5b5bd6` → `#504fd3` — chữ tím trên vệt sáng trang trí
  `#dce9f1` đạt 4.33 → **4.99:1**;
- `--primary-hover` `#4a4ac2` → `#3f3e9f`;
- `--muted` `#5f6884` → `#59617f` — chữ phụ trên vệt sáng trang trí đạt
  4.47 → **4.93:1**;
- `--success` `#0f9f6e` → `#0c7e57` — nút xanh đặc 3.38 → **5.08:1**;
- `--danger` `#e11d48` → `#ce1b42` — nút danger trên nền trang 4.32 → **5.00:1**;
- `--warning` `#d97706` → `#cd7006` — biểu tượng hổ phách 2.97 → **3.31:1**;
- `--accent` `#0891b2` → `#077894` — nhãn accent 3.37 → **4.66:1**;
- `placeholder:text-muted/60` → token `--placeholder` `#59617f` đặc:
  2.34 → **5.37:1**;
- nút / nhãn đặc ở chế độ tối đổi sang token `--on-primary` / `--on-success`
  / `--on-danger` / `--on-warning` (chữ tối trên nền sáng):
  3.14 → **6.03:1**, 1.92 → **9.85:1**, 2.69 → **7.03:1**, 1.43 → **11.34:1**.

`e2e/contrast-a11y.baseline.json` sau khi cập nhật chỉ còn **16** phát hiện
thuộc nhóm không liên quan màu (`label-content-name-mismatch` × 12,
`aria-prohibited-attr` × 4) — **không còn vi phạm tương phản nào**; mọi vi
phạm tương phản trước đây (nút chính, nhãn, placeholder, ô nhập…) đã được sửa
tận gốc bằng palette.

## Màu do người dùng chọn (Cài đặt → Giao diện)

Người dùng chọn preset hoặc hai màu gốc (chủ đạo, nhấn). Chỉ các token
`primary`, `primary-hover`, `primary-soft`, `on-primary`, `accent`,
`accent-soft`, `chart-1`, `chart-2` bị ghi đè (inline style trên `<html>`);
nền, chữ và màu trạng thái giữ nguyên.

- Lõi tính màu: `client/src/lib/colorScale.ts` (OKLCH). Với mỗi chế độ, màu chủ
  đạo/nhấn được dời độ sáng từ màu gốc cho đến khi đạt **4.5:1** trên mọi nền
  (`canvas`, `surface`, `surface-2`, `surface-3`, `menu-hover`) và trên nền
  `-soft` của chính nó; chữ trên nút chính là trắng (sáng) hoặc tối (tối).
- Lưu trữ: key `cfop-theme-colors` (không đổi `cfop-theme`). Preset mặc định
  không lưu gì. Script trong `client/index.html` dùng bản token đã tính để
  tránh nháy; ứng dụng luôn tính lại từ màu gốc khi tải.
- Kiểm thử: `client/src/lib/colorScale.test.ts` (quét hue × độ sáng, cả hai chế
  độ), `client/src/lib/themeColors.test.ts`, `server/themeColors.test.ts`
  (bề mặt dùng để tính phải khớp `index.css`).
- Ngoài phạm vi: nền, tông nền, từng token riêng lẻ, màu trạng thái, `--export-*`
  và màu mặt khối (pha 2).
