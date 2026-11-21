# Bộ giải Rust/WebAssembly: kết quả kiểm chứng

Bộ giải CFOP viết lại bằng Rust nằm ở [`packages/solver`](../../packages/solver):

| Crate | Nội dung |
|---|---|
| `cube-core` | Cubie 8 góc + 12 cạnh + 6 tâm, move U R F D L B / M E S / x y z / wide, parse và format, chuyển đổi 54 sticker URFDLB có kiểm tra hợp lệ. Chỉ dùng thư viện chuẩn. |
| `cfop` | Cross (IDA*, bảng chính xác), F2L theo slot (IDA*), OLL 57 case, PLL 21 case có AUF, XCross..XXXXCross, ZBLL (519 case), 1LLL (1163 case), pipeline `Cfop`. |
| `solver-wasm` | wasm-bindgen + tsify: `solve`, `scrambleToStickers`, `analyzeBld`, `warmUp`; trả đúng tài liệu `SolverResult` mà Studio dùng. |

Số liệu dưới đây đo trong container CI Linux x86_64 (Node 22.23, Rust 1.97).

## Test tính chất (`cargo test --workspace`)

- 2000 scramble: Cross luôn ≤ 8 nước (dài nhất gặp được: 8), cross đã xong.
- 2000 scramble: sau F2L cả 4 slot xong, cross còn nguyên sau từng cặp.
- 216/216 trạng thái hướng của last layer được nhận diện và giải đúng (57 case + skip).
- 288/288 trạng thái hoán vị của last layer được giải đúng (21 case + skip).
- 5000 scramble: `Cfop::solve` đưa khối về trạng thái đã giải; mỗi thuật toán OLL/PLL/ZBLL/1LLL được kiểm chứng bằng cách áp nghịch đảo lên khối đã giải.
- Opening, 1000 scramble mỗi mức (độ sâu 9–10, 200 000 node mỗi lần thử): XCross 1000/1000, XXCross 997, XXXCross 131, XXXXCross 1. Mỗi opening được ghi nhận đều là MỘT chuỗi trực tiếp từ scramble đạt cross và đủ slot cùng lúc.
- BLD 3-Style: khớp từng byte với output của bản Python trên 65 trạng thái cố định.

## Bảng tra

| Bảng | Entry | Dung lượng | Khoảng cách tối đa |
|---|---|---|---|
| Cross | 190 080 | 95 KB | 8 |
| Cross + cạnh slot | 3 041 280 | 1.52 MB (4 bit/entry) | 9 |
| Cross + góc slot | 4 561 920 | 2.28 MB (4 bit/entry) | 9 |
| ZBLL/1LLL (chỉ mục) | 1682 case | < 0.2 MB | – |

Dựng một lần, lười, ở lần giải đầu tiên: 1.43 s native (opt-level 3), 2.27 s native (opt-level "s"), **2.1 s trong WebAssembly** (Node/V8). Bộ nhớ tuyến tính của module WASM: 1.2 MiB lúc khởi động, **5.7 MiB** sau khi dựng bảng, không tăng thêm khi giải.

File `solver_wasm_bg.wasm`: 461 KiB sau wasm-pack, **300 KiB sau `wasm-opt -Os`** (121 KB gzip).

## Thời gian

Native, `cargo run --release -p cfop --example bench 2000` (opt-level 3):

| | p50 | p95 | max |
|---|---|---|---|
| Cross | 0.002 ms | 0.004 ms | 0.021 ms |
| F2L (4 cặp) | 1.26 ms | 6.26 ms | 36.96 ms |

Native, `cargo run --release -p cfop --example bench_extensions 300` (opt-level "s"), mỗi lần thử một bộ slot:

| Opening | Độ sâu 8, 5 000 node (mặc định Studio) | Độ sâu 10, 50 000 node (giới hạn tối đa của UI) |
|---|---|---|
| XCross | tìm được 299/300, p95 0.12 ms | 300/300, p95 0.13 ms |
| XXCross | 49/300, p95 0.77 ms | 299/300, p95 13.3 ms |
| XXXCross | 0/300, p95 0.53 ms | 22/300, p95 42.8 ms |
| XXXXCross | 0/300, p95 0.15 ms | 1/300, p95 13.0 ms |

WebAssembly (Node), cả lần giải sau khi đã dựng bảng: opening `cross` p50 1.3 ms / p95 6.8 ms; `auto` p50 2.0 ms / p95 7.6 ms; `auto` với độ sâu 10 và 50 000 node p50 43 ms / p95 65 ms / max 110 ms.

Giới hạn an toàn cho trình duyệt (đã áp dụng): độ sâu opening bị kẹp 4..10, ngân sách mỗi lần thử 500..50 000 node, ngân sách F2L 400 000 node mỗi cặp, ngân sách thời gian cả lần giải 40 s (trước hạn 45 s của client). Trường hợp xấu nhất đo được dưới 0.2 s, cách xa các giới hạn này.

## So sánh hai engine trên 500 scramble

`node scripts/compare-solvers.mjs 500`: 25 nước ngẫu nhiên, seed cố định, tham số mặc định của Studio (cross U, opening cross, last layer auto). Lời giải của MỖI engine được kiểm tra độc lập bằng mô hình khối của Python.

| | Giải đúng | Độ dài TB | p50 | p95 | max |
|---|---|---|---|---|---|
| WASM (Rust) | **500/500** | 52.98 | 2.7 ms | 13.8 ms | 58.6 ms |
| Pyodide (Python) | 494/500 | 55.07 | 585 ms | 8.6 s | 23.1 s |

Sáu đề Pyodide không giải được: năm đề ném `RuntimeError: No full PLL case matched the current state` (lỗi có sẵn trong `solve_pll_full` của bản Python) và một đề hết ngân sách F2L 3 s. Trên 494 đề cả hai cùng giải đúng, độ dài khác nhau ở 444 đề (WASM ngắn hơn 271 đề, dài hơn 173 đề).
