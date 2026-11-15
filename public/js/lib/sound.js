// Gentle sounds made on the fly: a soft plucked "santur" chime for little
// wins, and an optional trickling-fountain ambience.

let ctx = null;
function audio() {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

const prefersQuiet = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function pluck(freq, when, gainLevel = 0.18) {
  const a = audio();
  const osc = a.createOscillator();
  const osc2 = a.createOscillator();
  const gain = a.createGain();
  const filter = a.createBiquadFilter();
  osc.type = "triangle";
  osc2.type = "sine";
  osc.frequency.value = freq;
  osc2.frequency.value = freq * 2.01;
  filter.type = "lowpass";
  filter.frequency.value = 3200;
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(gainLevel, when + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 1.6);
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain).connect(a.destination);
  osc.start(when);
  osc2.start(when);
  osc.stop(when + 1.7);
  osc2.stop(when + 1.7);
}

/** A little rising phrase on a Persian-flavoured scale. */
export function chime(kind = "yes") {
  if (prefersQuiet()) return;
  try {
    const a = audio();
    const t = a.currentTime + 0.02;
    const notes = kind === "bloom" ? [392, 466.2, 523.3, 587.3, 698.5] : kind === "almost" ? [392, 440] : [440, 523.3, 659.3];
    notes.forEach((f, i) => pluck(f, t + i * 0.11, kind === "almost" ? 0.1 : 0.16));
  } catch {
    // audio not available
  }
}

let fountain = null;
export function setAmbience(on) {
  try {
    if (!on) {
      fountain?.stop();
      fountain = null;
      return;
    }
    if (fountain) return;
    const a = audio();
    const buffer = a.createBuffer(1, a.sampleRate * 4, a.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brownish noise
      data[i] = last * 3.2;
    }
    const src = a.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const band = a.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 900;
    band.Q.value = 0.6;
    const gain = a.createGain();
    gain.gain.value = 0.05;
    const lfo = a.createOscillator();
    const lfoGain = a.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain).connect(band.frequency);
    src.connect(band).connect(gain).connect(a.destination);
    src.start();
    lfo.start();
    fountain = {
      stop() {
        gain.gain.setTargetAtTime(0, a.currentTime, 0.4);
        setTimeout(() => {
          src.stop();
          lfo.stop();
        }, 1500);
      },
    };
  } catch {
    fountain = null;
  }
}
