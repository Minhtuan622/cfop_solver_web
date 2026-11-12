// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SolveTimer } from "./SolveTimer";

describe("SolveTimer keyboard cancellation", () => {
  it("records a forced DNF when Escape is pressed during a running solve", () => {
    const onComplete = vi.fn();
    render(
      <LanguageProvider>
        <SolveTimer inspectionEnabled={false} onComplete={onComplete} />
      </LanguageProvider>
    );

    fireEvent.keyDown(window, { code: "Space" });
    fireEvent.keyUp(window, { code: "Space" });
    fireEvent.keyDown(window, { code: "Escape" });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0].automaticPenalty).toBe("DNF");
  });

  it("cancels inspection with Escape without recording a solve", () => {
    const onComplete = vi.fn();
    render(
      <LanguageProvider>
        <SolveTimer inspectionEnabled onComplete={onComplete} />
      </LanguageProvider>
    );

    fireEvent.keyDown(window, { code: "Space" });
    fireEvent.keyUp(window, { code: "Space" });
    fireEvent.keyDown(window, { code: "Escape" });

    expect(onComplete).not.toHaveBeenCalled();
  });
});
