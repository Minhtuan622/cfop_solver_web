import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LanguageProvider } from "@/contexts/LanguageContext";

const STORAGE_KEY = "cfop-language";

function renderSwitcher() {
  return render(
    <LanguageProvider>
      <LanguageSwitcher />
    </LanguageProvider>
  );
}

describe("LanguageSwitcher", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.removeAttribute("lang");
  });

  it("offers the two languages of the interface", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole("button", { name: /Đổi ngôn ngữ/i }));

    expect(
      screen.getByRole("menuitemradio", { name: "Tiếng Việt" })
    ).toBeTruthy();
    expect(
      screen.getByRole("menuitemradio", { name: "Tiếng Anh" })
    ).toBeTruthy();
  });

  it("marks the language of the moment", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole("button", { name: /Đổi ngôn ngữ/i }));

    expect(
      screen
        .getByRole("menuitemradio", { name: "Tiếng Việt" })
        .getAttribute("aria-checked")
    ).toBe("true");
    expect(
      screen
        .getByRole("menuitemradio", { name: "Tiếng Anh" })
        .getAttribute("aria-checked")
    ).toBe("false");
  });

  it("applies and remembers the chosen language", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole("button", { name: /Đổi ngôn ngữ/i }));
    await user.click(screen.getByRole("menuitemradio", { name: "Tiếng Anh" }));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(
      screen.getByRole("button", { name: /Change the language/i })
    ).toBeTruthy();
  });

  it("closes the menu on Escape", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole("button", { name: /Đổi ngôn ngữ/i }));
    expect(screen.getByRole("menu")).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
