import { PLANE } from './config.js';
import { terrainHeight } from './terrain.js';

// Flight model: throttle sets target speed, pitch trades speed for climb, roll turns the nose.

export function updatePlane(state, controls, dt) {
  const p = state.plane;
  const missionWind = state.wind || 0;

  if (controls.throttleUp) p.throttle = clamp(p.throttle + dt * 0.55, 0, 1);
  if (controls.throttleDown) p.throttle = clamp(p.throttle - dt * 0.55, 0, 1);
  p.boost = controls.boost && state.fuel > 0;
  p.engineOn = state.fuel > 0;

  const targetSpeed = p.engineOn
    ? PLANE.minSpeed + p.throttle * (PLANE.maxSpeed - PLANE.minSpeed) + (p.boost ? 24 : 0)
    : PLANE.minSpeed;
  const accel = p.engineOn ? 14 : 7;
  p.speed += clamp(targetSpeed - p.speed, -accel * dt * 2.2, accel * dt);
  if (controls.brake) p.speed = Math.max(PLANE.minSpeed, p.speed - 26 * dt);
  p.speed = clamp(p.speed, 12, PLANE.boostSpeed);

  p.pitchInput = controls.pitch;
  p.rollInput = controls.roll;
  const lift = clamp((p.speed - PLANE.stallSpeed) / 45, 0, 1.25);
  const wantedClimb = controls.pitch * PLANE.maxClimb * lift - (p.engineOn ? 0 : 5.5);
  p.climb += clamp(wantedClimb - p.climb, -22 * dt, 22 * dt);
  p.climb = clamp(p.climb, -PLANE.maxSink, PLANE.maxClimb);
  p.speed -= p.climb * dt * 0.55;
  p.speed = clamp(p.speed, 12, PLANE.boostSpeed);

  const wantedRoll = controls.roll * 0.72;
  p.roll += clamp(wantedRoll - p.roll, -2.4 * dt, 2.4 * dt);
  p.heading += p.roll * PLANE.turnRate * dt * clamp(p.speed / PLANE.cruiseSpeed, 0.55, 1.25);
  p.heading = wrapAngle(p.heading);

  p.x += Math.sin(p.heading) * p.speed * dt + missionWind * dt;
  p.z += Math.cos(p.heading) * p.speed * dt;
  p.alt += p.climb * dt;
  p.alt = Math.min(p.alt, 420);

  const burn = dt * (0.55 + p.throttle * 1.5 + (p.boost ? 1.6 : 0));
  state.fuel = Math.max(0, state.fuel - burn);

  const ground = terrainHeight(p.x, p.z);
  return { ground, clearance: p.alt - ground };
}

export function headingDegrees(heading) {
  const deg = Math.round(((heading * 180) / Math.PI + 360) % 360);
  return deg === 0 ? 360 : deg;
}

export function wrapAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
