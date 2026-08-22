# Nguồn tham chiếu 3-Style BLD

- **Speffz**: [Speedsolving.com Wiki](https://www.speedsolving.com/wiki/index.php/Speffz). Trang mô tả lettering chuẩn, khởi đầu UBL cho corner và thứ tự mặt `ULFRBD`; đây là cơ sở cho memo Speffz của Studio.
- **BLDDB Documentation**: [docs.blddb.net](https://docs.blddb.net/). Tài liệu nêu catalog 3-Style gồm 1.008 corner 3-cycle và 1.760 edge 3-cycle, đồng thời có catalog parity, edge flip và corner twist.
- **Dữ liệu tham chiếu**: [BLDDB source](https://github.com/nbwzx/blddb), `public/data/*Manmade.json`. Probe nội bộ đã chuyển Chichu sang Speffz và xác nhận có 360 key edge bắt đầu buffer Speffz `C` (UF) và 108 key corner bắt đầu `A` (UBL).

## Quyết định kỹ thuật

Studio sẽ tính trace/memo từ CubieView nội bộ, sau đó map từng bộ ba buffer-target-target sang key Speffz cho execution algorithm. Catalog execution được lấy tại runtime từ BLDDB để tránh nhúng dữ liệu GPL vào bundle tĩnh.
