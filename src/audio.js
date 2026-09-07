/**
 * Taveez — Web Audio API Procedural Sound Generator
 * 100% Client-Side Synthesizer for Chimes, Bells, Bowls, and Taps
 */

let audioCtx = null;
let isMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setMuted(muted) {
  isMuted = muted;
}

export function getMuted() {
  return isMuted;
}

export function playRitualSound(preset = 'bell') {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (preset) {
      case 'chime':
        playChime(ctx, now);
        break;
      case 'bowl':
        playSingingBowl(ctx, now);
        break;
      case 'gong':
        playGong(ctx, now);
        break;
      case 'wood':
        playWoodBlock(ctx, now);
        break;
      case 'bell':
      default:
        playBrassBell(ctx, now);
        break;
    }
  } catch (err) {
    console.warn('Audio playback prevented or unsupported:', err);
  }
}

/**
 * Brass Bell: Clear metallic fundamental with harmonic overtones
 */
function playBrassBell(ctx, now) {
  const frequencies = [587.33, 1174.66, 1762.0]; // D5 and harmonics
  const gains = [0.4, 0.15, 0.08];

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(gains[idx], now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.8);
  });
}

/**
 * Glass Chime: High delicate arpeggiated frequencies
 */
function playChime(ctx, now) {
  const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6

  notes.forEach((freq, idx) => {
    const startTime = now + idx * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 1.2);
  });
}

/**
 * Tibetan Singing Bowl: Warm low tone with subtle LFO tremolo
 */
function playSingingBowl(ctx, now) {
  const osc = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const mainGain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(261.63, now); // C4 fundamental

  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(3.5, now); // 3.5Hz tremolo
  lfoGain.gain.setValueAtTime(0.08, now);

  lfo.connect(mainGain.gain);

  mainGain.gain.setValueAtTime(0.3, now);
  mainGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

  osc.connect(mainGain);
  mainGain.connect(ctx.destination);

  lfo.start(now);
  osc.start(now);

  lfo.stop(now + 2.5);
  osc.stop(now + 2.5);
}

/**
 * Gong: Low resonant metallic impact
 */
function playGong(ctx, now) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(146.83, now); // D3

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(220.0, now); // A3

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);

  osc1.stop(now + 2.2);
  osc2.stop(now + 2.2);
}

/**
 * Wooden Block: Short crisp impulse tap
 */
function playWoodBlock(ctx, now) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

/**
 * Swing Nudge Sound: Gentle subtle tick when charm swings or collides
 */
function playSwingTick(ctx, now = (audioCtx ? audioCtx.currentTime : 0)) {
  if (isMuted) return;
  try {
    const c = getAudioContext();
    if (!c) return;

    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch (err) {
    // Ignore micro tick errors
  }
}

export { playSwingTick };
