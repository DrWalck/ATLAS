const GAME_PAGE="__PAGE__"; const DRILL_KEY="__DRILLKEY__";
const SL_VARS=()=>window.__slvars||(window.__slvars={});
/* ---------- Game layer: XP, levels, streak, cleared badges, celebration ---------- */
const GAME=(()=>{
  const KEY="dpl-game";
  let S={xp:0,streak:0,best:0,solved:{},orig:{}};
  try{ Object.assign(S,JSON.parse(localStorage.getItem(KEY))||{}); }catch(e){}
  const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} };
  const mem=new WeakMap();                       /* per set of numbers: {earned:Set, revealed, cleared} */
  const rec=()=>{ let m=mem.get(SL_VARS()); if(!m){ m={earned:new Set(),revealed:false,cleared:false}; mem.set(SL_VARS(),m);} return m; };
  const solved=()=>S.solved[GAME_PAGE]||(S.solved[GAME_PAGE]=[]);
  const lvl=()=>Math.floor(S.xp/100)+1;
  const I={
    xp:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    fire:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.2 1-3.8 2.3-5 .2 1.8 1 2.8 2.2 3.2C11 8.6 11.3 5 12 2z"/></svg>',
    ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 5 5L20 6.5"/></svg>'
  };
  function hud(bump){
    let h=document.getElementById("hud");
    if(!h){ h=document.createElement("div"); h.className="hud"; h.id="hud"; h.setAttribute("aria-label","Your progress"); document.querySelector("header.top").appendChild(h); }
    let n=0,tot=20,lab="drills"; if(typeof PROBLEMS!=="undefined"){ n=solved().length; tot=PROBLEMS.length; lab="problems"; } else { try{ const ss=JSON.parse(localStorage.getItem(DRILL_KEY))||{}; n=Math.min(ss.correct||0,20); }catch(e){} }
    h.innerHTML=`<div class="cell lvl"><span class="k">LVL</span><span class="n">${lvl()}</span><span class="xpbar" title="${S.xp%100}/100 XP to next level"><i style="width:${S.xp%100}%"></i></span></div>
      <div class="cell xp">${I.xp}<span class="n">${S.xp}</span><span class="k">XP</span></div>
      <div class="cell streak" title="Problems cleared in a row without opening the full solution (best ${S.best})">${I.fire}<span class="n">${S.streak}</span><span class="k">streak</span></div>
      <div class="cell clr" title="Problems on this page you have fully solved">${I.ok}<span class="n">${n}/${tot}</span><span class="k">${lab}</span></div>`;
    if(bump) h.querySelectorAll(".cell").forEach(c=>{ if(bump.includes(c.classList[1])){ c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); } });
  }
  function markNav(){}
  function toast(big,small){
    let t=document.getElementById("toast"); if(!t){ t=document.createElement("div"); t.id="toast"; t.className="toast"; t.setAttribute("role","status"); document.body.appendChild(t); }
    t.innerHTML=`<div>${big}${small?`<small>${small}</small>`:""}</div>`;
    t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),2600);
  }
  function burst(x,y){
    if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cv=document.getElementById("fx"); if(!cv){ cv=document.createElement("canvas"); cv.id="fx"; document.body.appendChild(cv); }
    const dpr=window.devicePixelRatio||1, W=innerWidth, H=innerHeight; cv.width=W*dpr; cv.height=H*dpr; const c=cv.getContext("2d"); c.scale(dpr,dpr);
    const cols=["#22d3ee","#8b5cf6","#ff4fd8","#7cff6b","#ffd23f","#ff8a3d"];
    const P=Array.from({length:140},()=>{ const a=Math.random()*Math.PI*2, s=3+Math.random()*9; return {x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-5,r:2+Math.random()*3.5,c:cols[Math.random()*cols.length|0],rot:Math.random()*6,vr:(Math.random()-.5)*.4,sq:Math.random()<.5}; });
    let t0=null;
    (function f(ts){ t0??=ts; const k=(ts-t0)/1600; c.clearRect(0,0,W,H); if(k>=1){ c.clearRect(0,0,W,H); return; }
      P.forEach(p=>{ p.vy+=.28; p.vx*=.985; p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; c.save(); c.globalAlpha=1-k; c.translate(p.x,p.y); c.rotate(p.rot); c.fillStyle=p.c; c.shadowColor=p.c; c.shadowBlur=8; if(p.sq) c.fillRect(-p.r,-p.r/2,p.r*2,p.r); else { c.beginPath(); c.arc(0,0,p.r*.7,0,7); c.fill(); } c.restore(); });
      requestAnimationFrame(f); })(performance.now());
  }
  function onCheck(ans){
    const m=rec(); let gain=0, allGood=true;
    ans.forEach((a,i)=>{ const good=document.getElementById("c"+i).classList.contains("good"); if(!good) allGood=false; else if(!m.revealed && !m.earned.has(i)){ m.earned.add(i); gain+=10; } });
    const origKey=GAME_PAGE+"|"+state.id;
    if(state.isOriginal && S.orig[origKey]) gain=0;   /* the class example only pays XP once */
    if(allGood && !m.cleared){
      m.cleared=true;
      if(!m.revealed){
        if(!(state.isOriginal && S.orig[origKey])){ gain+=20; S.streak++; S.best=Math.max(S.best,S.streak); }
        if(state.isOriginal) S.orig[origKey]=true;
        const s=solved(); if(!s.includes(state.id)) s.push(state.id);
      }
      const before=lvl(); S.xp+=gain; save(); hud(["lvl","xp","streak","clr"]); markNav();
      const b=document.querySelector('#ansform button[type="submit"]').getBoundingClientRect(); burst(b.left+b.width/2,b.top);
      const up=lvl()>before;
      toast(up?`Level up! <span class="plus">LVL ${lvl()}</span>`:`Stage clear <span class="plus">+${gain} XP</span>`,
            m.revealed?"Solution was open, so no XP this time. Try New numbers!":(S.streak>1?`${S.streak} in a row. Keep it going with New numbers.`:"Press New numbers for another round."));
      return;
    }
    if(gain){ S.xp+=gain; save(); hud(["xp","lvl"]); }
  }
  function onReveal(){ const m=rec(); if(!m.revealed && !m.cleared){ m.revealed=true; if(S.streak){ S.streak=0; save(); hud(["streak"]); } } }
  function addXP(n,big,small){ S.xp=Math.max(0,S.xp+n); save(); hud(n>0?["xp","lvl"]:["xp"]); if(big) toast(big,small); }
  return {S,hud,markNav,onCheck,onReveal,addXP,toast,burst,rec};
})();

