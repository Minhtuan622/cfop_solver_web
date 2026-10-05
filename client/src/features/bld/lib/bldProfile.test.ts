// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { emptyBldProfile, gradeMemo, readBldProfile, reviewStreak, writeBldProfile } from "./bldProfile";

const noon = (day: number) => new Date(2026, 7, day, 12).getTime();

describe("BLD review streak", () => {
  beforeEach(() => localStorage.clear());

  it("records real self-grades by local review day and counts the active streak", () => {
    let profile = emptyBldProfile();
    profile = gradeMemo(profile, { key: "formula:ACE", memo: "ACE", kind: "formula" }, "good", noon(23));
    profile = gradeMemo(profile, { key: "formula:ACF", memo: "ACF", kind: "formula" }, "good", noon(24));
    profile = gradeMemo(profile, { key: "formula:ACI", memo: "ACI", kind: "formula" }, "again", noon(25));

    expect(profile.reviewDays).toEqual(["2026-08-23", "2026-08-24", "2026-08-25"]);
    expect(reviewStreak(profile, noon(25))).toMatchObject({ current: 3, longest: 3, reviewedToday: true });
  });

  it("derives one-time legacy streak days from existing memo records", () => {
    const profile = emptyBldProfile();
    profile.memoRecords["formula:ACE"] = { key: "formula:ACE", memo: "ACE", kind: "formula", attempts: 1, lapses: 0, intervalDays: 1, dueAt: noon(26), lastReviewedAt: noon(25), lastGrade: "good" };
    writeBldProfile({ ...profile, reviewDays: [] });
    const stored = JSON.parse(localStorage.getItem("cfop-bld-profile-v1") ?? "{}");
    delete stored.reviewDays;
    localStorage.setItem("cfop-bld-profile-v1", JSON.stringify(stored));

    expect(readBldProfile().reviewDays).toEqual(["2026-08-25"]);
  });
});
