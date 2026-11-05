# Nguồn học liệu CFOP

- Speedsolving Wiki xác nhận CFOP gồm Cross, F2L, OLL và PLL; trang tổng quan: https://www.speedsolving.com/wiki/index.php/CFOP_method
- Các đích deep link dùng trong tooltip: `Cross`, `F2L`, `OLL` và `PLL` trên Speedsolving Wiki.
- Trang được kiểm tra ngày 2026-08-21; nội dung mô tả Cross là bốn cạnh cùng màu, F2L là bốn cặp góc-cạnh, OLL có 57 case và PLL có 21 case không tầm thường.

## XCross và F2L bốn slot

Nguồn Speedsolving Wiki định nghĩa XCross (Extended Cross/Cross+1) là trạng thái hoàn tất Cross và một cặp F2L đầu tiên trong cùng sub-step: https://www.speedsolving.com/wiki/index.php?title=XCross. Trang cũng phân biệt **XCross** đạt state đó bằng blockbuilding với **Cross+1** đạt cùng state nhưng thực hiện Cross trước rồi thêm pair.

Trang Cross xác nhận biến thể XCross và ghi nhận Cross tối đa có thể giải trong tám moves: https://www.speedsolving.com/wiki/index.php?title=Cross. Trang First Two Layers mô tả F2L gồm bốn cặp corner-edge, nêu 41 last-slot cases theo symmetry và trung bình khoảng 6.7 HTM mỗi slot: https://www.speedsolving.com/wiki/index.php?title=First_Two_Layers. Tài liệu thuật toán thực hành của CubeSkills xác nhận nhiều case được đưa về basic insertion và dùng rotation `y/y'` để chuyển đối xứng slot: https://www.cubeskills.com/uploads/pdf/tutorials/f2l.pdf.
