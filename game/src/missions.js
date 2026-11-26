import { RUNWAY } from './config.js';
import { setMessage } from './state.js';
import { isRunwayArea, terrainHeight } from './terrain.js';

// Mission rules: rings in order, then a judged landing on the runway.

export function updateMission(state, events) {
  const p = state.plane;
  const ring = state.rings[state.nextRing];
  if (ring && !ring.passed && !ring.missed) {
    const dz = p.z - ring.z;
    if (Math.abs(dz) < 14) {
      const lateral = Math.abs(p.x - ring.x);
      const vertical = Math.abs(p.alt - ring.alt);
      const dist = Math.hypot(lateral, vertical);
      if (dist <= ring.radius) {
        ring.passed = true;
        const accuracy = Math.max(0, 1 - dist / ring.radius);
        const points = Math.round(120 + accuracy * 180);
        state.score += points;
        state.nextRing += 1;
        setMessage(state, `Ring clear +${points}`, 2.4);
        events.ring = true;
        spawnSparkles(state, ring);
      }
    } else if (dz > 30) {
      ring.missed = true;
      state.nextRing += 1;
      state.damage = Math.min(100, state.damage + 4);
      setMessage(state, 'Ring missed — keep flying', 2.4);
      events.missed = true;
    }
  }

  const ground = terrainHeight(p.x, p.z);
  if (p.alt <= ground + 1.2) {
    judgeTouchdown(state, ground, events);
  }
}

function judgeTouchdown(state, ground, events) {
  const p = state.plane;
  const onRunway = isRunwayArea(p.x, p.z, 2);
  const sink = -p.climb;
  const aligned = Math.abs(wrap(p.heading)) < 0.22;
  const ringsDone = state.nextRing >= state.rings.length;
  p.alt = ground + 1.2;

  if (!onRunway) {
    state.damage = 100;
    state.mode = 'crashed';
    state.outcome = 'Off-field touchdown. The courier parcel is soggy, but the pilot walks away.';
    events.crash = true;
    return;
  }

  if (sink > 9 || p.speed > 86 || !aligned) {
    state.damage = 100;
    state.mode = 'crashed';
    state.outcome = 'Hard arrival on the runway. Flare earlier and keep the nose straight.';
    events.crash = true;
    return;
  }

  let grade = 'Firm landing';
  let bonus = 180;
  if (sink < 2.2 && p.speed < 58) {
    grade = 'Silk landing';
    bonus = 420;
  } else if (sink < 4.5 && p.speed < 70) {
    grade = 'Smooth landing';
    bonus = 300;
  }
  if (!ringsDone) bonus = Math.round(bonus * 0.45);
  state.score += bonus + Math.round(state.fuel * 2) - Math.round(state.damage);
  state.landingGrade = grade;
  state.mode = 'landed';
  state.outcome = ringsDone
    ? `${grade}. Every ring threaded and the parcel delivered dry.`
    : `${grade}, but some rings were skipped. The parcel still made it.`;
  events.landed = true;
}

export function objectiveText(state) {
  if (state.mode === 'title') return 'Mission briefing';
  if (state.mode === 'crashed') return 'Flight ended';
  if (state.mode === 'landed') return 'Parcel delivered';
  const ring = state.rings[state.nextRing];
  if (ring) return `Ring ${state.nextRing + 1} of ${state.rings.length}`;
  return 'Land on runway 36';
}

export function distanceToObjective(state) {
  const p = state.plane;
  const ring = state.rings[state.nextRing];
  const target = ring || { x: RUNWAY.x, z: (RUNWAY.zStart + RUNWAY.zEnd) / 2, alt: 0 };
  return Math.round(Math.hypot(target.x - p.x, target.z - p.z));
}

function spawnSparkles(state, ring) {
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * Math.PI * 2;
    state.particles.push({
      x: ring.x + Math.cos(a) * ring.radius * 0.5,
      y: ring.alt + Math.sin(a) * ring.radius * 0.5,
      z: ring.z,
      life: 0.9,
      vx: Math.cos(a) * 9,
      vy: Math.sin(a) * 9,
      vz: 0,
    });
  }
}

function wrap(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}
