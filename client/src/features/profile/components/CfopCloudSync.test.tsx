// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression test cho A1: đồng bộ đám mây không được ghi đè dữ liệu mới.
 *
 * Lỗi thật: máy chủ tự đọc phiên bản hiện tại rồi truyền lại làm phiên bản
 * mong đợi, nên không bao giờ phát hiện client đang giữ bản cũ; thêm nữa cột
 * `version` của dòng lại được tính bằng `payload.version + 1` nên luôn bằng
 * 3. Kết quả: thiết bị D2 (dữ liệu cũ) ghi đè mất lần giải của D1.
 *
 * Test mô phỏng máy chủ đúng theo hành vi đã sửa: so sánh `baseVersion` của
 * client với revision của dòng, tăng revision sau mỗi lần ghi và trả
 * CONFLICT khi lệch.
 */

type CloudRow = { payload: Record<string, unknown>; revision: number };

let serverRow: CloudRow | null = null;
let conflictBurst = 0;
const saves: {
  baseVersion: number | null;
  payload: Record<string, unknown>;
}[] = [];
const toasts: string[] = [];

vi.mock("sonner", () => ({
  toast: {
    error: (message: string) => {
      toasts.push(message);
    },
  },
}));

const handlers: {
  save?: {
    onError?: (error: unknown) => void;
    onSuccess?: (result: unknown) => void;
  };
} = {};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({}),
    cfopAccount: {
      me: { useQuery: () => ({ data: { id: 7 } }) },
      cloudState: {
        get: {
          useQuery: () => ({
            data: serverRow
              ? {
                  payload: serverRow.payload,
                  updatedAt: new Date(0),
                  revision: serverRow.revision,
                }
              : null,
            isSuccess: true,
            refetch: async () => ({
              data: serverRow
                ? {
                    payload: serverRow.payload,
                    updatedAt: new Date(0),
                    revision: serverRow.revision,
                  }
                : null,
            }),
          }),
        },
        save: {
          useMutation: (options: {
            onError?: (error: unknown) => void;
            onSuccess?: (result: unknown) => void;
          }) => {
            handlers.save = options;
            return {
              mutate: (
                input: { baseVersion: number | null } & Record<string, unknown>
              ) => {
                saves.push({ baseVersion: input.baseVersion, payload: input });
                if (conflictBurst > 0) {
                  conflictBurst -= 1;
                  options.onError?.({ data: { code: "CONFLICT" } });
                  return;
                }
                const current = serverRow?.revision ?? 0;
                if ((input.baseVersion ?? 0) !== current) {
                  options.onError?.({ data: { code: "CONFLICT" } });
                  return;
                }
                serverRow = { payload: input, revision: current + 1 };
                options.onSuccess?.({
                  updatedAt: new Date(0),
                  revision: current + 1,
                });
              },
              isPending: false,
            };
          },
        },
      },
    },
  },
}));

import { CfopCloudSync } from "./CfopCloudSync";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CFOP_CLOUD_SYNC_EVENT } from "@/lib/cloudSyncSignal";

function payloadWith(ids: string[]) {
  return {
    schema: "cfop-account-cloud-state",
    schemaVersion: 2,
    capturedAt: Date.now(),
    timer: ids.map(id => ({
      id,
      createdAt: Date.now(),
      elapsedMs: 10_000,
      inspectionMs: 15_000,
      input: "R U",
      inputKind: "scramble",
      moves: 2,
      penalty: "none",
      solution: "R U",
      note: "",
      tags: [],
      phaseSplits: [],
    })),
    lastLayer: { study: { records: {}, dailyGoal: 0 }, masteredCaseKeys: [] },
    bldProfile: {
      preferredAlgorithms: {},
      memoRecords: {},
      pairCards: {},
      drillAttempts: [],
      reviewDays: [],
      audioEnabled: true,
      dailyGoal: 0,
    },
    bldLearningPath: {
      orientationDone: false,
      formulaDone: false,
      memoDone: false,
      sightedDone: false,
      selfCheckDone: false,
      reviewDone: false,
      lastStage: 0,
    },
  };
}

function timerIds(payload: Record<string, unknown> | undefined): string[] {
  const timer = (payload?.timer ?? []) as { id: string }[];
  return timer.map(entry => entry.id).sort();
}

describe("A1: đồng bộ đám mây theo revision của dòng", () => {
  beforeEach(() => {
    serverRow = null;
    conflictBurst = 0;
    saves.length = 0;
    toasts.length = 0;
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("lần lưu đầu tiên dùng baseVersion null và vẫn thành công", () => {
    render(
      <LanguageProvider>
        <CfopCloudSync />
      </LanguageProvider>
    );

    expect(saves.length).toBe(1);
    expect(saves[0].baseVersion).toBeNull();
    expect(serverRow?.revision).toBe(1);
  });

  it("client cũ bị CONFLICT rồi gộp và lưu lại với revision mới, không mất dữ liệu", async () => {
    render(
      <LanguageProvider>
        <CfopCloudSync />
      </LanguageProvider>
    );

    // D1 đã lưu lần giải "s1" (revision hiện tại = 1).
    serverRow = { payload: payloadWith(["s1"]), revision: 1 };

    // D1 lại lưu thêm "s2" ở nơi khác → revision tăng lên 2.
    serverRow = { payload: payloadWith(["s1", "s2"]), revision: 2 };

    // D2 (đang giữ bản cũ, revision 1) thử lưu: server trả CONFLICT, client
    // phải đọc lại, gộp rồi lưu với revision 2.
    window.dispatchEvent(new Event(CFOP_CLOUD_SYNC_EVENT));
    await new Promise(resolve => setTimeout(resolve, 1000));

    const last = saves[saves.length - 1];
    expect(last.baseVersion).toBe(2);
    // Cả s1 của D1 và s2 đều còn trong bản gộp.
    expect(timerIds(last.payload)).toEqual(["s1", "s2"]);
    expect(serverRow?.revision).toBe(3);
  });

  it("dừng thử lại sau 3 lần xung đột và báo lỗi thân thiện", async () => {
    render(
      <LanguageProvider>
        <CfopCloudSync />
      </LanguageProvider>
    );
    conflictBurst = 10;

    window.dispatchEvent(new Event(CFOP_CLOUD_SYNC_EVENT));
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 1 lần lưu lúc mount + 1 lần lưu kích hoạt + tối đa 3 lần thử lại.
    expect(saves.length).toBe(5);
    // Đã dừng thử lại và báo lỗi thân thiện.
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0]).toMatch(/cloud/i);
  });
});
