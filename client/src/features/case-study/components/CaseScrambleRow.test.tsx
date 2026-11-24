// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyFastMoves, SOLVED_FAST_STATE } from "@/lib/fastCube";

vi.mock("@/contexts/LanguageContext", async () => {
  const { translate } = await import("@/lib/i18n");
  return {
    useLanguage: () => ({
      language: "vi" as const,
      t: (key: string, params?: Record<string, string | number>) => translate("vi", key, params),
    }),
  };
});
const navigate = vi.fn();
vi.mock("wouter", () => ({ useLocation: () => ["/study", navigate] }));

import { CaseScrambleRow, withRandomAuf } from "./CaseScrambleRow";

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe("withRandomAuf", () => {
  it("chỉ thêm U / U2 / U' ở hai đầu và giữ nguyên phần giữa", () => {
    for (let index = 0; index < 50; index += 1) {
      const text = withRandomAuf("R U R' U'");
      expect(text).toMatch(/^(U2? |U' )?R U R' U'( U2?| U')?$/);
    }
  });

  it("dùng đúng bộ sinh số ngẫu nhiên được truyền vào", () => {
    expect(withRandomAuf("R", () => 0)).toBe("R");
    expect(withRandomAuf("R", () => 0.99)).toBe("U' R U'");
  });
});

describe("CaseScrambleRow", () => {
  it("hiện scramble, mở Timer với đúng event và scramble", () => {
    render(<CaseScrambleRow eventId="222" scramble="R U R' U'" />);
    expect(screen.getByTestId("case-scramble-text").textContent).toBe("R U R' U'");
    fireEvent.click(screen.getByRole("button", { name: "Mở trong Timer" }));
    expect(navigate).toHaveBeenCalledWith("/timer?event=222&scramble=R+U+R%27+U%27");
    // 2×2 không có AUF ngẫu nhiên.
    expect(screen.queryByRole("button", { name: "AUF ngẫu nhiên" })).toBeNull();
  });

  it("3×3: bật AUF ngẫu nhiên rồi đổi AUF khác", () => {
    render(<CaseScrambleRow eventId="333" scramble="R U R' U'" />);
    const button = screen.getByRole("button", { name: "AUF ngẫu nhiên" });
    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("case-scramble-text").textContent).toContain("R U R' U'");
    expect(screen.getByRole("button", { name: "AUF khác" })).toBeTruthy();
  });

  it("scramble của case đưa khối đã giải về đúng case (nghịch đảo thuật toán)", () => {
    const algorithm = "R U R' U R U2 R'";
    const scramble = "R U2 R' U' R U' R'";
    const solved = applyFastMoves(applyFastMoves(SOLVED_FAST_STATE, scramble), algorithm);
    expect(solved).toBe(SOLVED_FAST_STATE);
  });
});
