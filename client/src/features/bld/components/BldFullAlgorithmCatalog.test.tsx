// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { fireEvent, screen } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BldFullAlgorithmCatalog } from "./BldFullAlgorithmCatalog";
import { loadFullBldCatalog, type BldCatalogCase } from "@/features/bld";

vi.mock("@/features/bld", async () => {
  const actual = await vi.importActual<typeof import("@/features/bld")>("@/features/bld");
  return { ...actual, loadFullBldCatalog: vi.fn() };
});

const catalog: BldCatalogCase[] = [
  { group: "edge", kind: "edge", key: "ACE", algorithms: ["L2 U L2 S' L2 S U' L2", "U' M2 U' M U2 M' U' M2 U"] },
  { group: "corner", kind: "corner", key: "ADM", algorithms: ["U' R' D R U' R' D' R U2"] },
  { group: "special", kind: "flip", key: "BD", algorithms: ["R S2 R2 S' R U R' S R2 S2 R' U'"] },
];

describe("full 3-Style catalog", () => {
  beforeEach(() => { vi.mocked(loadFullBldCatalog).mockResolvedValue([...catalog]); });

  it("opens every group and sends a selected variant to the learning stage", async () => {
    const onChoose = vi.fn();
    render(<BldFullAlgorithmCatalog language="vi" onChoose={onChoose} />);

    fireEvent.click(screen.getByRole("button", { name: "Mở thư viện đầy đủ" }));
    expect(await screen.findByText("ACE")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Xem biến thể" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Dùng biến thể này" })[0]);
    expect(onChoose).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "edge", key: "ACE", algorithm: "L2 U L2 S' L2 S U' L2" }));

    fireEvent.click(screen.getByRole("button", { name: "Góc" }));
    expect(await screen.findByText("ADM")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Xem biến thể" }));
    fireEvent.click(screen.getByRole("button", { name: "Dùng biến thể này" }));
    expect(onChoose).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "corner", key: "ADM" }));

    fireEvent.click(screen.getByRole("button", { name: "Đặc biệt" }));
    expect(await screen.findByText("BD")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Xem biến thể" }));
    fireEvent.click(screen.getByRole("button", { name: "Dùng biến thể này" }));
    expect(onChoose).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "flip", key: "BD" }));
  });
});
