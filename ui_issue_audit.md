# UI issue audit — 2026-08-24

## Button contrast

Hai ảnh do người dùng cung cấp xác nhận cùng một lỗi tương phản: nút primary nền xanh Bootstrap hiển thị chữ và icon tối/xám thay vì `--bs-btn-color` trắng.

| Ảnh | Control | Quan sát xác minh |
| --- | --- | --- |
| `pasted_file_6wSPgf_image.png` | `TẠO MEMO 3-STYLE` | Chữ và biểu tượng tối trên nền xanh primary. |
| `pasted_file_mg7EQo_image.png` | `Kiểm tra & giải CFOP` | Cùng lỗi chữ/icon tối trên nền xanh primary. |

Khắc phục phải dùng màu chữ Bootstrap primary tương phản, không đổi riêng nhãn sang xám.

## Các ảnh còn lại

Ảnh control `Quét camera · tùy chọn` cho thấy control phụ cần tiếp tục dùng dạng Bootstrap outline với chữ tối mặc định trên nền sáng; không áp dụng quy tắc chữ trắng của primary cho control này. Lát đầu ảnh Study xác nhận cấu trúc tab Bootstrap và thẻ case đang hiện; lát kế tiếp sẽ được đối chiếu theo vùng overlap để hoàn thành kiểm tra ảnh Study.

Lát Study thứ hai lặp lại cùng vùng tab/card theo overlap và không có thêm control màu lỗi. Sau bản vá, desktop và 390px xác nhận nút primary `Case kế` hiển thị chữ trắng, còn control camera outline tiếp tục hiển thị chữ tối trên nền sáng theo Bootstrap mặc định.
