const MAX_MESSAGES = 120;
const BUBBLE_TTL_MS = 18000;

export function createChatState(maxMessageLength = 220) {
  return {
    messages: [],
    seenMessageIds: new Set(),
    bubbles: new Map(),
    maxMessageLength,
  };
}

export function getBubbleText(chatState, clientId) {
  const bubble = chatState.bubbles.get(clientId);
  if (!bubble) return "";
  if (bubble.until < Date.now()) {
    chatState.bubbles.delete(clientId);
    return "";
  }
  return bubble.text;
}

export function setBubble(chatState, clientId, text) {
  if (!clientId || !text) return;
  chatState.bubbles.set(clientId, {
    text: String(text).slice(0, chatState.maxMessageLength),
    until: Date.now() + BUBBLE_TTL_MS,
  });
}

export function resolveSpeakerClientId(message, participants, localClientId) {
  if (message.clientId) return message.clientId;
  const matched = participants.filter((p) => p.name === message.nickname);
  if (matched.length === 1) return matched[0].clientId;
  const me = participants.find((p) => p.clientId === localClientId);
  return me && me.name === message.nickname ? me.clientId : "";
}

export function appendMessage(chatState, message, participants, localClientId) {
  if (!message || !message.id || chatState.seenMessageIds.has(message.id)) return false;
  chatState.seenMessageIds.add(message.id);
  chatState.messages.push(message);
  if (chatState.messages.length > MAX_MESSAGES) {
    const removed = chatState.messages.splice(0, chatState.messages.length - MAX_MESSAGES);
    removed.forEach((m) => chatState.seenMessageIds.delete(m.id));
  }
  const cid = resolveSpeakerClientId(message, participants, localClientId);
  if (cid) setBubble(chatState, cid, message.text);
  return true;
}
