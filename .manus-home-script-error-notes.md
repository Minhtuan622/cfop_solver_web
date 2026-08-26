# Điều tra Script error trang chính

- Tải lại `/?from_webdev=1` lúc 15:36 hoạt động bình thường; giao diện Studio render và console không có lỗi mới.
- Log tại thời điểm người dùng báo chỉ cho thấy `Script error.` không có filename/stack; đây là dạng lỗi browser che thông tin từ script cross-origin hoặc ngữ cảnh preview.
- Bản vá giữ nguyên reporting native, đồng thời bắt unhandled rejection của import Bootstrap trì hoãn và thêm ngữ cảnh URL cho các lỗi global xuất hiện sau này.
- Tải lại cùng URL sau bản vá lúc 15:38 tiếp tục render ổn định; console trống và không tái diễn `Script error.`.
