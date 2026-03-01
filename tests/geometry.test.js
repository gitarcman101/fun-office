import { describe, it, expect } from "vitest";
import {
  clamp,
  getAvatarBox,
  intersects,
  distanceSq,
  isInsideMeetingDoor,
  clampMeetingPos,
  MEETING_SCENE_DOOR,
} from "../lib/geometry.js";

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min when below", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it("clamps to max when above", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("returns min when value equals min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe("getAvatarBox", () => {
  it("returns correct bounding box for origin-like position", () => {
    const box = getAvatarBox(100, 200);
    expect(box).toEqual({ x: 82, y: 144, w: 36, h: 48 });
  });

  it("handles zero position", () => {
    const box = getAvatarBox(0, 0);
    expect(box).toEqual({ x: -18, y: -56, w: 36, h: 48 });
  });

  it("always produces width 36 and height 48", () => {
    const box = getAvatarBox(999, 999);
    expect(box.w).toBe(36);
    expect(box.h).toBe(48);
  });
});

describe("intersects", () => {
  it("detects overlapping rectangles", () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 5, y: 5, w: 10, h: 10 };
    expect(intersects(a, b)).toBe(true);
  });

  it("returns false for adjacent non-overlapping rectangles", () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 10, y: 0, w: 10, h: 10 };
    expect(intersects(a, b)).toBe(false);
  });

  it("returns false for separated rectangles", () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 100, y: 100, w: 10, h: 10 };
    expect(intersects(a, b)).toBe(false);
  });

  it("detects contained rectangle", () => {
    const a = { x: 0, y: 0, w: 100, h: 100 };
    const b = { x: 10, y: 10, w: 5, h: 5 };
    expect(intersects(a, b)).toBe(true);
  });

  it("is symmetric", () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 5, y: 5, w: 10, h: 10 };
    expect(intersects(a, b)).toBe(intersects(b, a));
  });
});

describe("distanceSq", () => {
  it("returns 0 for same point", () => {
    expect(distanceSq({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it("calculates squared distance correctly", () => {
    expect(distanceSq({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(25);
  });

  it("is symmetric", () => {
    const a = { x: 1, y: 2 };
    const b = { x: 4, y: 6 };
    expect(distanceSq(a, b)).toBe(distanceSq(b, a));
  });
});

describe("isInsideMeetingDoor", () => {
  it("returns true for position inside the door", () => {
    const center = {
      x: MEETING_SCENE_DOOR.x + MEETING_SCENE_DOOR.w / 2,
      y: MEETING_SCENE_DOOR.y + MEETING_SCENE_DOOR.h / 2,
    };
    expect(isInsideMeetingDoor(center)).toBe(true);
  });

  it("returns true for position at door boundary", () => {
    expect(isInsideMeetingDoor({ x: MEETING_SCENE_DOOR.x, y: MEETING_SCENE_DOOR.y })).toBe(true);
  });

  it("returns false for position outside the door", () => {
    expect(isInsideMeetingDoor({ x: 100, y: 100 })).toBe(false);
  });

  it("returns false for position just below the door", () => {
    expect(isInsideMeetingDoor({ x: 5, y: MEETING_SCENE_DOOR.y + MEETING_SCENE_DOOR.h + 1 })).toBe(false);
  });
});

describe("clampMeetingPos", () => {
  it("returns position unchanged when within bounds", () => {
    expect(clampMeetingPos({ x: 50, y: 50 })).toEqual({ x: 50, y: 50 });
  });

  it("clamps x to minimum 6", () => {
    expect(clampMeetingPos({ x: 0, y: 50 })).toEqual({ x: 6, y: 50 });
  });

  it("clamps x to maximum 94", () => {
    expect(clampMeetingPos({ x: 100, y: 50 })).toEqual({ x: 94, y: 50 });
  });

  it("clamps y to minimum 16", () => {
    expect(clampMeetingPos({ x: 50, y: 0 })).toEqual({ x: 50, y: 16 });
  });

  it("clamps y to maximum 90", () => {
    expect(clampMeetingPos({ x: 50, y: 99 })).toEqual({ x: 50, y: 90 });
  });

  it("clamps both axes simultaneously", () => {
    expect(clampMeetingPos({ x: -10, y: 200 })).toEqual({ x: 6, y: 90 });
  });
});
