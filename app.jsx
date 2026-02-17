const { useEffect, useMemo, useRef, useState } = React;

const STATUS_ORDER = ["active", "focus", "idle", "offline"];
const STATUS_LABEL = {
  active: "Active",
  focus: "Focus",
  idle: "Idle",
  offline: "Offline"
};

const LOCAL_KEY = "agent-office-state-v1";
const ROOM_PARAM = "room";
const SYNC_MESSAGE_TYPE = "workspace_sync";

const DEFAULT_AGENTS = [
  { id: "ops-01", name: "김총괄", role: "Ops", accent: "#58ffc9", status: "focus" },
  { id: "pm-02", name: "이프엠", role: "PM", accent: "#d9b8ff", status: "active" },
  { id: "be-03", name: "박백엔", role: "Backend", accent: "#f0a6ff", status: "active" },
  { id: "data-04", name: "온데이터", role: "Data", accent: "#bfa9d9", status: "idle" },
  { id: "design-05", name: "한디포", role: "Design", accent: "#fcf9f2", status: "offline" },
  { id: "plan-06", name: "정기획", role: "Planning", accent: "#d9ff7f", status: "active" },
  { id: "qa-07", name: "조큐에이", role: "QA", accent: "#ffd67a", status: "idle" }
];

const OFFICE_AGENT_IDS = ["ops-01", "pm-02", "be-03", "data-04", "design-05"];

function encodeState(value) {
  const text = JSON.stringify(value);
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeState(value) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text);
}

function makeClientId() {
  return `client-${Math.random().toString(36).slice(2, 10)}`;
}

function makeRoomId() {
  return `room-${Math.random().toString(36).slice(2, 8)}`;
}

function makeLocalKey(roomId) {
  return `${LOCAL_KEY}:${roomId}`;
}

function resolveRoomId() {
  const params = new URLSearchParams(window.location.search);
  return params.get(ROOM_PARAM) || makeRoomId();
}

function ensureRoomInUrl(roomId) {
  const url = new URL(window.location.href);
  if (url.searchParams.get(ROOM_PARAM) === roomId) {
    return;
  }

  url.searchParams.set(ROOM_PARAM, roomId);
  const nextPath = `${url.pathname}${url.search}${url.hash}`;
  history.replaceState(null, "", nextPath);
}

function buildStatuses(agents) {
  return Object.fromEntries(agents.map((agent) => [agent.id, agent.status]));
}

function applyStatusesToAgents(baseAgents, incomingStatuses) {
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

function hydrateFromStorage(defaultAgents, defaultSelectedAgentId, roomId) {
  let payload = "";

  if (window.location.hash.startsWith("#state=")) {
    payload = window.location.hash.slice(7);
  } else {
    payload = localStorage.getItem(makeLocalKey(roomId)) || "";
  }

  if (!payload) {
    return {
      agents: defaultAgents,
      selectedAgentId: defaultSelectedAgentId,
      updatedAt: Date.now()
    };
  }

  try {
    const state = decodeState(payload);

    const selectedAgentId = defaultAgents.some((agent) => agent.id === state.selectedAgentId)
      ? state.selectedAgentId
      : defaultSelectedAgentId;

    const agents = applyStatusesToAgents(defaultAgents, state.statuses);
    const updatedAt = typeof state.updatedAt === "number" ? state.updatedAt : Date.now();

    return {
      agents,
      selectedAgentId,
      updatedAt
    };
  } catch (_error) {
    localStorage.removeItem(makeLocalKey(roomId));
    return {
      agents: defaultAgents,
      selectedAgentId: defaultSelectedAgentId,
      updatedAt: Date.now()
    };
  }
}

function persistState(agents, selectedAgentId, updatedAt, roomId) {
  const compact = {
    selectedAgentId,
    statuses: buildStatuses(agents),
    updatedAt
  };

  const encoded = encodeState(compact);
  localStorage.setItem(makeLocalKey(roomId), encoded);

  const nextHash = `state=${encoded}`;
  if (window.location.hash.slice(1) !== nextHash) {
    history.replaceState(null, "", `#${nextHash}`);
  }
}

function DeskAgent({ agent, isSelected, onSelect }) {
  const className = `desk-agent status-${agent.status}${isSelected ? " is-selected" : ""}`;

  return (
    <article className={className} data-agent-id={agent.id}>
      <div className="status-fire" aria-hidden="true"></div>
      <div className="desk"></div>
      <div className="avatar" style={{ "--accent": agent.accent }}></div>
      <button className="name-tag" type="button" onClick={() => onSelect(agent.id)}>
        {agent.name}
      </button>
    </article>
  );
}

function CrewCard({ agent, isSelected, onSelect, onCycleStatus }) {
  const className = `crew-card${isSelected ? " is-selected" : ""}`;

  return (
    <article className={className} data-agent-id={agent.id}>
      <button className="crew-select" type="button" onClick={() => onSelect(agent.id)}>
        <span className="crew-avatar" style={{ "--accent": agent.accent }}></span>
        <span className="crew-role">{agent.role}</span>
        <strong className="crew-name">{agent.name}</strong>
      </button>
      <button
        className={`status-pill status-${agent.status}`}
        type="button"
        onClick={() => onCycleStatus(agent.id)}
      >
        {STATUS_LABEL[agent.status]}
      </button>
    </article>
  );
}

function App() {
  const roomId = useMemo(resolveRoomId, []);
  const clientIdRef = useRef(makeClientId());
  const channelRef = useRef(null);
  const suppressBroadcastRef = useRef(false);
  const lastUpdateRef = useRef(0);

  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState("pm-02");
  const [updatedAt, setUpdatedAt] = useState(Date.now());
  const [isReady, setIsReady] = useState(false);
  const [syncMode, setSyncMode] = useState("Tab Sync");
  const [lastRemoteSyncAt, setLastRemoteSyncAt] = useState(null);

  useEffect(() => {
    ensureRoomInUrl(roomId);
    const hydrated = hydrateFromStorage(DEFAULT_AGENTS, "pm-02", roomId);

    setAgents(hydrated.agents);
    setSelectedAgentId(hydrated.selectedAgentId);
    setUpdatedAt(hydrated.updatedAt);
    lastUpdateRef.current = hydrated.updatedAt;
    setIsReady(true);
  }, [roomId]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    function applyIncomingState(nextState, sourceLabel) {
      if (!nextState || typeof nextState !== "object") {
        return;
      }

      const incomingUpdatedAt = typeof nextState.updatedAt === "number" ? nextState.updatedAt : 0;
      if (!incomingUpdatedAt || incomingUpdatedAt <= lastUpdateRef.current) {
        return;
      }

      suppressBroadcastRef.current = true;
      lastUpdateRef.current = incomingUpdatedAt;

      setAgents((prev) => applyStatusesToAgents(prev, nextState.statuses));

      if (DEFAULT_AGENTS.some((agent) => agent.id === nextState.selectedAgentId)) {
        setSelectedAgentId(nextState.selectedAgentId);
      }

      setUpdatedAt(incomingUpdatedAt);
      setLastRemoteSyncAt(incomingUpdatedAt);
      setSyncMode(sourceLabel);
    }

    function onStorage(event) {
      if (event.key !== makeLocalKey(roomId) || !event.newValue) {
        return;
      }

      try {
        const parsed = decodeState(event.newValue);
        applyIncomingState(parsed, "Tab Sync");
      } catch (_error) {
        // Ignore malformed storage payload.
      }
    }

    window.addEventListener("storage", onStorage);

    if (typeof BroadcastChannel === "undefined") {
      return () => {
        window.removeEventListener("storage", onStorage);
      };
    }

    const channel = new BroadcastChannel(`agent-office-${roomId}`);
    channelRef.current = channel;
    setSyncMode("Live Sync");

    channel.onmessage = (event) => {
      const message = event.data;
      if (!message || typeof message !== "object") {
        return;
      }
      if (message.type !== SYNC_MESSAGE_TYPE || message.roomId !== roomId) {
        return;
      }
      if (message.source === clientIdRef.current) {
        return;
      }

      applyIncomingState(message.payload, "Live Sync");
    };

    return () => {
      window.removeEventListener("storage", onStorage);
      channel.close();
      channelRef.current = null;
    };
  }, [isReady, roomId]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    persistState(agents, selectedAgentId, updatedAt, roomId);
    lastUpdateRef.current = Math.max(lastUpdateRef.current, updatedAt);

    if (suppressBroadcastRef.current) {
      suppressBroadcastRef.current = false;
      return;
    }

    const channel = channelRef.current;
    if (!channel) {
      return;
    }

    channel.postMessage({
      type: SYNC_MESSAGE_TYPE,
      roomId,
      source: clientIdRef.current,
      payload: {
        selectedAgentId,
        statuses: buildStatuses(agents),
        updatedAt
      }
    });
  }, [agents, selectedAgentId, updatedAt, isReady, roomId]);

  const officeAgents = useMemo(() => {
    const index = Object.fromEntries(agents.map((agent) => [agent.id, agent]));
    return OFFICE_AGENT_IDS.map((id) => index[id]).filter(Boolean);
  }, [agents]);

  function markUpdated() {
    setUpdatedAt((prev) => Math.max(prev + 1, Date.now()));
  }

  function selectAgent(agentId) {
    if (!agents.some((agent) => agent.id === agentId)) {
      return;
    }
    setSelectedAgentId(agentId);
    markUpdated();
  }

  function cycleStatus(agentId) {
    setAgents((prev) => {
      return prev.map((agent) => {
        if (agent.id !== agentId) {
          return agent;
        }

        const current = STATUS_ORDER.indexOf(agent.status);
        const next = (current + 1) % STATUS_ORDER.length;

        return {
          ...agent,
          status: STATUS_ORDER[next]
        };
      });
    });

    markUpdated();
  }

  function randomizeStatuses() {
    setAgents((prev) => {
      return prev.map((agent) => {
        const next = Math.floor(Math.random() * STATUS_ORDER.length);
        return {
          ...agent,
          status: STATUS_ORDER[next]
        };
      });
    });

    markUpdated();
  }

  async function copyShareLink() {
    persistState(agents, selectedAgentId, updatedAt, roomId);
    ensureRoomInUrl(roomId);
    const link = window.location.href;

    try {
      await navigator.clipboard.writeText(link);
      const btn = document.querySelector("#copyLinkBtn");
      const original = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(() => {
        btn.textContent = original;
      }, 1100);
    } catch (_error) {
      window.prompt("Copy this share link:", link);
    }
  }

  const syncTimeLabel = lastRemoteSyncAt
    ? new Date(lastRemoteSyncAt).toLocaleTimeString()
    : "No remote updates";

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="workspace-meta">
          <p className="workspace-note">Shared Avatar Workspace</p>
          <div className="sync-strip">
            <span className={`sync-pill ${syncMode === "Live Sync" ? "is-live" : "is-tab"}`}>
              {syncMode}
            </span>
            <span className="room-code">Room {roomId}</span>
            <span className="sync-time">{syncTimeLabel}</span>
          </div>
        </div>

        <div className="workspace-actions">
          <button className="action-btn" id="copyLinkBtn" type="button" onClick={copyShareLink}>
            Copy Share Link
          </button>
          <button className="action-btn" type="button" onClick={randomizeStatuses}>
            Shuffle Status
          </button>
        </div>
      </header>

      <section className="panel office-panel">
        <header className="panel-head">
          <h1>Agent Office</h1>
        </header>

        <div className="office-map" id="officeMap">
          <div className="window-row">
            <div className="window"></div>
            <div className="window"></div>
            <div className="window"></div>
          </div>

          <div className="floor-grid">
            <div className="plant p1"></div>
            <div className="plant p2"></div>

            {officeAgents.map((agent) => (
              <div className="desk-slot" data-agent-id={agent.id} key={agent.id}>
                <DeskAgent
                  agent={agent}
                  isSelected={selectedAgentId === agent.id}
                  onSelect={selectAgent}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel crew-panel">
        <header className="panel-head">
          <h2>Agent Crew Deck</h2>
        </header>
        <p className="deck-hint">Click card to focus. Click status to cycle Active, Focus, Idle, Offline.</p>
        <div className="crew-grid" id="crewGrid">
          {agents.map((agent) => (
            <CrewCard
              key={agent.id}
              agent={agent}
              isSelected={selectedAgentId === agent.id}
              onSelect={selectAgent}
              onCycleStatus={cycleStatus}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

const root = ReactDOM.createRoot(document.querySelector("#root"));
root.render(<App />);
