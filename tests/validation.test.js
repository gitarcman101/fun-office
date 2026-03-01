import { describe, it, expect } from "vitest";
import {
  normalizeMessagePayload,
  normalizeMovePayload,
  getBubbleLengthClass,
  isTypingElement,
} from "../lib/validation.js";

describe("normalizeMessagePayload", () => {
  it("returns normalized payload for valid input", () => {
    const payload = {
      id: "msg-1",
      clientId: "client-1",
      nickname: "Alice",
      text: "Hello world",
      createdAt: 1700000000000,
    };
    const result = normalizeMessagePayload(payload);
    expect(result).toEqual({
      id: "msg-1",
      clientId: "client-1",
      nickname: "Alice",
      text: "Hello world",
      createdAt: 1700000000000,
    });
  });

  it("returns null for null input", () => {
    expect(normalizeMessagePayload(null)).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(normalizeMessagePayload("string")).toBeNull();
  });

  it("returns null when id is missing", () => {
    expect(normalizeMessagePayload({ nickname: "A", text: "B" })).toBeNull();
  });

  it("returns null when nickname is missing", () => {
    expect(normalizeMessagePayload({ id: "1", text: "B" })).toBeNull();
  });

  it("returns null when text is missing", () => {
    expect(normalizeMessagePayload({ id: "1", nickname: "A" })).toBeNull();
  });

  it("trims whitespace from fields", () => {
    const result = normalizeMessagePayload({
      id: "  msg-1  ",
      clientId: "  c-1  ",
      nickname: "  Bob  ",
      text: "  hi  ",
      createdAt: 1700000000000,
    });
    expect(result.id).toBe("msg-1");
    expect(result.clientId).toBe("c-1");
    expect(result.nickname).toBe("Bob");
    expect(result.text).toBe("hi");
  });

  it("truncates nickname to 12 characters", () => {
    const result = normalizeMessagePayload({
      id: "1",
      nickname: "VeryLongNickname",
      text: "hi",
    });
    expect(result.nickname.length).toBeLessThanOrEqual(12);
  });

  it("truncates text to max message length", () => {
    const longText = "a".repeat(500);
    const result = normalizeMessagePayload({ id: "1", nickname: "A", text: longText });
    expect(result.text.length).toBeLessThanOrEqual(220);
  });

  it("respects custom max message length", () => {
    const longText = "a".repeat(100);
    const result = normalizeMessagePayload({ id: "1", nickname: "A", text: longText }, 50);
    expect(result.text.length).toBeLessThanOrEqual(50);
  });
});

describe("normalizeMovePayload", () => {
  it("returns normalized payload for valid input", () => {
    const result = normalizeMovePayload({
      clientId: "c-1",
      x: 100,
      y: 200,
      dir: "left",
      updatedAt: 1700000000000,
    });
    expect(result).toEqual({
      clientId: "c-1",
      x: 100,
      y: 200,
      dir: "left",
      updatedAt: 1700000000000,
    });
  });

  it("returns null for null input", () => {
    expect(normalizeMovePayload(null)).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(normalizeMovePayload(42)).toBeNull();
  });

  it("returns null when clientId is missing", () => {
    expect(normalizeMovePayload({ x: 1, y: 2 })).toBeNull();
  });

  it("returns null when x is NaN", () => {
    expect(normalizeMovePayload({ clientId: "c", x: "abc", y: 2 })).toBeNull();
  });

  it("returns null when y is NaN", () => {
    expect(normalizeMovePayload({ clientId: "c", x: 1, y: NaN })).toBeNull();
  });

  it("defaults dir to 'down' when missing", () => {
    const result = normalizeMovePayload({ clientId: "c", x: 1, y: 2 });
    expect(result.dir).toBe("down");
  });

  it("coerces string coordinates to numbers", () => {
    const result = normalizeMovePayload({ clientId: "c", x: "50", y: "100" });
    expect(result.x).toBe(50);
    expect(result.y).toBe(100);
  });
});

describe("getBubbleLengthClass", () => {
  it("returns empty string for short text", () => {
    expect(getBubbleLengthClass("Hi")).toBe("");
  });

  it("returns empty string for text under 26 chars", () => {
    expect(getBubbleLengthClass("a".repeat(25))).toBe("");
  });

  it("returns 'is-long' for text of 26+ chars", () => {
    expect(getBubbleLengthClass("a".repeat(26))).toBe("is-long");
  });

  it("returns 'is-long' for text of 51 chars", () => {
    expect(getBubbleLengthClass("a".repeat(51))).toBe("is-long");
  });

  it("returns 'is-xlong' for text of 52+ chars", () => {
    expect(getBubbleLengthClass("a".repeat(52))).toBe("is-xlong");
  });

  it("handles null/undefined input", () => {
    expect(getBubbleLengthClass(null)).toBe("");
    expect(getBubbleLengthClass(undefined)).toBe("");
  });

  it("trims whitespace before measuring", () => {
    expect(getBubbleLengthClass("  " + "a".repeat(24) + "  ")).toBe("");
  });
});

describe("isTypingElement", () => {
  it("returns true for INPUT element", () => {
    expect(isTypingElement({ tagName: "INPUT", isContentEditable: false })).toBe(true);
  });

  it("returns true for TEXTAREA element", () => {
    expect(isTypingElement({ tagName: "TEXTAREA", isContentEditable: false })).toBe(true);
  });

  it("returns true for contentEditable element", () => {
    expect(isTypingElement({ tagName: "DIV", isContentEditable: true })).toBe(true);
  });

  it("returns false for regular div", () => {
    expect(isTypingElement({ tagName: "DIV", isContentEditable: false })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isTypingElement(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isTypingElement(undefined)).toBe(false);
  });
});
