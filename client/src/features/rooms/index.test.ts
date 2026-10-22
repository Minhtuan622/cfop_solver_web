import { describe, expect, it } from "vitest";
import {
  RemoveSpectatorDialog,
  RoomLobby,
  RoomMemberRoster,
  RoomRoundPanel,
  RoomSidebar,
} from "./index";

describe("rooms feature public boundary", () => {
  it("exports presentation components through the feature barrel", () => {
    expect(typeof RoomLobby).toBe("function");
    expect(typeof RoomMemberRoster).toBe("function");
    expect(typeof RoomRoundPanel).toBe("function");
    expect(typeof RoomSidebar).toBe("function");
    expect(typeof RemoveSpectatorDialog).toBe("function");
  });
});
