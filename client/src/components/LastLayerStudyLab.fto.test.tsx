import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LastLayerStudyLab } from "./LastLayerStudyLab";

vi.mock("@/components/FtoStudyLab", () => ({ FtoStudyLab: () => <div data-testid="fto-study-lab">FTO study</div> }));
vi.mock("@/components/BldStudyLab", () => ({ BldStudyLab: () => <div>BLD study</div> }));
vi.mock("@/components/LastLayerExplorer", () => ({ LastLayerExplorer: () => <div>Last Layer explorer</div> }));
vi.mock("@/components/SolveTimer", () => ({ SolveTimer: () => <div>Timer</div> }));
vi.mock("@/components/BootstrapUI", () => ({ StatusFeedback: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/BootstrapIcon", () => ({ Check: () => null, Download: () => null, FileUp: () => null, Sparkles: () => null, TimerReset: () => null }));
vi.mock("@/lib/solverRuntime", () => ({ listLastLayerCasesInBrowser: vi.fn().mockResolvedValue([]) }));

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("Study FTO navigation", () => {
  it("always renders an FTO tab and opens it from the lane deep-link", async () => {
    window.history.replaceState({}, "", "/study?lane=fto");
    render(<LastLayerStudyLab language="vi" />);

    expect(screen.getByRole("tab", { name: "FTO" })).toBeTruthy();
    expect(await screen.findByTestId("fto-study-lab")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "FTO" }).getAttribute("aria-selected")).toBe("true");
  });
});
