import { describe, it, expect } from "vitest";
import {
  encodeState,
  decodeState,
  buildStatuses,
  applyStatusesToAgents,
} from "../lib/state.js";

describe("encodeState / decodeState", () => {
  it("round-trips a simple object", () => {
    const obj = { name: "Alice", status: "active" };
    expect(decodeState(encodeState(obj))).toEqual(obj);
  });

  it("round-trips an array", () => {
    const arr = [1, 2, 3, "hello"];
    expect(decodeState(encodeState(arr))).toEqual(arr);
  });

  it("round-trips unicode text", () => {
    const obj = { name: "한글테스트", emoji: "🎉" };
    expect(decodeState(encodeState(obj))).toEqual(obj);
  });

  it("round-trips nested objects", () => {
    const obj = { a: { b: { c: 42 } } };
    expect(decodeState(encodeState(obj))).toEqual(obj);
  });

  it("round-trips empty object", () => {
    expect(decodeState(encodeState({}))).toEqual({});
  });

  it("encodeState returns empty string for circular reference", () => {
    const obj = {};
    obj.self = obj;
    expect(encodeState(obj)).toBe("");
  });

  it("decodeState returns null for invalid base64", () => {
    expect(decodeState("!!!invalid!!!")).toBeNull();
  });

  it("decodeState returns null for valid base64 but invalid JSON", () => {
    expect(decodeState(btoa("not json"))).toBeNull();
  });
});

describe("buildStatuses", () => {
  it("creates id-to-status map", () => {
    const agents = [
      { id: "a1", status: "active" },
      { id: "a2", status: "idle" },
    ];
    expect(buildStatuses(agents)).toEqual({ a1: "active", a2: "idle" });
  });

  it("handles empty agents array", () => {
    expect(buildStatuses([])).toEqual({});
  });

  it("handles single agent", () => {
    expect(buildStatuses([{ id: "x", status: "focus" }])).toEqual({ x: "focus" });
  });
});

describe("applyStatusesToAgents", () => {
  const baseAgents = [
    { id: "a1", name: "Alice", status: "active" },
    { id: "a2", name: "Bob", status: "idle" },
    { id: "a3", name: "Carol", status: "focus" },
  ];

  it("applies valid status updates", () => {
    const result = applyStatusesToAgents(baseAgents, { a1: "offline", a2: "active" });
    expect(result[0].status).toBe("offline");
    expect(result[1].status).toBe("active");
    expect(result[2].status).toBe("focus"); // unchanged
  });

  it("ignores invalid status values", () => {
    const result = applyStatusesToAgents(baseAgents, { a1: "invalid-status" });
    expect(result[0].status).toBe("active"); // unchanged
  });

  it("ignores unknown agent ids", () => {
    const result = applyStatusesToAgents(baseAgents, { unknown: "active" });
    expect(result).toEqual(baseAgents);
  });

  it("handles null incomingStatuses", () => {
    const result = applyStatusesToAgents(baseAgents, null);
    expect(result[0].status).toBe("active"); // unchanged
  });

  it("handles undefined incomingStatuses", () => {
    const result = applyStatusesToAgents(baseAgents, undefined);
    expect(result[0].status).toBe("active"); // unchanged
  });

  it("preserves other agent properties", () => {
    const result = applyStatusesToAgents(baseAgents, { a1: "offline" });
    expect(result[0].name).toBe("Alice");
    expect(result[0].id).toBe("a1");
  });
});
