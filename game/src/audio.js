// Generated WebAudio: engine hum, wind wash and small event chimes. No audio files.

export function createAudio() {
  let ctx = null;
  let engineOsc = null;
  let engineGain = null;
  let windGain = null;

  function ensure() {
    if (ctx) return true;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return false;
    ctx = new AudioCtor();

    engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    engineGain = ctx.createGain();
    engineGain.gain.value = 0;
    engineOsc.connect(filter).connect(engineGain).connect(ctx.destination);
    engineOsc.start();

    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.72 + white * 0.28;
      data[i] = last;
    }
    const wind = ctx.createBufferSource();
    wind.buffer = buffer;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 900;
    windGain = ctx.createGain();
    windGain.gain.value = 0;
    wind.connect(windFilter).connect(windGain).connect(ctx.destination);
    wind.start();
    return true;
  }

  function update(state) {
    if (!ctx || !engineOsc) return;
    const p = state.plane;
    const flying = state.mode === 'flying';
    const targetEngine = flying && p.engineOn ? 0.028 + p.throttle * 0.05 : 0;
    const targetWind = flying ? Math.min(0.09, p.speed / 1600) : 0;
    engineGain.gain.setTargetAtTime(targetEngine, ctx.currentTime, 0.08);
    windGain.gain.setTargetAtTime(targetWind, ctx.currentTime, 0.12);
    engineOsc.frequency.setTargetAtTime(58 + p.throttle * 74 + (p.boost ? 22 : 0), ctx.currentTime, 0.08);
  }

  function chime() {
    if (!ensure()) return;
    tone(880, 0.12, 0.08);
    tone(1318, 0.18, 0.06, 0.07);
  }

  function thud() {
    if (!ensure()) return;
    tone(82, 0.28, 0.16);
  }

  function tone(freq, seconds, volume, delay = 0) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + delay;
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  }

  return { ensure, update, chime, thud };
}
