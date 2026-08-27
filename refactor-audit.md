# Bản đồ refactor

## Baseline

Dự án hiện có khoảng **19.471 dòng TypeScript/TSX** trong `client/src`, `server`, `shared` và `drizzle`, cùng **32 file regression**. Đợt refactor sẽ bảo toàn hành vi trước, thực hiện từng nhóm nhỏ và chỉ loại bỏ mã sau khi đã kiểm tra import, route và test liên quan.

| Khu vực | Quan sát đã xác nhận | Hướng refactor an toàn |
|---|---|---|
| `client/src/components` | Chứa 104 file, gồm component tính năng và component UI có sẵn. | Chỉ refactor component của ứng dụng; không chỉnh các primitives UI khi chưa có lỗi cụ thể. |
| `client/src/lib` | Có 33 module nghiệp vụ; `practiceCases.ts` đang là module lớn nhất trong nhóm này. | Chuẩn hóa exports/types và tách dữ liệu tĩnh khỏi logic biến đổi khi có dấu hiệu trùng lặp. |
| `client/src/pages` | `Home.tsx` và `TimerLab.tsx` là các page lớn của ứng dụng. | Tách theo feature boundaries, không đổi route hoặc persisted data trong cùng lượt đầu tiên. |
| `server` | `routers.ts` và `db.ts` đã tương đối lớn; `server/_core` là hạ tầng template. | Không thay đổi `server/_core`; chỉ tách router/helper ứng dụng khi có test bao phủ. |
| Bundle | Build vẫn có cảnh báo một số chunk lớn liên quan Three.js/Cubing. | Giữ lazy loading hiện có, đo import graph trước khi thay đổi chunking. |

## Thứ tự dự kiến

Đợt đầu tập trung vào bản đồ route và dependency, công cụ tiện ích dùng chung, cùng các component có dấu hiệu trùng lặp rõ ràng. Sau mỗi nhóm sẽ chạy `pnpm test`, `pnpm check`, `pnpm build` và kiểm tra giao diện các route chính trước khi tạo checkpoint.

## Kết quả audit dependency đợt 1

`ComponentShowcase.tsx` là page demo 1.437 dòng và không có tham chiếu tĩnh nào trong `client/src`; router hiện cũng không đăng ký route cho component này. Đây là ứng viên đầu tiên để loại bỏ sau một lượt kiểm tra build.

Các thao tác `localStorage` trực tiếp hiện nằm trong cả context, lib và một vài page/component. Đợt refactor tiếp theo sẽ chỉ hợp nhất các truy cập thuộc cùng miền dữ liệu vào helper sẵn có; không thay đổi key hoặc format persisted data trong khi người dùng đang sử dụng ứng dụng.

Các component `AIChatBox`, `DashboardLayout`, `DashboardLayoutSkeleton` và `ManusDialog` chỉ tự tham chiếu lẫn nhau hoặc không có tham chiếu ngoài file định nghĩa. Chúng là phần template không được router hay feature hiện tại sử dụng, nên có thể gỡ trong chặng dọn dẹp đầu tiên. `SystemLeaderboard` đang được `Rooms.tsx` sử dụng và được giữ lại.
