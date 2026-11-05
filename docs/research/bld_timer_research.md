# Nghiên cứu: timer Rubik và lộ trình 3-Style cho người mới

## Nguồn đã kiểm tra

| Nguồn | URL | Phát hiện áp dụng được |
| --- | --- | --- |
| CubeDesk | https://www.cubedesk.io/ | Timer là điểm tập trung duy nhất: event/session/keyboard ở control tối thiểu, scramble ngay trên readout, solve list và chỉ số nằm ở vùng phụ rõ ràng. Điều hướng tách Timer, Trainer, Solves, Stats và Settings thay vì đặt mọi chức năng cùng một canvas. |
| Twisty Timer | https://play.google.com/store/apps/details?id=com.aricneto.twistytimer&hl=en_US | Mô tả chính thức nhấn mạnh thiết kế dễ dùng, category theo event, scramble có minh họa, thống kê/progress và tài liệu thuật toán có theo dõi tiến độ. Đây là mô hình “một nhiệm vụ chính, tiến độ sau đó”. |
| J Perm — How To Solve a Rubik's Cube Blindfolded | https://www.jperm.net/bld | Hướng dẫn nhập môn trình bày theo tuần tự: hiểu mục tiêu BLD → buffer/target → giải edge → giải corner → lettering → memo theo letter pair/story → parity → walkthrough. Nội dung nói rõ người mới chỉ cần vài thuật toán trước, không bắt đầu bằng catalog 3-Style. |

## Hệ quả cho CFOP Solver Studio

1. Study 3-Style phải mở bằng **“Bạn sẽ học gì?”**, không phải Drill/Parity/2-Flip. Lộ trình đề xuất: BLD cơ bản → chuẩn bị chữ cái → đọc memo → thuật toán đầu tiên → luyện có hướng dẫn → Drill/timer khi đã sẵn sàng.
2. Một thời điểm chỉ hiện **một nhiệm vụ**. Các thuật ngữ `buffer`, `parity`, `execution`, `special case`, `SRS` chỉ xuất hiện sau khi giải thích bằng tiếng Việt ngay tại bước liên quan.
3. Studio 3-Style chỉ nên là một **phân tích memo compact**: input, cube state, “Tạo memo”, summary edge/corner/parity và report. Mọi học, drill, SRS, profile chuyển hẳn sang Study.
4. Các bề mặt phụ không được lặp label/khu luyện; dùng one primary action, disclosure cho phần nâng cao, và giữ lịch sử/metric ở sau thao tác chính.
