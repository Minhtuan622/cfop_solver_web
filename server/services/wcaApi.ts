/**
 * Adapter cho WCA public API. Chia thành ba module trong `./wca/`:
 * `types` (kiểu dữ liệu), `http` (cache, giới hạn tần suất, lỗi) và `queries`
 * (các truy vấn nghiệp vụ). Module này giữ nguyên tên export cũ.
 */
export * from "./wca/http";
export * from "./wca/queries";
export * from "./wca/types";
