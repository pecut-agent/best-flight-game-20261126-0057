import { updatePlane } from './aircraft.js';
import { createAudio } from './audio.js';
import { consumePress, createInput, endFrame, readControls } from './input.js';
import { updateMission } from './missions.js';
import { renderScene } from './render.js';
import { createState, currentMission, loadMission } from './state.js';
import { drawHud } from './hud.js';

// Entry point: fixed-step simulation, mode changes and deterministic screenshot scenes.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();
const state = createState();
loadMission(state, 0);
state.mode = 'title';

const shot = new URLSearchParams(window.location.search).get('shot') || '';
if (shot) applyShot(shot);

let last = performance.now();
let accumulator = 0;
const STEP = 1 / 60;

function frame(now) {
  const elapsed = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!state.shot) {
    accumulator += elapsed;
    while (accumulator >= STEP) {
      tick(STEP);
      accumulator -= STEP;
    }
  }
  renderScene(ctx, state);
  drawHud(ctx, state);
  audio.update(state);
  endFrame(input);
  requestAnimationFrame(frame);
}

function tick(dt) {
  state.time += dt;
  state.messageTimer = Math.max(0, state.messageTimer - dt);
  updateParticles(dt);
  state.wind = currentMission(state).wind;

  const startPressed = consumePress(input, 'Enter') || consumePress(input, 'PointerStart');
  const restartPressed = consumePress(input, 'KeyR');
  const pausePressed = consumePress(input, 'KeyP');

  if (state.mode === 'title') {
    if (startPressed) beginFlight();
    return;
  }

  if (state.mode === 'paused') {
    if (pausePressed || startPressed) state.mode = 'flying';
    if (restartPressed) restartMission();
    return;
  }

  if (state.mode === 'crashed') {
    if (restartPressed || startPressed) restartMission();
    return;
  }

  if (state.mode === 'landed') {
    if (startPressed) {
      loadMission(state, state.missionIndex + 1);
      state.mode = 'flying';
      audio.ensure();
    } else if (restartPressed) {
      restartMission();
    }
    return;
  }

  if (pausePressed) {
    state.mode = 'paused';
    return;
  }
  if (restartPressed) {
    restartMission();
    return;
  }

  const controls = readControls(input);
  updatePlane(state, controls, dt);
  const events = {};
  updateMission(state, events);
  if (events.ring) audio.chime();
  if (events.crash) audio.thud();
  if (events.landed) audio.chime();
}

function beginFlight() {
  loadMission(state, state.missionIndex);
  state.mode = 'flying';
  audio.ensure();
}

function restartMission() {
  loadMission(state, state.missionIndex);
  state.mode = 'flying';
  audio.ensure();
}

function updateParticles(dt) {
  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.z += particle.vz * dt;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
}

function applyShot(name) {
  state.shot = name;
  state.time = 4.25;
  if (name === 'mission') {
    loadMission(state, 1);
    state.mode = 'title';
    placePlane({ x: -30, z: 180, alt: 150, heading: 0.04, speed: 64, climb: 2, roll: -0.08, throttle: 0.66 });
    state.score = 0;
    return;
  }

  loadMission(state, 0);
  state.mode = 'flying';
  if (name === 'cover') {
    placePlane({ x: -24, z: 760, alt: 152, heading: 0.02, speed: 68, climb: 1.5, roll: -0.1, throttle: 0.68 });
    state.score = 520;
    state.rings[0].passed = true;
    state.rings[1].passed = true;
    state.nextRing = 2;
    state.message = 'Thread the gold ring';
    state.messageTimer = 3;
  } else if (name === 'cockpit') {
    placePlane({ x: -170, z: 520, alt: 118, heading: 0.16, speed: 74, climb: -1, roll: 0.18, throttle: 0.74 });
    state.score = 520;
    state.rings[0].passed = true;
    state.nextRing = 1;
    state.message = 'Coast on the left, peaks on the right';
    state.messageTimer = 3;
  } else if (name === 'landing') {
    placePlane({ x: 4, z: 1455, alt: 42, heading: 0.01, speed: 54, climb: -2.4, roll: 0.02, throttle: 0.42 });
    state.score = 1180;
    for (const ring of state.rings) ring.passed = true;
    state.nextRing = state.rings.length;
    state.fuel = 46;
    state.message = 'Final approach — flare gently';
    state.messageTimer = 3;
  }
}

function placePlane(values) {
  Object.assign(state.plane, values);
  state.plane.engineOn = true;
  state.plane.gearDown = true;
}

requestAnimationFrame(frame);
