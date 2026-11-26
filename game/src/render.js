import { COLORS, RUNWAY, VIEW } from './config.js';
import { cameraFor, fogMix, kindColor, project, shade, terrainHeight, terrainKind } from './terrain.js';

// Scene rendering: sky, terrain strips, runway, rings, particles and the chase-view aircraft.

export function renderScene(ctx, state) {
  const camera = cameraFor(state.plane);
  drawSky(ctx, state, camera);
  drawTerrain(ctx, camera);
  drawRunway(ctx, camera);
  drawRings(ctx, state, camera);
  drawParticles(ctx, state, camera);
  drawShadow(ctx, state, camera);
  drawAircraft(ctx, state, camera);
  return camera;
}

function drawSky(ctx, state, camera) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  grad.addColorStop(0, COLORS.skyTop);
  grad.addColorStop(0.45, COLORS.skyMid);
  grad.addColorStop(0.72, COLORS.skyLow);
  grad.addColorStop(1, '#b9d9f4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  const sunX = VIEW.width * 0.78 - Math.sin(camera.heading) * 120;
  const sunY = camera.horizon - 190;
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 150);
  glow.addColorStop(0, 'rgba(255,243,176,0.95)');
  glow.addColorStop(0.25, 'rgba(255,243,176,0.45)');
  glow.addColorStop(1, 'rgba(255,243,176,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 160, sunY - 160, 320, 320);
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  for (let i = 0; i < 16; i += 1) {
    const seed = i * 137.5;
    const drift = state.shot ? 0 : state.time * (2 + (i % 4));
    const x = ((seed * 7 + drift) % (VIEW.width + 260)) - 130;
    const y = 36 + ((seed * 3) % 190);
    const w = 70 + (seed % 90);
    cloud(ctx, x, y, w);
  }
}

function cloud(ctx, x, y, w) {
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.5, w * 0.16, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.28, y - w * 0.07, w * 0.32, w * 0.13, 0, 0, Math.PI * 2);
  ctx.ellipse(x - w * 0.3, y + w * 0.03, w * 0.3, w * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
}

function stripDistances() {
  const list = [];
  let d = 22;
  while (d < VIEW.far) {
    list.push(d);
    d *= 1.13;
  }
  list.push(VIEW.far);
  return list;
}

function drawTerrain(ctx, camera) {
  const distances = stripDistances();
  const sin = Math.sin(camera.heading);
  const cos = Math.cos(camera.heading);
  const cols = 34;
  const rows = distances.map((d) => {
    const span = d * 1.25 + 160;
    const points = [];
    for (let c = 0; c <= cols; c += 1) {
      const lat = -span + (2 * span * c) / cols;
      const wx = camera.x + cos * lat + sin * d;
      const wz = camera.z - sin * lat + cos * d;
      const h = terrainHeight(wx, wz);
      points.push({ screen: project(camera, wx, h, wz), wx, wz, h });
    }
    return { d, points };
  });

  for (let r = rows.length - 2; r >= 0; r -= 1) {
    const far = rows[r + 1];
    const near = rows[r];
    for (let c = 0; c < cols; c += 1) {
      const a = far.points[c];
      const b = far.points[c + 1];
      const cNear = near.points[c + 1];
      const dNear = near.points[c];
      if (!a.screen || !b.screen || !cNear.screen || !dNear.screen) continue;
      const midX = (a.wx + b.wx + cNear.wx + dNear.wx) / 4;
      const midZ = (a.wz + b.wz + cNear.wz + dNear.wz) / 4;
      const kind = terrainKind(midX, midZ);
      const slope = 0.82 + Math.min(0.35, Math.abs(b.h - a.h) * 0.004);
      const fog = Math.min(0.72, far.d / VIEW.far);
      ctx.fillStyle = fogMix(kindColor(kind), fog);
      if (kind !== 'sea' && kind !== 'river') ctx.fillStyle = shade(ctx.fillStyle.startsWith('#') ? ctx.fillStyle : kindColor(kind), slope);
      ctx.beginPath();
      ctx.moveTo(a.screen.x, a.screen.y);
      ctx.lineTo(b.screen.x, b.screen.y);
      ctx.lineTo(cNear.screen.x, cNear.screen.y);
      ctx.lineTo(dNear.screen.x, dNear.screen.y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawRunway(ctx, camera) {
  const corners = [
    project(camera, RUNWAY.x - RUNWAY.halfWidth, 0.3, RUNWAY.zStart),
    project(camera, RUNWAY.x + RUNWAY.halfWidth, 0.3, RUNWAY.zStart),
    project(camera, RUNWAY.x + RUNWAY.halfWidth, 0.3, RUNWAY.zEnd),
    project(camera, RUNWAY.x - RUNWAY.halfWidth, 0.3, RUNWAY.zEnd),
  ];
  if (corners.some((p) => !p)) return;
  ctx.fillStyle = COLORS.runway;
  poly(ctx, corners);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  poly(ctx, corners);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  for (let z = RUNWAY.zStart + 26; z < RUNWAY.zEnd - 20; z += 44) {
    const a = project(camera, RUNWAY.x, 0.5, z);
    const b = project(camera, RUNWAY.x, 0.5, z + 22);
    if (!a || !b) continue;
    ctx.lineWidth = Math.max(2, a.scale * 2.2);
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.fillStyle = COLORS.gold;
  for (let z = RUNWAY.zStart; z <= RUNWAY.zEnd; z += 50) {
    for (const side of [-1, 1]) {
      const p = project(camera, RUNWAY.x + side * (RUNWAY.halfWidth + 3), 1, z);
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(2, p.scale * 1.4), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const label = project(camera, RUNWAY.x, 2, RUNWAY.zStart + 16);
  if (label && label.depth < 900) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.max(12, label.scale * 9)}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('36', label.x, label.y);
  }
}

function drawRings(ctx, state, camera) {
  const ordered = state.rings
    .map((ring, index) => ({ ring, index, p: project(camera, ring.x, ring.alt, ring.z) }))
    .filter((item) => item.p)
    .sort((a, b) => b.p.depth - a.p.depth);

  for (const { ring, index, p } of ordered) {
    const radius = Math.max(7, ring.radius * p.scale);
    const isNext = index === state.nextRing;
    ctx.save();
    if (isNext) {
      ctx.shadowColor = COLORS.gold;
      ctx.shadowBlur = 24;
    }
    ctx.strokeStyle = ring.passed ? 'rgba(80,220,150,0.55)' : ring.missed ? 'rgba(160,170,190,0.4)' : isNext ? COLORS.gold : COLORS.teal;
    ctx.lineWidth = Math.max(3, radius * 0.09);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, radius, radius * 0.92, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = Math.max(1.5, radius * 0.03);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, radius * 0.88, radius * 0.81, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (isNext && p.depth < 1300) {
      ctx.fillStyle = COLORS.gold;
      ctx.font = '700 17px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`RING ${index + 1}`, p.x, p.y - radius - 10);
    }
    ctx.restore();
  }
}

function drawParticles(ctx, state, camera) {
  ctx.fillStyle = COLORS.gold;
  for (const particle of state.particles) {
    const p = project(camera, particle.x, particle.y, particle.z);
    if (!p) continue;
    ctx.globalAlpha = Math.max(0, Math.min(1, particle.life));
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(2, p.scale * 2.4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawShadow(ctx, state, camera) {
  const p = state.plane;
  const ground = terrainHeight(p.x, p.z);
  const point = project(camera, p.x, ground + 0.4, p.z);
  if (!point) return;
  const heightFactor = Math.max(0.25, 1 - (p.alt - ground) / 260);
  ctx.fillStyle = `rgba(10,20,35,${0.28 * heightFactor})`;
  ctx.beginPath();
  ctx.ellipse(point.x, point.y, 52 * point.scale * heightFactor + 8, 10 * point.scale * heightFactor + 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawAircraft(ctx, state, camera) {
  const p = state.plane;
  const cx = VIEW.width / 2;
  const cy = camera.horizon + 168 - p.climb * 1.6;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(p.roll * 0.55);

  ctx.fillStyle = '#dfe9f7';
  ctx.strokeStyle = '#28405f';
  ctx.lineWidth = 3;

  // wings
  ctx.beginPath();
  ctx.moveTo(-168, 26);
  ctx.lineTo(-38, 2);
  ctx.lineTo(38, 2);
  ctx.lineTo(168, 26);
  ctx.lineTo(150, 48);
  ctx.lineTo(-150, 48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ff8c42';
  ctx.fillRect(-168, 24, 34, 20);
  ctx.fillRect(134, 24, 34, 20);

  // fuselage
  ctx.fillStyle = '#f4f8ff';
  ctx.beginPath();
  ctx.ellipse(0, 8, 34, 58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // canopy
  ctx.fillStyle = '#7fc4ea';
  ctx.beginPath();
  ctx.ellipse(0, -12, 20, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // tail
  ctx.fillStyle = '#dfe9f7';
  ctx.beginPath();
  ctx.moveTo(-52, 58);
  ctx.lineTo(0, 42);
  ctx.lineTo(52, 58);
  ctx.lineTo(42, 72);
  ctx.lineTo(-42, 72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ff8c42';
  ctx.beginPath();
  ctx.moveTo(0, 34);
  ctx.lineTo(10, 62);
  ctx.lineTo(-10, 62);
  ctx.closePath();
  ctx.fill();

  // propeller blur at the nose
  ctx.strokeStyle = 'rgba(30,45,70,0.5)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, -54, 58, 9, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#28405f';
  ctx.beginPath();
  ctx.arc(0, -54, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function poly(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
}
