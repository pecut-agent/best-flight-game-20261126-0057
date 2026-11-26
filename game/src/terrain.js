import { COLORS, RUNWAY, VIEW } from './config.js';

// Deterministic landscape: sea to the west, a river bend, fields, forest and snowy peaks to the east.

function smoothNoise(x, z) {
  const a = Math.sin(x * 0.011 + z * 0.004) * 0.5;
  const b = Math.sin(x * 0.003 - z * 0.009 + 1.7) * 0.35;
  const c = Math.sin((x + z) * 0.021) * 0.15;
  return a + b + c;
}

export function terrainHeight(x, z) {
  if (isRunwayArea(x, z, 90)) return 0;
  const east = Math.max(0, (x - 240) / 900);
  const hills = Math.max(0, smoothNoise(x, z)) * 46;
  const peaks = Math.pow(east, 1.7) * 210 + Math.max(0, Math.sin(z * 0.004 + 0.8)) * east * 60;
  const valley = Math.exp(-Math.pow((x + 60) / 260, 2)) * 10;
  let h = hills + peaks - valley;
  if (x < -330) h = Math.min(h, 1.5);
  return Math.max(0, h);
}

export function isRunwayArea(x, z, pad = 0) {
  return Math.abs(x - RUNWAY.x) <= RUNWAY.halfWidth + pad && z >= RUNWAY.zStart - pad && z <= RUNWAY.zEnd + pad;
}

export function riverCenter(z) {
  return -150 + Math.sin(z * 0.0022) * 90;
}

export function terrainKind(x, z) {
  if (isRunwayArea(x, z, 8)) return 'runway';
  const h = terrainHeight(x, z);
  if (x < -330) return 'sea';
  if (Math.abs(x - riverCenter(z)) < 26 && h < 26) return 'river';
  if (x < -285) return 'sand';
  if (h > 150) return 'snow';
  if (h > 82) return 'rock';
  const checker = Math.floor((x + 4000) / 150) + Math.floor((z + 4000) / 150);
  if (checker % 5 === 0) return 'forest';
  return checker % 2 === 0 ? 'fieldA' : 'fieldB';
}

export function kindColor(kind) {
  return {
    sea: COLORS.sea,
    river: COLORS.seaDeep,
    sand: COLORS.sand,
    fieldA: COLORS.fieldA,
    fieldB: COLORS.fieldB,
    forest: COLORS.forest,
    rock: COLORS.rock,
    snow: COLORS.snow,
    runway: COLORS.runway,
  }[kind] || COLORS.fieldA;
}

export function shade(hex, factor) {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * factor));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * factor));
  const b = Math.min(255, Math.round((n & 255) * factor));
  return `rgb(${r},${g},${b})`;
}

export function fogMix(hex, amount) {
  const n = Number.parseInt(hex.slice(1), 16);
  const fog = [196, 222, 246];
  const r = Math.round(((n >> 16) & 255) * (1 - amount) + fog[0] * amount);
  const g = Math.round(((n >> 8) & 255) * (1 - amount) + fog[1] * amount);
  const b = Math.round((n & 255) * (1 - amount) + fog[2] * amount);
  return `rgb(${r},${g},${b})`;
}

// Project a world point into screen space. Returns null when behind the camera.
export function project(camera, x, y, z) {
  const dx = x - camera.x;
  const dz = z - camera.z;
  const sin = Math.sin(camera.heading);
  const cos = Math.cos(camera.heading);
  const camX = dx * cos - dz * sin;
  const camZ = dx * sin + dz * cos;
  if (camZ < 4) return null;
  const scale = VIEW.focal / camZ;
  return {
    x: VIEW.width / 2 + camX * scale,
    y: camera.horizon - (y - camera.alt) * scale,
    scale,
    depth: camZ,
  };
}

export function cameraFor(plane) {
  const back = VIEW.cameraBack;
  return {
    x: plane.x - Math.sin(plane.heading) * back,
    z: plane.z - Math.cos(plane.heading) * back,
    alt: plane.alt + VIEW.cameraUp,
    heading: plane.heading,
    horizon: VIEW.height * 0.46 + plane.climb * 2.2 - plane.roll * 18,
  };
}
