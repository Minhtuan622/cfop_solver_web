# Báo cáo tương phản màu — CFOP Solver Studio

Bài kiểm tra tự động: `server/contrast.test.ts` (Vitest, môi trường Node).

## Giới hạn của bài kiểm tra

Bài này **chỉ kiểm tra token màu** khai báo trong `client/src/index.css`
(`:root, [data-theme="light"]` và `[data-theme="dark"]`) và các tổ hợp class
thật sự dùng trong `client/src/components/ui/`. Những điều sau **chưa** được
tính:

- **Độ trong suốt nhiều lớp**: token có alpha (`muted/60`) được phủ lên đúng
  nền của cặp đó, nhưng các lớp chồng nhiều lớp, `color-mix`, `backdrop-filter`
  hay vùng gradient chưa được mô phỏng.
- **Gradient, ảnh nền, hình ảnh và video** làm nền: không tính.
- **Font thực tế**: tỉ lệ tính theo màu, không theo độ đậm của chữ, độ mờ của
  chữ mờ (`text-muted/60` được tính như một màu đục sau khi phủ) hay khoảng
  cách chữ.
- **Trạng thái hover/focus/disabled** chỉ được đo ở trạng thái nền.
- **Chưa phải thay thế cho kiểm tra bằng công cụ trên trình duyệt thật**
  (ví dụ `@axe-core/playwright`): bài này không biết phần tử nào thực sự đứng
  trên nền nào, có lớp phủ nào hay nằm trong vùng cuộn.

## Cách đo

- Công thức tỉ lệ tương phản của WCAG 2.x:
  `(L1 + 0.05) / (L2 + 0.05)`, với `L` là độ chói tương đối
  (`0.2126 R + 0.7152 G + 0.0722 B`, kênh đã linearize theo sRGB).
- Ngưỡng: **4.5:1** cho chữ (WCAG 1.4.3), **3:1** cho vòng focus và biểu tượng
  trạng thái (WCAG 1.4.11).
- Màu được đọc trực tiếp từ file CSS, quy đổi về sRGB bằng bộ quy đổi tự
  viết trong bài kiểm tra — **không thêm dependency mới**.
- Chạy lại bảng này bằng:
  ```bash
  pnpm exec vitest run server/contrast.test.ts --reporter=verbose --disable-console-intercept
  ```

## Bảng số đo

| # | Cặp màu | Nguồn trong mã nguồn | Chế độ sáng | Chế độ tối | Ngưỡng | Sáng | Tối |
|---|---|---|---:|---:|---:|---|---|
| 1 | `ink` trên `canvas` | body (`text-ink` trên `bg-canvas`) | 16.70 | 16.34 | 4.5 | đạt | đạt |
| 2 | `ink` trên `surface` | `Card.tsx` (`bg-surface`) | 18.17 | 14.78 | 4.5 | đạt | đạt |
| 3 | `ink` trên `surface-2` | `Button.tsx` variant `soft` | 17.14 | 13.63 | 4.5 | đạt | đạt |
| 4 | `muted` trên `canvas` | `text-muted` trên `bg-canvas` | 5.08 | 7.77 | 4.5 | đạt | đạt |
| 5 | `muted` trên `surface` | `Button.tsx` variant `ghost` | 5.53 | 7.03 | 4.5 | đạt | đạt |
| 6 | `muted` trên `surface-2` | `DesignSystem.tsx` `PillGroup` | 5.21 | 6.48 | 4.5 | đạt | đạt |
| 7 | trắng trên `primary` (nút chính) | `Button.tsx` variant `primary` | 5.37 | **3.14** | 4.5 | đạt | **KHÔNG ĐẠT** |
| 8 | `ink` trên `surface` (nút phụ) | `Button.tsx` variant `secondary` | 18.17 | 14.78 | 4.5 | đạt | đạt |
| 9 | `ink` trên `surface-2` (nút soft) | `Button.tsx` variant `soft` | 17.14 | 13.63 | 4.5 | đạt | đạt |
| 10 | `primary` trên `surface` (nút outline) | `Button.tsx` variant `outline` | 5.37 | 5.51 | 4.5 | đạt | đạt |
| 11 | `primary` trên `canvas` (nút outline) | `Button.tsx` variant `outline` trên nền trang | 4.93 | 6.08 | 4.5 | đạt | đạt |
| 12 | `muted` trên `surface` (nút ghost) | `Button.tsx` variant `ghost` | 5.53 | 7.03 | 4.5 | đạt | đạt |
| 13 | `muted` trên `canvas` (nút ghost) | `Button.tsx` variant `ghost` trên nền trang | 5.08 | 7.77 | 4.5 | đạt | đạt |
| 14 | `danger` trên `surface` (nút danger) | `Button.tsx` variant `danger` | 4.70 | 6.43 | 4.5 | đạt | đạt |
| 15 | `danger` trên `canvas` (nút danger) | `Button.tsx` variant `danger` trên nền trang | **4.32** | 7.10 | 4.5 | **KHÔNG ĐẠT** | đạt |
| 16 | trắng trên `danger` (nút dangerSolid) | `Button.tsx` variant `dangerSolid` | 4.70 | **2.69** | 4.5 | đạt | **KHÔNG ĐẠT** |
| 17 | `success` trên `surface` (nút success) | `Button.tsx` variant `success` | **3.38** | 9.00 | 4.5 | **KHÔNG ĐẠT** | đạt |
| 18 | `success` trên `canvas` (nút success) | `Button.tsx` variant `success` trên nền trang | **3.11** | 9.95 | 4.5 | **KHÔNG ĐẠT** | đạt |
| 19 | trắng trên `success` (nút xanh đặc) | `bg-success text-white` (`Rooms.tsx`, `TimerLab.tsx`, `Profile.tsx`) | **3.38** | **1.92** | 4.5 | **KHÔNG ĐẠT** | **KHÔNG ĐẠT** |
| 20 | `ink` trên `warning` (nút warning) | `Button.tsx` variant `warning` | 5.70 | **1.43** | 4.5 | đạt | **KHÔNG ĐẠT** |
| 21 | `surface` trên `ink` (nút inverse) | `Button.tsx` variant `inverse` | 18.17 | 14.78 | 4.5 | đạt | đạt |
| 22 | `primary` trên `surface` (nút link) | `Button.tsx` variant `link` | 5.37 | 5.51 | 4.5 | đạt | đạt |
| 23 | `primary` trên `canvas` (nút link) | `Button.tsx` variant `link` trên nền trang | 4.93 | 6.08 | 4.5 | đạt | đạt |
| 24 | `primary` trên `primary-soft` | `DesignSystem.tsx` `IconBox` / `EyebrowPill` | 4.65 | 4.67 | 4.5 | đạt | đạt |
| 25 | `accent` trên `accent-soft` | token `--accent` / `--accent-soft` (chưa dùng cho chữ nào) | **3.37** | 7.80 | 4.5 | **KHÔNG ĐẠT** | đạt |
| 26 | `ink` trên `surface-3` (chữ trong ô nhập) | `FormControls.tsx` `controlBase` | 15.99 | 11.97 | 4.5 | đạt | đạt |
| 27 | `muted` 60% trên `surface-3` (chữ gợi ý) | `FormControls.tsx` `placeholder:text-muted/60` | **2.34** | **3.02** | 4.5 | **KHÔNG ĐẠT** | **KHÔNG ĐẠT** |
| 28 | `ink` trên `surface-2` (chữ trong PillInput) | `DesignSystem.tsx` `PillInput` | 17.14 | 13.63 | 4.5 | đạt | đạt |
| 29 | `muted` 60% trên `surface-2` (chữ gợi ý) | `DesignSystem.tsx` `PillInput` | **2.41** | **3.24** | 4.5 | **KHÔNG ĐẠT** | **KHÔNG ĐẠT** |
| 30 | `primary` trên `canvas` (vòng focus) | `index.css` — `:focus-visible { outline: 2px solid var(--primary) }` | 4.93 | 6.08 | 3 | đạt | đạt |
| 31 | `primary` trên `surface` (vòng focus) | như trên | 5.37 | 5.51 | 3 | đạt | đạt |
| 32 | `primary` trên `surface-2` (vòng focus) | như trên | 5.06 | 5.08 | 3 | đạt | đạt |
| 33 | `primary` trên `surface-3` (vòng focus) | như trên | 4.72 | 4.46 | 3 | đạt | đạt |
| 34 | `success` trên `success-soft` (biểu tượng) | `DesignSystem.tsx` `Banner` (`[&>svg]:text-success`) | 3.08 | 7.51 | 3 | đạt | đạt |
| 35 | `warning` trên `warning-soft` (biểu tượng) | `DesignSystem.tsx` `Banner` (`[&>svg]:text-warning`) | **2.97** | 8.68 | 3 | **KHÔNG ĐẠT** | đạt |

## Cặp KHÔNG đạt — danh sách cho chủ sản phẩm quyết định

Bài kiểm tra **không đổi màu**. Các cặp dưới đây nằm trong `KNOWN_FAILURES`
của `server/contrast.test.ts` kèm lý do và số đo hiện tại, nên **CI vẫn xanh**.
Khi palette được sửa, phải cập nhật lại danh sách đó (và bài kiểm tra sẽ FAIL
nếu một cặp đã đạt mà chưa được gỡ).

| # | Cặp | Chế độ | Tỉ lệ | Ngưỡng | Thiếu | Nơi xuất hiện |
|---|---|---|---:|---:|---:|---|
| 1 | `ink` trên `warning` (nút warning) | tối | 1.43 | 4.5 | −3.07 | `Button.tsx` variant `warning` (`bg-warning text-ink`) |
| 2 | trắng trên `success` (nút xanh đặc) | tối | 1.92 | 4.5 | −2.58 | `bg-success text-white` trong `Rooms.tsx`, `TimerLab.tsx`, `Profile.tsx` |
| 3 | trắng trên `danger` (nút dangerSolid) | tối | 2.69 | 4.5 | −1.81 | `Button.tsx` variant `dangerSolid` |
| 4 | trắng trên `primary` (nút chính) | tối | 3.14 | 4.5 | −1.36 | `Button.tsx` variant `primary` |
| 5 | `muted` 60% trên `surface-3` (chữ gợi ý) | sáng | 2.34 | 4.5 | −2.16 | `FormControls.tsx` `placeholder:text-muted/60` |
| 6 | `muted` 60% trên `surface-3` (chữ gợi ý) | tối | 3.02 | 4.5 | −1.48 | như trên |
| 7 | `muted` 60% trên `surface-2` (chữ gợi ý) | sáng | 2.41 | 4.5 | −2.09 | `DesignSystem.tsx` `PillInput` |
| 8 | `muted` 60% trên `surface-2` (chữ gợi ý) | tối | 3.24 | 4.5 | −1.26 | như trên |
| 9 | `success` trên `surface` (nút success) | sáng | 3.38 | 4.5 | −1.12 | `Button.tsx` variant `success` |
| 10 | `success` trên `canvas` (nút success) | sáng | 3.11 | 4.5 | −1.39 | như trên |
| 11 | trắng trên `success` (nút xanh đặc) | sáng | 3.38 | 4.5 | −1.12 | `bg-success text-white` |
| 12 | `accent` trên `accent-soft` | sáng | 3.37 | 4.5 | −1.13 | token chưa dùng cho chữ nào — theo dõi trước khi dùng |
| 13 | `danger` trên `canvas` (nút danger) | sáng | 4.32 | 4.5 | −0.18 | `Button.tsx` variant `danger` trên nền trang |
| 14 | `warning` trên `warning-soft` (biểu tượng) | sáng | 2.97 | 3 | −0.03 | `DesignSystem.tsx` `Banner` |

### Nhận xét cho chủ sản phẩm

- **"Chữ trên nền tím"** — lỗi từng được sửa ở chế độ **sáng** (5.37:1) nhưng
  chế độ **tối** vẫn chỉ đạt **3.14:1**: `--primary` tối là `#8585f6` (màu tím
  nhạt) nên chữ trắng trên đó không đủ tương phản. Đổi `--primary` tối sang
  tím đậm hơn sẽ sửa cả nút chính lẫn các nhãn tím khác — nhưng cũng làm
  nhãn tím trên nền tối tối đi, nên cần cân.
- **Nút trạng thái ở chế độ tối** (`success` đặc, `danger` đặc, `warning`) là
  nhóm lỗi nặng nhất: 1.43:1 – 2.69:1. Nguyên nhân chung là các token trạng
  thái ở chế độ tối được chọn làm **màu chữ trên nền tối** (chúng đủ tương
  phản với nền tối) nhưng lại được dùng làm **nền nút** với chữ trắng.
  Trong chế độ tối, các nền nút đặc này nên dùng màu đậm hơn hoặc chuyển sang
  nền mềm + chữ màu.
- **Chữ gợi ý** (`placeholder:text-muted/60`) là lỗi duy nhất ở **cả hai** chế
  độ: 2.34:1 (sáng) và 3.02:1 (tối). Bỏ hết độ trong suốt (`muted` thay cho
  `muted/60`) sẽ đưa cặp này lên 5.53:1 / 7.03:1 — đây là cách sửa ít ảnh
  hưởng giao diện nhất.
- **Biểu tượng hổ phách** trên nền `warning-soft` thiếu 0.03:1 so với ngưỡng
  3:1 — gần như đạt.

## Cặp chỉ để tham khảo (không làm test fail)

Giao diện phẳng đã bỏ đường viền, nên ranh giới giữa các khối chỉ còn nhờ
nền. Các tỉ lệ rất thấp ở đây là **hệ quả của thiết kế phẳng**, không phải
lỗi — nhưng chủ sản phẩm cần số liệu này để quyết định.

| Cặp | Chế độ sáng | Chế độ tối | Ghi chú |
|---|---:|---:|---|
| nền ô nhập (`surface-3`) so với nền thẻ chứa nó (`surface`) | 1.14 | 1.24 | Ô nhập chỉ nổi lên nhờ nền, không có viền. |
| nền `surface-2` so với nền trang (`canvas`) | 1.03 | 1.20 | Khối trên nền trang gần như không khác nền. |
| hào focus mờ (`primary` 20%) trên nền trang | 1.31 | 1.32 | Xem ghi chú bên dưới. |
| hào focus mờ (`primary` 20%) trên nền thẻ | 1.32 | 1.35 | |
| hào focus mờ (`primary` 20%) trên nền `surface-2` | 1.31 | 1.36 | |
| hào focus mờ (`primary` 20%) trên nền `surface-3` | 1.30 | 1.35 | |

### Ghi chú về vòng focus

Bài kiểm tra đo vòng focus **đặc** (`--primary`), vì đó là chỉ dẫn tiếp cận
được khai báo trong `client/src/index.css`:
`:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }`.

Nhưng phần lớn nút và ô nhập lại thêm class `outline-none` (Tailwind) — lớp
`utilities` đứng sau lớp `base` nên `outline-style: none` **thắng** — rồi dùng
`focus-visible:ring-4 focus-visible:ring-primary/20`, tức là chỉ còn lại một
**hào mờ 20%** với tỉ lệ ~1.3:1. Với các phần tử đó, chỉ dẫn tiếp cận hiện tại
không đạt ngưỡng 3:1.

Đây là vấn đề **cấp phần tử** (cascade của CSS), không phải vấn đề token màu
nên bài kiểm tra token **không assert** vào đó — chỉ in ra số đo. Muốn xác
nhận chắc chắn thì cần chạy công cụ kiểm tra trên trình duyệt thật.

## Cách bài kiểm tra bảo vệ palette

`server/contrast.test.ts` (7 test):

1. đọc được token của cả hai chế độ;
2. **mọi cặp đang đạt phải tiếp tục đạt** — đổi màu làm tụt một cặp thì test đỏ,
   và thông báo lỗi nêu đúng cặp, chế độ, tỉ lệ và ngưỡng;
3. **mọi cặp trong `KNOWN_FAILURES` vẫn phải chưa đạt** — nếu một cặp đã đạt mà
   chưa được gỡ khỏi danh sách thì test đỏ, để danh sách luôn trung thực;
4. số đo ghi trong `KNOWN_FAILURES` phải khớp palette hiện tại (sai số 0.05);
5. mọi mục trong `KNOWN_FAILURES` phải tồn tại và có lý do;
6. in bảng tương phản đầy đủ;
7. in các cặp chỉ để tham khảo.
