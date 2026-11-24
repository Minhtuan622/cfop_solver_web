import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LastLayerExplorer } from "./LastLayerExplorer";
import type { LastLayerCatalogCase } from "@/lib/solverRuntime";

afterEach(() => cleanup());

const makeCase = (
  family: "zbll" | "1lll",
  id: string,
  group: string
): LastLayerCatalogCase => ({
  family,
  id,
  group,
  algorithm: `R U R' F2 ${id}`,
  state: "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB",
});

const catalog = [
  makeCase("zbll", "AS-001", "AS"),
  makeCase("zbll", "AS-002", "AS"),
  makeCase("zbll", "AS-003", "AS"),
  makeCase("1lll", "H-1", "H"),
];

function openGroup(name: string) {
  fireEvent.click(screen.getByText(name));
}

describe("LastLayerExplorer bulk selection", () => {
  it("marks every visible case of the group as mastered in one action", () => {
    const onMasteredChange = vi.fn();
    render(
      <LastLayerExplorer
        catalog={catalog}
        family="all"
        selectedCase={null}
        masteredKeys={new Set()}
        onFamily={() => undefined}
        onSelect={() => undefined}
        onMasteredChange={onMasteredChange}
      />
    );
    openGroup("AS");
    fireEvent.click(screen.getByRole("button", { name: "Chọn nhiều" }));
    fireEvent.click(screen.getByRole("button", { name: "Chọn tất cả" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Đánh dấu đã thuộc \(3\)/ })
    );
    expect(onMasteredChange).toHaveBeenCalledTimes(1);
    const keys = onMasteredChange.mock.calls[0][0] as Set<string>;
    expect([...keys].sort()).toEqual(["zbll:AS-001", "zbll:AS-002", "zbll:AS-003"]);
  });

  it("unmarks the selected cases through the bulk bar", () => {
    const onMasteredChange = vi.fn();
    render(
      <LastLayerExplorer
        catalog={catalog}
        family="all"
        selectedCase={null}
        masteredKeys={new Set(["zbll:AS-001", "zbll:AS-002"])}
        onFamily={() => undefined}
        onSelect={() => undefined}
        onMasteredChange={onMasteredChange}
      />
    );
    openGroup("AS");
    fireEvent.click(screen.getByRole("button", { name: "Chọn nhiều" }));
    fireEvent.click(screen.getByRole("button", { name: "Chọn tất cả" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Bỏ đánh dấu \(3\)/ })
    );
    const keys = onMasteredChange.mock.calls[0][0] as Set<string>;
    expect(keys.size).toBe(0);
  });

  it("selecting individual cards toggles the count and respects the filtered view", () => {
    const onMasteredChange = vi.fn();
    render(
      <LastLayerExplorer
        catalog={catalog}
        family="zbll"
        selectedCase={null}
        masteredKeys={new Set()}
        onFamily={() => undefined}
        onSelect={() => undefined}
        onMasteredChange={onMasteredChange}
      />
    );
    openGroup("AS");
    fireEvent.click(screen.getByRole("button", { name: "Chọn nhiều" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn nhiều AS-002" }));
    expect(screen.getByText("Đã chọn 1/3")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: /Đánh dấu đã thuộc \(1\)/ })
    );
    const keys = onMasteredChange.mock.calls[0][0] as Set<string>;
    expect(keys.has("zbll:AS-002")).toBe(true);
    expect(keys.size).toBe(1);
  });
});
