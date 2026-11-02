const AN=(()=>{
  const $=(s)=>document.querySelector(s); const {add,mul}=B3; const {MUSCLES,BONES,JOINTS,L,COL}=ANM;
  /* ---------- build the scene ---------- */
  const LAYER={skin:0.25,m1:1,m2:1,bone:1,joint:1}; let state={reg:"all",side:"both",iso:null,sel:null,focusLayer:null};
  const byId={}; const partsOf={};
  function alphaOf(p){ const base=LAYER[p.layer]; if(base<=0.02) return 0; let a=base;
    if(state.reg!=="all"&&p.reg&&p.reg!==state.reg&&p.layer!=="skin") a*=0.12;
    if(state.iso&&p.layer!=="skin"){ a=p.sid===state.iso?Math.max(a,0.95):(p.layer==="bone"?Math.min(a,0.35):Math.min(a,0.08)); }
    return a; }
  function build(){ const r=ANM.build((p)=>{ if(state.side==="right"&&p.side<0&&!p.single&&p.layer!=="skin") return 0; return alphaOf(p); }); Object.assign(byId,r.byId); Object.assign(partsOf,r.partsOf); }
  const dirty=()=>{ B3.S.dirty=true; };
  /* ---------- attachments overlay for the selected muscle ---------- */
  B3.S.overlays.push((ctx,M,project)=>{ if(!state.sel) return; const e=byId[state.sel]; if(!e||e.kind!=="muscle") return; const mu=e.d; const sides=state.side==="right"?[1]:[1,-1];
    sides.forEach(s=>ANM.pathsOf(mu).forEach((path,k)=>{ const o=[path[0][0],path[0][1],path[0][2]*s], i=path[path.length-1]; const ip=[i[0],i[1],i[2]*s]; const dot=(p,c)=>{ const P=project(p,M); if(P[2]<0.1) return; ctx.fillStyle=c; ctx.beginPath(); ctx.arc(P[0],P[1],3.5,0,2*Math.PI); ctx.fill(); }; dot(o,"#7cff6b"); dot(ip,"#ffd23f"); if(k===0){ B3.label3(ctx,M,project,o,"origin","#7cff6b",-12); B3.label3(ctx,M,project,ip,"insertion","#ffd23f",18); } })); });

  /* ---------- UI ---------- */
  const REGN={head:"Head & neck",trunk:"Trunk",upper:"Upper limb",lower:"Lower limb"};
  function osimRows(d){ if(!ANM.HAS_OSIM||!d.osim||!OSIM.muscles[d.id]) return ""; const L=OSIM.muscles[d.id]; const row=(m)=>`<tr><td>${m.label||d.n.split(" (")[0]}</td><td>${m.Fmax.toFixed(0)}</td><td>${(m.lopt*100).toFixed(1)}</td><td>${(m.lslack*100).toFixed(1)}</td><td>${(m.alpha*180/Math.PI).toFixed(0)}°</td></tr>`;
    return `<details class="osim" style="margin:8px 0"><summary><b>Model parameters</b> <span class="note">(OpenSim · Rajagopal et al.)</span></summary><table class="mini"><thead><tr><th>part</th><th>F<sub>max</sub> (N)</th><th>ℓ<sub>opt</sub> (cm)</th><th>ℓ<sub>slack</sub> (cm)</th><th>α<sub>opt</sub></th></tr></thead><tbody>${L.map(row).join("")}</tbody></table><p class="note" style="margin:4px 0 0">Path drawn from the model's attachment points; the tube radius scales with PCSA = F<sub>max</sub>/σ, σ = 60 N/cm².</p></details>`; }
  function muscleCenter(mu){ const pts=ANM.pathsOf(mu).flat(); return pts.reduce((a,p)=>add(a,mul(p,1/pts.length)),[0,0,0]); }
  function select(sid,fly=true){ state.sel=sid; B3.S.sel=sid; const e=byId[sid]; if(!e){ $("#ainfo").innerHTML="<p class='note'>Click any structure. Use the layer sliders to peel the body back: skin → superficial muscles → deep muscles → bones → joints.</p>"; dirty(); return; }
    /* highlight: mark all parts of this structure as selected by id match in render (B3 highlights one id) — we pulse via alpha instead */
    const d=e.d; let html="";
    if(e.kind==="muscle"){ html=`<div class="jmeta"><span class="chip" style="border-color:${COL.m1}">muscle · ${d.lay===1?"superficial":"deep"}</span><span class="chip">${REGN[d.reg]}</span></div><h3 style="margin:6px 0">${d.n}</h3>
      <div class="ro"><span>Origin</span><b style="text-align:right;max-width:60%;font-family:inherit;font-weight:500">${d.o}</b></div><div class="ro"><span>Insertion</span><b style="text-align:right;max-width:60%;font-family:inherit;font-weight:500">${d.i}</b></div>
      <p style="margin:8px 0 4px"><b>Action.</b> ${d.a}</p>${osimRows(d)}<div class="ro"><span>Joint(s) crossed</span><b style="font-family:inherit;font-weight:500">${d.j}</b></div><div class="ro"><span>Plane(s)</span><b style="font-family:inherit;font-weight:500">${d.pl}</b></div>
      <div class="xray" style="margin-top:8px"><button type="button" class="btn small" id="isob">${state.iso===sid?"Show all":"Isolate"}</button><button type="button" class="btn small" id="flyb">Fly to</button></div>`;
      if(fly){ const c=muscleCenter(d); B3.flyTo([c[0],c[1],0],1.6); } }
    else if(e.kind==="bone"){ html=`<div class="jmeta"><span class="chip">bone</span><span class="chip">${REGN[d.reg]}</span></div><h3 style="margin:6px 0">${d.n}</h3><p>${d.txt}</p>
      <p class="note"><b>Muscles attaching here or nearby:</b> ${MUSCLES.filter(m=>(m.o+" "+m.i).toLowerCase().includes(d.n.split(" ")[0].toLowerCase().replace(/[()]/g,""))).map(m=>m.n).join(", ")||"—"}</p>
      <div class="xray" style="margin-top:8px"><button type="button" class="btn small" id="isob">${state.iso===sid?"Show all":"Isolate"}</button></div>`; }
    else { const acting=MUSCLES.filter(m=>m.j.toLowerCase().includes(d.n.split(" ")[0].toLowerCase().slice(0,5))); html=`<div class="jmeta"><span class="chip" style="border-color:${COL.joint}">joint · ${d.type}</span><span class="chip">${d.dof} DOF</span></div><h3 style="margin:6px 0">${d.n}</h3><p><b>Movements.</b> ${d.mv}</p>
      <p class="note"><b>Muscles acting across it:</b> ${acting.map(m=>`<a href="#" data-sel="${m.id}">${m.n}</a>`).join(", ")||"—"}</p>`; if(fly) B3.flyTo([d.pos[0],d.pos[1],0],1.2); }
    $("#ainfo").innerHTML=html; const ib=$("#isob"); if(ib) ib.onclick=()=>{ state.iso=state.iso===sid?null:sid; select(sid,false); }; const fb=$("#flyb"); if(fb) fb.onclick=()=>{ const c=muscleCenter(d); B3.flyTo([c[0],c[1],0],1.2); };
    $("#ainfo").querySelectorAll("[data-sel]").forEach(a=>a.onclick=(ev)=>{ ev.preventDefault(); select(a.dataset.sel); });
    fixSubs($("#ainfo")); dirty(); }
  /* selection glow: B3 highlights by part.id; we set it to the right-side part and flag left via color tweak */
  const origRender=null;
  function applyLayerUI(){ ["skin","m1","m2","bone","joint"].forEach(k=>{ const el=$("#lay-"+k); if(el) LAYER[k]=+el.value; }); dirty(); }
  const PRESET={skin:{skin:1,m1:0,m2:0,bone:0,joint:0},muscles:{skin:0.12,m1:1,m2:1,bone:0.9,joint:0},deep:{skin:0,m1:0.08,m2:1,bone:0.9,joint:0},skeleton:{skin:0,m1:0,m2:0,bone:1,joint:0},joints:{skin:0.08,m1:0,m2:0,bone:0.7,joint:1}};
  function fillList(){ const sel=$("#astruct"); const q=($("#asearch").value||"").toLowerCase(); const grp=(label,items)=>items.length?`<optgroup label="${label}">${items.map(x=>`<option value="${x.id}">${x.n}</option>`).join("")}</optgroup>`:"";
    const f=(arr)=>arr.filter(x=>(state.reg==="all"||x.reg===state.reg)&&(!q||x.n.toLowerCase().includes(q)));
    sel.innerHTML=`<option value="">— pick a structure —</option>`+grp("Superficial muscles",f(MUSCLES.filter(m=>m.lay===1)))+grp("Deep muscles",f(MUSCLES.filter(m=>m.lay===2)))+grp("Bones",f(BONES))+grp("Joints",f(JOINTS)); }
  /* ---------- drills ---------- */
  const DR=(()=>{ const KEY="dpl-biomech-anatomy"; let St={done:0,correct:0,streak:0,best:0}; try{ Object.assign(St,JSON.parse(localStorage.getItem(KEY))||{}); }catch(e){} const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(St)); }catch(e){} };
    const pick=(a)=>a[Math.floor(Math.random()*a.length)]; const shuffle=(a)=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
    const others=(arr,x,n)=>shuffle(arr.filter(y=>y.id!==x.id&&y.reg===x.reg)).slice(0,n).concat(shuffle(arr.filter(y=>y.id!==x.id&&y.reg!==x.reg))).slice(0,n);
    const Q=[
      ()=>{ const m=pick(MUSCLES); showStructure(m.id,m.lay===1?"muscles":"deep"); return {q:"Which muscle is highlighted?",opts:shuffle([m,...others(MUSCLES,m,3)].map(x=>x.n)),ans:m.n,why:`${m.n}: ${m.o} → ${m.i}.`}; },
      ()=>{ const m=pick(MUSCLES); showStructure(m.id,m.lay===1?"muscles":"deep"); return {q:"Which muscle is highlighted?",opts:shuffle([m,...others(MUSCLES,m,3)].map(x=>x.n)),ans:m.n,why:`${m.n}: ${m.a}`}; },
      ()=>{ const b=pick(BONES); showStructure(b.id,"skeleton"); return {q:"Which bone is highlighted?",opts:shuffle([b,...others(BONES,b,3)].map(x=>x.n)),ans:b.n,why:b.txt}; },
      ()=>{ const j=pick(JOINTS); showStructure(j.id,"joints"); return {q:"Which joint is highlighted?",opts:shuffle([j,...others(JOINTS,j,3)].map(x=>x.n)),ans:j.n,why:`${j.n}: ${j.type}, ${j.dof} DOF — ${j.mv}.`}; },
      ()=>{ const j=pick(JOINTS); showStructure(j.id,"joints"); return {q:`What type of joint is the ${j.n.toLowerCase()}?`,opts:shuffle([j.type,...shuffle([...new Set(JOINTS.map(x=>x.type))].filter(t=>t!==j.type)).slice(0,3)]),ans:j.type,why:`${j.dof} DOF — ${j.mv}.`}; },
      ()=>{ const m=pick(MUSCLES); showStructure(m.id,m.lay===1?"muscles":"deep"); return {q:`Where does the ${m.n.toLowerCase()} insert?`,opts:shuffle([m.i,...others(MUSCLES,m,3).map(x=>x.i)]),ans:m.i,why:`Origin: ${m.o}. Insertion: ${m.i}.`}; },
      ()=>{ const m=pick(MUSCLES); showStructure(m.id,m.lay===1?"muscles":"deep"); return {q:`Where does the ${m.n.toLowerCase()} originate?`,opts:shuffle([m.o,...others(MUSCLES,m,3).map(x=>x.o)]),ans:m.o,why:`Origin: ${m.o}. Insertion: ${m.i}.`}; },
      ()=>{ const m=pick(MUSCLES); showStructure(m.id,m.lay===1?"muscles":"deep"); return {q:`Which description matches the action of the highlighted muscle (${m.n})?`,opts:shuffle([m.a,...others(MUSCLES,m,3).map(x=>x.a)]),ans:m.a,why:`${m.n} crosses: ${m.j}.`}; },
      ()=>{ const m=pick(MUSCLES); showStructure(m.id,"muscles"); const ans=m.lay===1?"superficial":"deep"; return {q:`Is the ${m.n.toLowerCase()} superficial or deep?`,opts:["superficial","deep"],ans,why:m.lay===1?"It lies directly under the skin/fascia.":"It lies under other muscles."}; },
      ()=>{ const acts=[["hip flexion","Iliopsoas (psoas major + iliacus)","ilps"],["knee extension","Vastus lateralis","vl"],["ankle plantarflexion","Soleus","sol"],["ankle dorsiflexion","Tibialis anterior","ta_"],["hip abduction","Gluteus medius","gmed"],["hip extension from a deep squat","Gluteus maximus","gmax"],["elbow flexion with the forearm pronated","Brachialis","brach"],["elbow extension","Triceps brachii","tri"],["shoulder abduction beyond 15°","Deltoid","delt"],["scapular protraction","Serratus anterior","serr"],["forearm supination with the elbow extended","Supinator","sup"],["knee flexion and tibial external rotation","Biceps femoris","bf"]]; const a=pick(acts); showStructure(a[2],"muscles"); const m=byId[a[2]].d; return {q:`A prime mover for ${a[0]} is…`,opts:shuffle([a[1],...others(MUSCLES,m,3).map(x=>x.n)]),ans:a[1],why:`${m.n}: ${m.a}`}; }
    ];
    let cur=null; function next(){ cur=pick(Q)(); const el=$("#andrill"); el.innerHTML=`<div class="dq">${cur.q}</div><div class="dopts">${cur.opts.map(o=>`<button type="button" class="btn dopt" data-o="${o.replace(/"/g,"&quot;")}">${o}</button>`).join("")}</div><div class="dfb" id="andfb"></div><div class="dstat">Answered ${St.done} · correct ${St.correct} · streak ${St.streak} (best ${St.best})</div>`; el.querySelectorAll(".dopt").forEach(b=>b.onclick=()=>answer(b.dataset.o,b)); fixSubs(el); }
    function answer(o,b){ const ok=o===cur.ans; St.done++; if(ok){ St.correct++; St.streak++; St.best=Math.max(St.best,St.streak); } else St.streak=0; save(); $("#andrill").querySelectorAll(".dopt").forEach(x=>{ x.disabled=true; if(x.dataset.o===cur.ans) x.classList.add("good"); else if(x===b&&!ok) x.classList.add("bad"); }); $("#andfb").innerHTML=`<p class="${ok?"fb good":"fb bad"}">${ok?"Correct.":"Not quite — the answer is <b>"+cur.ans+"</b>."} ${cur.why}</p><button type="button" class="btn primary small" id="annext">Next question →</button>`; $("#annext").onclick=next; const ds=$("#andrill .dstat"); if(ds) ds.textContent=`Answered ${St.done} · correct ${St.correct} · streak ${St.streak} (best ${St.best})`; if(typeof GAME!=="undefined"&&ok) GAME.addXP(10,St.streak>1?`+10 XP · ${St.streak} in a row`:"+10 XP"); if(state.sel) select(state.sel,false); }
    return {next}; })();
  function showStructure(sid,preset){ Object.assign(LAYER,PRESET[preset]); ["skin","m1","m2","bone","joint"].forEach(k=>{ const el=$("#lay-"+k); if(el) el.value=LAYER[k]; }); state.iso=sid; state.sel=null; $("#ainfo").innerHTML="<p class='note'>Answer the question — the structure is highlighted and isolated.</p>"; const e=byId[sid]; const c=e.kind==="muscle"?muscleCenter(e.d):e.kind==="joint"?e.d.pos:null; if(c) B3.flyTo([c[0],c[1],0],e.kind==="joint"?1.2:1.7); else B3.flyTo([0,0.92,0],2.5); dirty(); }
  function reference(){ const el=$("#areftable"); el.innerHTML=`<table class="jt"><tr><th>Muscle</th><th>Layer</th><th>Origin</th><th>Insertion</th><th>Action</th><th>Joint(s)</th></tr>${MUSCLES.map(m=>`<tr><td><a href="#" data-sel="${m.id}">${m.n}</a></td><td>${m.lay===1?"superficial":"deep"}</td><td>${m.o}</td><td>${m.i}</td><td>${m.a}</td><td>${m.j}</td></tr>`).join("")}</table>
    <h4 style="margin:14px 0 6px">Joints</h4><table class="jt"><tr><th>Joint</th><th>Type</th><th>DOF</th><th>Movements</th></tr>${JOINTS.map(j=>`<tr><td><a href="#" data-sel="${j.id}">${j.n}</a></td><td>${j.type}</td><td>${j.dof}</td><td>${j.mv}</td></tr>`).join("")}</table>`;
    el.querySelectorAll("[data-sel]").forEach(a=>a.onclick=(ev)=>{ ev.preventDefault(); document.querySelector('#tabs [data-k="explore"]').click(); const e=byId[a.dataset.sel]; Object.assign(LAYER,PRESET[e.kind==="joint"?"joints":e.kind==="bone"?"skeleton":e.d.lay===2?"deep":"muscles"]); ["skin","m1","m2","bone","joint"].forEach(k=>{ const x=$("#lay-"+k); if(x) x.value=LAYER[k]; }); select(a.dataset.sel); }); }
  function init(){ build(); B3.S.alwaysRender=false; B3.S.viewDist=2.5; B3.S.viewTarget=[0,0.92,0]; B3.cam.target=[0,0.92,0]; B3.cam.dist=2.5; B3.cam.theta=Math.PI/2; B3.cam.phi=0.1;
    B3.init("#bcanvas",(p)=>{ if(!p) return; select(p.sid); });
    document.querySelectorAll("#tabs .tabbtn").forEach(b=>b.onclick=()=>{ document.querySelectorAll("#tabs .tabbtn").forEach(x=>x.classList.toggle("on",x===b)); ["explore","drills","reference"].forEach(k=>$("#"+k).hidden=k!==b.dataset.k); });
    ["skin","m1","m2","bone","joint"].forEach(k=>{ const el=$("#lay-"+k); el.value=LAYER[k]; el.oninput=applyLayerUI; });
    document.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>{ Object.assign(LAYER,PRESET[b.dataset.preset]); ["skin","m1","m2","bone","joint"].forEach(k=>$("#lay-"+k).value=LAYER[k]); state.iso=null; dirty(); if(state.sel) select(state.sel,false); });
    $("#aregion").onchange=(e)=>{ state.reg=e.target.value; fillList(); dirty(); }; $("#aside").onchange=(e)=>{ state.side=e.target.value; dirty(); };
    $("#asearch").oninput=fillList; $("#astruct").onchange=(e)=>{ if(e.target.value){ const en=byId[e.target.value]; if(en.kind==="muscle"&&LAYER[en.d.lay===1?"m1":"m2"]<0.3){ Object.assign(LAYER,PRESET[en.d.lay===2?"deep":"muscles"]); ["skin","m1","m2","bone","joint"].forEach(k=>$("#lay-"+k).value=LAYER[k]); } select(e.target.value); } };
    $("#showall").onclick=()=>{ state.iso=null; state.sel=null; select(null); B3.flyTo([0,0.92,0],2.5,Math.PI/2,0.1); };
    fillList(); reference(); select(null);
    $("#andrillstart").onclick=()=>{ DR.next(); $("#andrillstart").textContent="Skip →"; };
    /* pulse the selected structure */ setInterval(()=>{ if(state.sel) dirty(); },500); }
  return {init,MUSCLES,BONES,JOINTS,state,LAYER,select};
})();
AN.init();
