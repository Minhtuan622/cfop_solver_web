import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

function Boom(): never {
  throw new Error("secret internal detail");
}

describe("ErrorBoundary", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows a friendly message instead of the stack", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: /lỗi không mong muốn/i })).toBeTruthy();
    expect(screen.queryByText(/secret internal detail/)).toBeNull();
    expect(document.querySelector("pre")).toBeNull();
  });

  it("keeps rendering the children while nothing fails", () => {
    render(
      <ErrorBoundary>
        <p>everything is fine</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText("everything is fine")).toBeTruthy();
  });
});
