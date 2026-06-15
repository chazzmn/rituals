import { useState, useReducer, useEffect, useMemo } from "react";

/* ═══ DESIGN TOKENS — Light bold theme ═══ */
const C = {
  bg: "#F5F5F4", card: "#FFFFFF", border: "rgba(0,0,0,0.07)", elevated: "#F0F0EF",
  track: "#E5E5E3", primary: "#7C3AED", success: "#16A34A", warning: "#D97706",
  danger: "#DC2626", pink: "#DB2777", cyan: "#0891B2",
  text: "#0F0F0F", textSec: "#57534E", textMut: "#A8A29E",
};
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const SHAD = "0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)";
const SHAD_MD = "0 4px 12px rgba(0,0,0,0.08)";

/* ═══ SOUND ENGINE ═══ */
let _ac = null;
function ac() {
  if (!_ac) try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  if (_ac && _ac.state === "suspended") _ac.resume();
  return _ac;
}
function tone(freq, dur, vol = 0.12, type = "sine", delay = 0) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.connect(g); g.connect(c.destination);
  o.frequency.setValueAtTime(freq, c.currentTime + delay); o.type = type;
  g.gain.setValueAtTime(vol, c.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
  o.start(c.currentTime + delay); o.stop(c.currentTime + delay + dur);
}
const SND = {
  check: () => tone(880, 0.15, 0.1),
  uncheck: () => tone(440, 0.1, 0.06),
  catDone: () => [523, 659, 784].forEach((f, i) => tone(f, 0.3, 0.08, "sine", i * 0.1)),
  milestone: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 0.08, "triangle", i * 0.1)),
  unlock: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.4, 0.07, "triangle", i * 0.13)),
};

/* ═══ SVG ICONS ═══ */
function Ic({ name, size = 20, color = C.textSec, sw = 2 }) {
  const d = {
    briefcase: <><rect x={3} y={7} width={18} height={13} rx={2}/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>,
    home: <><path d="M3 12l9-8 9 8"/><path d="M5 10v10a1 1 0 001 1h3v-5h6v5h3a1 1 0 001-1V10"/></>,
    music: <><path d="M9 18V5l12-2v13"/><circle cx={6} cy={18} r={3}/><circle cx={18} cy={16} r={3}/></>,
    book: <><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></>,
    lock: <><rect x={3} y={11} width={18} height={11} rx={2}/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    sliders: <><line x1={4} y1={21} x2={4} y2={14}/><line x1={4} y1={10} x2={4} y2={3}/><line x1={12} y1={21} x2={12} y2={12}/><line x1={12} y1={8} x2={12} y2={3}/><line x1={20} y1={21} x2={20} y2={16}/><line x1={20} y1={12} x2={20} y2={3}/><line x1={1} y1={14} x2={7} y2={14}/><line x1={9} y1={8} x2={15} y2={8}/><line x1={17} y1={16} x2={23} y2={16}/></>,
    x: <><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d[name]}</svg>
  );
}
const CAT_IC = { work: "briefcase", health: "heart", life: "home", chazzmn: "music", learning: "book" };

/* ═══ CATEGORIES & HABITS ═══ */
const CATEGORIES = [
  { id: "work", name: "WORK", color: C.primary, habits: [
    { id: "outreach", name: "Send one outreach message", freq: "daily", uday: 2 },
    { id: "admin", name: "Clear one admin task", freq: "daily", uday: 16 },
    { id: "building", name: "5 min design/build work", freq: "daily", uday: 6 },
  ]},
  { id: "health", name: "HEALTH", color: C.success, habits: [
    { id: "meditation", name: "5 min meditation", freq: "daily", uday: 0 },
    { id: "gym", name: "Gym session", freq: "daily", uday: 4 },
    { id: "protein", name: "Hit protein target", freq: "daily", uday: 8 },
    { id: "stretching", name: "5 min stretching", freq: "daily", uday: 14 },
    { id: "sleep", name: "In bed by target time", freq: "daily", uday: 18 },
  ]},
  { id: "life", name: "LIFE", color: C.warning, habits: [
    { id: "makebed", name: "Make bed", freq: "daily", uday: 0 },
    { id: "walking", name: "10 min walk", freq: "weekly", wd: 6, uday: 26 },
    { id: "tidyroom", name: "5 min tidy", freq: "weekly", wd: 0, uday: 24 },
    { id: "cooking", name: "Cook one meal", freq: "daily", uday: 10 },
    { id: "finances", name: "5 min finance check", freq: "weekly", wd: 4, uday: 28 },
  ]},
  { id: "chazzmn", name: "CHAZZMN", color: C.pink, habits: [
    { id: "festival", name: "5 min festival planning", freq: "weekly", wd: 1, uday: 34 },
    { id: "clothing", name: "Review clothing drops", freq: "weekly", wd: 3, uday: 36 },
    { id: "artlaunches", name: "5 min art launch work", freq: "weekly", wd: 5, uday: 38 },
    { id: "socialmedia", name: "Post on socials", freq: "daily", uday: 0 },
  ]},
  { id: "learning", name: "LEARNING", color: C.cyan, habits: [
    { id: "reading", name: "Read for 5 min", freq: "daily", uday: 0 },
    { id: "philosophy", name: "5 min philosophy", freq: "weekly", wd: 1, uday: 12 },
    { id: "psychology", name: "5 min psychology", freq: "weekly", wd: 2, uday: 20 },
    { id: "chess", name: "Play one chess puzzle", freq: "weekly", wd: 3, uday: 22 },
    { id: "designstudy", name: "5 min design study", freq: "weekly", wd: 4, uday: 30 },
    { id: "languages", name: "5 min language practice", freq: "weekly", wd: 6, uday: 32 },
  ]},
];

const ALL_HABITS = CATEGORIES.flatMap(c => c.habits.map(h => ({ ...h, catId: c.id, catColor: c.color })));
const DAILY_HABITS = ALL_HABITS.filter(h => h.freq === "daily");
const DAILY_COUNT = DAILY_HABITS.length;

const QUOTE = { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" };

const MILESTONES = {
  3: "3 days strong!", 7: "One week! Momentum is real.",
  14: "Two weeks! This is a habit now.", 21: "21 days. You're wired in.",
  30: "One month. Unstoppable.", 60: "60 days. Elite discipline.", 90: "90 DAYS. Transformed.",
};

const DS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const DN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/* ═══ DATE UTILS ═══ */
function dk(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function ws(d) { const r=new Date(d.getTime()); const day=r.getDay(); r.setDate(r.getDate()-(day===0?6:day-1)); r.setHours(0,0,0,0); return r; }
function wdates(d) { const s=ws(d); return Array.from({length:7},(_,i)=>{const r=new Date(s.getTime());r.setDate(s.getDate()+i);return r;}); }
function fmtDate(d) { return `${DN[d.getDay()]}, ${d.getDate()} ${MN[d.getMonth()]}`; }
function greet() { const h=new Date().getHours(); return h<12?"Morning":h<17?"Afternoon":"Evening"; }

/* ═══ HABIT UTILS ═══ */
function isScheduled(h, date) { return h.freq==="daily" || (h.wd!=null && date.getDay()===h.wd); }
function isActive(h, date, appDay, off) { return h.uday<=appDay && !off.has(h.id) && isScheduled(h, date); }
function getActive(date, appDay, off) { return ALL_HABITS.filter(h=>isActive(h,date,appDay,off)); }
function getActiveDailyCount(appDay, off) { return DAILY_HABITS.filter(h=>h.uday<=appDay && !off.has(h.id)).length; }

function dailyDone(key, comp, appDay, off) {
  return DAILY_HABITS.filter(h => h.uday<=appDay && !off.has(h.id) && comp[key]?.[h.id]).length;
}
function dailyRate(key, comp, appDay, off) {
  const cnt = getActiveDailyCount(appDay, off);
  return cnt > 0 ? dailyDone(key,comp,appDay,off) / cnt : 0;
}

function calcStreak(comp, today, appDay, off) {
  let s = 0; const d = new Date(today.getTime());
  if (dailyRate(dk(d),comp,appDay,off) >= 0.8) { s++; d.setDate(d.getDate()-1); }
  else d.setDate(d.getDate()-1);
  for (let i=0;i<400;i++) { const k=dk(d); if(!comp[k])break; if(dailyRate(k,comp,appDay,off)>=0.8){s++;d.setDate(d.getDate()-1);}else break; }
  return s;
}
function calcBest(comp, today, appDay, off) {
  const keys=Object.keys(comp).sort(); if(!keys.length)return 0;
  let best=0,cur=0; const start=new Date(keys[0]); const end=new Date(today.getTime()); const d=new Date(start.getTime());
  while(d<=end){if(dailyRate(dk(d),comp,appDay,off)>=0.8){cur++;if(cur>best)best=cur;}else cur=0;d.setDate(d.getDate()+1);}
  return best;
}
function hStreak(hid,comp,today){
  let s=0;const d=new Date(today.getTime());
  if(comp[dk(d)]?.[hid]){s++;d.setDate(d.getDate()-1);}else d.setDate(d.getDate()-1);
  for(let i=0;i<400;i++){const k=dk(d);if(!comp[k])break;if(comp[k][hid]){s++;d.setDate(d.getDate()-1);}else break;}
  return s;
}
function catWeekRate(cat,dates,comp,appDay,off){
  let t=0,dn=0;
  cat.habits.forEach(h=>{
    if(h.uday>appDay||off.has(h.id))return;
    if(h.freq==="daily"){dates.forEach(d=>{t++;if(comp[dk(d)]?.[h.id])dn++;});}
    else{t++;if(dates.some(d=>h.wd===d.getDay()&&comp[dk(d)]?.[h.id]))dn++;}
  });
  return t>0?dn/t:0;
}
function compColor(r){return r>=0.75?C.success:r>=0.5?"#4ADE80":r>=0.25?C.warning:C.danger;}

/* ═══ REDUCER & SEED ═══ */
function reducer(s,a){if(a.type==="TOGGLE"){const d={...(s[a.key]||{})};d[a.hid]=!d[a.hid];return{...s,[a.key]:d};}return s;}
const SKIP_ORD=[11,10,9,8,6,5,7,4,3,2,1,0];
function seedData(today){
  const comp={};
  const targets=[10,11,6,10,11,10,11,10,10,11,5,10,10,4];
  const weeklySeed={walking:4,tidyroom:1,finances:5,philosophy:6,chess:2,psychology:3};
  for(let i=1;i<=14;i++){
    const d=new Date(today.getTime());d.setDate(d.getDate()-i);const key=dk(d);comp[key]={};
    const tgt=targets[i-1];const skip=new Set(SKIP_ORD.slice(0,DAILY_COUNT-tgt));
    DAILY_HABITS.forEach((h,idx)=>{comp[key][h.id]=!skip.has(idx);});
    ALL_HABITS.filter(h=>h.freq==="weekly").forEach(h=>{
      if(weeklySeed[h.id]===i)comp[key][h.id]=true;
      else if(i>6&&h.wd===d.getDay())comp[key][h.id]=(i%3!==0);
    });
  }
  return comp;
}

/* ═══ TOGGLE SWITCH ═══ */
function Toggle({on,onChange,color}){
  return(
    <div onClick={onChange} style={{width:44,height:24,borderRadius:12,background:on?color:C.track,position:"relative",cursor:"pointer",transition:"background 0.2s ease",flexShrink:0}}>
      <div style={{width:20,height:20,borderRadius:10,background:"#fff",position:"absolute",top:2,left:on?22:2,transition:"left 0.2s ease",boxShadow:"0 1px 3px rgba(0,0,0,0.25)"}}/>
    </div>
  );
}

/* ═══ PROGRESS RING ═══ */
function Ring({done,total,size=96,color=C.primary}){
  const sw=7,r=(size-sw)/2,ci=2*Math.PI*r,pct=total>0?done/total:0,off=ci*(1-pct);
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.track} strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={ci} strokeDashoffset={off}
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dashoffset 0.5s ease"}}/>
      <text x={size/2} y={size/2-6} textAnchor="middle" dominantBaseline="central"
        fill={C.text} fontSize={22} fontWeight={700} fontFamily={FONT}>{done}/{total}</text>
      <text x={size/2} y={size/2+14} textAnchor="middle" dominantBaseline="central"
        fill={C.textMut} fontSize={10} fontWeight={600} fontFamily={FONT} letterSpacing={1}>TODAY</text>
    </svg>
  );
}

/* ═══ CELEBRATION OVERLAY ═══ */
function Celeb({msg,icon,onDone}){
  const[p,setP]=useState("enter");
  useEffect(()=>{const t1=setTimeout(()=>setP("show"),50);const t2=setTimeout(()=>setP("exit"),2800);const t3=setTimeout(onDone,3300);return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};},[onDone]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,opacity:p==="show"?1:0,transition:"opacity 0.4s ease"}}>
      <div style={{textAlign:"center",transform:p==="show"?"scale(1)":"scale(0.85)",transition:"transform 0.4s cubic-bezier(.34,1.56,.64,1)"}}>
        <div style={{fontSize:52,marginBottom:12}}>{icon||"\u{1F525}"}</div>
        <div style={{fontSize:20,fontWeight:700,color:"#fff",fontFamily:FONT,lineHeight:1.4}}>{msg}</div>
      </div>
    </div>
  );
}

/* ═══ HABIT ROW ═══ */
function HabitRow({habit,done,onToggle,color,streak,isLast,isNew}){
  return(
    <div onClick={()=>onToggle(habit.id)} style={{display:"flex",alignItems:"center",padding:"10px 0",gap:12,cursor:"pointer",minHeight:44,userSelect:"none",borderBottom:isLast?"none":`1px solid ${C.elevated}`}}>
      <div style={{width:28,height:28,borderRadius:14,flexShrink:0,border:done?"none":`2px solid ${C.track}`,background:done?color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s ease",boxShadow:done?`0 0 0 3px ${color}20`:"none"}}>
        {done&&<svg width={14} height={14} viewBox="0 0 14 14"><path d="M3 7l3 3 5-6" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:500,color:C.text,fontFamily:FONT,opacity:done?0.45:1,transition:"opacity 0.2s",textDecoration:done?"line-through":"none",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {habit.name}
          {habit.freq==="weekly"&&<span style={{fontSize:8,fontWeight:700,color:C.textMut,background:C.elevated,padding:"2px 6px",borderRadius:4,letterSpacing:.5,textDecoration:"none",display:"inline-block"}}>{DS[habit.wd]}</span>}
          {isNew&&<span style={{fontSize:8,fontWeight:700,color:C.primary,background:`${C.primary}15`,padding:"2px 6px",borderRadius:4,letterSpacing:.5,textDecoration:"none",display:"inline-block"}}>NEW</span>}
        </div>
      </div>
      {habit.freq==="daily"&&streak>0&&<div style={{fontSize:12,color:C.warning,fontWeight:700,fontFamily:FONT,flexShrink:0}}>{"\u{1F525}"}{streak}</div>}
    </div>
  );
}

/* ═══ CATEGORY CARD ═══ */
function CatCard({cat,date,comp,onToggle,expanded,onExpand,appDay,off,today}){
  const habits=useMemo(()=>cat.habits.filter(h=>isActive(h,date,appDay,off)),[cat,date,appDay,off]);
  const key=dk(date);
  const done=habits.filter(h=>comp[key]?.[h.id]).length;
  const tot=habits.length;
  const pct=tot>0?done/tot:0;
  if(tot===0)return null;
  return(
    <div style={{background:C.card,borderRadius:14,overflow:"hidden",boxShadow:SHAD,borderLeft:`4px solid ${cat.color}`}}>
      <div onClick={onExpand} style={{padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,userSelect:"none",minHeight:44}}>
        <Ic name={CAT_IC[cat.id]} size={20} color={cat.color}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:cat.color,fontFamily:FONT}}>{cat.name}</span>
            <span style={{fontSize:13,fontWeight:600,color:C.textSec,fontFamily:FONT}}>{done}/{tot}</span>
          </div>
          <div style={{height:4,borderRadius:2,background:C.elevated,marginTop:8,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:2,background:cat.color,width:`${pct*100}%`,transition:"width 0.4s ease"}}/>
          </div>
        </div>
        <svg width={16} height={16} viewBox="0 0 16 16" style={{transform:expanded?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s ease",flexShrink:0}}>
          <path d="M4 6l4 4 4-4" stroke={C.textMut} strokeWidth={2} fill="none" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{maxHeight:expanded?`${habits.length*64+16}px`:"0",opacity:expanded?1:0,overflow:"hidden",transition:"max-height 0.35s ease,opacity 0.25s ease",padding:expanded?"0 16px 8px":"0 16px"}}>
        {habits.map((h,i)=>(
          <HabitRow key={h.id} habit={h} done={!!comp[key]?.[h.id]} onToggle={onToggle} color={cat.color}
            streak={h.freq==="daily"?hStreak(h.id,comp,today):0} isLast={i===habits.length-1}
            isNew={h.uday<=appDay&&h.uday>appDay-4}/>
        ))}
      </div>
    </div>
  );
}

/* ═══ RADAR CHART ═══ */
function Radar({rates,size=220}){
  const cx=size/2,cy=size/2,maxR=size/2-36,n=5;
  const angs=Array.from({length:n},(_,i)=>-Math.PI/2+(2*Math.PI*i)/n);
  const pt=(ai,f)=>({x:cx+maxR*f*Math.cos(angs[ai]),y:cy+maxR*f*Math.sin(angs[ai])});
  const poly=f=>angs.map((_,i)=>{const p=pt(i,f);return`${p.x},${p.y}`;}).join(" ");
  const dp=rates.map((r,i)=>{const p=pt(i,Math.max(r,0.06));return`${p.x},${p.y}`;}).join(" ");
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:"block",margin:"0 auto"}}>
      {[.25,.5,.75,1].map(f=><polygon key={f} points={poly(f)} fill="none" stroke={C.track} strokeWidth={1}/>)}
      {angs.map((_,i)=>{const p=pt(i,1);return<line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={C.track} strokeWidth={1}/>;})}
      <polygon points={dp} fill={`${C.primary}18`} stroke={C.primary} strokeWidth={2}/>
      {rates.map((r,i)=>{const p=pt(i,Math.max(r,0.06));return<circle key={i} cx={p.x} cy={p.y} r={4} fill={C.primary}/>;})}
      {CATEGORIES.map((cat,i)=>{const lr=maxR+22;const x=cx+lr*Math.cos(angs[i]);const y=cy+lr*Math.sin(angs[i]);
        let a="middle";if(Math.cos(angs[i])>0.3)a="start";if(Math.cos(angs[i])<-0.3)a="end";
        return<text key={cat.id} x={x} y={y} textAnchor={a} dominantBaseline="central" fill={cat.color} fontSize={9} fontWeight={700} fontFamily={FONT} letterSpacing={.5}>{cat.name}</text>;})}
    </svg>
  );
}

/* ═══ NAV ICONS ═══ */
const NI={
  today:c=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2}><circle cx={12} cy={12} r={10}/><path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  week:c=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2}><rect x={3} y={5} width={18} height={16} rx={2}/><line x1={3} y1={10} x2={21} y2={10}/><line x1={9} y1={5} x2={9} y2={2}/><line x1={15} y1={5} x2={15} y2={2}/></svg>,
  stats:c=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2}><rect x={4} y={14} width={4} height={8} rx={1}/><rect x={10} y={8} width={4} height={14} rx={1}/><rect x={16} y={4} width={4} height={18} rx={1}/></svg>,
};
function Nav({view,setView}){
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.card,borderTop:`1px solid ${C.border}`,zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0px)",boxShadow:"0 -2px 10px rgba(0,0,0,0.04)"}}>
      <div style={{display:"flex",maxWidth:430,margin:"0 auto",height:56}}>
        {[{k:"today",l:"TODAY"},{k:"week",l:"WEEK"},{k:"stats",l:"STATS"}].map(t=>{
          const a=view===t.k;
          return<div key={t.k} onClick={()=>setView(t.k)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,cursor:"pointer",userSelect:"none",borderTop:a?`2px solid ${C.primary}`:"2px solid transparent",transition:"border-color 0.2s",paddingTop:2}}>
            {NI[t.k](a?C.primary:C.textMut)}
            <span style={{fontSize:9,fontWeight:600,letterSpacing:1,color:a?C.primary:C.textMut,fontFamily:FONT}}>{t.l}</span>
          </div>;
        })}
      </div>
    </div>
  );
}

/* ═══ MAIN APP ═══ */
export default function Rituals(){
  const[today]=useState(()=>{const d=new Date();d.setHours(0,0,0,0);return d;});
  const todayKey=useMemo(()=>dk(today),[today]);
  const[view,setView]=useState("today");
  const[expCat,setExpCat]=useState(null);
  const[selDay,setSelDay]=useState(null);
  const[comp,dispatch]=useReducer(reducer,today,seedData);
  const[celeb,setCeleb]=useState(null);
  const[prevStreak,setPrevStreak]=useState(null);
  const[appDay,setAppDay]=useState(24);
  const[off,setOff]=useState(()=>new Set());
  const[soundOn,setSoundOn]=useState(true);
  const[showSettings,setShowSettings]=useState(false);
  const[flash,setFlash]=useState(null);

  const streak=useMemo(()=>calcStreak(comp,today,appDay,off),[comp,today,appDay,off]);
  const best=useMemo(()=>calcBest(comp,today,appDay,off),[comp,today,appDay,off]);
  const wd=useMemo(()=>wdates(today),[today]);
  const catRates=useMemo(()=>CATEGORIES.map(c=>catWeekRate(c,wd,comp,appDay,off)),[comp,wd,appDay,off]);
  const activeDC=getActiveDailyCount(appDay,off);
  const todayDD=dailyDone(todayKey,comp,appDay,off);
  const threshold=Math.ceil(activeDC*0.8);

  const totalDone=useMemo(()=>Object.values(comp).reduce((s,d)=>s+Object.values(d).filter(Boolean).length,0),[comp]);
  const weekRate=useMemo(()=>{let s=0,c=0;wd.forEach(d=>{const k=dk(d);if(comp[k]){c++;s+=dailyRate(k,comp,appDay,off);}});return c>0?s/c:0;},[comp,wd,appDay,off]);
  const mostCon=useMemo(()=>{let b=0,n=CATEGORIES[0].name;catRates.forEach((r,i)=>{if(r>b){b=r;n=CATEGORIES[i].name;}});return n;},[catRates]);
  const mostNeg=useMemo(()=>{let w=1,n=CATEGORIES[0].name;catRates.forEach((r,i)=>{if(r<w){w=r;n=CATEGORIES[i].name;}});return n;},[catRates]);

  const nextUnlock=useMemo(()=>{
    const h=ALL_HABITS.filter(h=>h.uday>appDay).sort((a,b)=>a.uday-b.uday)[0];
    return h?{habit:h,days:h.uday-appDay}:null;
  },[appDay]);

  // Milestone
  useEffect(()=>{
    if(prevStreak===null){setPrevStreak(streak);return;}
    if(streak>prevStreak&&MILESTONES[streak]){setCeleb({msg:MILESTONES[streak],icon:"\u{1F525}"});if(soundOn)SND.milestone();}
    setPrevStreak(streak);
  },[streak]);

  // Flash cleanup
  useEffect(()=>{if(flash){const t=setTimeout(()=>setFlash(null),700);return()=>clearTimeout(t);};},[flash]);

  function handleToggle(hid,dateKey){
    const wasDone=!!comp[dateKey]?.[hid];
    if(!wasDone){
      if(soundOn)SND.check();
      // check category completion
      const h=ALL_HABITS.find(x=>x.id===hid);
      if(h&&dateKey===todayKey){
        const cat=CATEGORIES.find(c=>c.id===h.catId);
        if(cat){
          const vis=cat.habits.filter(x=>isActive(x,today,appDay,off));
          const othersDone=vis.filter(x=>x.id!==hid).every(x=>comp[dateKey]?.[x.id]);
          if(othersDone&&vis.length>0){
            setTimeout(()=>{setFlash(cat.color);if(soundOn)SND.catDone();},180);
          }
        }
      }
    }else{if(soundOn)SND.uncheck();}
    dispatch({type:"TOGGLE",key:dateKey,hid});
  }

  function toggleOff(id){setOff(prev=>{const n=new Set(prev);if(n.has(id))n.delete(id);else n.add(id);return n;});}
  function advanceDay(){
    const newDay=appDay+1;
    setAppDay(newDay);
    const unlocked=ALL_HABITS.find(h=>h.uday===newDay);
    if(unlocked){
      setCeleb({msg:`Habit unlocked: ${unlocked.name}`,icon:"\u{1F513}"});
      if(soundOn)SND.unlock();
    }
  }

  /* ─── TODAY VIEW ─── */
  function renderToday(){
    return(
      <div style={{padding:"0 16px"}}>
        <div style={{fontSize:28,fontWeight:800,color:C.text,fontFamily:FONT,lineHeight:1.2,marginTop:8}}>
          {greet()}, Charlie
        </div>
        <div style={{fontSize:18,fontWeight:600,color:C.textSec,marginTop:6,fontFamily:FONT}}>
          {fmtDate(today)}
        </div>

        {/* Quote */}
        <div style={{borderLeft:`3px solid ${C.primary}`,background:`${C.primary}08`,borderRadius:"0 10px 10px 0",padding:"12px 16px",marginTop:16}}>
          <div style={{fontSize:13,fontStyle:"italic",color:C.textSec,fontFamily:FONT,lineHeight:1.5}}>
            &ldquo;{QUOTE.text}&rdquo;
          </div>
          <div style={{fontSize:11,color:C.textMut,fontFamily:FONT,marginTop:4,textAlign:"right"}}>
            &mdash; {QUOTE.author}
          </div>
        </div>

        {/* Progress */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:28,marginTop:20,marginBottom:8}}>
          <Ring done={todayDD} total={activeDC}/>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:36,fontWeight:800,color:C.text,fontFamily:FONT,lineHeight:1}}>{"\u{1F525}"} {streak}</div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:C.textMut,marginTop:6,fontFamily:FONT,textTransform:"uppercase"}}>day streak</div>
            <div style={{fontSize:11,color:C.textMut,marginTop:4,fontFamily:FONT}}>Best: {best}</div>
            {todayDD>=threshold&&activeDC>0&&<div style={{fontSize:10,color:C.success,marginTop:6,fontFamily:FONT,fontWeight:700}}>Streak secured</div>}
            {todayDD<threshold&&<div style={{fontSize:10,color:C.warning,marginTop:6,fontFamily:FONT,fontWeight:600}}>{threshold-todayDD} more to keep streak</div>}
          </div>
        </div>

        {/* Categories */}
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:12}}>
          {CATEGORIES.map(cat=>(
            <CatCard key={cat.id} cat={cat} date={today} comp={comp} onToggle={hid=>handleToggle(hid,todayKey)}
              expanded={expCat===cat.id} onExpand={()=>setExpCat(expCat===cat.id?null:cat.id)}
              appDay={appDay} off={off} today={today}/>
          ))}
        </div>

        {/* Next unlock teaser */}
        {nextUnlock&&(
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",marginTop:12,background:C.card,borderRadius:12,boxShadow:SHAD,borderLeft:`4px solid ${C.primary}20`}}>
            <Ic name="lock" size={16} color={C.textMut}/>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:C.textSec,fontFamily:FONT}}>{nextUnlock.habit.name}</div>
              <div style={{fontSize:10,color:C.textMut,fontFamily:FONT,marginTop:2}}>Unlocks in {nextUnlock.days} day{nextUnlock.days!==1?"s":""}</div>
            </div>
          </div>
        )}
        <div style={{height:20}}/>
      </div>
    );
  }

  /* ─── WEEK VIEW ─── */
  function renderWeek(){
    const selDate=selDay?new Date(selDay+"T00:00:00"):null;
    const selKey=selDay||"";
    return(
      <div style={{padding:"0 16px"}}>
        <div style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:FONT,marginTop:8}}>This Week</div>
        <div style={{fontSize:14,color:C.textSec,marginTop:4,fontFamily:FONT}}>{wd[0].getDate()}&ndash;{wd[6].getDate()} {MN[wd[0].getMonth()]}</div>

        <div style={{display:"flex",gap:6,marginTop:20,justifyContent:"center"}}>
          {wd.map(d=>{
            const k=dk(d);const isT=k===todayKey;const isFut=k>todayKey;
            const active=getActive(d,appDay,off);const dn=active.filter(h=>comp[k]?.[h.id]).length;
            const rate=active.length>0&&!isFut?dn/active.length:-1;
            const bg=rate<0?C.elevated:compColor(rate);const sel=selDay===k;
            return(
              <div key={k} onClick={()=>setSelDay(sel?null:k)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",userSelect:"none"}}>
                <span style={{fontSize:9,fontWeight:700,letterSpacing:.5,color:C.textMut,fontFamily:FONT}}>{DS[d.getDay()]}</span>
                <div style={{width:42,height:48,borderRadius:10,background:rate<0?C.card:`${bg}18`,border:sel?`2px solid ${C.primary}`:isT?`2px solid ${C.textMut}`:"2px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",position:"relative",boxShadow:sel?SHAD_MD:"none"}}>
                  <span style={{fontSize:15,fontWeight:700,color:rate<0?C.textMut:C.text,fontFamily:FONT}}>{d.getDate()}</span>
                  {rate>=0&&<div style={{position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%)",width:24,height:3,borderRadius:2,background:bg,opacity:.5}}/>}
                </div>
                {rate>=0&&<span style={{fontSize:9,color:C.textMut,fontFamily:FONT,fontWeight:600}}>{Math.round(rate*100)}%</span>}
              </div>
            );
          })}
        </div>

        {selDate&&(
          <div style={{marginTop:20,paddingBottom:16}}>
            <div style={{fontSize:16,fontWeight:700,color:C.text,fontFamily:FONT,marginBottom:4}}>{fmtDate(selDate)}</div>
            <div style={{fontSize:12,color:C.textSec,fontFamily:FONT,marginBottom:12}}>{dailyDone(selKey,comp,appDay,off)}/{getActiveDailyCount(appDay,off)} daily habits</div>
            {CATEGORIES.map(cat=>{
              const ch=cat.habits.filter(h=>isActive(h,selDate,appDay,off));
              if(ch.length===0)return null;
              const cd=ch.filter(h=>comp[selKey]?.[h.id]).length;
              return(
                <div key={cat.id} style={{background:C.card,borderRadius:12,padding:"12px 14px",marginBottom:8,boxShadow:SHAD,borderLeft:`3px solid ${cat.color}`}}>
                  <div style={{fontSize:11,fontWeight:700,color:cat.color,letterSpacing:1,fontFamily:FONT,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                    <Ic name={CAT_IC[cat.id]} size={14} color={cat.color}/>{cat.name} — {cd}/{ch.length}
                  </div>
                  {ch.map(h=>{
                    const dn=!!comp[selKey]?.[h.id];
                    return(
                      <div key={h.id} onClick={()=>handleToggle(h.id,selKey)} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",cursor:"pointer",userSelect:"none",minHeight:32}}>
                        <div style={{width:20,height:20,borderRadius:10,flexShrink:0,border:dn?"none":`2px solid ${C.track}`,background:dn?cat.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                          {dn&&<svg width={10} height={10} viewBox="0 0 14 14"><path d="M3 7l3 3 5-6" stroke="#fff" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span style={{fontSize:13,fontFamily:FONT,color:C.text,opacity:dn?.45:1,textDecoration:dn?"line-through":"none",transition:"opacity 0.2s"}}>{h.name}</span>
                        {h.freq==="weekly"&&<span style={{fontSize:8,fontWeight:700,color:C.textMut,background:C.elevated,padding:"1px 5px",borderRadius:3,marginLeft:"auto"}}>{DS[h.wd]}</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
        {!selDate&&<div style={{textAlign:"center",marginTop:40,color:C.textMut,fontSize:13,fontFamily:FONT}}>Tap a day to see details</div>}
      </div>
    );
  }

  /* ─── STATS VIEW ─── */
  function renderStats(){
    const stats=[
      {l:"TOTAL DONE",v:totalDone,ic:"✓"},{l:"CURRENT STREAK",v:`${streak}d`,ic:"\u{1F525}"},
      {l:"BEST STREAK",v:`${best}d`,ic:"\u{1F3C6}"},{l:"WEEK RATE",v:`${Math.round(weekRate*100)}%`,ic:"\u{1F4C8}"},
      {l:"MOST CONSISTENT",v:mostCon,sm:true},{l:"NEEDS WORK",v:mostNeg,sm:true},
    ];
    return(
      <div style={{padding:"0 16px"}}>
        <div style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:FONT,marginTop:8}}>Stats</div>
        <div style={{fontSize:13,color:C.textSec,marginTop:4,fontFamily:FONT,marginBottom:20}}>Your performance this session</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {stats.map(s=>(
            <div key={s.l} style={{background:C.card,borderRadius:12,padding:"14px 12px",boxShadow:SHAD}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:1.2,color:C.textMut,fontFamily:FONT,marginBottom:8}}>{s.l}</div>
              <div style={{fontSize:s.sm?14:24,fontWeight:700,color:C.text,fontFamily:FONT}}>{s.ic?`${s.ic} `:""}{s.v}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:24,background:C.card,borderRadius:14,padding:"20px 8px",boxShadow:SHAD}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.2,color:C.textMut,fontFamily:FONT,textAlign:"center",marginBottom:12}}>LIFE BALANCE</div>
          <Radar rates={catRates}/>
          <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:"6px 14px",marginTop:16}}>
            {CATEGORIES.map((cat,i)=>(
              <div key={cat.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,fontFamily:FONT}}>
                <div style={{width:8,height:8,borderRadius:4,background:cat.color}}/>
                <span style={{color:C.textSec,fontWeight:500}}>{cat.name} {Math.round(catRates[i]*100)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{height:24}}/>
      </div>
    );
  }

  /* ─── SETTINGS PANEL ─── */
  function renderSettings(){
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:200,display:"flex",justifyContent:"center",alignItems:"flex-end"}} onClick={e=>{if(e.target===e.currentTarget)setShowSettings(false);}}>
        <div style={{background:C.card,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,maxHeight:"82vh",overflowY:"auto",padding:"20px 16px",paddingBottom:"calc(24px + env(safe-area-inset-bottom,0px))"}}>
          <div style={{width:36,height:4,borderRadius:2,background:C.track,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <span style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:FONT}}>Settings</span>
            <div onClick={()=>setShowSettings(false)} style={{cursor:"pointer",padding:4}}><Ic name="x" size={20} color={C.textMut}/></div>
          </div>

          {/* Sound */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.elevated}`}}>
            <span style={{fontSize:14,color:C.text,fontFamily:FONT}}>Sound effects</span>
            <Toggle on={soundOn} onChange={()=>setSoundOn(!soundOn)} color={C.primary}/>
          </div>

          {/* Habits */}
          {CATEGORIES.map(cat=>(
            <div key={cat.id} style={{marginTop:20}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                <Ic name={CAT_IC[cat.id]} size={16} color={cat.color}/>
                <span style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:cat.color,fontFamily:FONT}}>{cat.name}</span>
              </div>
              {cat.habits.map(h=>{
                const unlocked=h.uday<=appDay;const enabled=!off.has(h.id);
                return(
                  <div key={h.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",opacity:unlocked?1:.4}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,color:C.text,fontFamily:FONT,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        {h.name}
                        {h.freq==="weekly"&&h.wd!=null&&<span style={{fontSize:8,fontWeight:700,color:C.textMut,background:C.elevated,padding:"1px 5px",borderRadius:3}}>{DS[h.wd]}</span>}
                        {!unlocked&&<span style={{fontSize:9,color:C.textMut}}>Day {h.uday}</span>}
                        {unlocked&&h.uday>appDay-4&&<span style={{fontSize:8,fontWeight:700,color:C.primary,background:`${C.primary}15`,padding:"1px 5px",borderRadius:3}}>NEW</span>}
                      </div>
                    </div>
                    {unlocked?<Toggle on={enabled} onChange={()=>toggleOff(h.id)} color={cat.color}/>:<Ic name="lock" size={16} color={C.textMut}/>}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Dev tools */}
          <div style={{marginTop:24,padding:"16px 0",borderTop:`1px solid ${C.elevated}`}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:C.textMut,fontFamily:FONT,marginBottom:10}}>DEVELOPER</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:C.textSec,fontFamily:FONT}}>App Day: {appDay}</span>
              <div onClick={advanceDay} style={{fontSize:12,fontWeight:600,color:C.primary,fontFamily:FONT,cursor:"pointer",padding:"6px 14px",borderRadius:8,background:`${C.primary}10`,border:`1px solid ${C.primary}30`}}>
                Advance Day
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── RENDER ─── */
  return(
    <>
      <style>{`@keyframes flashAnim{0%{opacity:.22}100%{opacity:0}}`}</style>
      {celeb&&<Celeb msg={celeb.msg} icon={celeb.icon} onDone={()=>setCeleb(null)}/>}
      {flash&&<div style={{position:"fixed",inset:0,background:flash,animation:"flashAnim .6s ease-out forwards",zIndex:500,pointerEvents:"none"}}/>}
      {showSettings&&renderSettings()}
      <div style={{background:C.bg,color:C.text,fontFamily:FONT,maxWidth:430,margin:"0 auto",minHeight:"100vh",position:"relative",paddingBottom:72}}>
        {/* Header */}
        <div style={{padding:"14px 16px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:13,fontWeight:800,letterSpacing:6,color:C.text,opacity:.2,fontFamily:FONT}}>RITUALS</span>
          <div onClick={()=>setShowSettings(true)} style={{cursor:"pointer",padding:4}}><Ic name="sliders" size={20} color={C.textMut}/></div>
        </div>
        {view==="today"&&renderToday()}
        {view==="week"&&renderWeek()}
        {view==="stats"&&renderStats()}
        <Nav view={view} setView={setView}/>
      </div>
    </>
  );
}