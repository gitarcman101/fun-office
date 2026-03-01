import { describe, it, expect } from "vitest";
import { hashText, avatarForName } from "../lib/hash.js";

describe("hashText", () => {
  it("returns a number", () => {
    expect(typeof hashText("hello")).toBe("number");
  });

  it("returns 0 for empty string", () => {
    expect(hashText("")).toBe(0);
  });

  it("is deterministic", () => {
    expect(hashText("test")).toBe(hashText("test"));
  });

  it("produces different hashes for different strings", () => {
    expect(hashText("alice")).not.toBe(hashText("bob"));
  });

  it("handles unicode characters", () => {
    const hash = hashText("한글테스트");
    expect(typeof hash).toBe("number");
    expect(hash).toBeGreaterThan(0);
  });

  it("always returns a non-negative integer (unsigned)", () => {
    const hash = hashText("a".repeat(1000));
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(hash)).toBe(true);
  });
});

describe("avatarForName", () => {
  const avatars = ["avatar1.svg", "avatar2.svg", "avatar3.svg"];

  it("returns an avatar from the list", () => {
    const result = avatarForName("Alice", avatars);
    expect(avatars).toContain(result);
  });

  it("returns empty string when avatars array is empty", () => {
    expect(avatarForName("Alice", [])).toBe("");
  });

  it("is deterministic for the same name", () => {
    expect(avatarForName("Bob", avatars)).toBe(avatarForName("Bob", avatars));
  });

  it("distributes across avatars for different names", () => {
    const results = new Set();
    for (let i = 0; i < 100; i++) {
      results.add(avatarForName(`user-${i}`, avatars));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});
