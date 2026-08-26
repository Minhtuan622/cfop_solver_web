# Ghi chú tích hợp Timer đa event

## Preview scramble

- `cubing/twisty` cung cấp `TwistyPlayer` cho nhiều puzzle và nhận `puzzle`, `alg`, `experimental-setup-alg`, `background` cùng kích thước CSS.
- Để hiển thị **trạng thái scramble**, dùng `experimental-setup-alg=<scramble>` và không phát một lời giải. `puzzle` dự kiến: `2x2x2`, `pyraminx`, `megaminx`.
- Không ép chế độ 2D vì tài liệu nêu chỉ một số puzzle hỗ trợ 2D. Dùng player 3D tĩnh, không control panel, background trong suốt để tránh preview sai với Pyraminx/Megaminx.

Nguồn: [cubing/twisty](https://js.cubing.net/cubing/twisty/), truy cập 2026-08-26.

## So sánh WCA

- Các `TimerEventId` hiện tại sử dụng đúng WCA event code: `222`, `333`, `444`, `555`, `666`, `777`, `pyram`, `skewb`, `minx`, `sq1`, `clock`.
- Adapter server đã trả `personalRecords` theo `eventId`, `singleCentiseconds` và `averageCentiseconds`; bảng Timer phải dùng cùng event code, không suy đoán hay ghi dữ liệu sang WCA.
- API v0 được WCA mô tả là không bảo đảm tính nhất quán/khả dụng; UI cần xử lý rõ trạng thái thiếu hồ sơ, không có record và lỗi tải.

Nguồn: [WCA v0 API](https://docs.worldcubeassociation.org/knowledge_base/v0_api.html), truy cập 2026-08-26.
