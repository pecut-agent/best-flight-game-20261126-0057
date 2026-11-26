import { COLORS, VIEW } from './config.js';
import { headingDegrees } from './aircraft.js';
import { distanceToObjective, objectiveText } from './missions.js';
import { currentMission } from './state.js';

// Cockpit instruments, mission readouts and full-screen state panels.

export function drawHud(ctx, state) {
  drawTopBar(ctx, state);
  drawPanel(ctx, state);
  if (state.messageTimer > 0 && state.mode === 'flying') drawMessage(ctx, state.message);
  if (state.mode === 'title') drawTitle(ctx, state);
  if (state.mode === 'paused') drawCenterPanel(ctx, 'Paused', ['Press P or Enter to keep flying.', 'R restarts the mission.']);
  if (state.mode === 'crashed') drawCenterPanel(ctx, 'Flight ended', [state.outcome, `Score ${state.score}`, 'Press R or Enter to try again.']);
  if (state.mode === 'landed') drawCenterPanel(ctx, state.landingGrade || 'Landed', [state.outcome, `Score ${state.score}`, 'Press Enter for the next mission, R to refly.']);
}

function drawTopBar(ctx, state) {
  const mission = currentMission(state);
  panel(ctx, 18, 16, 430, 86, 0.72);
  ctx.fillStyle = COLORS.paper;
  ctx.font = '700 24px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(mission.name, 38, 50);
  ctx.font = '600 19px "Trebuchet MS", sans-serif';
  ctx.fillStyle = COLORS.gold;
  ctx.fillText(objectiveText(state), 38, 78);
  ctx.fillStyle = '#cfe1f7';
  ctx.font = '600 17px "Trebuchet MS", sans-serif';
  if (state.mode === 'flying') ctx.fillText(`${distanceToObjective(state)} m`, 300, 78);

  panel(ctx, VIEW.width - 318, 16, 300, 86, 0.72);
  ctx.fillStyle = COLORS.paper;
  ctx.font = '700 24px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Score ${state.score}`, VIEW.width - 38, 50);
  ctx.font = '600 17px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#cfe1f7';
  ctx.fillText(`Rings ${state.rings.filter((r) => r.passed).length}/${state.rings.length}`, VIEW.width - 38, 78);
}

function drawPanel(ctx, state) {
  const p = state.plane;
  const y = VIEW.height - 158;
  panel(ctx, 18, y, VIEW.width - 36, 140, 0.86);

  gauge(ctx, 120, y + 60, 50, p.speed, 0, 150, 'SPEED', 'm/s', '#35e0c8');
  gauge(ctx, 300, y + 60, 50, p.alt, 0, 420, 'ALTITUDE', 'm', '#ffd166');
  gauge(ctx, 480, y + 60, 50, p.climb, -22, 18, 'CLIMB', 'm/s', '#8ecbff');

  drawCompass(ctx, 650, y + 24, 300, headingDegrees(p.heading));
  bar(ctx, 650, y + 92, 300, 'THROTTLE', p.throttle, '#ffd166');
  bar(ctx, 650, y + 122, 300, 'FUEL', state.fuel / 100, state.fuel < 22 ? '#ff6b6b' : '#35e0c8');

  bar(ctx, 990, y + 48, 230, 'DAMAGE', state.damage / 100, state.damage > 55 ? '#ff6b6b' : '#8ecbff');
  ctx.fillStyle = COLORS.paper;
  ctx.font = '700 19px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(p.engineOn ? (p.boost ? 'BOOST' : 'ENGINE ON') : 'ENGINE OUT', 990, y + 104);
  ctx.font = '600 16px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#cfe1f7';
  ctx.fillText('Gear down · runway 36', 990, y + 128);
}

function gauge(ctx, cx, cy, r, value, min, max, label, unit, color) {
  ctx.fillStyle = '#0d1830';
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  for (let i = 0; i <= 10; i += 1) {
    const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - 9), cy + Math.sin(a) * (r - 9));
    ctx.lineTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3));
    ctx.stroke();
  }

  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle = Math.PI * 0.75 + t * Math.PI * 1.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * (r - 13), cy + Math.sin(angle) * (r - 13));
  ctx.stroke();
  ctx.fillStyle = COLORS.paper;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '700 15px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy + r + 20);
  ctx.font = '700 17px "Trebuchet MS", sans-serif';
  ctx.fillText(`${Math.round(value)} ${unit}`, cx, cy + 24);
}

function drawCompass(ctx, x, y, w, heading) {
  ctx.fillStyle = '#0d1830';
  roundRect(ctx, x, y, w, 30, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.stroke();
  ctx.fillStyle = COLORS.paper;
  ctx.font = '700 16px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  const labels = [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W'], [360, 'N']];
  for (const [deg, text] of labels) {
    let rel = deg - heading;
    if (rel > 180) rel -= 360;
    if (rel < -180) rel += 360;
    const lx = x + w / 2 + rel * 1.15;
    if (lx > x + 12 && lx < x + w - 12) ctx.fillText(text, lx, y + 21);
  }
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 2);
  ctx.lineTo(x + w / 2 - 6, y + 12);
  ctx.lineTo(x + w / 2 + 6, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.font = '700 15px "Trebuchet MS", sans-serif';
  ctx.fillText(`${String(heading).padStart(3, '0')}°`, x + w / 2, y + 48);
}

function bar(ctx, x, y, w, label, value, color) {
  ctx.fillStyle = COLORS.paper;
  ctx.font = '700 14px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y + 4);
  ctx.fillStyle = '#0d1830';
  roundRect(ctx, x + 92, y - 8, w - 92, 14, 7);
  ctx.fill();
  ctx.fillStyle = color;
  const fillW = Math.max(0, Math.min(1, value)) * (w - 92);
  if (fillW > 2) {
    roundRect(ctx, x + 92, y - 8, fillW, 14, 7);
    ctx.fill();
  }
}

function drawMessage(ctx, text) {
  ctx.font = '700 26px "Trebuchet MS", sans-serif';
  const w = Math.min(760, ctx.measureText(text).width + 56);
  panel(ctx, (VIEW.width - w) / 2, 118, w, 52, 0.78);
  ctx.fillStyle = COLORS.paper;
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW.width / 2, 152);
}

function drawTitle(ctx, state) {
  const mission = currentMission(state);
  panel(ctx, 300, 120, 680, 430, 0.88);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = '800 58px "Trebuchet MS", sans-serif';
  ctx.fillText('AURORA COURIER', VIEW.width / 2, 196);
  ctx.fillStyle = COLORS.paper;
  ctx.font = '700 27px "Trebuchet MS", sans-serif';
  ctx.fillText(mission.name, VIEW.width / 2, 244);
  ctx.font = '600 20px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#cfe1f7';
  wrapText(ctx, mission.brief, VIEW.width / 2, 282, 560, 28);
  ctx.font = '600 18px "Trebuchet MS", sans-serif';
  const lines = [
    'Arrows or WASD: climb, dive and turn',
    'Shift / Ctrl: throttle · Space: boost · B: brake',
    'Mouse also steers. P pauses. R restarts.',
    'Thread each gold ring, then land gently on runway 36.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 356 + i * 30));
  ctx.fillStyle = COLORS.gold;
  ctx.font = '800 25px "Trebuchet MS", sans-serif';
  ctx.fillText('Press Enter to take off', VIEW.width / 2, 508);
}

function drawCenterPanel(ctx, title, lines) {
  panel(ctx, 330, 190, 620, 300, 0.9);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = '800 42px "Trebuchet MS", sans-serif';
  ctx.fillText(title, VIEW.width / 2, 262);
  ctx.fillStyle = COLORS.paper;
  ctx.font = '600 20px "Trebuchet MS", sans-serif';
  let y = 312;
  for (const line of lines) {
    y = wrapText(ctx, line, VIEW.width / 2, y, 520, 28) + 10;
  }
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cx, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, cy);
  return cy;
}

function panel(ctx, x, y, w, h, alpha) {
  ctx.fillStyle = `rgba(8,15,30,${alpha})`;
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
