# Đặc tả layout tham chiếu csTimer

Renderer Square-1 của csTimer dùng 24 slot: 12 slot trên và 12 slot dưới. Slot chẵn là edge, slot lẻ là corner đôi. Màu sticker mặt U/D chọn theo `piece >= 8`; màu mặt bên dùng chuỗi `R-B-L-F-F-L-B-R-` cho edge và `RBBLLFFRRFFLLBBR` cho corner. Với corner, csTimer vẽ hai phần bên độc lập, dùng `ccol[val - 1]` và `ccol[val]`, sau đó vẽ sticker U/D. Renderer 3D phải dùng chính các slot, chuỗi màu và phép quay `cRot/eRot` này.

Renderer Clock của csTimer sắp 18 dial thành hai lưới tròn 3×3. Mặt đầu dùng thứ tự `0,3,6,1,4,7,2,5,8`; mặt còn lại dùng `12-clks[2], clks[10], 12-clks[8], clks[9], clks[11], clks[13], 12-clks[0], clks[12], 12-clks[6]`. Tám pin được bố trí ở bốn góc mỗi mặt. Renderer 3D mới phải giữ hai mặt tròn, thứ tự dial này và trạng thái frame `y2`.

Nguồn tham chiếu: `src/js/tools/image.js`, các khối `clkImage` (dòng 13–104) và `sq1Image` (dòng 106–289) của kho csTimer.

Browser probe đã xác nhận canvas render cho cả Square-1 và Clock. Square-1 dùng polygon edge/corner từ `ep`, `cp`, `cpr`, `cpl`; Clock dùng thứ tự dial `0,3,6,1,4,7,2,5,8` và mapping mặt sau theo renderer tham chiếu.
