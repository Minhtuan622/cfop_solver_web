// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

    serverRow = { payload: payloadWith(["s1"]), revision: 1 };

    serverRow = { payload: payloadWith(["s1", "s2"]), revision: 2 };

    window.dispatchEvent(new Event(CFOP_CLOUD_SYNC_EVENT));
    await new Promise(resolve => setTimeout(resolve, 1000));

    const last = saves[saves.length - 1];
    expect(last.baseVersion).toBe(2);
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

    expect(saves.length).toBe(5);
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0]).toMatch(/cloud/i);
  });
});
