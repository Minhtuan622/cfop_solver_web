# Nguồn đối chiếu starter pack 3×3 BLD

Ngày truy cập: 2026-08-25.

Starter pack trong Study dùng các algorithm từ catalog BLDDB mà ứng dụng đã dùng trực tiếp ở BLD Report/Drill. Các endpoint nguồn là:

- https://raw.githubusercontent.com/nbwzx/blddb/v2/public/data/edgeManmade.json
- https://raw.githubusercontent.com/nbwzx/blddb/v2/public/data/cornerManmade.json
- https://raw.githubusercontent.com/nbwzx/blddb/main/assets/json/parityAlgToInfoManmade.json
- https://raw.githubusercontent.com/nbwzx/blddb/main/assets/json/twoFlipsAlgToInfo.json

Công thức đã đối chiếu cho bản starter hiện hữu gồm `ACE` edge: `L2 U L2 S' L2 S U' L2`; `ACF` edge: `l U L' U' M' U L U' L'`; `ADM` corner: `L D L' U' L D' L' U`; và `BD` two-flip: `R S2 R2 S' R U R' S R2 S2 R' U'`.

## Bộ dữ liệu đầy đủ cho thư viện case

Ngày tải: 2026-08-25. Các tệp JSON gốc được lấy thụ động từ catalog công khai và chỉ dùng để trích case/algorithm, không thực thi mã từ nguồn.

- `edgeManmade.json`: 3,556,482 byte.
- `cornerManmade.json`: 2,451,452 byte.
- `parityAlgToInfoManmade.json`: 415,994 byte.
- `twoFlipsAlgToInfo.json`: 283,962 byte.
- `twistsAlgToInfo.json`: 7,006,937 byte.

Nguồn giới thiệu catalog: https://blddb.net/ — trang công khai liệt kê 3-Style Corner, 3-Style Edge, Corner Twist, Edge Flip và 3BLD Parity.
