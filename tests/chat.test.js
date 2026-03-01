import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createChatState,
  getBubbleText,
  setBubble,
  resolveSpeakerClientId,
  appendMessage,
} from "../lib/chat.js";

describe("getBubbleText", () => {
  it("returns empty string when no bubble exists", () => {
    const state = createChatState();
    expect(getBubbleText(state, "c-1")).toBe("");
  });

  it("returns bubble text when active", () => {
    const state = createChatState();
    state.bubbles.set("c-1", { text: "Hello", until: Date.now() + 60000 });
    expect(getBubbleText(state, "c-1")).toBe("Hello");
  });

  it("returns empty string and deletes expired bubble", () => {
    const state = createChatState();
    state.bubbles.set("c-1", { text: "Old", until: Date.now() - 1000 });
    expect(getBubbleText(state, "c-1")).toBe("");
    expect(state.bubbles.has("c-1")).toBe(false);
  });
});

describe("setBubble", () => {
  it("sets a bubble with TTL", () => {
    const state = createChatState();
    const before = Date.now();
    setBubble(state, "c-1", "Hello");
    const bubble = state.bubbles.get("c-1");
    expect(bubble.text).toBe("Hello");
    expect(bubble.until).toBeGreaterThanOrEqual(before + 18000);
  });

  it("does nothing for empty clientId", () => {
    const state = createChatState();
    setBubble(state, "", "Hello");
    expect(state.bubbles.size).toBe(0);
  });

  it("does nothing for empty text", () => {
    const state = createChatState();
    setBubble(state, "c-1", "");
    expect(state.bubbles.size).toBe(0);
  });

  it("truncates long text to maxMessageLength", () => {
    const state = createChatState(50);
    setBubble(state, "c-1", "a".repeat(100));
    expect(state.bubbles.get("c-1").text.length).toBe(50);
  });
});

describe("resolveSpeakerClientId", () => {
  const participants = [
    { clientId: "c-1", name: "Alice" },
    { clientId: "c-2", name: "Bob" },
  ];

  it("returns clientId from message when present", () => {
    expect(resolveSpeakerClientId({ clientId: "c-1", nickname: "Alice" }, participants, "c-1")).toBe("c-1");
  });

  it("resolves by nickname when clientId is empty and unique match exists", () => {
    expect(resolveSpeakerClientId({ clientId: "", nickname: "Bob" }, participants, "c-1")).toBe("c-2");
  });

  it("returns empty string when nickname matches multiple participants and local user is not one of them", () => {
    const dupes = [
      { clientId: "c-1", name: "Alice" },
      { clientId: "c-3", name: "Alice" },
    ];
    expect(resolveSpeakerClientId({ clientId: "", nickname: "Alice" }, dupes, "c-99")).toBe("");
  });

  it("returns local clientId when nickname matches local user", () => {
    expect(resolveSpeakerClientId({ clientId: "", nickname: "Alice" }, participants, "c-1")).toBe("c-1");
  });

  it("returns empty string when no match found", () => {
    expect(resolveSpeakerClientId({ clientId: "", nickname: "Unknown" }, participants, "c-1")).toBe("");
  });
});

describe("appendMessage", () => {
  it("appends a new message", () => {
    const state = createChatState();
    const result = appendMessage(state, { id: "m-1", text: "Hi", nickname: "Alice" }, [], "");
    expect(result).toBe(true);
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].id).toBe("m-1");
  });

  it("rejects duplicate messages", () => {
    const state = createChatState();
    appendMessage(state, { id: "m-1", text: "Hi", nickname: "A" }, [], "");
    const result = appendMessage(state, { id: "m-1", text: "Hi", nickname: "A" }, [], "");
    expect(result).toBe(false);
    expect(state.messages).toHaveLength(1);
  });

  it("rejects null message", () => {
    const state = createChatState();
    expect(appendMessage(state, null, [], "")).toBe(false);
  });

  it("rejects message without id", () => {
    const state = createChatState();
    expect(appendMessage(state, { text: "Hi" }, [], "")).toBe(false);
  });

  it("evicts oldest messages when exceeding MAX_MESSAGES (120)", () => {
    const state = createChatState();
    // Add 125 messages
    for (let i = 0; i < 125; i++) {
      appendMessage(state, { id: `m-${i}`, text: `msg ${i}`, nickname: "A" }, [], "");
    }
    expect(state.messages.length).toBeLessThanOrEqual(120);
    // First 5 messages should be evicted
    expect(state.seenMessageIds.has("m-0")).toBe(false);
    expect(state.seenMessageIds.has("m-4")).toBe(false);
    // Last message should still be there
    expect(state.seenMessageIds.has("m-124")).toBe(true);
  });

  it("sets bubble for resolved speaker", () => {
    const state = createChatState();
    const participants = [{ clientId: "c-1", name: "Alice" }];
    appendMessage(state, { id: "m-1", clientId: "c-1", text: "Hello!", nickname: "Alice" }, participants, "c-1");
    expect(state.bubbles.has("c-1")).toBe(true);
    expect(state.bubbles.get("c-1").text).toBe("Hello!");
  });
});
