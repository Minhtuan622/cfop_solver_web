# Bộ giải và mô hình 3D của Square-1

Tài liệu này ghi cách Square-1 được mô hình hoá, bộ giải ba pha và mô hình 3D.
Mã nằm ở:

- `client/src/lib/squareOneModel.ts`: trạng thái và các nước đi (dùng chung cho bộ giải và 3D).
- `client/src/features/puzzle-solver/lib/squareOneSolver.ts`, `squareOneParity.ts`, `squareOneEngine.ts`, `squareOneWorker.ts`: bộ giải.
- `client/src/features/puzzle-3d/lib/squareOneGeometry.ts`, `squareOneScene.ts` và `components/SquareOneCanvas.tsx`: mô hình 3D.

## Trạng thái

Trạng thái là bản sắp xếp 24 wedge giống kpuzzle `square1` của `cubing`:
ô 0-11 là tầng trên, ô 12-23 là tầng dưới. `(a,b)` xoay tầng trên `a` ô, tầng dưới `b` ô
(ô `i` nhận mảnh ở ô `i - a`); `/` đổi ô 6-11 với ô 12-17. Bước kiểm tra `canSlice`: lát cắt
không được nằm giữa hai nửa của một góc, tức bit "nửa đầu của góc" ở ô 5 và 11 phải tắt.

Tầng trên lúc giải đọc *góc, góc, cạnh, góc, góc, cạnh…*, tầng dưới đọc *cạnh, góc, góc, …*
(hai tầng đánh số ngược chiều nhau để khớp thành một khối lập phương). Quy ước này được suy
ra từ scramble chính thức của `cubing/scramble` (cả 15 scramble mẫu đều hợp lệ, mọi cách đặt
khác đều sai) và được khoá bằng `squareOneModel.test.ts`, kể cả việc so với kpuzzle.

`EQUATOR.orientation[1]` của kpuzzle chỉ là độ chẵn lẻ số lần `/`; bộ giải nhận nó qua
`equatorFlipped` và chọn số lần `/` có cùng độ chẵn lẻ.

## Bộ giải ba pha

Mỗi pha dùng một bảng tra tính trước (khoảng 1 giây, dựng lười trong Web Worker ở lần giải đầu):

1. **Cube Shape.** Bảng khoảng cách (số lần `/`) đến "hai tầng đều là vòng cạnh-góc xen kẽ"
   cho 19.305 hình dạng (tính cả các góc quay), xa nhất là 7.
2. **Separate Layers.** Ở hình khối lập phương, mỗi tầng là bốn cặp (góc, cạnh), nên tám cặp là
   tám vị trí. Một "macro" là chuỗi lát cắt đi từ hình khối lập phương về hình khối lập phương,
   tìm bằng DFS giới hạn độ sâu 5 trên các hình dạng (hơn 5.000 chuỗi, rút còn 98 macro
   sau khi coi các phép xoay tầng là miễn phí). Bảng tra này kéo mọi mảnh về đúng tầng và đưa
   trạng thái vào lớp mà pha 3 giải được.
3. **Permute.** Chỉ dùng macro giữ mảnh trong tầng của chúng (kèm xoay tầng miễn phí), bảng
   0-1 BFS trên 576 × 576 × 2 trạng thái (hoán vị cạnh, góc, độ chẵn lẻ lát cắt). Một nửa số
   trạng thái cần đổi độ chẵn lẻ giữa góc và cạnh; chuỗi ngắn nhất như vậy dài 7 lát cắt
   và không đi qua hình khối lập phương ở giữa chừng, nên không ghép được từ macro ngắn hơn.
   `squareOneParity.ts` chứa các chuỗi đó, sinh bởi
   `pnpm exec tsx scripts/square-one-parity-runs.ts 7` (khoảng 15 giây).

Kết quả đo trên scramble ngẫu nhiên: trung bình khoảng 25 lát cắt (cực đại quan sát được 34; pha 3 tệ nhất là 25),
mỗi lần giải vài mili giây sau khi dựng bảng. Lời giải không phải ngắn nhất.

Mọi test giải đều phát lại lời giải trong kpuzzle của `cubing` và so với trạng thái đã giải.

## Mô hình 3D

`SquareOneCanvas` dựng bằng Three.js (không dùng `twisty-player`, vì `cubing` chỉ có SVG 2D
cho Square-1). Mỗi mảnh là một lăng trụ: cạnh là tam giác 30°, góc là hình diều 60°, màu mặt
trên/dưới lấy từ `CUBE_COLORS`. Góc nhìn của mỗi ô (độ, quay theo chiều kim đồng hồ từ trên xuống):
tầng trên `-60 + 30·ô`, tầng dưới `-90 - 30·ô`. Lát cắt lật nửa có các ô 6-11 của tầng trên
quanh trục nằm ở 195°; phép phản chiếu qua trục đó là thứ đưa tầng dưới về đúng chỗ
(`squareOneGeometry.test.ts` kiểm).

Tầng giữa là hai nửa của hình vuông; nửa bị lật bởi lát cắt đổi hình sau số lẻ lần `/`, đúng
như trên khối thật.

`squareOneScene.test.ts` dựng mô hình bằng Three.js trong Node và so sánh toạ độ mọi đỉnh sau
khi một nước xoay và một lát cắt kết thúc hoạt ảnh với việc vẽ thẳng trạng thái kế tiếp.

## Giới hạn

- Chỉ nhập bằng scramble `(a,b)/ …`; chưa có trình vẽ trạng thái cho Square-1.
- Lời giải chưa tối ưu; để rút ngắn có thể nâng độ sâu macro hoặc thêm một pha kết hợp cạnh/góc.
- Ảnh xem trước nhỏ (timer, thẻ scramble) vẫn là SVG 2D của `cubing`.
