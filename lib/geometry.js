export const MEETING_SCENE_DOOR = { x: 2, y: 42, w: 12, h: 22 };

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function getAvatarBox(x, y) {
  return { x: x - 18, y: y - 56, w: 36, h: 48 };
}

export function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function isInsideMeetingDoor(pos) {
  return (
    pos.x >= MEETING_SCENE_DOOR.x &&
    pos.x <= MEETING_SCENE_DOOR.x + MEETING_SCENE_DOOR.w &&
    pos.y >= MEETING_SCENE_DOOR.y &&
    pos.y <= MEETING_SCENE_DOOR.y + MEETING_SCENE_DOOR.h
  );
}

export function clampMeetingPos(pos) {
  return {
    x: clamp(pos.x, 6, 94),
    y: clamp(pos.y, 16, 90)
  };
}
