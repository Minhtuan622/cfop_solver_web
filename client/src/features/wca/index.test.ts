import { describe, expect, it } from "vitest";
import * as wca from "./index";

describe("the wca feature public boundary", () => {
  it("exports the calendar pieces through the feature barrel", () => {
    expect(typeof wca.WcaCalendarFilters).toBe("function");
    expect(typeof wca.WcaCompetitionList).toBe("function");
    expect(typeof wca.WcaCompetitionRow).toBe("function");
    expect(typeof wca.groupByMonth).toBe("function");
    expect(typeof wca.matchesQuery).toBe("function");
    expect(typeof wca.parseVenue).toBe("function");
    expect(wca.DEFAULT_PRESET_ID).toBe("90");
  });
});
