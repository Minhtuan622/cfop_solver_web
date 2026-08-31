// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vitest";
import { BldNextReview } from "./BldNextReview";
import { BldSightedCommutator } from "./BldSightedCommutator";
import { BldStageChecklist } from "./BldStageChecklist";
import { emptyBldProfile } from "@/lib/bldProfile";
import type { BldLearningPathProgress } from "@/lib/bldLearningPath";
import type { StarterFormula } from "./BldStudyLab";

const starter: StarterFormula = { group: "edge", kind: "edge", key: "ACE", titleVi: "Cạnh · setup với S", titleEn: "Edges · S-slice setup", algorithm: "L2 U L2 S' L2 S U' L2", noteVi: "", noteEn: "" };
const blankPath: BldLearningPathProgress = { orientationDone: false, formulaDone: false, memoDone: false, sightedDone: false, selfCheckDone: false, reviewDone: false, lastStage: 0 };

describe("BLD Study progress helpers", () => {
  it("records a stage checklist completion without replacing the rest of progress", () => {
    const onPath = vi.fn();
    render(<BldStageChecklist path={blankPath} onPath={onPath} language="vi" />);

    fireEvent.click(screen.getByLabelText(/Tôi đã chạy một commutator mở mắt/i));
    expect(onPath).toHaveBeenCalledWith({ ...blankPath, sightedDone: true });
  });

  it("prioritizes a due SRS record as the next case", () => {
    const profile = emptyBldProfile();
    profile.memoRecords["formula:edge:ACE"] = { key: "formula:edge:ACE", memo: "ACE", kind: "formula", attempts: 2, lapses: 1, intervalDays: 1, dueAt: Date.now() - 1, lastReviewedAt: 0, lastGrade: "again" };
    render(<BldNextReview profile={profile} language="vi" />);

    expect(screen.getByText("CASE NÊN ÔN NGAY")).toBeTruthy();
    expect(screen.getByText("ACE")).toBeTruthy();
  });

  it("lets a learner complete a sighted commutator and self-grade it", () => {
    const onGrade = vi.fn();
    render(<BldSightedCommutator formula={starter} language="vi" onGrade={onGrade} />);

    for (let index = 0; index < 8; index += 1) fireEvent.click(screen.getByRole("button", { name: "Nước kế bài mở mắt" }));
    fireEvent.click(screen.getByRole("button", { name: /Đã chạy đúng/i }));
    expect(onGrade).toHaveBeenCalledWith(true);
  });
});
