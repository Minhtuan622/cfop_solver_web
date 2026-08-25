# Nguồn đối chiếu starter pack 3×3 BLD

Ngày truy cập: 2026-08-25.

Starter pack trong Study dùng các algorithm từ catalog BLDDB mà ứng dụng đã dùng trực tiếp ở BLD Report/Drill. Các endpoint nguồn là:

- https://raw.githubusercontent.com/nbwzx/blddb/v2/public/data/edgeManmade.json
- https://raw.githubusercontent.com/nbwzx/blddb/v2/public/data/cornerManmade.json
- https://raw.githubusercontent.com/nbwzx/blddb/main/assets/json/parityAlgToInfoManmade.json
- https://raw.githubusercontent.com/nbwzx/blddb/main/assets/json/twoFlipsAlgToInfo.json

Công thức đã đối chiếu cho bản starter hiện hữu gồm `ACE` edge: `L2 U L2 S' L2 S U' L2`; `ACF` edge: `l U L' U' M' U L U' L'`; `ADM` corner: `L D L' U' L D' L' U`; và `BD` two-flip: `R S2 R2 S' R U R' S R2 S2 R' U'`.
