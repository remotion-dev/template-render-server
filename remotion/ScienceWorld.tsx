import React from "react";
import {
  AbsoluteFill, Audio, Sequence, Series, interpolate, random, spring,
  useCurrentFrame, useVideoConfig, staticFile,
} from "remotion";
import type {SceneProps, ScienceStickProps, IconName} from "./ScienceStick";

const C = {
  ink: "#10152B", cream: "#FFF4D6", yellow: "#FFD166", coral: "#FF6B6B",
  cyan: "#5CE1E6", blue: "#4263EB", violet: "#845EC2", green: "#71C99A",
  navy: "#111A3A",
};
const palettes: Record<string, [string,string,string]> = {
  space: ["#10163B","#283C78","#F5A65B"],
  deepblue: ["#092B45","#176B87","#67D6D0"],
  dusk: ["#38245E","#B65C78","#FFB36B"],
  teal: ["#073B3A","#168B83","#B4E1C5"],
};
const clamp = {extrapolateLeft:"clamp" as const, extrapolateRight:"clamp" as const};

const Orb: React.FC<{name: IconName; x:number; y:number; size:number; frame:number; delay:number}> = ({name,x,y,size,frame,delay}) => {
  const bob = Math.sin((frame+delay)/18)*9;
  const rot = frame*.35+delay;
  const common = {stroke:C.cream,strokeWidth:4,strokeLinejoin:"round" as const};
  return <g transform={`translate(${x} ${y+bob}) rotate(${Math.sin(frame/45+delay)*5}) scale(${size/100})`}>
    {name==="earth" || name==="planet" ? <>
      <circle r="43" fill={name==="earth" ? "#3A9BE8" : "#F08B55"} {...common}/>
      {name==="earth" ? <><path d="M-30 -18 Q-12 -38 2 -22 L12 -8 -2 2 -15 0 -22 20 -37 10Z M10 8 Q28 0 34 18 L20 34 6 27Z" fill={C.green}/><path d="M-44 2 Q0 20 42 -5" fill="none" stroke="#A9E7F4" strokeWidth="5"/></> : <><ellipse rx="61" ry="14" fill="none" stroke="#FFD166" strokeWidth="10" transform="rotate(-20)"/><path d="M-20 -15 Q0 -26 22 -12 M-27 13 Q0 24 27 10" fill="none" stroke="#C45D52" strokeWidth="7"/></>}
    </> : name==="sun" ? <><circle r="28" fill="#FFD166"/>{Array.from({length:12}).map((_,i)=><path key={i} d="M0 -42 V-57" stroke="#FFD166" strokeWidth="8" strokeLinecap="round" transform={`rotate(${i*30+rot})`}/>)}</>
    : name==="moon" ? <><circle r="42" fill="#E8E5D9" {...common}/><circle cx="18" cy="-14" r="36" fill={C.navy}/><circle cx="-16" cy="12" r="5" fill="#C4C3CE"/></>
    : name==="rocket" ? <g transform={`rotate(-12)`}><path d="M0 -54 Q34 -28 22 24 L-22 24 Q-34 -28 0 -54Z" fill="#F8F4E8" {...common}/><circle cy="-13" r="10" fill={C.cyan} stroke={C.blue} strokeWidth="4"/><path d="M-22 8 L-44 34 -18 27 M22 8 L44 34 18 27" fill={C.coral} {...common}/><path d="M-12 26 Q0 68 12 26Z" fill={C.yellow}/></g>
    : name==="blackhole" ? <><ellipse rx="58" ry="20" fill="none" stroke={C.coral} strokeWidth="8" transform={`rotate(${rot})`}/><ellipse rx="47" ry="13" fill="none" stroke={C.yellow} strokeWidth="6" transform={`rotate(${-rot*.7})`}/><circle r="26" fill="#080B19"/></>
    : name==="atom" ? <><g fill="none" stroke={C.cyan} strokeWidth="5">{[0,60,120].map(v=><ellipse key={v} rx="48" ry="17" transform={`rotate(${v+rot})`}/>)}</g><circle r="9" fill={C.yellow}/></>
    : name==="clock" ? <><circle r="43" fill="#FFF8E7" {...common}/>{Array.from({length:12}).map((_,i)=><path key={i} d="M0 -34 V-27" stroke={C.ink} strokeWidth="4" transform={`rotate(${i*30})`}/>)}<path d="M0 0 V-26 M0 0 L20 12" stroke={C.ink} strokeWidth="6" strokeLinecap="round"/></>
    : name==="star" ? <path d="M0 -52 L13 -16 50 -16 20 7 31 44 0 22 -31 44 -20 7 -50 -16 -13 -16Z" fill={C.yellow} {...common}/>
    : name==="lightbulb" ? <><circle cy="-9" r="29" fill={C.yellow} {...common}/><path d="M-17 14 H17 L12 31 H-12Z M-10 40 H10" stroke={C.cream} strokeWidth="7" strokeLinecap="round"/></>
    : name==="ufo" ? <><path d="M-20 -12 Q0 -52 20 -12Z" fill={C.cyan} {...common}/><ellipse rx="48" ry="16" cy="0" fill="#A6B0C8" {...common}/><circle cx="-24" cy="1" r="4" fill={C.yellow}/><circle r="4" cy="4" fill={C.yellow}/><circle cx="24" cy="1" r="4" fill={C.yellow}/></>
    : <><path d="M0 -45 Q45 -38 33 15 Q18 45 0 48 Q-18 45 -33 15 Q-45 -38 0 -45Z" fill={C.green} {...common}/><ellipse cx="-14" cy="-8" rx="8" ry="13" fill={C.ink}/><ellipse cx="14" cy="-8" rx="8" ry="13" fill={C.ink}/></>}
  </g>;
};

const Mascot: React.FC<{frame:number; pose:string}> = ({frame,pose}) => {
  const lift = Math.sin(frame/12)*8 + (pose==="floating" ? Math.sin(frame/7)*18 : 0);
  const wave = pose==="celebrate" ? -35 : pose==="shocked" ? 35 : 0;
  return <g transform={`translate(0 ${lift})`}>
    <ellipse cx="540" cy="1115" rx="180" ry="34" fill="#070D26" opacity=".28"/>
    <g transform="translate(540 1000)">
      <path d="M-95 25 Q-120 120 -75 175 Q0 215 75 175 Q120 120 95 25Z" fill="#F5F0DE" stroke={C.ink} strokeWidth="13"/>
      <path d="M-76 75 Q0 110 76 75 L68 155 Q0 190 -68 155Z" fill={C.cyan} stroke={C.ink} strokeWidth="10"/>
      <circle cy="-42" r="112" fill="#F5F0DE" stroke={C.ink} strokeWidth="14"/>
      <path d="M-94 -68 Q-75 -170 0 -165 Q75 -170 94 -68" fill={C.coral} stroke={C.ink} strokeWidth="12"/>
      <path d="M-83 -72 Q0 -120 83 -72" fill="none" stroke="#FFB1A4" strokeWidth="12"/>
      <ellipse cx="-38" cy="-38" rx="15" ry="22" fill={C.ink}/><ellipse cx="38" cy="-38" rx="15" ry="22" fill={C.ink}/>
      <path d="M-25 10 Q0 32 25 10" fill="none" stroke={C.ink} strokeWidth="9" strokeLinecap="round"/>
      <path d={`M-86 45 Q-165 ${wave-5} -150 ${wave-55} M86 45 Q165 ${-wave-5} 150 ${-wave-55}`} fill="none" stroke="#F5F0DE" strokeWidth="24" strokeLinecap="round"/>
      <path d="M-86 45 Q-165 -10 -150 -55 M86 45 Q165 -10 150 -55" fill="none" stroke={C.ink} strokeWidth="12" strokeLinecap="round"/>
    </g>
  </g>;
};

const World: React.FC<{bg:string; icons:IconName[]; frame:number}> = ({bg,icons,frame}) => {
  const [top,mid,sun] = palettes[bg] ?? palettes.space;
  return <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position:"absolute"}}>
    <defs>
      <radialGradient id="glow"><stop stopColor={sun} stopOpacity=".55"/><stop offset="1" stopColor={sun} stopOpacity="0"/></radialGradient>
      <linearGradient id="ground" x2="0" y2="1"><stop stopColor={mid}/><stop offset="1" stopColor={top}/></linearGradient>
    </defs>
    <rect width="1080" height="1920" fill={top}/>
    <circle cx="830" cy="370" r="390" fill="url(#glow)"/>
    {Array.from({length:85}).map((_,i)=><circle key={i} cx={random("sx"+i)*1080} cy={random("sy"+i)*1180} r={1+random("sr"+i)*3} fill="#FFF7DE" opacity={.25+.65*Math.abs(Math.sin(frame/20+i))}/>)}
    <g transform={`translate(${Math.sin(frame/90)*18} 0)`}>
      <circle cx="865" cy="470" r="180" fill={sun} stroke={C.ink} strokeWidth="15"/>
      <path d="M720 450 Q850 360 1000 460 M750 545 Q850 490 970 550" fill="none" stroke="#FFF0C0" strokeWidth="20" opacity=".35"/>
      <ellipse cx="865" cy="480" rx="270" ry="72" fill="none" stroke="#F7D38A" strokeWidth="24" transform="rotate(-18 865 480)"/>
      <path d="M0 1220 Q220 1040 420 1190 T850 1160 T1200 1200 V1920 H0Z" fill={mid}/>
      <path d="M0 1430 Q240 1280 460 1410 T900 1370 T1200 1420 V1920 H0Z" fill="url(#ground)"/>
      <path d="M0 1640 Q260 1500 520 1630 T1080 1590 V1920 H0Z" fill={top} opacity=".55"/>
    </g>
    {icons.slice(0,3).map((name,i)=><Orb key={name+i} name={name} x={[210,540,850][i]} y={[720,600,790][i]} size={i===1?155:125} frame={frame} delay={i*25}/>)}
  </svg>;
};

const Caption: React.FC<{text:string; duration:number}> = ({text,duration}) => {
  const frame=useCurrentFrame();
  const words=text.split(/\s+/).filter(Boolean);
  const idx=Math.min(words.length-1,Math.floor((frame/Math.max(1,duration-15))*words.length));
  const chunk=Math.floor(Math.max(0,idx)/4);
  return <div style={{position:"absolute",left:70,right:70,bottom:150,textAlign:"center",fontFamily:"Arial, sans-serif",fontWeight:900,fontSize:57,lineHeight:1.12,color:C.cream,textShadow:"0 4px 0 #172044, 3px 7px 0 #172044",letterSpacing:1}}>
    {words.slice(chunk*4,chunk*4+4).map((w,i)=><span key={chunk*4+i} style={{color:chunk*4+i===idx?C.yellow:C.cream,margin:"0 8px"}}>{w}</span>)}
  </div>;
};

const AnimatedScene: React.FC<SceneProps & {duration:number}> = p => {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const enter=spring({frame,fps,config:{damping:16,stiffness:90}});
  const opacity=Math.min(interpolate(frame,[0,12],[0,1],clamp),interpolate(frame,[p.duration-10,p.duration],[1,0],clamp));
  return <AbsoluteFill style={{opacity,backgroundColor:C.navy}}>
    <World bg={p.bg} icons={p.icons} frame={frame}/>
    <div style={{position:"absolute",top:115,left:65,right:65,textAlign:"center",fontFamily:"Arial, sans-serif",fontSize:74,fontWeight:900,letterSpacing:1.5,lineHeight:1.04,color:C.cream,textShadow:"0 7px 0 #182044",transform:`translateY(${(1-enter)*-80}px) scale(${.94+.06*enter})`}}>{p.headline}</div>
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position:"absolute"}}><Mascot frame={frame} pose={p.pose}/></svg>
    <Caption text={p.narration} duration={p.duration}/>
    {p.voiceUrl ? <Sequence from={4}><Audio src={p.voiceUrl} volume={1}/></Sequence> : null}
    {p.sfx ? <Audio src={staticFile(`audio/sfx_${p.sfx}.wav`)} volume={.35}/> : null}
  </AbsoluteFill>;
};

export const ScienceWorld: React.FC<ScienceStickProps> = ({scenes,music}) => {
  const {durationInFrames,fps}=useVideoConfig();
  return <AbsoluteFill style={{backgroundColor:C.navy}}>
    <Series>{scenes.map((s,i)=><Series.Sequence key={i} durationInFrames={s.durationInFrames??90}><AnimatedScene {...s} duration={s.durationInFrames??90}/></Series.Sequence>)}</Series>
    {music ? <Audio src={staticFile(`audio/music_${music}.wav`)} loop volume={f=>(f<fps?f/fps*.12:f>durationInFrames-fps*2?Math.max(0,(durationInFrames-f)/ (fps*2))*.12:.12)}/> : null}
  </AbsoluteFill>;
};
