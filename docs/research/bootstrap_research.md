# Bootstrap UI Migration Notes

Bootstrap **5.3.8** là bản cập nhật mới nhất của major release hiện tại tại thời điểm thiết kế. Kế hoạch sẽ dùng package NPM thay vì CDN để Vite đóng gói CSS và các JavaScript component cần thiết vào build sản phẩm. Điều này cho phép dùng trực tiếp hệ lưới responsive, navbar, card, nav-tabs, form controls, dropdown và modal chuẩn Bootstrap.

Theme hiện có sẽ tiếp tục hỗ trợ Light, Dark và System. Bootstrap 5.3 dùng thuộc tính `data-bs-theme` để áp dụng Light/Dark cho toàn bộ component; vì vậy ThemeContext sẽ đồng bộ thuộc tính đó với trạng thái theme hiện tại, thay vì duy trì hai bộ màu giao diện rời rạc.

| Khu vực | Bootstrap primitives | Mục tiêu UX |
|---|---|---|
| Điều hướng | Navbar, offcanvas collapse, nav-link | Gọn trên desktop, mở/đóng rõ trên mobile |
| Studio | Container, row, card, nav-tabs, form-control, button group | Input, cube và report có hierarchy quen thuộc |
| Timer | Card, nav-pills, table, badges, modal | Ưu tiên đồng hồ, scramble và lịch sử |
| Study | Nav-tabs, progress, accordion, card | Một lộ trình học với disclosure cho công cụ nâng cao |
| Cài đặt | Cards, form-check, form-select, accordion | Nhóm setting dễ quét và truy cập được |

## Sources

1. [Bootstrap versions — Bootstrap 5.3.8](https://getbootstrap.com/docs/versions/)
2. [Bootstrap 5.3 introduction](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
3. [Bootstrap and Vite](https://getbootstrap.com/docs/5.3/getting-started/vite/)
4. [Bootstrap 5.3 color modes](https://getbootstrap.com/docs/5.3/customize/color-modes/)
