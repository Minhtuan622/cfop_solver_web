// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Settings from "./Settings";

describe("Settings opening find-result preference", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "matchMedia", { writable: true, value: () => ({ matches: false, addEventListener: () => undefined, removeEventListener: () => undefined }) });
    localStorage.setItem("cfop-app-solver-settings-v1", JSON.stringify({ crossColor: "U", opening: "xxcross", openingDepth: 8, openingFindResult: false, lastLayer: "auto", excludedSlots: [] }));
  });

  it("shows the preference for XCross-family openings and changes its current value", () => {
    render(<LanguageProvider><Settings /></LanguageProvider>);
    const toggle = screen.getByRole("switch", { name: "Ưu tiên tìm được kết quả direct" });
    expect((toggle as HTMLInputElement).checked).toBe(false);
    fireEvent.click(toggle);
    expect((toggle as HTMLInputElement).checked).toBe(true);
  });
});
