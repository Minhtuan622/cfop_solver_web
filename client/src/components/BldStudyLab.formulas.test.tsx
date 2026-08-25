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
    expect(screen.getByLabelText(/Mô hình Rubik 3D/i)).toBeTruthy();
    expect(screen.getByText("Target scramble")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Solution của bạn"), { target: { value: "L2 U L2 S' L2 S U' L2" } });
    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra solution" }));
    expect(screen.getByText(/Đúng\. Solution của bạn đưa target scramble/i)).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Dùng công thức này" })[0]);

    await waitFor(() => expect(localStorage.getItem("cfop-bld-profile-v1")).toContain("L2 U L2 S' L2 S U' L2"));
  });
});
