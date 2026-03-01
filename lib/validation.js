const DEFAULT_MAX_MESSAGE_LENGTH = 220;

export function normalizeMessagePayload(payload, maxMessageLength = DEFAULT_MAX_MESSAGE_LENGTH) {
  if (!payload || typeof payload !== "object") return null;
  const id = String(payload.id || "").trim();
  const clientId = String(payload.clientId || "").trim();
  const nickname = String(payload.nickname || "").trim().slice(0, 12);
  const text = String(payload.text || "").trim().slice(0, maxMessageLength);
  const createdAt = Number(payload.createdAt || Date.now());
  if (!id || !nickname || !text) return null;
  return { id, clientId, nickname, text, createdAt };
}

export function normalizeMovePayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const clientId = String(payload.clientId || "").trim();
  const x = Number(payload.x);
  const y = Number(payload.y);
  const dir = String(payload.dir || "down");
  const updatedAt = Number(payload.updatedAt || Date.now());
  if (!clientId || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { clientId, x, y, dir, updatedAt };
}

export function getBubbleLengthClass(text) {
  const len = String(text || "").trim().length;
  if (len >= 52) return "is-xlong";
  if (len >= 26) return "is-long";
  return "";
}

export function isTypingElement(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}
