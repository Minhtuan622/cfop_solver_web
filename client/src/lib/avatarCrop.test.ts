import { describe, expect, it } from "vitest";
import { centeredAvatarCrop, clampAvatarCrop, zoomAvatarCrop } from "./avatarCrop";

describe("avatar crop", () => {
  it("căn giữa ảnh ngang theo cover, không để lộ nền trong khung vuông", () => {
    expect(centeredAvatarCrop(560, 280)).toEqual({ zoom: 1, x: -140, y: 0 });
  });

  it("giới hạn kéo ảnh trong vùng phủ kín khung", () => {
    expect(clampAvatarCrop({ zoom: 1, x: 40, y: 80 }, 560, 280)).toEqual({ zoom: 1, x: 0, y: 0 });
    expect(clampAvatarCrop({ zoom: 1, x: -999, y: -999 }, 560, 280)).toEqual({ zoom: 1, x: -280, y: 0 });
  });

  it("giữ vùng giữa khi thay đổi mức phóng to", () => {
    const centered = centeredAvatarCrop(560, 280);
    expect(zoomAvatarCrop(centered, 2, 560, 280)).toEqual({ zoom: 2, x: -420, y: -140 });
  });
});
