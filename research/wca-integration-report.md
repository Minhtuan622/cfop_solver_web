# Nghiên cứu tích hợp dữ liệu WCA vào CFOP Solver Studio

## Kết luận

> **Có thể tích hợp dữ liệu WCA**, nhưng nên tách ba lớp sử dụng: lịch giải đấu công khai, thành tích theo WCA ID và tin tức. Lịch giải có thể lấy read-only từ endpoint WCA v0; thành tích sâu nên dùng export hoặc API công khai được WCA Software Team khuyến nghị; còn tin tức tổng quát chưa có feed/API chính thức ổn định để tích hợp tự động.[1][2]

| Nhu cầu | Nguồn nên dùng | Mức độ phù hợp | Lưu ý quan trọng |
|---|---|---:|---|
| Lịch giải sắp tới | `GET /api/v0/competitions` của WCA | Cao | Có lọc ngày, quốc gia, tìm kiếm và phân trang.[2] |
| Kết quả giải đã chốt | WCA Results Export hoặc API công khai được WST khuyến nghị | Cao | Export công khai nhưng lớn, cần attribution khi tái xuất bản.[1][3] |
| Thành tích cá nhân hiện tại | Liên kết WCA ID qua OAuth hoặc tra cứu bằng WCA ID | Cao | OAuth cần đăng ký ứng dụng WCA và giữ client secret phía máy chủ.[2] |
| Kết quả đang diễn ra | WCA Live | Trung bình | Nền tảng chính thức, nhưng chưa có API read-only bên thứ ba được tài liệu hóa.[4] |
| Tin tức WCA tổng quát | Không có nguồn API/RSS ổn định đã xác minh | Thấp | Không nên scrape widget `/posts`; feed regulation từng công bố trả HTTP 500 trong lần khảo sát. |

## Điều đã xác minh

WCA nói rõ họ **không có official API dành cho việc đọc dữ liệu website**. Với nhu cầu truy vấn dữ liệu, tài liệu WCA đề xuất hai lựa chọn: unofficial WCA API do Robin Engelbrecht vận hành và được WCA Software Team ủng hộ, hoặc các database export công khai.[1] API không chính thức này cập nhật mỗi ngày, vì thế không nên dùng nó để cam kết dữ liệu trực tiếp từng giây.

API v0 của WCA phù hợp để lấy lịch giải đấu và thực hiện OAuth. Endpoint `GET /api/v0/competitions` cho phép giới hạn theo `start`, `end`, `country_iso2`, tìm bằng `q` và phân trang; endpoint theo từng giải có danh sách competitor và kết quả.[2] Kiểm tra read-only trực tiếp cho thấy endpoint trả dữ liệu lịch bao gồm tên, mã/URL, ngày, quốc gia, địa điểm, trạng thái và thông tin delegate. Tuy nhiên WCA không cam kết tính ổn định hay khả dụng của v0 API cho ứng dụng bên thứ ba.[2]

Results Export v2 có dữ liệu công khai về giải đấu, người chơi, kết quả, attempt, bảng xếp hạng single/average và scramble. Export có thể được dùng cho phân tích, nhưng bản khảo sát hiện tại có kích thước khoảng 355–368 MB; vì vậy không phù hợp để tải theo từng lượt truy cập. WCA yêu cầu nêu rõ dữ liệu dựa trên kết quả do WCA sở hữu và duy trì khi tái xuất bản.[3]

WCA Live là nền tảng chính thức để nhập kết quả tại giải đấu và đưa kết quả cuối về WCA rankings. Tài liệu giới thiệu WCA Live nói về WCIF/open-source, không công bố một API read-only ổn định cho product bên thứ ba; do đó phiên bản đầu nên dẫn người dùng đến WCA Live thay vì gọi các endpoint nội bộ không được hỗ trợ.[4]

## Kiến trúc đề xuất

### Giai đoạn 1 — Lịch giải WCA, không cần đăng nhập WCA

CFOP Solver Studio có thể thêm một panel **Giải WCA** tại trang thi đấu hoặc một route riêng. Backend Express/tRPC sẽ gọi server-side endpoint `competitions`, chuẩn hóa trường cần hiển thị và cache ngắn theo truy vấn ngày/quốc gia. Client chỉ nhận danh sách tối giản gồm tên, ngày, quốc gia, thành phố, trạng thái và link WCA chính thức. Cách này không cần API key, không lưu dữ liệu nhạy cảm và không thay đổi tài khoản CFOP hiện có.

Bộ nhớ đệm là cần thiết để tránh biến ứng dụng thành proxy không giới hạn cho WCA. Có thể bắt đầu bằng cache trong bộ nhớ theo TTL ngắn; khi nhu cầu cao hơn, chuyển metadata cache sang database. Không nên gọi API trực tiếp từ trình duyệt vì không kiểm soát được rate, lỗi CORS hoặc cách thay đổi endpoint.

### Giai đoạn 2 — Hồ sơ thành tích theo WCA ID

Thêm trường WCA ID dạng tùy chọn vào Hồ sơ CFOP. Ban đầu, người dùng tự nhập WCA ID và ứng dụng chỉ tra cứu public result/ranking để hiển thị dashboard: event đã thi, single/average tốt nhất, quốc gia và mốc mới nhất. Không được tự suy diễn danh tính chỉ từ tên vì trùng tên là có thể xảy ra.

Nếu cần nút **Liên kết tài khoản WCA**, dùng OAuth authorization-code flow của WCA. Điều này yêu cầu người vận hành tạo OAuth application tại WCA, cấu hình redirect URL production và cung cấp `WCA_CLIENT_ID`, `WCA_CLIENT_SECRET` qua cơ chế secret server-side. Token tuyệt đối không được đưa vào frontend hoặc trộn với cookie tài khoản CFOP. WCA khuyến nghị trao đổi với WST/WDPC khi triển khai OAuth hoặc sử dụng dữ liệu bên thứ ba.[2]

### Giai đoạn 3 — Thống kê toàn cầu đã chốt

Nếu cần top quốc gia, biểu đồ lịch sử hoặc so sánh rộng hơn theo event, tạo pipeline server-side đọc Results Export hoặc endpoint phát hiện export mới. Chỉ nhập các bảng/cột cần dùng vào các bảng tổng hợp riêng, ví dụ `wca_competitions`, `wca_person_summaries` và `wca_event_ranks`; không import toàn bộ dump vào database ứng dụng ngay từ đầu. Do export lớn, tác vụ này phù hợp với job định kỳ ngoài đường request, có kiểm tra version và attribution hiển thị rõ ràng.[3]

## Tin tức và kết quả trực tiếp

Phần tin tức không nên được triển khai bằng cách scrape trang `/posts`: lần khảo sát cho thấy nội dung dùng widget phía client, còn WCA chưa công bố API/RSS tổng quát ổn định. Có thể đặt card link-out tới WCA Posts và WCA Live ngay từ giai đoạn 1. Khi WCA xác nhận feed hoặc endpoint chính thức, ứng dụng mới nên bổ sung bộ đọc tin có cache và hiển thị nguồn.

Đối với kết quả trực tiếp, WCA Live là điểm đến chính xác nhất cho người dùng. Nhúng dữ liệu live vào CFOP Solver Studio chỉ nên thực hiện nếu WCA công bố contract/API dành cho bên thứ ba hoặc có xác nhận từ WST; không nên dựa vào các endpoint nội bộ quan sát được từ trình duyệt.

## Khuyến nghị triển khai trước

Tôi khuyến nghị bắt đầu bằng **Giai đoạn 1**: lịch giải WCA có bộ lọc thời gian/quốc gia và nút mở trang WCA chính thức. Đây là chức năng hữu ích, không đòi OAuth, không cần thêm chi phí dịch vụ và tránh rủi ro về dữ liệu cá nhân. Sau đó, thêm WCA ID tự nguyện ở Hồ sơ. Chỉ triển khai OAuth sau khi chủ dự án đã đăng ký ứng dụng WCA và xác nhận muốn liên kết danh tính chính thức.

## Tài liệu tham khảo

[1]: https://docs.worldcubeassociation.org/knowledge_base/wca_data_overview.html "WCA Data Overview"
[2]: https://docs.worldcubeassociation.org/knowledge_base/v0_api.html "WCA v0 API"
[3]: https://www.worldcubeassociation.org/export/results "WCA Results Export"
[4]: https://live.worldcubeassociation.org/about "About WCA Live"
