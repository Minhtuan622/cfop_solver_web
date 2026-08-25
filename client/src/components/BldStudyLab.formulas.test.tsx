// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { BldStudyLab } from "./BldStudyLab";

describe("BLD formula learning stage", () => {
  beforeEach(() => localStorage.clear());

  it("shows a starter algorithm and stores it as the learner preference", async () => {
    render(<BldStudyLab language="vi" />);
    fireEvent.click(screen.getByRole("tab", { name: /Học algorithm đầu tiên/i }));

    expect(screen.getByText(/Học một case, không học cả thư viện cùng lúc/i)).toBeTruthy();
    expect(screen.getByText("L2 U L2 S' L2 S U' L2")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Dùng công thức này" })[0]);

    await waitFor(() => expect(localStorage.getItem("cfop-bld-profile-v1")).toContain("L2 U L2 S' L2 S U' L2"));
  });
});
