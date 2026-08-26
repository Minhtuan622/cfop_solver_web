# Ghi chú tích hợp Timer đa event

## Preview scramble

- `cubing/twisty` cung cấp `TwistyPlayer` cho nhiều puzzle và nhận `puzzle`, `alg`, `experimental-setup-alg`, `background` cùng kích thước CSS.
- Để hiển thị **trạng thái scramble**, dùng `experimental-setup-alg=<scramble>` và không phát một lời giải. `puzzle` dự kiến: `2x2x2`, `pyraminx`, `megaminx`.
- Không ép chế độ 2D vì tài liệu nêu chỉ một số puzzle hỗ trợ 2D. Dùng player 3D tĩnh, không control panel, background trong suốt để tránh preview sai với Pyraminx/Megaminx.

Kết quả browser cho thấy vùng `TwistyPlayer` có thể giữ kích thước nhưng không render model. Vì Timer không được phép để vùng trắng, preview 2×2 sẽ chuyển sang renderer CSS 3D nội bộ: tái sử dụng state 3×3 của cùng scramble và lấy bốn corner facelet trên từng mặt, vốn tương ứng trực tiếp với trạng thái 2×2. Pyraminx/Megaminx chỉ giữ TwistyPlayer khi đã có model render; nếu thất bại phải hiện fallback có ích thay vì card rỗng.

Kiểm chứng tiếp theo cho thấy `TwistyPlayer` tạo được `Object3D` nhưng canvas nội bộ không hiện ổn định trong layout Timer. Cách ổn định là lấy `experimentalCurrentThreeJSPuzzleObject()` từ player staging, rồi render Object3D đó bằng canvas Three.js có cùng phiên bản runtime `0.170.0` như cubing.js. Renderer riêng đã hiển thị Pyraminx thật trong browser với màu trạng thái sau scramble; các input orbit, zoom và reset được quản lý ở app.

Xác minh browser desktop và viewport 390px cho thấy Pyraminx/Megaminx đều có canvas 3D, không rơi về fallback hoặc vùng trắng. Megaminx giữ canvas trong cột Timer trên mobile, không tràn ngang; số sticker và màu sau scramble vẫn hiển thị rõ.

Nguồn: [cubing/twisty](https://js.cubing.net/cubing/twisty/), truy cập 2026-08-26.

## So sánh WCA

- Các `TimerEventId` hiện tại sử dụng đúng WCA event code: `222`, `333`, `444`, `555`, `666`, `777`, `pyram`, `skewb`, `minx`, `sq1`, `clock`.
- Adapter server đã trả `personalRecords` theo `eventId`, `singleCentiseconds` và `averageCentiseconds`; bảng Timer phải dùng cùng event code, không suy đoán hay ghi dữ liệu sang WCA.
- API v0 được WCA mô tả là không bảo đảm tính nhất quán/khả dụng; UI cần xử lý rõ trạng thái thiếu hồ sơ, không có record và lỗi tải.

Nguồn: [WCA v0 API](https://docs.worldcubeassociation.org/knowledge_base/v0_api.html), truy cập 2026-08-26.
