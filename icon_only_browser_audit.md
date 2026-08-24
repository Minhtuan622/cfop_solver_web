# Browser audit — icon-only controls

- URL đã kiểm tra: `/history?from_webdev=1` trong phiên browser người dùng.
- Dữ liệu thực được giữ nguyên: History hiển thị 10 solve hợp lệ; không thực hiện thao tác nhập, xuất, xóa, chỉnh sửa hoặc thay đổi localStorage.
- Các action nhập JSON, xuất JSON, xuất CSV và quay về Timer hiển thị dưới dạng icon-only với tên truy cập được.
- Hover nút Nhập JSON đã hiển thị tooltip Bootstrap “Nhập JSON”, xác nhận cơ chế tooltip từ `aria-label` đang hoạt động trên dữ liệu thực.
