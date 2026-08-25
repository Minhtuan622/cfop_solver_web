// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Settings from "./Settings";

describe("Settings cuber solution choices", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "matchMedia", { writable: true, value: () => ({ matches: false, addEventListener: () => undefined, removeEventListener: () => undefined }) });
    localStorage.setItem("cfop-app-solver-settings-v1", JSON.stringify({ crossColor: "U", opening: "xxcross", openingDepth: 8, openingFindResult: false, lastLayer: "auto", excludedSlots: [] }));
  });

  it("shows the direct tier preference and changes its current value", () => {
    render(<LanguageProvider><Settings /></LanguageProvider>);
    const toggle = screen.getByRole("switch", { name: /Ưu tiên direct đúng tier/ });
    expect((toggle as HTMLInputElement).checked).toBe(false);
    fireEvent.click(toggle);
    expect((toggle as HTMLInputElement).checked).toBe(true);
  });

  it("shows and autosaves the direct node budget", async () => {
    render(<LanguageProvider><Settings /></LanguageProvider>);
    const threshold = screen.getAllByRole("slider", { name: /Node budget direct/ }).at(-1) as HTMLInputElement;
    expect(threshold.value).toBe("5000");
    fireEvent.change(threshold, { target: { value: "12500" } });
    expect(threshold.value).toBe("12500");
    await waitFor(() => expect(JSON.parse(localStorage.getItem("cfop-app-solver-settings-v1") ?? "{}").directNodeBudget).toBe(12500), { timeout: 900 });
  });
});
