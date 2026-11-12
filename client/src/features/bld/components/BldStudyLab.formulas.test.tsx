// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it } from "vitest";
import { BldStudyLab } from "./BldStudyLab";
import { BldTargetSelfCheck } from "./BldTargetSelfCheck";

describe("BLD formula learning stage", () => {
  beforeEach(() => localStorage.clear());

  it(
    "shows a starter algorithm and stores it as the learner preference",
    { timeout: 15_000 },
    async () => {
      render(<BldStudyLab language="vi" />);
      fireEvent.click(screen.getByRole("tab", { name: /Học nhịp đầu tiên/i }));

      expect(screen.getByText("MỤC TIÊU HÔM NAY")).toBeTruthy();
      expect(
        screen.getByText("Chọn một case, không mở catalog lớn.")
      ).toBeTruthy();
      expect(
        screen.getByText(/Học một case, không học cả thư viện cùng lúc/i)
      ).toBeTruthy();
      expect(
        screen.getAllByText("L2 U L2 S' L2 S U' L2").length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByLabelText(/Mô hình Rubik 3D/i).length
      ).toBeGreaterThan(0);
      expect(screen.getByText("Target scramble")).toBeTruthy();
      expect(
        screen.getByText("Năm nhịp luyện 3-Style dễ áp dụng")
      ).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Xem mẹo" }));
      expect(
        screen.getByRole("link", { name: /J Perm · 3×3 Blindfolded/i })
      ).toHaveProperty("href", "https://www.youtube.com/watch?v=9KPqwwKNldc");
      fireEvent.change(screen.getByLabelText("Solution của bạn"), {
        target: { value: "U' L2 U L2 S' L2 S U' L2" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Kiểm tra solution" })
      );
      expect(
        screen.getByText(/Đúng\. Solution của bạn đưa target scramble có AUF/i)
      ).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", { name: "Đổi AUF target scramble" })
      );
      expect(screen.getByText("AUF: U2")).toBeTruthy();
      fireEvent.change(screen.getByLabelText("Solution của bạn"), {
        target: { value: "U2 L2 U L2 S' L2 S U' L2" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Kiểm tra solution" })
      );
      expect(
        screen.getByText(/Đúng\. Solution của bạn đưa target scramble có AUF/i)
      ).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", { name: "Đổi AUF target scramble" })
      );
      expect(screen.getByText("AUF: U'")).toBeTruthy();
      fireEvent.change(screen.getByLabelText("Solution của bạn"), {
        target: { value: "U L2 U L2 S' L2 S U' L2" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Kiểm tra solution" })
      );
      expect(
        screen.getByText(/Đúng\. Solution của bạn đưa target scramble có AUF/i)
      ).toBeTruthy();
      fireEvent.click(
        screen.getAllByRole("button", { name: "Dùng công thức này" })[0]
      );

      await waitFor(() =>
        expect(localStorage.getItem("cfop-bld-profile-v1")).toContain(
          "L2 U L2 S' L2 S U' L2"
        )
      );
    }
  );

  it("keeps a catalog formula visible without crashing when its notation is unsupported", () => {
    const view = render(
      <BldTargetSelfCheck
        language="vi"
        formula={{
          group: "edge",
          kind: "edge",
          key: "TEST",
          titleVi: "Cạnh · TEST",
          titleEn: "Edge · TEST",
          algorithm: "Q U",
          noteVi: "",
          noteEn: "",
        }}
      />
    );

    expect(
      view.getByText(/ký hiệu chưa được cube engine hỗ trợ/i)
    ).toBeTruthy();
    expect(view.container.querySelector("#bld-target-answer")).toBeNull();
  });
});
