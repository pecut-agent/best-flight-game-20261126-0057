// Keyboard and mouse input. Keys are tracked by code so layouts stay predictable.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouseActive: false,
    mouseX: 0,
    mouseY: 0,
    pressed: new Set(),
  };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!input.keys.has(event.code)) input.pressed.add(event.code);
    input.keys.add(event.code);
  });

  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
  });

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    input.mouseY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    input.mouseActive = true;
  });

  canvas.addEventListener('pointerleave', () => {
    input.mouseActive = false;
  });

  canvas.addEventListener('pointerdown', () => {
    canvas.focus();
    input.pressed.add('PointerStart');
  });

  return input;
}

export function readControls(input) {
  const down = (code) => input.keys.has(code);
  let pitch = 0;
  let roll = 0;
  if (down('ArrowUp') || down('KeyW')) pitch += 1;
  if (down('ArrowDown') || down('KeyS')) pitch -= 1;
  if (down('ArrowLeft') || down('KeyA')) roll -= 1;
  if (down('ArrowRight') || down('KeyD')) roll += 1;
  if (pitch === 0 && input.mouseActive) pitch = clamp(-input.mouseY * 1.4, -1, 1);
  if (roll === 0 && input.mouseActive) roll = clamp(input.mouseX * 1.4, -1, 1);
  return {
    pitch,
    roll,
    throttleUp: down('ShiftLeft') || down('ShiftRight'),
    throttleDown: down('ControlLeft') || down('ControlRight'),
    boost: down('Space'),
    brake: down('KeyB'),
  };
}

export function consumePress(input, code) {
  if (!input.pressed.has(code)) return false;
  input.pressed.delete(code);
  return true;
}

export function endFrame(input) {
  input.pressed.clear();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
