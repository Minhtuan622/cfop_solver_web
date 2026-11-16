# Replay verification notes

> Cập nhật 2026-11: dialog Phát lại được đơn giản hóa — khối 3D render bằng Cubing.js (`PuzzleScramblePreview` + `animationAlg`), tự chạy cả chuỗi solution khi mở, nút **Phát solution** chạy lại từ đầu. Bỏ nút từng nước (`Nước trước`/`Nước sau`), speed slider và bộ đếm bước; `traceFastMoves` không còn dùng trong Timer. Entry lưu dạng `inputKind: "state"` không dựng lại được khối (không có scramble để feed `experimental-setup-alg`) — dialog hiện thông báo thay vì khối 3D.

Trong phiên My Browser tại `/timer?from_webdev=1` và `/history`, History hiện có 10 solve thực. Tất cả record hiển thị `0 nước xoay`, do đó chưa có solution đã lưu để mở replay thực tế. Các record này không bị chỉnh sửa.

Replay đã được xác minh qua fixture jsdom cô lập: scramble `R U`, solution hợp lệ `U' R'`, thời gian 4 giây. Test mở dialog qua PB, kiểm tra trace hai bước, sau đó dùng control “Nước sau” để chuyển Cube 3D từ bước 0 sang `U'` ở bước 1. Đây là cùng code path `validateRecordedSolution` → `openReplay` → `traceFastMoves` mà ứng dụng dùng cho solve đã lưu.
