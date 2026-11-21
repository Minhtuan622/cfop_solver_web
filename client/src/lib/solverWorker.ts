/** Worker của bộ giải CFOP: bộ giải Rust (`packages/solver`) biên dịch ra
 * WebAssembly.
 *
 * Module WASM chỉ được tải khi worker nhận request đầu tiên; bản thân worker
 * cũng chỉ được tạo khi người dùng bấm giải (xem `WasmSolverEngine`).
 * Huỷ mềm: nếu trang gửi `{ type: "init", cancelFlag }` (SharedArrayBuffer),
 * mọi request có id <= giá trị trong cờ sẽ dừng ở lần kiểm tra tiến độ kế
 * tiếp mà không mất các bảng tra đã dựng.
 */
import init, * as wasm from "@solver-wasm/solver_wasm.js";
import wasmUrl from "@solver-wasm/solver_wasm_bg.wasm?url";
import { handleWasmRequest, type WorkerRequest } from "./wasmSolverCore";

let ready: Promise<unknown> | null = null;
let cancelFlag: Int32Array | null = null;

type InitMessage = { type: "init"; cancelFlag?: SharedArrayBuffer };

self.onmessage = async (event: MessageEvent<WorkerRequest | InitMessage>) => {
  const data = event.data;
  if ("type" in data && data.type === "init") {
    cancelFlag = data.cancelFlag ? new Int32Array(data.cancelFlag) : null;
    return;
  }
  const request = data as WorkerRequest;
  try {
    ready ??= init({ module_or_path: wasmUrl });
    await ready;
  } catch {
    ready = null;
    self.postMessage({
      id: request.id,
      ok: false,
      error: "Không thể tải bộ giải WebAssembly. Hãy kiểm tra kết nối mạng rồi thử lại.",
      code: "",
    });
    return;
  }
  const reply = handleWasmRequest(
    wasm,
    request,
    message => self.postMessage(message),
    () => cancelFlag !== null && Atomics.load(cancelFlag, 0) >= request.id
  );
  self.postMessage(reply);
};
