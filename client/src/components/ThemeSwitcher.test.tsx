import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { THEME_STORAGE_KEY } from "@/lib/theme";

function renderSwitcher() {
  return render(
    <ThemeProvider>
      <ThemeSwitcher />
    </ThemeProvider>
  );
}

describe("ThemeSwitcher", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("offers the three palettes in a menu", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole("button", { name: /giao diện/i }));

    expect(screen.getByRole("menuitemradio", { name: /Sáng/ })).toBeTruthy();
    expect(screen.getByRole("menuitemradio", { name: /Tối/ })).toBeTruthy();
    expect(
      screen.getByRole("menuitemradio", { name: /Hệ thống/ })
    ).toBeTruthy();
  });

  it("applies and remembers the chosen palette", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole("button", { name: /giao diện/i }));
    await user.click(screen.getByRole("menuitemradio", { name: /Tối/ }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("closes the menu on Escape", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole("button", { name: /giao diện/i }));
    expect(screen.getByRole("menu")).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
