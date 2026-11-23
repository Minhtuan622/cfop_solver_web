# Bộ giải Rust/WebAssembly: kết quả kiểm chứng

Bộ giải CFOP viết lại bằng Rust nằm ở [`packages/solver`](../../packages/solver):

| Crate | Nội dung |
|---|---|
| `cube-core` | Cubie 8 góc + 12 cạnh + 6 tâm, move U R F D L B / M E S / x y z / wide, parse và format, chuyển đổi 54 sticker URFDLB có kiểm tra hợp lệ. Chỉ dùng thư viện chuẩn. |
| `cfop` | Cross (IDA*, bảng chính xác), F2L theo slot (IDA*), OLL 57 case, PLL 21 case có AUF, XCross..XXXXCross, ZBLL (519 case), 1LLL (1163 case), pipeline `Cfop`. |
| `solver-wasm` | wasm-bindgen + tsify (crate `tsify` 0.5, kiểu bọc `Ts<T>`): `solve`, `scrambleToStickers`, `analyzeBld`, `warmUp`; trả đúng tài liệu `SolverResult` mà Studio dùng. |

Số liệu dưới đây đo trong container CI Linux x86_64 (Node 22.23, Rust 1.97).

## Test tính chất (`cargo test --workspace`)

- 2000 scramble: Cross luôn ≤ 8 nước (dài nhất gặp được: 8), cross đã xong.
- 2000 scramble: sau F2L cả 4 slot xong, cross còn nguyên sau từng cặp.
- 216/216 trạng thái hướng của last layer được nhận diện và giải đúng (57 case + skip).
- 288/288 trạng thái hoán vị của last layer được giải đúng (21 case + skip).
- 5000 scramble: `Cfop::solve` đưa khối về trạng thái đã giải; mỗi thuật toán OLL/PLL/ZBLL/1LLL được kiểm chứng bằng cách áp nghịch đảo lên khối đã giải.
- Opening, 1000 scramble mỗi mức (độ sâu 9–10, 200 000 node mỗi lần thử): XCross 1000/1000, XXCross 997, XXXCross 131, XXXXCross 1. Mỗi opening được ghi nhận đều là MỘT chuỗi trực tiếp từ scramble đạt cross và đủ slot cùng lúc.
- Opening XXXCross ở độ sâu 12, 2 000 000 node mỗi lần thử: tìm được ít nhất 16/20 scramble (`xxxcross_at_depth_12_is_usually_found`; lần chạy gần nhất 17/20).
- BLD 3-Style: khớp từng byte với output của engine cũ trên 65 trạng thái cố định (fixture đóng băng `solver-wasm/tests/fixtures/bld_reference.json`).

## Bảng tra

| Bảng | Entry | Dung lượng | Khoảng cách tối đa |
|---|---|---|---|
| Cross | 190 080 | 95 KB | 8 |
| Cross + cạnh slot | 3 041 280 | 1.52 MB (4 bit/entry) | 9 |
| Cross + góc slot | 4 561 920 | 2.28 MB (4 bit/entry) | 9 |
| ZBLL/1LLL (chỉ mục) | 1682 case | < 0.2 MB | – |

Dựng một lần, lười, ở lần giải đầu tiên: 1.43 s native (opt-level 3), 2.27 s native (opt-level "s"), **2.1 s trong WebAssembly** (Node/V8). Bộ nhớ tuyến tính của module WASM: 1.2 MiB lúc khởi động, **5.7 MiB** sau khi dựng bảng, không tăng thêm khi giải.

File `solver_wasm_bg.wasm`: 473 008 byte (132 886 byte gzip) sau wasm-pack, **308 569 byte (118 736 byte gzip) sau `wasm-opt -Os`**.

`wasm-opt` lấy từ bản phát hành Binaryen **version_133** (ghim phiên bản, kiểm checksum SHA-256), dùng chung cho CI (`.github/workflows/ci.yml`) và Docker (`Dockerfile`, tầng `solver`), cùng bộ cờ với `scripts/build-solver.mjs`. Đo ngày 22/11/2026: file `.wasm` do quy trình CI và do Docker tạo ra **giống hệt nhau từng byte** (cùng SHA-256), module khởi tạo được và `node scripts/bench-solver.mjs --check` đạt cả hai kịch bản (`cross` 11/11, `auto` 11/11). Trước đây Docker bỏ bước này vì Binaryen 108 của Debian bookworm làm hỏng bảng externref của wasm-bindgen 0.2.130; bản 133 không còn lỗi đó.

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

Giới hạn an toàn cho trình duyệt (đã áp dụng): độ sâu opening bị kẹp **4..12**, ngân sách mỗi lần thử **500..2 000 000** node, ngân sách F2L 400 000 node mỗi cặp, ngân sách thời gian cả lần giải 40 s (trước hạn 45 s của client). Mặc định vẫn là độ sâu 8 và 5 000 node; người dùng tự nâng trong Cài đặt. Trường hợp xấu nhất đo được ở mức tối đa (`auto`, độ sâu 12, 2 000 000 node, 100 scramble): 9,4 s, có tính lần dựng bảng đầu tiên.

## Nới độ sâu opening lên 12 (22/11/2026)

**Nút thắt.** Đo trên đúng 1000 scramble của test `openings_1000_scrambles_per_tier` (độ sâu 10, 200 000 node): XXXCross thất bại 869 lần, trong đó **853 lần không tồn tại lời giải trực tiếp nào ≤ 10 nước** (IDA* đã duyệt hết) và chỉ 16 lần hết ngân sách node. XXXXCross: 995 lần không tồn tại lời giải ≤ 10 nước, 4 lần hết node. Vậy ở độ sâu 10, heuristic mạnh đến đâu cũng chỉ nâng được XXXCross lên tối đa 147/1000 và XXXXCross lên 5/1000; giới hạn nằm ở độ sâu, không ở heuristic.

**Thử heuristic mạnh hơn (đã bỏ).** Thêm bảng khoảng cách "tất cả góc slot mục tiêu" và "tất cả cạnh slot mục tiêu" (không kèm cross), lấy max với heuristic hiện có: số node chỉ giảm 1–15%, tỉ lệ tìm được không đổi, còn thời gian dựng bảng tăng khoảng 1,1 s native. Không đạt điều kiện "dựng thêm ≤ 1 s", nên không đưa vào.

**Thay đổi.** Chỉ nới giới hạn ở `solver-wasm/src/studio.rs` (độ sâu 4..12, ngân sách 500..2 000 000) và ở Cài đặt (`client/src/lib/appSettings.ts`, thanh trượt). Thuật toán tìm kiếm và invariant direct search giữ nguyên.

**Kết quả trong WebAssembly** (Node 22, cùng hàm sinh scramble và seed với test Rust, mỗi lần giải gồm cả F2L và last layer):

| Cấu hình | XXXCross | XXXXCross | Thời gian một lần giải p50 / p95 |
|---|---|---|---|
| Độ sâu 10, 200 000 node (Rust native) | 131/1000 | 1/1000 | – |
| Độ sâu 10, 50 000 node (giới hạn cũ của UI), 100 scramble | 13/100 | 0/100 | 0,06 s / 0,12 s |
| Độ sâu 12, 2 000 000 node, 100 scramble | 94/100 | 2/100 | XXX 0,78 s / 2,57 s · XXXX 1,68 s / 3,61 s |
| Độ sâu 12, 2 000 000 node, **1000 scramble** | **928/1000** | **14/1000** | XXX 0,68 s / 2,48 s · XXXX 1,12 s / 2,35 s |

Lần đo 1000 scramble chạy song song với `cargo test` nên thời gian chỉ để tham khảo; số p50/p95 đáng tin là dòng 100 scramble. Không lời giải nào sai, không lần nào báo lỗi. Kích thước `.wasm` gần như không đổi (308 571 byte sau `wasm-opt`), bộ nhớ không tăng vì không thêm bảng.

**Rủi ro còn lại.** Ở mức tối đa, chế độ `auto` có thể thử tới 15 bộ slot × 2 000 000 node. Trên máy đo, trường hợp xấu nhất là 9,4 s; trên điện thoại chậm có thể chậm hơn vài lần. Nếu chạm hạn 40 s thì cả lần giải báo lỗi hết thời gian, nên mặc định vẫn giữ ở mức thấp.

## So sánh với engine cũ trên 500 scramble

Trước khi gỡ engine Python cũ (chạy trong trình duyệt), hai engine được so sánh bằng một script tạm (`scripts/compare-solvers.mjs`, đã gỡ cùng engine cũ; xem lịch sử git): 500 scramble 25 nước ngẫu nhiên, seed cố định, tham số mặc định của Studio (cross U, opening cross, last layer auto). Lời giải của MỖI engine được kiểm tra độc lập bằng mô hình khối của engine cũ.

| | Giải đúng | Độ dài TB | p50 | p95 | max |
|---|---|---|---|---|---|
| WASM (Rust) | **500/500** | 52.98 | 2.7 ms | 13.8 ms | 58.6 ms |
| Engine cũ (Python) | 494/500 | 55.07 | 585 ms | 8.6 s | 23.1 s |

Sáu đề engine cũ không giải được: năm đề ném `RuntimeError: No full PLL case matched the current state` (lỗi có sẵn trong bước PLL của engine cũ) và một đề hết ngân sách F2L 3 s. Trên 494 đề cả hai cùng giải đúng, độ dài khác nhau ở 444 đề (WASM ngắn hơn 271 đề, dài hơn 173 đề).

## Kích thước bản phát hành khi gỡ engine cũ

Đo bằng `pnpm build` ngay trước và ngay sau khi gỡ engine cũ. Bản "trước" là bản đã có cả hai engine (mặc định engine cũ), nên đã gồm sẵn worker và file `.wasm` của bộ giải Rust. gzip đo ở mức 9.

| | Trước | Sau |
|---|---|---|
| `dist/public` | 25.12 MiB | **11.52 MiB** |
| Runtime Python cục bộ (thư mục riêng trong `dist/public`) | 13.21 MiB (5.47 MiB gzip) | 0 |
| `dist/public/assets` | 5.40 MiB | 5.01 MiB |
| JS trong `assets` (raw / gzip) | 5.03 / 1.33 MiB | 4.64 / 1.20 MiB |
| Entry `index-*.js` (raw / gzip) | 318.9 / 97.1 KiB | 318.9 / 97.1 KiB (không đổi) |
| Worker bộ giải | 396.4 KiB (engine cũ, gồm mã Python nhúng) + 9.4 KiB | 9.4 KiB (3.7 KiB gzip) |
| File `.wasm` của bộ giải (raw / gzip) | 300.4 / 116.3 KiB | 300.4 / 116.3 KiB |
| Precache của service worker | 95 file, 6.36 MiB | 93 file, 4.78 MiB |
| Server `dist/index.js` | 124.2 KiB | 124.2 KiB |

Lượng tải của bộ giải trong trình duyệt:

- **Trước:** trang Studio tải runtime Python ngay khi mở (warmup): 13.85 MB (5.74 MB gzip) cộng worker 396 KiB (135 KiB gzip).
- **Sau:** mở trang không tải gì của bộ giải; lần bấm giải đầu tiên tải worker 9.4 KiB và file `.wasm` 300 KiB (tổng khoảng 120 KiB gzip), nhỏ hơn khoảng 45 lần.

## Đổi `tsify-next` sang `tsify` (23/11/2026)

`cargo deny check advisories` báo `tsify-next` đã ngừng bảo trì (RUSTSEC-2025-0048). `solver-wasm` chuyển sang crate `tsify` 0.5.8. Bản này coi thuộc tính `into_wasm_abi` / `from_wasm_abi` là deprecated (gây rò rỉ bộ nhớ, tsify issue #65), nên các hàm xuất ra JS giờ nhận và trả `Ts<T>`.

- File kiểu `solver_wasm.d.ts`: chữ ký hàm và kiểu giữ nguyên; chỉ khác ở chú thích (bỏ escape `\"`). File glue `solver_wasm.js` giống hệt từng byte.
- Options sai kiểu giờ trả lỗi có cấu trúc `{ code: "invalid_option" }`, thay vì ném ra tại ranh giới wasm-bindgen.
- `.wasm` sau `wasm-opt`: 308 999 byte (+428 byte).
- `cargo deny check advisories licenses`: sạch. `bench-solver.mjs --check`: đạt cả hai kịch bản.
