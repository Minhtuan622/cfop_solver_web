# Nguồn tham chiếu 3-Style BLD

- **Speffz**: [Speedsolving.com Wiki](https://www.speedsolving.com/wiki/index.php/Speffz). Trang mô tả lettering chuẩn, khởi đầu UBL cho corner và thứ tự mặt `ULFRBD`; đây là cơ sở cho memo Speffz của Studio.
- **BLDDB Documentation**: [docs.blddb.net](https://docs.blddb.net/). Tài liệu nêu catalog 3-Style gồm 1.008 corner 3-cycle và 1.760 edge 3-cycle, đồng thời có catalog parity, edge flip và corner twist.
- **Dữ liệu tham chiếu**: [BLDDB source](https://github.com/nbwzx/blddb), `public/data/*Manmade.json`. Probe nội bộ đã chuyển Chichu sang Speffz và xác nhận có 360 key edge bắt đầu buffer Speffz `C` (UF) và 108 key corner bắt đầu `A` (UBL).

## Quyết định kỹ thuật

Studio sẽ tính trace/memo từ CubieView nội bộ, sau đó map từng bộ ba buffer-target-target sang key Speffz cho execution algorithm. Catalog execution được lấy tại runtime từ BLDDB để tránh nhúng dữ liệu GPL vào bundle tĩnh.

## Catalog special-case và luyện memo

- **BLDDB special modules**: Tài liệu BLDDB có các module Corner Twist, Edge Flip và 3BLD Parity; tài liệu mô tả chúng sử dụng quy tắc tương ứng với 3-Style nightmare. Nguồn: [BLDDB Documentation](https://docs.blddb.net/en/), truy cập 2026-08-22.
- **Nguồn runtime**: BLDDB public repository cung cấp `parityManmade.json`, `flipsManmade.json` và `twistsManmade.json` bên cạnh dữ liệu 3-cycle. Studio chỉ truy vấn runtime, không nhúng hay phân phối lại dữ liệu GPLv3. Nguồn: [BLDDB source](https://github.com/nbwzx/blddb).
- **Memo letters**: Speffz chuẩn hóa naming vị trí/cycle và được dùng làm nền cho memo letter-pair. Nguồn: [Speedsolving.com Wiki](https://www.speedsolving.com/wiki/index.php/Speffz), truy cập 2026-08-22.
- **Quy tắc hiển thị**: Parity/flip/twist chỉ nhận gợi ý khi direction-safe key khớp chính xác catalog; key chưa match chỉ báo trạng thái cần chọn algorithm. Profile người dùng có thể override thuật toán được khuyến nghị cho cùng exact key.
- **Edge flips**: Frontend BLDDB main tạo key bằng hai vị trí edge theo thứ tự canonical; mapping public là `UR→H, UF→B, UL→D, UB→F, DR→P, DF→J, DL→L, DB→N, FR→R, FL→T, BR→Z, BL→X`. Chỉ cặp vị trí đã sort mới được lookup vào `twoFlipsAlgToInfo`.
- **Corner twists**: BLDDB main biểu diễn condition bằng chuỗi code có hướng theo vị trí. Ví dụ `UFL ccw→B`, `UBL ccw→E`, `UBR ccw→H`; thử nghiệm áp dụng algorithm catalog `BEH` cho state solved tạo đúng CubieView orientation `2` ở ba vị trí này. Studio map `corner_ori=2` sang condition `ccw` và `corner_ori=1` sang `cw` theo quy ước BLDDB.
- **Parity**: BLDDB yêu cầu hai edge position và hai corner position, chuẩn hóa chúng qua `parityEdgeAlgToStandard` và `parityCornerAlgToStandard` trước khi lookup `parityAlgToInfoManmade`. Vì parity trong execution phụ thuộc thứ tự target người dùng chọn, Studio không tự suy đoán hai pair; chỉ tự báo parity và dùng selected pairs để tạo exact key.
