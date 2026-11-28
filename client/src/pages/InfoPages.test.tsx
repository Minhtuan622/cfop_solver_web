// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import About from "./About";
import Donate from "./Donate";
import Guide from "./Guide";

function renderPage(page: React.ReactNode) {
  return render(<LanguageProvider>{page}</LanguageProvider>);
}

afterEach(cleanup);

describe("trang thông tin", () => {
  it("Về chúng tôi: tiêu đề, nút hành động và bốn tính năng dẫn vào đúng trang", () => {
    renderPage(<About />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Rubik");
    expect(screen.getByRole("link", { name: /Thử giải khối/ }).getAttribute("href")).toBe("/");
    const features = screen.getByRole("region", { name: "Bạn có thể làm gì" });
    const hrefs = within(features).getAllByRole("link").map(link => link.getAttribute("href"));
    expect(hrefs).toEqual(["/", "/timer", "/study", "/rooms"]);
    expect(screen.getAllByRole("link", { name: /Mở trên GitHub/ })).toHaveLength(2);
  });

  it("Hướng dẫn: mục lục có bốn nhóm và mọi phần có link dẫn tới trang, trừ Tài khoản", () => {
    renderPage(<Guide />);
    const toc = screen.getByRole("navigation", { name: "Mục lục" });
    expect(within(toc).getAllByRole("link")).toHaveLength(4);
    const openLinks = screen.getAllByRole("link", { name: "Mở trang" });
    expect(openLinks.map(link => link.getAttribute("href"))).toEqual([
      "/", "/study", "/play", "/timer", "/history", "/rooms", "/competition", "/wca", "/settings",
    ]);
    expect(screen.getByRole("heading", { name: "Tài khoản và đồng bộ" })).toBeTruthy();
  });

  it("Ủng hộ: khu vực QR báo chưa có ảnh và còn đủ bốn cách ủng hộ miễn phí", () => {
    renderPage(<Donate />);
    expect(screen.getByText("Chưa có ảnh QR")).toBeTruthy();
    for (const name of ["Tặng một sao", "Chia sẻ", "Báo lỗi, góp ý", "Đóng góp"]) {
      expect(screen.getByText(name)).toBeTruthy();
    }
    expect(screen.getByRole("link", { name: /Mở GitHub/ })).toBeTruthy();
  });
});
