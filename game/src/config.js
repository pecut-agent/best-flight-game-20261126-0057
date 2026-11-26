// Shared tuning for Aurora Courier. Distances are metres, speeds are metres per second.

export const VIEW = {
  width: 1280,
  height: 720,
  focal: 620,
  cameraBack: 26,
  cameraUp: 7,
  far: 2400,
};

export const PLANE = {
  minSpeed: 24,
  cruiseSpeed: 62,
  maxSpeed: 118,
  boostSpeed: 142,
  stallSpeed: 30,
  maxClimb: 17,
  maxSink: 21,
  turnRate: 0.62,
  startAltitude: 150,
};

export const RUNWAY = {
  x: 0,
  zStart: 1500,
  zEnd: 1900,
  halfWidth: 26,
  heading: 0,
};

export const COLORS = {
  skyTop: '#5f9fe8',
  skyMid: '#9cc8f2',
  skyLow: '#dceeff',
  sun: '#fff3b0',
  sea: '#2e7fc2',
  seaDeep: '#1d5f9e',
  sand: '#e8d29a',
  fieldA: '#7db85c',
  fieldB: '#a8c66c',
  forest: '#3f7d4e',
  rock: '#8b8fa3',
  snow: '#f4f8ff',
  runway: '#3c4356',
  gold: '#ffd166',
  teal: '#35e0c8',
  ink: '#10203a',
  paper: '#f7fbff',
};

export const MISSIONS = [
  {
    name: 'Harbor Delivery',
    brief: 'Thread five gold rings over the coast, then land on runway 36.',
    fuel: 100,
    wind: 0,
    rings: [
      { x: -40, z: 420, alt: 150, radius: 34 },
      { x: 70, z: 700, alt: 170, radius: 32 },
      { x: -90, z: 980, alt: 150, radius: 30 },
      { x: 30, z: 1220, alt: 120, radius: 28 },
      { x: 0, z: 1420, alt: 82, radius: 26 },
    ],
  },
  {
    name: 'Aurora Post Run',
    brief: 'Six tighter rings, a light crosswind, and a shorter fuel margin.',
    fuel: 82,
    wind: 3.2,
    rings: [
      { x: 90, z: 380, alt: 165, radius: 28 },
      { x: -120, z: 640, alt: 190, radius: 26 },
      { x: 130, z: 900, alt: 150, radius: 25 },
      { x: -60, z: 1140, alt: 125, radius: 24 },
      { x: 45, z: 1320, alt: 95, radius: 22 },
      { x: 0, z: 1440, alt: 70, radius: 20 },
    ],
  },
];
