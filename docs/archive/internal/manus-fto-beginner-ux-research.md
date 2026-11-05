# Căn cứ thiết kế lại trải nghiệm học FTO cho người mới

Nguồn A Fort Made of Books: http://afortmadeofbooks.blogspot.com/2024/12/fto-tutorial.html. Điểm bắt đầu được mô tả cụ thể là chỉ ghép ba cạnh trắng, chưa ghép toàn bộ tâm/hexagon. Thứ tự màu tham chiếu trong ví dụ là purple ở sau, red ở trái và blue ở phải. Nguồn cũng mô tả một 3-cycle tâm `l R' L R - l' R' L' R` bằng vị trí mảnh, không chỉ bằng chiều quay mơ hồ.

Nguồn Cubelelo: https://www.cubelelo.com/blogs/cubing/a-beginners-guide-to-solving-the-fto-face-turning-octahedron. Lộ trình đơn giản: (1) hoàn thiện mặt trắng, bỏ qua corners; (2) tạo hai triples từ corner và các triangle tương ứng; (3) giải ba centers còn lại; (4) giải white corner cuối; (5) giải corners/triples cuối. Nguồn cung cấp hai công thức dễ gọi tên để đổi hướng: hedgeslammer `F R' F' R` và sledgehammer `R' F R F'`.

Quyết định UX: ứng dụng cần hiển thị một “bước bắt đầu ngay” trước, chỉ một mục tiêu nhìn thấy được, một checklist 3 hành động ngắn, một preview “trước → sau” và nút tự kiểm. Thuật toán Nautilus nâng cao sẽ được đặt trong khu tiếp theo/học sau, không còn là điểm vào mặc định của người mới.
