import { clamp, getAvatarBox, intersects } from "./geometry.js";

export function detectRoomIdAt(x, y, roomZones) {
  const entries = Object.entries(roomZones);
  for (let i = 0; i < entries.length; i += 1) {
    const [roomId, r] = entries[i];
    if (x >= r.x + 8 && x <= r.x + r.w - 8 && y >= r.y + 8 && y <= r.y + r.h - 8) return roomId;
  }
  return "";
}

export function collidesAt(x, y, colliders, worldSize) {
  const box = getAvatarBox(x, y);
  if (box.x < 6 || box.y < 6 || box.x + box.w > worldSize.width - 6 || box.y + box.h > worldSize.height - 6) return true;
  for (let i = 0; i < colliders.length; i += 1) {
    if (intersects(box, colliders[i])) return true;
  }
  return false;
}

export function findValidSpotAround(targetX, targetY, colliders, worldSize) {
  const maxX = Math.max(20, worldSize.width - 20);
  const maxY = Math.max(20, worldSize.height - 20);
  const baseX = clamp(targetX, 20, maxX);
  const baseY = clamp(targetY, 20, maxY);
  if (!collidesAt(baseX, baseY, colliders, worldSize)) return { x: baseX, y: baseY };
  const radii = [16, 24, 32, 40, 56, 72, 88, 104];
  for (let ri = 0; ri < radii.length; ri += 1) {
    const r = radii[ri];
    for (let angle = 0; angle < 360; angle += 18) {
      const rad = (angle * Math.PI) / 180;
      const x = clamp(baseX + Math.cos(rad) * r, 20, maxX);
      const y = clamp(baseY + Math.sin(rad) * r, 20, maxY);
      if (!collidesAt(x, y, colliders, worldSize)) return { x, y };
    }
  }
  return { x: baseX, y: baseY };
}
