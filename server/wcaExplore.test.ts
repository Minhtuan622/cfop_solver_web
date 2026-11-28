import { describe, expect, it } from "vitest";
import {
  distanceKm,
  groupCompetitionResults,
  normalizeDelegates,
  normalizeNearby,
  normalizePsychSheet,
  normalizeTeams,
  pickMyAgenda,
  reduceWcif,
} from "./services/wca/explore";

describe("groupCompetitionResults", () => {
  it("orders events and rounds and ranks rows by position", () => {
    const result = groupCompetitionResults([
      { event_id: "444", round_type_id: "f", pos: 2, best: 900, average: 1000, name: "B", country_iso2: "VN", attempts: [900, 1000] },
      { event_id: "333", round_type_id: "f", pos: 2, best: 800, average: 900, name: "C" },
      { event_id: "333", round_type_id: "1", pos: 1, best: 700, average: 800, name: "A" },
      { event_id: "333", round_type_id: "f", pos: 1, best: 600, average: 700, name: "D", regional_single_record: "NR" },
    ]);
    expect(result.resultCount).toBe(4);
    expect(result.events.map(event => event.eventId)).toEqual(["333", "444"]);
    expect(result.events[0].rounds.map(round => round.roundTypeId)).toEqual(["1", "f"]);
    expect(result.events[0].rounds[1].rows.map(row => row.name)).toEqual(["D", "C"]);
    expect(result.events[0].rounds[1].rows[0].singleRecord).toBe("NR");
  });
});

describe("normalizePsychSheet", () => {
  it("keeps positions and drops missing ranks", () => {
    const sheet = normalizePsychSheet("333", {
      sort_by: "average",
      sorted_rankings: [
        { name: "A", wca_id: "2018AAAA01", average_best: 618, average_rank: 169, single_best: 494, single_rank: 318, pos: 1 },
        { name: "B", average_best: 0, single_best: 700 },
        { name: null },
      ],
    });
    expect(sheet.sortBy).toBe("average");
    expect(sheet.rows).toHaveLength(2);
    expect(sheet.rows[1].average.best).toBeNull();
    expect(sheet.rows[1].pos).toBe(2);
  });
});

describe("WCIF schedule", () => {
  const wcif = {
    persons: [
      {
        name: "Me",
        wcaId: "2018ABCD01",
        registrantId: 1,
        registration: { status: "accepted", eventIds: ["333"] },
        assignments: [
          { activityId: 3, assignmentCode: "competitor", stationNumber: 4 },
          { activityId: 99, assignmentCode: "staff-judge" },
        ],
      },
      { name: "Pending", wcaId: "2018EFGH01", registration: { status: "pending", eventIds: [] }, assignments: [] },
    ],
    schedule: {
      venues: [
        {
          name: "Hall",
          timezone: "Asia/Bangkok",
          rooms: [
            {
              name: "Main",
              color: "#304a96",
              activities: [
                {
                  id: 2,
                  name: "3x3x3 Cube, Round 1",
                  activityCode: "333-r1",
                  startTime: "2027-01-02T03:45:00Z",
                  endTime: "2027-01-02T05:15:00Z",
                  childActivities: [
                    { id: 3, name: "3x3x3 Cube, Round 1, Group 1", activityCode: "333-r1-g1", startTime: "2027-01-02T03:45:00Z", endTime: "2027-01-02T04:30:00Z" },
                  ],
                },
                { id: 1, name: "Check-in", activityCode: "other-checkin", startTime: "2027-01-02T02:00:00Z", endTime: "2027-01-02T02:30:00Z" },
              ],
            },
          ],
        },
      ],
    },
  };

  it("flattens activities in time order and keeps accepted people only", () => {
    const reduced = reduceWcif(wcif);
    expect(reduced.timezone).toBe("Asia/Bangkok");
    expect(reduced.activities.map(activity => activity.id)).toEqual([1, 2, 3]);
    expect(reduced.activities[2].parentId).toBe(2);
    expect(reduced.people).toHaveLength(1);
  });

  it("builds the personal agenda and skips unknown activities", () => {
    const me = pickMyAgenda(reduceWcif(wcif), "2018ABCD01");
    expect(me?.agenda).toHaveLength(1);
    expect(me?.agenda[0].activity.code).toBe("333-r1-g1");
    expect(me?.agenda[0].stationNumber).toBe(4);
    expect(pickMyAgenda(reduceWcif(wcif), "2018ZZZZ01")).toBeNull();
    expect(pickMyAgenda(reduceWcif(wcif), null)).toBeNull();
  });
});

describe("nearby competitions", () => {
  const rows = [
    { id: "Far", name: "Far", start_date: "2027-01-01", end_date: "2027-01-02", latitude_degrees: 10.8, longitude_degrees: 106.7, base_entry_fee_lowest_denomination: 200000, currency_code: "VND" },
    { id: "Near", name: "Near", start_date: "2027-03-01", end_date: "2027-03-02", latitude_degrees: 21.0, longitude_degrees: 105.8 },
    { id: "NoGeo", name: "NoGeo", start_date: "2027-02-01", end_date: "2027-02-02" },
  ];

  it("sorts by date without an origin", () => {
    expect(normalizeNearby(rows, null).map(row => row.id)).toEqual(["Far", "NoGeo", "Near"]);
  });

  it("sorts by distance and puts unknown places last", () => {
    const sorted = normalizeNearby(rows, { lat: 21.03, lng: 105.85 });
    expect(sorted.map(row => row.id)).toEqual(["Near", "Far", "NoGeo"]);
    expect(sorted[0].distanceKm).toBeLessThan(20);
    expect(sorted[1].distanceKm).toBeGreaterThan(1000);
    expect(sorted[2].distanceKm).toBeNull();
    expect(sorted[1].entryFee).toEqual({ lowestDenomination: 200000, currency: "VND" });
  });

  it("measures great-circle distance", () => {
    expect(distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(111.19, 1);
  });
});

describe("community", () => {
  it("never copies e-mail addresses", () => {
    const delegates = normalizeDelegates([
      {
        wca_id: "2014ZAKR01",
        name: "Karol",
        delegate_status: "senior_delegate",
        country_iso2: "PL",
        country: { name: "Poland" },
        email: "x@example.com",
      } as never,
      { wca_id: "2000XXXX01", name: "No status" },
    ]);
    expect(delegates).toHaveLength(1);
    expect(JSON.stringify(delegates)).not.toContain("example.com");
  });

  it("groups team members and puts leaders first", () => {
    const teams = normalizeTeams([
      { user: { name: "B", wca_id: "2010BBBB01" }, group: { name: "WRT" }, metadata: { status: "member" } },
      { user: { name: "A", wca_id: "2010AAAA01" }, group: { name: "WRT" }, metadata: { status: "leader" } },
      { user: { name: "C" }, group: { name: "WCT" } },
    ]);
    expect(teams.map(team => team.name)).toEqual(["WCT", "WRT"]);
    expect(teams[1].members.map(member => member.name)).toEqual(["A", "B"]);
  });
});
