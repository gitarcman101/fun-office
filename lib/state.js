const STATUS_ORDER = ["active", "focus", "idle", "offline"];

export function encodeState(value) {
  try {
    const text = JSON.stringify(value);
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  } catch {
    return "";
  }
}

export function decodeState(value) {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function buildStatuses(agents) {
  return Object.fromEntries(agents.map((agent) => [agent.id, agent.status]));
}

export function applyStatusesToAgents(baseAgents, incomingStatuses) {
  return baseAgents.map((agent) => {
    const incomingStatus = incomingStatuses?.[agent.id];
    if (!STATUS_ORDER.includes(incomingStatus)) {
      return agent;
    }
    return {
      ...agent,
      status: incomingStatus
    };
  });
}
