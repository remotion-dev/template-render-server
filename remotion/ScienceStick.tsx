import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  Series,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
  CalculateMetadataFunction,
  staticFile,
} from 'remotion';
import {getAudioDurationInSeconds} from '@remotion/media-utils';

/* ------------------------------------------------------------------ */
/* THEME - edit colors / font here to match your reference channel     */
/* ------------------------------------------------------------------ */
export const theme = {
  stroke: '#ffffff',
  accent: '#ffd93d', // active subtitle word + headline
  cyan: '#00e5ff',
  magenta: '#ff4fd8',
  font: '"Arial Black", Impact, sans-serif',
  bgs: {
    space: ['#050816', '#1a1050'],
    deepblue: ['#06142e', '#0b4f8a'],
    dusk: ['#1b0f3b', '#a63d6f'],
    teal: ['#02131a', '#0f766e'],
  } as Record<string, string[]>,
};

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */
export type Pose =
  | 'idle'
  | 'shocked'
  | 'thinking'
  | 'pointing'
  | 'walking'
  | 'floating'
  | 'celebrate';

export type IconName =
  | 'earth'
  | 'moon'
  | 'sun'
  | 'rocket'
  | 'ufo'
  | 'alien'
  | 'clock'
  | 'blackhole'
  | 'star'
  | 'atom'
  | 'planet'
  | 'lightbulb';

// Names map to public/audio/sfx_<name>.wav and music_<name>.wav,
// created by `node generate-audio.mjs`.
export type SfxName =
  | 'whoosh'
  | 'ticking'
  | 'boom'
  | 'sparkle'
  | 'riser'
  | 'pop'
  | 'alien'
  | 'beep';

export type MusicName = 'mysterious' | 'epic' | 'curious' | 'calm';

export type SceneProps = {
  narration: string;
  headline: string;
  pose: Pose;
  icons: IconName[];
  bg: string;
  voiceUrl: string;
  sfx?: SfxName;
  durationInFrames?: number;
};

export type ScienceStickProps = {
  title: string;
  scenes: SceneProps[];
  music?: MusicName;
};

const FPS = 30;
const PAD_SEC = 0.5; // silence after each narration line

/* ------------------------------------------------------------------ */
/* DURATION = length of each voiceover (so audio/visuals stay in sync) */
/* ------------------------------------------------------------------ */
export const calculateScienceMetadata: CalculateMetadataFunction<
  ScienceStickProps
> = async ({props}) => {
  const scenes = await Promise.all(
    props.scenes.map(async (s) => {
      if (!s.voiceUrl) return {...s, durationInFrames: 90};
      const sec = await getAudioDurationInSeconds(s.voiceUrl);
      return {...s, durationInFrames: Math.max(45, Math.ceil((sec + PAD_SEC) * FPS))};
    }),
  );
  const total = scenes.reduce((a, s) => a + (s.durationInFrames ?? 0), 0);
  return {
    durationInFrames: Math.max(30, total),
    fps: FPS,
    width: 1080,
    height: 1920,
    props: {...props, scenes},
  };
};

/* ------------------------------------------------------------------ */
/* STICK FIGURE                                                        */
/* ------------------------------------------------------------------ */
const POSES: Record<
  Pose,
  {la: number; ra: number; ll: number; rl: number; mouth: 'smile' | 'o' | 'flat'; tilt: number}
> = {
  idle: {la: 25, ra: -25, ll: 10, rl: -10, mouth: 'smile', tilt: 0},
  shocked: {la: 155, ra: -155, ll: 14, rl: -14, mouth: 'o', tilt: 0},
  thinking: {la: 25, ra: -150, ll: 8, rl: -8, mouth: 'flat', tilt: -6},
  pointing: {la: 95, ra: -20, ll: 10, rl: -10, mouth: 'smile', tilt: 0},
  walking: {la: 30, ra: -30, ll: 20, rl: -20, mouth: 'smile', tilt: 0},
  floating: {la: 60, ra: -60, ll: 25, rl: -25, mouth: 'smile', tilt: 4},
  celebrate: {la: 160, ra: -160, ll: 18, rl: -18, mouth: 'smile', tilt: 0},
};

const rad = (d: number) => (d * Math.PI) / 180;
const limb = (x: number, y: number, deg: number, len: number) =>
  [x + Math.sin(rad(deg)) * len, y + Math.cos(rad(deg)) * len] as const;

const StickFigure: React.FC<{pose: Pose}> = ({pose}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = POSES[pose] ?? POSES.idle;

  const enter = spring({frame, fps, config: {damping: 11, stiffness: 120}});
  const wob = Math.sin(frame / 7) * 8;
  const swing = pose === 'walking' ? Math.sin(frame / 5) * 32 : 0;
  const bobAmp = pose === 'floating' ? 22 : 6;
  let bob = Math.sin(frame / 10) * bobAmp;
  if (pose === 'celebrate') bob = -Math.abs(Math.sin(frame / 6)) * 40;

  const shoulder = [300, 240] as const;
  const hip = [300, 430] as const;
  const la = limb(shoulder[0], shoulder[1], p.la + wob + swing * -0.8, 150);
  const ra = limb(shoulder[0], shoulder[1], p.ra - wob + swing * 0.8, 150);
  const ll = limb(hip[0], hip[1], p.ll + swing, 190);
  const rl = limb(hip[0], hip[1], p.rl - swing, 190);

  const blink = frame % 90 > 86;
  const eyeR = p.mouth === 'o' ? 12 : 8;

  return (
    <svg
      width={620}
      height={720}
      viewBox="0 0 600 700"
      style={{
        transform: `translateY(${bob + (1 - enter) * 300}px) scale(${0.6 + 0.4 * enter})`,
        filter: 'drop-shadow(0 10px 0 rgba(0,0,0,0.35))',
        overflow: 'visible',
      }}
      fill="none"
      stroke={theme.stroke}
      strokeWidth={16}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform={`rotate(${p.tilt} 300 190)`}>
        <circle cx={300} cy={120} r={72} />
        {!blink && <circle cx={272} cy={108} r={eyeR} fill={theme.stroke} stroke="none" />}
        {!blink && <circle cx={328} cy={108} r={eyeR} fill={theme.stroke} stroke="none" />}
        {p.mouth === 'smile' && <path d="M268 146 Q300 176 332 146" strokeWidth={10} />}
        {p.mouth === 'o' && <ellipse cx={300} cy={152} rx={13} ry={18} strokeWidth={9} />}
        {p.mouth === 'flat' && <line x1={274} y1={152} x2={326} y2={152} strokeWidth={10} />}
      </g>
      <line x1={300} y1={192} x2={hip[0]} y2={hip[1]} />
      <line x1={shoulder[0]} y1={shoulder[1]} x2={la[0]} y2={la[1]} />
      <line x1={shoulder[0]} y1={shoulder[1]} x2={ra[0]} y2={ra[1]} />
      <line x1={hip[0]} y1={hip[1]} x2={ll[0]} y2={ll[1]} />
      <line x1={hip[0]} y1={hip[1]} x2={rl[0]} y2={rl[1]} />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* ICONS (100x100 viewBox)                                             */
/* ------------------------------------------------------------------ */
const Icon: React.FC<{name: IconName; frame: number}> = ({name, frame}) => {
  const s = {stroke: '#fff', strokeWidth: 3, strokeLinejoin: 'round' as const};
  switch (name) {
    case 'earth':
      return (
        <g>
          <circle cx={50} cy={50} r={40} fill="#2e86ff" {...s} />
          <path d="M30 30 Q42 24 48 34 Q40 44 32 42Z M56 52 Q70 48 72 62 Q64 76 54 68Z" fill="#3ddc84" />
        </g>
      );
    case 'moon':
      return (
        <g>
          <circle cx={50} cy={50} r={40} fill="#e8e8ee" {...s} />
          <circle cx={36} cy={40} r={7} fill="#c3c3cf" />
          <circle cx={62} cy={58} r={10} fill="#c3c3cf" />
          <circle cx={44} cy={68} r={5} fill="#c3c3cf" />
        </g>
      );
    case 'sun':
      return (
        <g>
          <g transform={`rotate(${frame * 1.2} 50 50)`} stroke="#ffd93d" strokeWidth={5} strokeLinecap="round">
            {Array.from({length: 8}).map((_, i) => (
              <line key={i} x1={50} y1={4} x2={50} y2={14} transform={`rotate(${i * 45} 50 50)`} />
            ))}
          </g>
          <circle cx={50} cy={50} r={26} fill="#ffd93d" {...s} />
        </g>
      );
    case 'rocket':
      return (
        <g>
          <path d="M50 6 C70 24 70 54 62 74 L38 74 C30 54 30 24 50 6Z" fill="#f4f4f8" {...s} />
          <circle cx={50} cy={36} r={9} fill="#00e5ff" {...s} />
          <path d="M38 58 L20 82 L38 76Z M62 58 L80 82 L62 76Z" fill="#ff4fd8" {...s} />
          <path d={`M42 78 Q50 ${92 + Math.sin(frame / 2) * 8} 58 78Z`} fill="#ffd93d" />
        </g>
      );
    case 'ufo':
      return (
        <g>
          <path d="M34 50 Q50 14 66 50Z" fill="#9be7ff" {...s} />
          <ellipse cx={50} cy={54} rx={42} ry={14} fill="#8b8fa8" {...s} />
          <circle cx={26} cy={56} r={3} fill="#ffd93d" />
          <circle cx={50} cy={60} r={3} fill="#ffd93d" />
          <circle cx={74} cy={56} r={3} fill="#ffd93d" />
          <path d="M36 68 L22 98 L78 98 L64 68Z" fill="#ffd93d" opacity={0.25 + 0.15 * Math.sin(frame / 5)} />
        </g>
      );
    case 'alien':
      return (
        <g>
          <path d="M50 10 C84 10 82 62 50 90 C18 62 16 10 50 10Z" fill="#6ee26e" {...s} />
          <ellipse cx={34} cy={44} rx={9} ry={14} fill="#111" transform="rotate(-20 34 44)" />
          <ellipse cx={66} cy={44} rx={9} ry={14} fill="#111" transform="rotate(20 66 44)" />
        </g>
      );
    case 'clock': {
      const sec = (frame / 30) * 360 * 2; // fast-forward feel
      return (
        <g>
          <circle cx={50} cy={50} r={40} fill="#fff" {...s} stroke="#ffd93d" strokeWidth={6} />
          {Array.from({length: 12}).map((_, i) => (
            <line key={i} x1={50} y1={14} x2={50} y2={20} stroke="#111" strokeWidth={3} transform={`rotate(${i * 30} 50 50)`} />
          ))}
          <line x1={50} y1={50} x2={50} y2={26} stroke="#111" strokeWidth={5} strokeLinecap="round" transform={`rotate(${sec} 50 50)`} />
          <line x1={50} y1={50} x2={50} y2={36} stroke="#111" strokeWidth={6} strokeLinecap="round" transform={`rotate(${sec / 12} 50 50)`} />
        </g>
      );
    }
    case 'blackhole':
      return (
        <g>
          <g transform={`rotate(${frame * 3} 50 50)`}>
            <ellipse cx={50} cy={50} rx={46} ry={16} fill="none" stroke="#ff4fd8" strokeWidth={5} />
            <ellipse cx={50} cy={50} rx={36} ry={11} fill="none" stroke="#ffd93d" strokeWidth={4} />
          </g>
          <circle cx={50} cy={50} r={22} fill="#000" stroke="#fff" strokeWidth={3} />
        </g>
      );
    case 'star':
      return (
        <polygon
          points="50,8 61,38 93,38 67,57 77,89 50,69 23,89 33,57 7,38 39,38"
          fill="#ffd93d"
          {...s}
          transform={`rotate(${Math.sin(frame / 12) * 10} 50 50)`}
        />
      );
    case 'atom':
      return (
        <g fill="none" stroke="#00e5ff" strokeWidth={4}>
          {[0, 60, 120].map((r) => (
            <ellipse key={r} cx={50} cy={50} rx={42} ry={15} transform={`rotate(${r + frame * 2} 50 50)`} />
          ))}
          <circle cx={50} cy={50} r={9} fill="#ff4fd8" stroke="#fff" strokeWidth={3} />
        </g>
      );
    case 'planet':
      return (
        <g>
          <circle cx={50} cy={50} r={28} fill="#ff9f43" {...s} />
          <ellipse cx={50} cy={52} rx={46} ry={11} fill="none" stroke="#ffd93d" strokeWidth={5} transform="rotate(-18 50 50)" />
        </g>
      );
    case 'lightbulb':
      return (
        <g>
          <circle cx={50} cy={40} r={26} fill="#ffe66d" {...s} />
          <rect x={38} y={64} width={24} height={16} rx={4} fill="#aaa" {...s} />
          <line x1={42} y1={88} x2={58} y2={88} {...s} />
        </g>
      );
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ */
/* SUBTITLES (3 words at a time, active word highlighted)              */
/* ------------------------------------------------------------------ */
const Subtitles: React.FC<{text: string; durationInFrames: number}> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const startF = 0.15 * FPS;
  const speechF = Math.max(1, durationInFrames - PAD_SEC * FPS - startF);
  const p = Math.min(1, Math.max(0, (frame - startF) / speechF));

  const words = text.split(/\s+/).filter(Boolean);
  const total = words.reduce((a, w) => a + w.length + 1, 0) || 1;
  let acc = 0;
  const timings = words.map((w) => {
    const start = acc / total;
    acc += w.length + 1;
    return {w, start, end: acc / total};
  });
  const active = Math.max(0, timings.findIndex((t) => p >= t.start && p < t.end));
  const idx = p >= 1 ? words.length - 1 : active;
  const chunk = Math.floor(idx / 3);
  const visible = timings.slice(chunk * 3, chunk * 3 + 3);

  return (
    <div
      style={{
        position: 'absolute',
        top: 1420,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontFamily: theme.font,
        fontSize: 92,
        lineHeight: 1.15,
        textTransform: 'uppercase',
      }}
    >
      {visible.map((t, i) => {
        const isActive = chunk * 3 + i === idx;
        return (
          <span
            key={chunk * 3 + i}
            style={{
              display: 'inline-block',
              margin: '0 12px',
              color: isActive ? theme.accent : '#fff',
              transform: `scale(${isActive ? 1.1 : 1})`,
              WebkitTextStroke: '10px #000',
              paintOrder: 'stroke fill',
            }}
          >
            {t.w}
          </span>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* SCENE                                                               */
/* ------------------------------------------------------------------ */
const ICON_X: Record<number, number[]> = {1: [540], 2: [330, 750], 3: [200, 540, 880]};

const Scene: React.FC<SceneProps & {durationInFrames: number}> = (p) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [c1, c2] = theme.bgs[p.bg] ?? theme.bgs.space;
  const fade = Math.min(
    interpolate(frame, [0, 5], [0, 1], {extrapolateRight: 'clamp'}),
    interpolate(frame, [p.durationInFrames - 5, p.durationInFrames], [1, 0], {extrapolateLeft: 'clamp'}),
  );
  const hs = spring({frame, fps, config: {damping: 12}});
  const xs = ICON_X[Math.min(3, Math.max(1, p.icons.length))] ?? [540];

  return (
    <AbsoluteFill style={{opacity: fade, background: `linear-gradient(180deg, ${c1}, ${c2})`}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {Array.from({length: 50}).map((_, i) => (
          <circle
            key={i}
            cx={random('x' + i) * 1080}
            cy={random('y' + i) * 1920}
            r={2 + random('r' + i) * 4}
            fill="#fff"
            opacity={0.35 + 0.65 * Math.abs(Math.sin((frame + i * 13) / 22))}
          />
        ))}
      </svg>

      <div
        style={{
          position: 'absolute',
          top: 170,
          width: '100%',
          padding: '0 60px',
          boxSizing: 'border-box',
          textAlign: 'center',
          fontFamily: theme.font,
          fontSize: 104,
          lineHeight: 1.05,
          color: theme.accent,
          textShadow: '0 8px 0 #000',
          transform: `scale(${hs})`,
        }}
      >
        {p.headline}
      </div>

      {p.icons.map((name, i) => {
        const s = spring({frame: frame - 6 - i * 8, fps, config: {damping: 9}});
        return (
          <svg
            key={name + i}
            width={280}
            height={280}
            viewBox="0 0 100 100"
            style={{
              position: 'absolute',
              left: xs[i] - 140,
              top: 500,
              transform: `translateY(${Math.sin((frame + i * 10) / 15) * 14}px) scale(${s})`,
              filter: 'drop-shadow(0 8px 0 rgba(0,0,0,0.35))',
            }}
          >
            <Icon name={name} frame={frame} />
          </svg>
        );
      })}

      <div style={{position: 'absolute', top: 820, left: 230}}>
        <StickFigure pose={p.pose} />
      </div>

      <Subtitles text={p.narration} durationInFrames={p.durationInFrames} />

      {p.voiceUrl ? (
        <Sequence from={4}>
          <Audio src={p.voiceUrl} volume={1} />
        </Sequence>
      ) : null}
      {p.sfx ? <Audio src={staticFile(`audio/sfx_${p.sfx}.wav`)} volume={0.5} /> : null}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* ROOT COMPOSITION                                                    */
/* ------------------------------------------------------------------ */
export const ScienceStick: React.FC<ScienceStickProps> = ({scenes, music}) => {
  const {durationInFrames, fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Series>
        {scenes.map((s, i) => (
          <Series.Sequence key={i} durationInFrames={s.durationInFrames ?? 90}>
            <Scene {...s} durationInFrames={s.durationInFrames ?? 90} />
          </Series.Sequence>
        ))}
      </Series>
      {music ? (
        <Audio
          src={staticFile(`audio/music_${music}.wav`)}
          loop
          volume={(f) =>
            interpolate(f, [0, fps, durationInFrames - fps * 2, durationInFrames], [0, 0.14, 0.14, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};
