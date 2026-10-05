// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Cube3DGuide } from "./Cube3DGuide";

vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ language: "vi" }) }));

describe("Cube3DGuide 2×2", () => {
  it("renders a six-face 2×2 model with four visible stickers per face", () => {
    const { container } = render(<Cube3DGuide state="UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB" dimension={2} step={0} />);
    const faces = container.querySelectorAll(".cube3d-face-2x2");
    expect(faces).toHaveLength(6);
    faces.forEach((face: Element) => expect(face.querySelectorAll("span")).toHaveLength(4));
  });
});
