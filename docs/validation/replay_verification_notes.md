# Replay verification notes

Trong phiên My Browser tại `/timer?from_webdev=1` và `/history`, History hiện có 10 solve thực. Tất cả record hiển thị `0 nước xoay`, do đó chưa có solution đã lưu để mở replay thực tế. Các record này không bị chỉnh sửa.

Replay đã được xác minh qua fixture jsdom cô lập: scramble `R U`, solution hợp lệ `U' R'`, thời gian 4 giây. Test mở dialog qua PB, kiểm tra trace hai bước, sau đó dùng control “Nước sau” để chuyển Cube 3D từ bước 0 sang `U'` ở bước 1. Đây là cùng code path `validateRecordedSolution` → `openReplay` → `traceFastMoves` mà ứng dụng dùng cho solve đã lưu.
