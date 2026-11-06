// Procedural music + SFX generator for the ScienceStick composition.
// Usage (from the Remotion project root):  node generate-audio.mjs
// Writes mono 16-bit 44.1 kHz WAVs to public/audio/. No dependencies.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {Buffer} from 'node:buffer';
import console from 'node:console';

const SR = 44100;
const OUT = path.join(process.cwd(), 'public', 'audio');
fs.mkdirSync(OUT, {recursive: true});

let seed = 12345; // deterministic noise so every build is identical
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 4294967296) * 2 - 1;
};
const buf = (sec) => new Float32Array(Math.floor(sec * SR));
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const TAU = Math.PI * 2;
const lpA = (fc) => 1 - Math.exp((-TAU * fc) / SR);

const norm = (b, peak = 0.9) => {
  let m = 0;
  for (const v of b) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < b.length; i++) b[i] *= peak / m;
  return b;
};

const save = (name, b) => {
  const n = b.length;
  const d = Buffer.alloc(44 + n * 2);
  d.write('RIFF', 0);
  d.writeUInt32LE(36 + n * 2, 4);
  d.write('WAVEfmt ', 8);
  d.writeUInt32LE(16, 16);
  d.writeUInt16LE(1, 20);
  d.writeUInt16LE(1, 22);
  d.writeUInt32LE(SR, 24);
  d.writeUInt32LE(SR * 2, 28);
  d.writeUInt16LE(2, 32);
  d.writeUInt16LE(16, 34);
  d.write('data', 36);
  d.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    d.writeInt16LE(Math.round(Math.max(-1, Math.min(1, b[i])) * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT, name + '.wav'), d);
  console.log('wrote', name + '.wav', (d.length / 1024).toFixed(0) + ' KB');
};

/* ------------------------------ SFX ------------------------------ */
const sfx = {
  whoosh() {
    const b = buf(1.2);
    let y = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / b.length;
      y += lpA(300 + 4000 * Math.sin(Math.PI * t)) * (rnd() - y);
      b[i] = y * Math.pow(Math.sin(Math.PI * t), 2);
    }
    return norm(b, 0.8);
  },
  ticking() {
    const b = buf(3);
    for (let k = 0; k < 6; k++) {
      const s = Math.floor(k * 0.5 * SR);
      const f = k % 2 ? 1500 : 1900;
      for (let j = 0; j < 0.08 * SR; j++) {
        const t = j / SR;
        b[s + j] += (rnd() * 0.5 + Math.sin(TAU * f * t)) * Math.exp(-t * 60);
      }
    }
    return norm(b, 0.8);
  },
  boom() {
    const b = buf(2);
    let ph = 0;
    let y = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      ph += (TAU * (35 + 70 * Math.exp(-t * 3))) / SR;
      y += lpA(200) * (rnd() - y);
      b[i] = (Math.sin(ph) + 0.6 * y) * Math.exp(-t * 2.2);
    }
    return norm(b, 0.95);
  },
  sparkle() {
    const b = buf(1.5);
    for (let k = 0; k < 14; k++) {
      const s = Math.floor(Math.abs(rnd()) * 1.1 * SR);
      const f = 2000 + 3000 * Math.abs(rnd());
      for (let j = 0; j < 0.3 * SR && s + j < b.length; j++) {
        const t = j / SR;
        b[s + j] += Math.sin(TAU * f * t) * Math.exp(-t * 14);
      }
    }
    return norm(b, 0.7);
  },
  riser() {
    const b = buf(2.5);
    let ph = 0;
    let y = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / b.length;
      ph += (TAU * (200 + 1000 * t * t)) / SR;
      y += lpA(400 + 6000 * t) * (rnd() - y);
      b[i] = (0.5 * Math.sin(ph) + y) * Math.pow(t, 1.8);
    }
    return norm(b, 0.85);
  },
  pop() {
    const b = buf(0.3);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      ph += (TAU * (200 + 400 * Math.exp(-t * 40))) / SR;
      b[i] = Math.sin(ph) * Math.exp(-t * 18);
    }
    return norm(b, 0.9);
  },
  alien() {
    const b = buf(1.5);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      ph += (TAU * (450 + 130 * Math.sin(TAU * 6 * t))) / SR;
      b[i] = (Math.sin(ph) + 0.4 * Math.sin(2 * ph)) * Math.pow(Math.sin(Math.PI * (t / 1.5)), 1.5);
    }
    return norm(b, 0.7);
  },
  beep() {
    const b = buf(0.6);
    [[0, 880], [0.3, 1320]].forEach(([start, f]) => {
      const s = Math.floor(start * SR);
      for (let j = 0; j < 0.2 * SR; j++) {
        const t = j / SR;
        b[s + j] += Math.sin(TAU * f * t) * Math.min(1, t * 200) * Math.min(1, (0.2 - t) * 200);
      }
    });
    return norm(b, 0.7);
  },
};

/* ----------------------------- MUSIC ----------------------------- */
// 32 s seamless loop: 4 chords x 8 s. Pads overlap the next chord and wrap
// around the end of the buffer, so the loop point has no click.
const MOODS = {
  mysterious: {bpm: 60, arpDiv: 2, arpVol: 0.1, chords: [[57, 60, 64], [53, 57, 60, 64], [50, 53, 57], [52, 56, 59, 64]]},
  epic: {bpm: 100, arpDiv: 2, arpVol: 0.12, chords: [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]},
  curious: {bpm: 90, arpDiv: 2, arpVol: 0.14, chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]},
  calm: {bpm: 48, arpDiv: 1, arpVol: 0.1, chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]]},
};

const music = (m) => {
  const b = buf(32);
  const N = b.length;
  const add = (i, v) => {
    b[((i % N) + N) % N] += v;
  };
  m.chords.forEach((ch, ci) => {
    const start = ci * 8 * SR;
    // pads: three slightly detuned voices per note
    for (const note of ch) {
      for (const det of [-0.003, 0, 0.003]) {
        const f = hz(note) * (1 + det);
        let ph = 0;
        for (let j = 0; j < 9.5 * SR; j++) {
          const t = j / SR;
          const env = Math.min(1, t / 2) * Math.min(1, (9.5 - t) / 2);
          ph += (TAU * f) / SR;
          add(start + j, (Math.sin(ph) + 0.3 * Math.sin(2 * ph)) * env * 0.05);
        }
      }
    }
    // sub bass
    {
      const f = hz(ch[0] - 12);
      let ph = 0;
      for (let j = 0; j < 9 * SR; j++) {
        const t = j / SR;
        const env = Math.min(1, t / 1.5) * Math.min(1, (9 - t) / 1.5);
        ph += (TAU * f) / SR;
        add(start + j, Math.sin(ph) * env * 0.16);
      }
    }
    // arpeggio plucks
    const step = 60 / m.bpm / m.arpDiv;
    const n = Math.floor(8 / step);
    for (let k = 0; k < n; k++) {
      const octave = k % (ch.length * 2) >= ch.length ? 12 : 0;
      const f = hz(ch[k % ch.length] + 12 + octave);
      const s = start + Math.floor(k * step * SR);
      for (let j = 0; j < 1.2 * SR; j++) {
        const t = j / SR;
        add(s + j, Math.sin(TAU * f * t) * Math.exp(-t * 4) * m.arpVol);
      }
    }
  });
  return norm(b, 0.8);
};

for (const [name, fn] of Object.entries(sfx)) save('sfx_' + name, fn());
for (const [name, mood] of Object.entries(MOODS)) save('music_' + name, music(mood));
