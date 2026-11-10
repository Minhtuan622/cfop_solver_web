# Thông báo bên thứ ba (Third-Party Notices)

Dự án CFOP Solver Studio sử dụng các thư viện và tài nguyên bên thứ ba sau. Dưới đây là danh sách giấy phép và bản quyền để minh bính.

## Các thư viện chính (npm)

| Gói | Giấy phép | Ghi chú |
|-----|-----------|---------|
| react | MIT | |
| react-dom | MIT | |
| three | MIT | Bản đồ khối 3D (Three.js) |
| cubing | MPL-2.0 hoặc GPL-3.0-or-later | Scramble, twisty (thuật toán khối Rubik) |
| lucide-react | ISC | Biểu tượng |
| clsx | MIT | |
| zod | MIT | Xác thực schema |
| @trpc/* | MIT | API tRPC |
| express | MIT | Server HTTP |
| drizzle-orm | BSL-1.1 | ORM |
| mysql2 | MIT | Kết nối MySQL/MariaDB |
| cookie | MIT | Xử lý cookie |
| dotenv | MIT | Biến môi trường |
| nanoid | MIT | Sinh ID |
| superjson | MIT | Biến đổi dữ liệu |
| recharts | MIT | Biểu đồ |
| sonner | MIT | Thông báo |
| wouter | MIT | Định tuyến |
| react-resizable-panels | MIT | Panel co giãn |
| tailwindcss | MIT | Framework CSS |
| @tailwindcss/vite | MIT | Vite plugin Tailwind |
| @vitejs/plugin-react | MIT | Vite plugin React |
| vite | MIT | Build tool |
| esbuild | MIT | Bundler server |
| tsx | MIT | Chạy TypeScript |
| prettier | MIT | Định dạng code |
| rollup | MIT | Bundler |
| vitest | MIT | Kiểm thử đơn vị |
| jsdom | MIT | Môi trường DOM kiểm thử |
| @testing-library/* | MIT | Các tiện ích kiểm thử |
| @playwright/test | MIT | Kiểm thử trình duyệt (Playwright) |
| @trpc/client | MIT | Client tRPC |
| @trpc/react-query | MIT | Kết nối tRPC + React Query |
| @tanstack/react-query | MIT | Quản lý trạng thái server |
| @react-buddy/ide-toolbox | MIT | |
| @builder.io/vite-plugin-jsx-loc | MIT | Dịch thuật Vite |

## Các thành phần đặc biệt

### Pyodide
- **Giấy phép:** MPL-2.0
- **Vai trò:** Chạy bộ giải CFOP (Python) trong trình duyệt qua Web Worker.
- **Nguồn:** https://pyodide.org
- **Lưu ý:** Pyodide được tải từ CDN (`cdn.jsdelivr.net`) theo mặc định. Có thể đóng gói vào `public/` để chạy ngoại línea (tùy chọn).

### BLDDB (dữ liệu BLD)
- **Giấy phép theo file LICENSE:** GPL-3.0
- **Giấy phép theo package.json:** ISC
- **Vai trò:** Dữ liệu các thể thức BLD (3-Style) từ `raw.githubusercontent.com/nbwzx/blddb`.
- **Lưu ý:** Hai ghi chú giấy phép trên không nhất quán. Người duy trì dự án nên liên hệ tác giả BLDDB để xác nhận giấy phép chính xác trước khi sử dụng dữ liệu này trong sản phẩm công khai.

### solver-python
- Bộ giải CFOP viết bằng Python, chạy qua Pyodide.
- **Ghi chú:** Kiểm tra lại giấy phép của thư mục `solver-python` trước khi công bố chính thức.

## Triết lý

Mã nguồn chính của CFOP Solver Studio (thư mục gốc, trừ các thư viện bên trên) được cấp phép theo **MIT License** (xem `LICENSE`).

Nếu bạn là tác giả của bất kỳ thành phần bên thứ ba trong danh sách này và có quan ngại về giấy phép, vui lòng mở issue trên repo để chúng tôi điều chỉnh hoặc gỡ bỏ ngay lập tức.
