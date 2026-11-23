/** Original beds, a short lute pattern, and paper-thin UI ticks. No recorded music. */

const LUTE = [220, 293.66, 329.63, 261.63, 196, 293.66, 246.94, 329.63];

export function createAudio() {
  let ctx = null;
  let master = null;
  let luteGain = null;
  let panner = null;
  let noise = null;
  let beds = null;
  let stepAt = 0;
  let luteAt = 0;
  let luteStep = 0;
  let muted = false;

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);

    const a = ctx.createOscillator();
    const b = ctx.createOscillator();
    a.type = 'sine';
    b.type = 'sine';
    a.frequency.value = 110;
    b.frequency.value = 164.81;
    const pad = ctx.createGain();
    pad.gain.value = 0.018;
    a.connect(pad);
    b.connect(pad);
    pad.connect(master);
    a.start();
    b.start();

    const len = ctx.sampleRate * 2;
    const data = new Float32Array(len);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    buffer.copyToChannel(data, 0);
    noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    noise.connect(filter);
    noise.start();

    const makeBed = (type, freq, gain) => {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0;
      filter.connect(f);
      f.connect(g);
      g.connect(master);
      return g;
    };
    beds = {
      beach: makeBed('highpass', 700, 0),
      works: makeBed('lowpass', 180, 0),
      falls: makeBed('bandpass', 500, 0),
      square: makeBed('bandpass', 320, 0),
    };
    beds.works.gain.value = 0;

    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 73;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0;
    drone.connect(droneGain);
    droneGain.connect(master);
    drone.start();
    beds.drone = droneGain;

    luteGain = ctx.createGain();
    luteGain.gain.value = 0;
    panner = ctx.createStereoPanner();
    luteGain.connect(panner);
    panner.connect(master);
    return true;
  }

  function envGain(freq, dur, type, gain, dest) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(dest || master);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  }

  return {
    resume() {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
    },
    setMuted(on) {
      muted = on;
      if (master) master.gain.value = on ? 0 : 0.8;
    },
    blip(pitch = 520) {
      if (!ctx || muted) return;
      envGain(pitch, 0.06, 'triangle', 0.035);
    },
    whoosh() {
      if (!ctx || muted) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(280, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.45);
      g.gain.setValueAtTime(0.04, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      o.connect(g);
      g.connect(master);
      o.start();
      o.stop(ctx.currentTime + 0.52);
    },
    update({ region, sorenDist, sorenPan, moving, wet }) {
      if (!ctx || muted) return;
      const now = ctx.currentTime;
      const target = { beach: 0, works: 0, falls: 0, square: 0, drone: 0 };
      if (region === 'beach') target.beach = 0.05;
      else if (region === 'works') { target.works = 0.04; target.drone = 0.03; }
      else if (region === 'falls') target.falls = 0.045;
      else if (region === 'square' || region === 'ward') target.square = 0.012;
      if (wet > 0.4) target.beach = Math.max(target.beach, 0.03);
      for (const key of Object.keys(target)) {
        const node = key === 'drone' ? beds.drone : beds[key];
        const cur = node.gain.value;
        node.gain.value = cur + (target[key] - cur) * 0.05;
      }
      const audible = Math.max(0, 1 - sorenDist / 46);
      luteGain.gain.value = audible * audible * 0.22;
      panner.pan.value = Math.max(-1, Math.min(1, sorenPan || 0));
      if (audible > 0.03 && now > luteAt) {
        const freq = LUTE[luteStep % LUTE.length];
        envGain(freq, 0.7, 'triangle', 0.12, luteGain);
        envGain(freq * 2, 0.25, 'sine', 0.03, luteGain);
        luteStep += 1;
        luteAt = now + 0.52;
      }
      if (moving && now > stepAt) {
        envGain(wet > 0.35 ? 180 : 90, 0.05, 'square', wet > 0.35 ? 0.02 : 0.012);
        stepAt = now + (moving > 6 ? 0.28 : 0.42);
      }
    },
  };
}
