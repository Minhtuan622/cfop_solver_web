# Nguồn pattern Cross mở rộng

## Mục tiêu tích hợp

Thư viện trong Study/Studio chỉ ghi nhận một pattern là **direct** khi thuật toán được áp từ trạng thái scramble ban đầu và predicate cuối cùng đồng thời xác nhận Cross cùng đủ số slot F2L. Không suy ra tier từ các phase F2L diễn ra sau Cross.

## Nguồn đã đối chiếu

| Nguồn | Điểm dùng cho sản phẩm | Liên kết |
|---|---|---|
| or18/RubiksSolver | Xác nhận cách mô hình hoá XCross đến XXXXCROSS bằng các slot F2L được chọn cùng Cross; ví dụ XXXXCROSS dùng cả bốn slot và độ dài tìm kiếm cao hơn Cross/XCross. Tài liệu cũng nêu rõ chi phí bảng tra cứu lớn, nên không phù hợp nhúng nguyên trạng vào frontend. | https://github.com/or18/RubiksSolver |
| CubeSkills: 25 Extended Cross Examples | Cung cấp scramble, định hướng Cross và lời giải extended/double extended cross có giải thích blockbuilding. Chỉ dùng làm nguồn học và ý tưởng pattern; mỗi pattern đưa vào app vẫn phải qua predicate direct của engine. | https://www.cubeskills.com/blog/25-extended-cross-examples |
| RubiksSolver Demo Documentation | Xác nhận các family Cross đến XXXXCROSS được triển khai như solver riêng; dùng như tham chiếu rằng tier cao cần chiến lược/budget rõ ràng thay vì suy diễn từ các phase sau. | https://or18.github.io/RubiksSolverDemo/documentation.html |

## Quy tắc thư viện

1. Mỗi pattern lưu scramble, màu Cross, thuật toán và tier kỳ vọng.
2. Khi build/test, engine chạy thuật toán từ scramble ban đầu và kiểm tra Cross + toàn bộ slot yêu cầu trong **cùng trạng thái sau chuỗi đó**.
3. Nếu một thuật toán nguồn chỉ là XCross/XXCross, không nâng tier trong UI.
4. XXXXCross chỉ được công bố khi đủ cả bốn slot F2L; nếu chưa có pattern nguồn hợp lệ, UI phải nói rõ thư viện đang có mẫu direct đã kiểm chứng theo tier hiện có.

## Quyết định hiệu năng

Tài liệu RubiksSolver nêu bảng tra cứu cỡ GB cho tìm tier cao. Vì Studio là frontend chạy trong worker, node threshold cần là **ngân sách người học nhìn thấy và kiểm soát được**, không phải lời hứa tìm không giới hạn. Cross có pruning table nén riêng nên được tối ưu ở pipeline độc lập; node threshold chỉ áp cho target direct F2L mở rộng.
