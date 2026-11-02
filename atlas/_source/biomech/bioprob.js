/* ===================== BIOPROB: lean problem engine for ATLAS Biomechanics =====================
   PROBLEMS entries: {id,name,tag,level:"short"|"full",group,original,randomize(),solve(v),statement(v,r),known(v,r)[],find[],
   schematic(v,r) -> svg string (optional),assumptions[],steps(v,r)[{t,eq,note}],comments(v,r)[],references[],
   answers(v,r)[{label,unit,val,scale?}],hints(v,r)[3],takeaway}. Numbers in text use N(x,"unit"). 1 % tolerance.      */
const fmt=(x,sig=4)=>{ if(!isFinite(x)) return "—"; if(Math.abs(x)<1e-12) return "0"; return String(Number(x.toPrecision(sig))); };
const N=(x,unit="",sig=4)=>`<span class="num">${fmt(x,sig)}${unit?"&nbsp;"+unit:""}</span>`;
const pick=(min,max,step)=>{ const n=Math.round((max-min)/step); return +(min+step*Math.floor(Math.random()*(n+1))).toFixed(6); };
const subs=(h)=>String(h).replace(/([^\s_(>"=])_([A-Za-z0-9]+|[θαωρμ∞])/g,"$1<sub>$2</sub>");
const state={id:null,vars:null,isOriginal:true,shown:false,hintsUsed:0};
const BP=(()=>{
  const $=(s)=>document.querySelector(s);
  const cur=()=>PROBLEMS.find(p=>p.id===state.id);
  function nav(){ const el=$("#pnav"); const groups=[...new Set(PROBLEMS.map(p=>p.group))]; const solved=(typeof GAME!=="undefined"&&GAME.S.solved[GAME_PAGE])||[];
    el.innerHTML=groups.map(g=>`<div class="topic"><h2>${g}</h2>`+PROBLEMS.filter(p=>p.group===g).map(p=>`<button type="button" data-id="${p.id}" aria-current="${p.id===state.id}" class="${solved.includes(p.id)?"solved":""}"><span class="pname">${p.name}</span><span class="ptag">${p.level==="full"?"full":"quick"}</span></button>`).join("")+`</div>`).join("");
    el.querySelectorAll("button").forEach(b=>b.onclick=()=>{ state.id=b.dataset.id; state.vars={...cur().original}; state.isOriginal=true; state.shown=false; state.hintsUsed=0; window.__slvars={}; render(); }); }
  function render(){ const p=cur(); const v=state.vars, r=p.solve(v); const ans=p.answers(v,r); const full=p.level==="full"; window.__slvars=window.__slvars||{};
    const sheet=$("#psheet");
    sheet.innerHTML=`<header class="phead"><div class="eyebrow">${p.group} · ${p.tag} · ${full?"full set-up (Known → Find → Schematic → Assumptions → Analysis → Comments → References)":"quick problem"}</div><h2>${p.name}</h2>
      <div class="controls"><button type="button" class="btn primary" id="newnums">New numbers</button><button type="button" class="btn" id="orig">Class example</button>${p.credit?`<span class="note">${p.credit}</span>`:""}</div></header>
      <section class="statement"><p>${p.statement(v,r)}</p></section>
      ${full?`<div class="cols"><div class="box known"><h3>Known</h3><ul>${p.known(v,r).map(k=>`<li>${k}</li>`).join("")}</ul></div><div class="box find"><h3>Find</h3><ul>${p.find.map(k=>`<li>${k}</li>`).join("")}</ul></div></div>
      <div class="cols kf2">${p.schematic?`<figure class="schem">${p.schematic(v,r)}<figcaption>Schematic</figcaption></figure>`:""}${p.assumptions?`<div class="box assume"><h3>Assumptions</h3><ul class="plain">${p.assumptions.map(a=>`<li>${a}</li>`).join("")}</ul></div>`:""}</div>`:""}
      <form id="ansform" class="answers" autocomplete="off"><h3>Your answers</h3>${ans.map((a,i)=>`<div class="arow"><label for="a${i}">${a.label}</label><input id="a${i}" inputmode="decimal" placeholder="e.g. 12.3"><span class="unit">${a.unit}</span><span class="chip idle" id="c${i}">not checked</span></div>`).join("")}
        <div class="controls"><button class="btn primary" type="submit">Check answers</button><button type="button" class="btn" id="hintbtn">Hint (−5 XP)</button><button type="button" class="btn" id="showsol">${state.shown?"Hide":"Show"} full solution</button><span class="hint">Correct within 1 %.</span></div><div class="hints" id="hints" ${state.hintsUsed?"":"hidden"}>${p.hints(v,r).slice(0,state.hintsUsed).map((h,i)=>`<p><b>Hint ${i+1}.</b> ${h}</p>`).join("")}</div></form>
      <section id="sol" class="solution" ${state.shown?"":"hidden"}><h3>Analysis</h3><ol class="steps">${p.steps(v,r).map(s=>`<li><div class="step-title">${s.t}</div><div class="step-body"><div class="eq">${subs(s.eq)}</div>${s.note?`<div class="note">${s.note}</div>`:""}</div></li>`).join("")}</ol>
        <div class="final">${ans.map(a=>`<div class="ans"><div class="k">${a.label}</div><div class="val">${fmt(a.val)} ${a.unit}</div></div>`).join("")}</div>
        ${p.comments?`<div class="box comments"><h3>Comments</h3><ul class="plain">${p.comments(v,r).map(c=>`<li>${c}</li>`).join("")}</ul></div>`:""}${p.references?`<div class="box refs"><h3>References</h3><ol class="plain">${p.references.map(c=>`<li>${c}</li>`).join("")}</ol></div>`:""}
        ${p.takeaway?`<p class="takeaway"><b>Takeaway.</b> ${p.takeaway}</p>`:""}</section>`;
    $("#newnums").onclick=()=>{ state.vars=p.randomize(); state.isOriginal=false; state.shown=false; state.hintsUsed=0; window.__slvars={}; render(); };
    $("#orig").onclick=()=>{ state.vars={...p.original}; state.isOriginal=true; state.shown=false; state.hintsUsed=0; window.__slvars={}; render(); };
    $("#showsol").onclick=()=>{ state.shown=!state.shown; if(state.shown&&typeof GAME!=="undefined") GAME.onReveal(); $("#sol").hidden=!state.shown; $("#showsol").textContent=(state.shown?"Hide":"Show")+" full solution"; if(state.shown) $("#sol").scrollIntoView({behavior:"smooth",block:"start"}); };
    $("#hintbtn").onclick=()=>{ const hs=p.hints(v,r); if(state.hintsUsed>=hs.length) return; state.hintsUsed++; if(typeof GAME!=="undefined") GAME.addXP(-5,"Hint "+state.hintsUsed,"−5 XP"); const hb=$("#hints"); hb.hidden=false; hb.innerHTML=hs.slice(0,state.hintsUsed).map((h,i)=>`<p><b>Hint ${i+1}.</b> ${h}</p>`).join(""); fixSubs(hb); };
    $("#ansform").onsubmit=(e)=>{ e.preventDefault(); ans.forEach((a,i)=>{ const inp=$("#a"+i), chip=$("#c"+i); const x=parseFloat(inp.value.replace(",",".")); if(!isFinite(x)){ chip.className="chip idle"; chip.textContent="enter a number"; return; } const tol=0.01*Math.max(Math.abs(a.val),a.scale||0); const err=Math.abs(x-a.val); if(err<=tol+1e-12){ chip.className="chip good"; chip.textContent="correct"; } else { chip.className="chip bad"; chip.textContent=err<=3*tol?"close — check rounding/units":"not yet"; } }); if(typeof GAME!=="undefined") GAME.onCheck(ans); nav(); };
    nav(); fixSubs(sheet); }
  function init(){ state.id=PROBLEMS[0].id; state.vars={...PROBLEMS[0].original}; render(); }
  return {init,render,cur};
})();
