const STATUS_ORDER = ["active", "focus", "idle", "offline"];
const STATUS_LABEL = {
  active: "활동중",
  focus: "집중",
  idle: "대기",
  offline: "오프라인"
};

const agents = [
  { id: "ops-01", name: "김총괄", role: "운영", status: "focus", avatar: "assets/avatars/avatar-ops.svg" },
  { id: "pm-02", name: "이피엠", role: "PM", status: "active", avatar: "assets/avatars/avatar-pm.svg" },
  { id: "be-03", name: "박백엔", role: "백엔드", status: "active", avatar: "assets/avatars/avatar-be.svg" },
  { id: "data-04", name: "온데이터", role: "데이터", status: "idle", avatar: "assets/avatars/avatar-data.svg" },
  { id: "design-05", name: "한디자인", role: "디자인", status: "offline", avatar: "assets/avatars/avatar-design.svg" },
  { id: "plan-06", name: "정기획", role: "기획", status: "active", avatar: "assets/avatars/avatar-plan.svg" },
  { id: "qa-07", name: "조큐에이", role: "QA", status: "idle", avatar: "assets/avatars/avatar-qa.svg" }
];

const appState = { selectedAgentId: "pm-02" };

const officeSlots = document.querySelectorAll(".desk-slot");
const crewGrid = document.querySelector("#crewGrid");
const deskTemplate = document.querySelector("#deskAvatarTemplate");
const cardTemplate = document.querySelector("#crewCardTemplate");
const copyLinkBtn = document.querySelector("#copyLinkBtn");
const shuffleStatusBtn = document.querySelector("#shuffleStatusBtn");

function renderOffice() {
  officeSlots.forEach((slot) => {
    slot.textContent = "";
    const agent = agents.find((item) => item.id === slot.dataset.agentId);
    if (!agent) return;

    const node = deskTemplate.content.firstElementChild.cloneNode(true);
    const image = node.querySelector(".avatar-img");
    const tag = node.querySelector(".name-tag");

    node.dataset.agentId = agent.id;
    node.classList.add(`status-${agent.status}`);
    if (appState.selectedAgentId === agent.id) node.classList.add("is-selected");

    image.src = agent.avatar;
    image.alt = `${agent.name} 아바타`;
    tag.textContent = agent.name;
    tag.addEventListener("click", () => selectAgent(agent.id));

    slot.appendChild(node);
  });
}

function renderCrew() {
  crewGrid.textContent = "";

  agents.forEach((agent) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    const selectBtn = card.querySelector(".crew-select");
    const image = card.querySelector(".crew-avatar-img");
    const role = card.querySelector(".crew-role");
    const name = card.querySelector(".crew-name");
    const statusBtn = card.querySelector(".status-pill");

    card.dataset.agentId = agent.id;
    if (appState.selectedAgentId === agent.id) card.classList.add("is-selected");

    image.src = agent.avatar;
    image.alt = `${agent.name} 아바타`;
    role.textContent = agent.role;
    name.textContent = agent.name;

    statusBtn.classList.add(`status-${agent.status}`);
    statusBtn.textContent = STATUS_LABEL[agent.status];

    selectBtn.addEventListener("click", () => selectAgent(agent.id));
    statusBtn.addEventListener("click", () => cycleStatus(agent.id));

    crewGrid.appendChild(card);
  });
}

function rerender() {
  renderOffice();
  renderCrew();
}

function selectAgent(agentId) {
  if (!agents.some((agent) => agent.id === agentId)) return;
  appState.selectedAgentId = agentId;
  rerender();
}

function cycleStatus(agentId) {
  const target = agents.find((agent) => agent.id === agentId);
  if (!target) return;

  const current = STATUS_ORDER.indexOf(target.status);
  target.status = STATUS_ORDER[(current + 1) % STATUS_ORDER.length];
  rerender();
}

function shuffleStatuses() {
  agents.forEach((agent) => {
    agent.status = STATUS_ORDER[Math.floor(Math.random() * STATUS_ORDER.length)];
  });
  rerender();
}

async function copyShareLink() {
  const link = window.location.href;
  try {
    await navigator.clipboard.writeText(link);
    const original = copyLinkBtn.textContent;
    copyLinkBtn.textContent = "복사됨";
    setTimeout(() => { copyLinkBtn.textContent = original; }, 900);
  } catch (_error) {
    window.prompt("이 링크를 복사하세요:", link);
  }
}

copyLinkBtn.addEventListener("click", copyShareLink);
shuffleStatusBtn.addEventListener("click", shuffleStatuses);
rerender();
