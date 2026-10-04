import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingTransition } from "./BootstrapUI";

describe("LoadingTransition", () => {
  it("giữ nội dung và chuyển sang trạng thái hiển thị sau frame", async () => {
    render(<LoadingTransition>Đã tải</LoadingTransition>);

    const content = screen.getByText("Đã tải");
    expect(content?.classList.contains("loading-content")).toBe(true);
    await waitFor(() => expect(content?.classList.contains("loading-content-ready")).toBe(true));
    expect(screen.getByText("Đã tải")).not.toBeNull();
  });
});
