import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as wasm from "@solver-wasm/solver_wasm.js";
import { handleWasmRequest } from "@/lib/wasmSolverCore";
import type { SolverResult } from "@/lib/solverRuntime";

const SOLVED = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

beforeAll(() => {
  const file = path.resolve(
    import.meta.dirname,
    "../../../packages/solver/solver-wasm/pkg/solver_wasm_bg.wasm"
  );
  wasm.initSync({ module: readFileSync(file) });
});

describe("handleWasmRequest", () => {
  it("trả về số move cross tối ưu cho từng mặt", () => {
    const solved = handleWasmRequest(wasm, { id: 1, command: "cross", kind: "state", value: SOLVED }, () => {});
    if (solved.type !== undefined || !solved.ok) throw new Error("expected success");
    expect(JSON.parse(solved.output!)).toEqual({ U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 });

    const reply = handleWasmRequest(wasm, { id: 2, command: "cross", kind: "scramble", value: "R" }, () => {});
    if (reply.type !== undefined || !reply.ok) throw new Error("expected success");
    expect(JSON.parse(reply.output!)).toEqual({ U: 1, R: 1, F: 1, D: 1, L: 0, B: 1 });
  });

  it("báo lỗi cross khi scramble làm lệch tâm", () => {
    const reply = handleWasmRequest(wasm, { id: 3, command: "cross", kind: "scramble", value: "x" }, () => {});
    expect(reply.type === undefined && reply.ok).toBe(false);
  });

  it("giải scramble và trả về đúng tài liệu SolverResult", () => {
    const posts: unknown[] = [];
    const reply = handleWasmRequest(
      wasm,
      { id: 1, command: "solve", kind: "scramble", value: "R U R' U' F2 D L'" },
      m => posts.push(m)
    );
    expect(reply.type).toBeUndefined();
    if (reply.type !== undefined || !reply.ok) throw new Error("expected success");
    const result = JSON.parse(reply.output!) as SolverResult;
    expect(result.final_state).toBe(SOLVED);
    expect(result.trace.at(-1)?.state).toBe(SOLVED);
    expect(result.phases[0].name).toBe("cross");
    expect(result.opening.requested).toBe("cross");
    expect(result.last_layer.requested).toBe("auto");
    expect(result.initial_state).toBe(wasm.scrambleToStickers("R U R' U' F2 D L'"));
    expect(result.algorithm.split(" ").length).toBeGreaterThan(5);
  });

  it("bld trả về memo 3-Style", () => {
    const reply = handleWasmRequest(
      wasm,
      { id: 2, command: "bld", kind: "scramble", value: "R U" },
      () => undefined
    );
    if (reply.type !== undefined || !reply.ok) throw new Error("expected success");
    const out = JSON.parse(reply.output!);
    expect(out.analysis.method).toBe("3style-speffz");
    expect(out.initial_state).toHaveLength(54);
  });

  it("lỗi có cấu trúc: mã + thông điệp", () => {
    const reply = handleWasmRequest(
      wasm,
      { id: 3, command: "solve", kind: "state", value: "UUU" },
      () => undefined
    );
    expect(reply).toMatchObject({ id: 3, ok: false, code: "invalid_input" });
    const scramble = handleWasmRequest(
      wasm,
      { id: 4, command: "solve", kind: "scramble", value: "R Q" },
      () => undefined
    );
    expect(scramble).toMatchObject({ ok: false, code: "invalid_input" });
  });

  it("huỷ giữa chừng qua callback tiến độ", () => {
    const reply = handleWasmRequest(
      wasm,
      { id: 5, command: "solve", kind: "scramble", value: "D2 F2 U' B2 R2 B2 R2 L B' D' F D2 F B2 U' R' L F2 U2" },
      () => undefined,
      () => true
    );
    expect(reply).toMatchObject({ ok: false, code: "cancelled" });
  });
});
