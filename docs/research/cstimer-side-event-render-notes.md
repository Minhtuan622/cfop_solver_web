# Tham chiếu csTimer cho Square-1 và Clock

Nguồn tham chiếu:

- csTimer chính: <https://cstimer.net/>
- Mã nguồn csTimer: <https://github.com/cs0x7f/cstimer>

Trang csTimer hiển thị scramble text riêng và giữ vùng visualizer tách khỏi timer. Repository công khai xác nhận nguồn phiên bản của csTimer nằm tại `cstimer.net/src/` và đồng bộ với nhánh `master`.

Khi dựng lại preview cho ứng dụng, ưu tiên mô hình dễ đọc theo quy ước 2D: Square-1 cần hai vòng lát phân biệt rõ top/bottom, khe slash ở tâm và màu sticker đúng mặt; Clock cần lưới 3×3 kim phía trước/sau cùng bốn pin. Trạng thái phải lấy trực tiếp từ pattern sau scramble, không suy đoán từ animation.
