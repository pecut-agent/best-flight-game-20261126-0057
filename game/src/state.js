import { MISSIONS, PLANE } from './config.js';

// One mutable game state object. Every module reads or updates this shape.

export function createState() {
  return {
    mode: 'title',
    missionIndex: 0,
    score: 0,
    time: 0,
    message: 'Press Enter to take off',
    messageTimer: 0,
    plane: freshPlane(),
    rings: [],
    nextRing: 0,
    fuel: MISSIONS[0].fuel,
    damage: 0,
    outcome: '',
    landingGrade: '',
    shot: '',
    particles: [],
  };
}

export function freshPlane() {
  return {
    x: 0,
    z: 60,
    alt: PLANE.startAltitude,
    heading: 0,
    speed: PLANE.cruiseSpeed,
    throttle: 0.62,
    climb: 0,
    roll: 0,
    pitchInput: 0,
    rollInput: 0,
    boost: false,
    engineOn: true,
    gearDown: true,
  };
}

export function loadMission(state, index) {
  const mission = MISSIONS[index % MISSIONS.length];
  state.missionIndex = index % MISSIONS.length;
  state.plane = freshPlane();
  state.rings = mission.rings.map((ring) => ({ ...ring, passed: false, missed: false }));
  state.nextRing = 0;
  state.fuel = mission.fuel;
  state.damage = 0;
  state.outcome = '';
  state.landingGrade = '';
  state.particles = [];
  state.message = mission.brief;
  state.messageTimer = 6;
}

export function currentMission(state) {
  return MISSIONS[state.missionIndex];
}

export function setMessage(state, text, seconds = 3) {
  state.message = text;
  state.messageTimer = seconds;
}
