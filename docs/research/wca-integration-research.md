# Ghi chú nghiên cứu tích hợp WCA

## Nguồn chính thức đã xác minh

- WCA nêu rõ không có public API chính thức cho việc đọc dữ liệu website; thay vào đó họ khuyến nghị unofficial API được WCA Software Team ủng hộ và database exports.
- Results Export v2 là dữ liệu công khai, bao gồm cuộc thi, người chơi, kết quả, lần giải, xếp hạng single/average và scramble. Trang export khuyến nghị kiểm tra `https://www.worldcubeassociation.org/api/v0/export/public` để phát hiện export mới.
- API v0 phù hợp hơn cho OAuth và luồng ghi/WCIF. Các endpoint tài liệu gồm danh sách competitions có phân trang/lọc ngày/quốc gia, results per competition, competitors và search users.
- API v0 mô tả `GET /competitions` với lọc `start`, `end`, `country_iso2`, `q` và phân trang 25 bản ghi; có endpoint results/competitors theo competition và tìm WCA profile. WCA lưu ý API v0 không được hỗ trợ chính thức về tính ổn định/availability, đồng thời khuyến nghị liên hệ WST/WDPC khi xây dựng tích hợp OAuth hoặc dữ liệu bên thứ ba.
- Kiểm tra trực tiếp ngày 2026-08-26 cho thấy `GET /api/v0/competitions?start=2026-08-01&end=2026-09-30` trả JSON công khai chứa các trường giải đấu cần cho lịch như URL/ID, tên, ngày bắt đầu/kết thúc, giới hạn người chơi, địa điểm, quốc gia, trạng thái và thông tin delegate. Đây là nguồn khả thi cho màn lịch giải read-only, nhưng cần cache server-side và xử lý phân trang.
- Trang `/posts` dùng widget phía trình duyệt và không trả bài viết trong nội dung tĩnh của lần kiểm tra; không tìm thấy feed tin tổng quát chính thức được tài liệu hóa. Do đó, chưa nên xây tin tức dựa trên scrape widget; chỉ dùng RSS được WCA công bố theo từng mảng khi phù hợp, hoặc chờ WCA xác nhận nguồn tin tổng.
- WCA Live tự xác nhận là nền tảng chính thức để nhập/quản lý kết quả trong thời gian giải đấu và chuyển kết quả cuối về WCA rankings. Tuy nhiên trang giới thiệu chỉ nêu WCIF/open-source, không công bố API read-only ổn định cho bên thứ ba. Đây nên là link-out tới WCA Live, không phải nguồn API mặc định.
- Feed RSS thông báo Regulations do WCA từng công bố không phản hồi được ở lần kiểm tra (HTTP 500). Vì vậy không thể coi đó là nguồn tin production đáng tin cậy hiện tại; cần health-check và fallback trước khi sử dụng.
- Kiểm tra trực tiếp cho thấy `GET /api/v0/persons/{WCA_ID}` trả hồ sơ công khai cùng avatar, quốc gia, `competition_count`, `personal_records` theo event (single/average, xếp hạng thế giới/châu lục/quốc gia), medals, records và tổng số solve. Đây là contract đủ cho trang Hồ sơ WCA không cần OAuth.
- `GET /api/v0/countries` trả danh sách quốc gia WCA với `name` và `iso2`, phù hợp để dựng bộ lọc quốc gia và truyền `country_iso2` cho endpoint competitions.
- Results Export yêu cầu hiển thị thông báo quy nguồn WCA khi tái xuất bản dữ liệu. Export lớn (khoảng 355–368 MB ở ngày khảo sát), nên không phù hợp để tải trên request của người dùng.

## Hướng phù hợp cho CFOP Solver Studio

1. Màn thông tin giải đấu: dùng endpoint API v0 cho danh sách/lọc competition, có server-side cache ngắn.
2. Thành tích theo WCA ID: dùng OAuth WCA nếu người dùng muốn liên kết danh tính; giữ hoàn toàn tách với tài khoản CFOP hiện có.
3. Bảng kỷ lục/thống kê sâu: dùng job nhập Results Export vào bảng tổng hợp cục bộ, chỉ khi đã có hosting/schedule phù hợp và có attribution.
4. Tin tức: chưa xác nhận được API/RSS WCA chính thức. Không nên scrape trang tin; cần hỏi WCA hoặc dùng nguồn chính thức có feed công khai trước khi triển khai.

## Nguồn

- [WCA Data Overview](https://docs.worldcubeassociation.org/knowledge_base/wca_data_overview.html)
- [WCA API v0](https://docs.worldcubeassociation.org/knowledge_base/v0_api.html)
- [WCA Results Export](https://www.worldcubeassociation.org/export/results)
- [WCA posts](https://www.worldcubeassociation.org/posts)
