import { describe, it, expect } from "vitest";
import { detectRoomIdAt, collidesAt, findValidSpotAround } from "../lib/collision.js";

describe("detectRoomIdAt", () => {
  const roomZones = {
    A: { x: 100, y: 100, w: 200, h: 150 },
    B: { x: 400, y: 100, w: 200, h: 150 },
  };

  it("returns room id when position is inside a room zone (with 8px inset)", () => {
    expect(detectRoomIdAt(200, 175, roomZones)).toBe("A");
  });

  it("returns empty string when position is outside all rooms", () => {
    expect(detectRoomIdAt(50, 50, roomZones)).toBe("");
  });

  it("returns empty string when position is inside wall inset (8px from edge)", () => {
    // Right at the edge of room A (x=100, with 8px inset means x must be >= 108)
    expect(detectRoomIdAt(105, 175, roomZones)).toBe("");
  });

  it("detects the correct room for room B", () => {
    expect(detectRoomIdAt(500, 175, roomZones)).toBe("B");
  });

  it("returns empty string for position between rooms", () => {
    expect(detectRoomIdAt(350, 175, roomZones)).toBe("");
  });

  it("handles empty roomZones", () => {
    expect(detectRoomIdAt(200, 175, {})).toBe("");
  });
});

describe("collidesAt", () => {
  const worldSize = { width: 960, height: 540 };

  it("returns false for position in open space", () => {
    expect(collidesAt(480, 300, [], worldSize)).toBe(false);
  });

  it("returns true when avatar box exceeds left boundary", () => {
    // getAvatarBox(x, y) => { x: x-18, y: y-56, w: 36, h: 48 }
    // box.x < 6 means x-18 < 6, so x < 24
    expect(collidesAt(20, 300, [], worldSize)).toBe(true);
  });

  it("returns true when avatar box exceeds top boundary", () => {
    // box.y < 6 means y-56 < 6, so y < 62
    expect(collidesAt(480, 60, [], worldSize)).toBe(true);
  });

  it("returns true when avatar box exceeds right boundary", () => {
    // box.x + box.w > width - 6, i.e. (x-18)+36 > 954, so x > 936
    expect(collidesAt(940, 300, [], worldSize)).toBe(true);
  });

  it("returns true when avatar box exceeds bottom boundary", () => {
    // box.y + box.h > height - 6, i.e. (y-56)+48 > 534, so y > 542
    // but y=540 means box.y=484, box.y+box.h=532 which is < 534, so NOT collision
    // y=545 means box.y=489, box.y+box.h=537 > 534, collision
    expect(collidesAt(480, 545, [], worldSize)).toBe(true);
  });

  it("returns true when avatar intersects a collider", () => {
    const colliders = [{ x: 470, y: 250, w: 40, h: 40 }];
    // Avatar at 480, 300: box = { x: 462, y: 244, w: 36, h: 48 }
    // Collider = { x: 470, y: 250, w: 40, h: 40 }
    // intersects? 462 < 510 (yes) && 498 > 470 (yes) && 244 < 290 (yes) && 292 > 250 (yes) -> YES
    expect(collidesAt(480, 300, colliders, worldSize)).toBe(true);
  });

  it("returns false when avatar does not intersect colliders", () => {
    const colliders = [{ x: 100, y: 100, w: 20, h: 20 }];
    expect(collidesAt(480, 300, colliders, worldSize)).toBe(false);
  });
});

describe("findValidSpotAround", () => {
  const worldSize = { width: 960, height: 540 };

  it("returns the target position when it is valid", () => {
    const result = findValidSpotAround(480, 300, [], worldSize);
    expect(result).toEqual({ x: 480, y: 300 });
  });

  it("clamps target to within world bounds", () => {
    const result = findValidSpotAround(-100, -100, [], worldSize);
    expect(result.x).toBeGreaterThanOrEqual(20);
    expect(result.y).toBeGreaterThanOrEqual(20);
  });

  it("finds an alternative spot when target is blocked", () => {
    // Create a collider right at 480,300 position
    // Avatar box at (480,300) = { x: 462, y: 244, w: 36, h: 48 }
    const colliders = [{ x: 460, y: 242, w: 40, h: 52 }];
    const result = findValidSpotAround(480, 300, colliders, worldSize);
    // Should find a nearby valid spot (at least one coordinate differs)
    const moved = result.x !== 480 || result.y !== 300;
    expect(moved).toBe(true);
    // The returned position should not collide
    expect(collidesAt(result.x, result.y, colliders, worldSize)).toBe(false);
  });

  it("returns clamped base position when all spots are blocked", () => {
    // Create massive collider covering everything
    const colliders = [{ x: 0, y: 0, w: 960, h: 540 }];
    const result = findValidSpotAround(480, 300, colliders, worldSize);
    // Should return the base position as fallback
    expect(result).toEqual({ x: 480, y: 300 });
  });
});
