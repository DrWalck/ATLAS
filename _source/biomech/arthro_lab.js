/* ===================== ARTHROKINEMATICS LAB =====================
   Tabs: roll · glide · spin → convex–concave rule → knee open/closed chain (+ screw-home) → included vs anatomical angle →
   mobilization planner → drills. Source: ME 320 Lecture 9 (Dr. Walck); Kaltenborn's convex–concave rule; Neumann,
   Kinesiology of the Musculoskeletal System (roll/slide/spin definitions).                                              */
const AL=(()=>{
  const $=(s)=>document.querySelector(s); const f=(x,d=1)=>isFinite(x)?(+x).toFixed(d):"—"; const rad=(d)=>d*Math.PI/180;
  let svgN=0; const svg=(w,h,inner,cls="")=>{ const uid="s"+(svgN++); return `<svg viewBox="0 0 ${w} ${h}" class="mlsvg ${cls}" preserveAspectRatio="xMidYMid meet">${inner.split("@@").join(uid)}</svg>`; };
  const MK={"#7cff6b":"ahg","#22d3ee":"ahc","#ffd23f":"ahy","#ff8a3d":"aho","#ff5a5a":"ahr"};
  const ARROW=`<defs>${Object.entries(MK).map(([c,id])=>`<marker id="${id}@@" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join("")}</defs>`;
  const arrow=(x1,y1,x2,y2,col,w=3,dash="")=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" marker-end="url(#${MK[col]||"ahc"}@@)" ${dash?`stroke-dasharray="${dash}"`:""}/>`;
  const txt=(x,y,s,o="")=>`<text x="${x}" y="${y}" class="mlab" ${o}>${s}</text>`;
  const BONE="#e8e2d2", BONE2="#cfc6b0", CART="#9fd8ff";

  /* ---------- 1. roll · glide · spin (tire analogies, animated) ---------- */
  let rgsT=0, rgsTimer=null, rgsMode="roll";
  const RGS={
    roll:{n:"Roll",tire:"a tire rolling down the road",def:"<b>Many points</b> on the moving surface contact <b>many points</b> on the fixed surface. New points keep meeting new points, like tread meeting fresh pavement.",joint:"A femoral condyle rolling across the tibial plateau in flexion."},
    glide:{n:"Glide / slide",tire:"a locked tire skidding on ice",def:"<b>The same point</b> on the moving surface contacts <b>many points</b> on the fixed surface. One patch of tread drags along the ground.",joint:"The carpal row sliding dorsally on the radius during wrist flexion."},
    spin:{n:"Spin",tire:"a wheel spinning in a pothole",def:"<b>Many points</b> on the moving surface contact <b>the same point</b> on the fixed surface. The wheel turns in place.",joint:"The radial head spinning on the capitulum in pronation–supination; the femoral head spinning in the acetabulum during hip flexion with the knee extended (approx.)."}
  };
  function drawWheel(cx,cy,r,ang,col){ const sp=[0,90,180,270].map(a=>{ const t=rad(a+ang); return `<line x1="${cx}" y1="${cy}" x2="${cx+r*0.78*Math.cos(t)}" y2="${cy+r*0.78*Math.sin(t)}" stroke="#394b78" stroke-width="3"/>`; }).join("");
    const t=rad(90+ang); const mark=`<circle cx="${cx+r*0.86*Math.cos(t)}" cy="${cy+r*0.86*Math.sin(t)}" r="6" fill="${col}"/>`;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1b2748" stroke="#9fb3e6" stroke-width="6"/>${sp}${mark}<circle cx="${cx}" cy="${cy}" r="${r*0.22}" fill="#6f86b3"/>`; }
  function renderRGS(){ const el=$("#rgs"); const m=RGS[rgsMode]; const r=46, gy=170, p=(rgsT%1);
    let scene="", note="";
    if(rgsMode==="roll"){ const x=120+p*300; const ang=((x-120)/r)*180/Math.PI; scene=drawWheel(x,gy-r,r,ang,"#ff8a3d")+`<rect x="60" y="${gy}" width="480" height="8" fill="#6f86b3"/>`+[...Array(9)].map((_,i)=>`<circle cx="${100+i*50}" cy="${gy+4}" r="3" fill="${(100+i*50)<x?"#ff8a3d":"#394b78"}"/>`).join("")+txt(300,215,"contact point advances on BOTH surfaces: many ↔ many",'text-anchor="middle"'); }
    else if(rgsMode==="glide"){ const x=120+p*300; scene=drawWheel(x,gy-r,r,0,"#ff8a3d")+`<rect x="60" y="${gy}" width="480" height="8" fill="#9fd8ff" opacity=".8"/>`+`<line x1="120" y1="${gy-2}" x2="${x}" y2="${gy-2}" stroke="#ff8a3d" stroke-width="4"/>`+txt(300,215,"same tread patch (orange) drags over many points of the ice: one ↔ many",'text-anchor="middle"'); }
    else { const ang=p*720; scene=`<path d="M200,${gy} q100,-30 200,0 L400,${gy+8} L200,${gy+8} Z" fill="#5a4330"/>`+drawWheel(300,gy-r+6,r,ang,"#ff8a3d")+txt(300,215,"wheel turns in place: many points of tread ↔ the same point of ground",'text-anchor="middle"'); }
    el.innerHTML=`${seg("Motion",Object.keys(RGS).map(k=>[k,RGS[k].n]),rgsMode,"data-m")}<p class="note" style="margin:-4px 0 8px">tire analogy: ${m.tire}</p>
      ${svg(600,230,ARROW+scene)}<p><b>${m.n}.</b> ${m.def}</p><p class="note"><b>In a joint:</b> ${m.joint}</p>
      <p class="note">Real joint motion is a <b>combination</b>: bones rotate (osteokinematics), and at the articular surfaces that rotation is produced by roll + glide (+ spin). Which way the glide goes is the convex–concave rule, next tab.</p>`;
    el.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{ rgsMode=b.dataset.m; rgsT=0; renderRGS(); }); }
  function rgsTick(){ rgsT+=0.006; const el=$("#rgs"); if(!el||el.closest(".mpane").hidden) return; const s=el.querySelector("svg"); if(!s) return; /* cheap: re-render only the svg */
    const tmp=document.createElement("div"); renderRGSsvgOnly(tmp); s.outerHTML=tmp.innerHTML; }
  function renderRGSsvgOnly(tmp){ const r=46, gy=170, p=(rgsT%1); let scene="";
    if(rgsMode==="roll"){ const x=120+p*300; const ang=((x-120)/r)*180/Math.PI; scene=drawWheel(x,gy-r,r,ang,"#ff8a3d")+`<rect x="60" y="${gy}" width="480" height="8" fill="#6f86b3"/>`+[...Array(9)].map((_,i)=>`<circle cx="${100+i*50}" cy="${gy+4}" r="3" fill="${(100+i*50)<x?"#ff8a3d":"#394b78"}"/>`).join("")+txt(300,215,"contact point advances on BOTH surfaces: many ↔ many",'text-anchor="middle"'); }
    else if(rgsMode==="glide"){ const x=120+p*300; scene=drawWheel(x,gy-r,r,0,"#ff8a3d")+`<rect x="60" y="${gy}" width="480" height="8" fill="#9fd8ff" opacity=".8"/>`+`<line x1="120" y1="${gy-2}" x2="${x}" y2="${gy-2}" stroke="#ff8a3d" stroke-width="4"/>`+txt(300,215,"same tread patch (orange) drags over many points of the ice: one ↔ many",'text-anchor="middle"'); }
    else { const ang=p*720; scene=`<path d="M200,${gy} q100,-30 200,0 L400,${gy+8} L200,${gy+8} Z" fill="#5a4330"/>`+drawWheel(300,gy-r+6,r,ang,"#ff8a3d")+txt(300,215,"wheel turns in place: many points of tread ↔ the same point of ground",'text-anchor="middle"'); }
    tmp.innerHTML=svg(600,230,ARROW+scene); }

  /* ---------- shared UI: segmented toggle + play/pause animator ---------- */
  const seg=(label,opts,cur,attr)=>`<div class="seg"><span class="seglab">${label}</span>${opts.map(([v,t])=>`<button type="button" class="segbtn ${v===cur?"on":""}" ${attr}="${v}">${t}</button>`).join("")}</div>`;
  const playBtn=(id,on)=>`<button type="button" class="btn small play ${on?"on":""}" id="${id}" title="play / pause">${on?"❚❚ Pause":"▶ Play"}</button>`;
  function animator(getState,setValue,draw,min,max,speed){ let raf=null,last=0,dir=1;
    const step=(t)=>{ const st=getState(); if(!st.playing){ raf=null; return; } const dt=last?Math.min(0.05,(t-last)/1000):0; last=t; let v=st.value+dir*speed*dt; if(v>max){ v=max; dir=-1; } if(v<min){ v=min; dir=1; } setValue(v); draw(); raf=requestAnimationFrame(step); };
    return { toggle(){ const st=getState(); st.playing=!st.playing; last=0; if(st.playing&&!raf) raf=requestAnimationFrame(step); draw(true); }, stop(){ const st=getState(); st.playing=false; } }; }

  /* ---------- 2. convex–concave rule ---------- */
  let cc={mover:"convex",theta:35,glide:1,playing:false};
  function ccScene(){ const r=56; const th=rad(cc.theta); const dir=Math.sign(cc.theta)||1; let scene="";
    if(cc.mover==="convex"){ const cy=185; const shift=r*th*(1-cc.glide); const cx=300+shift; const plateauHalf=130;
      const plate=`<path d="M${300-plateauHalf},${cy+r} q0,-24 ${plateauHalf},-24 q${plateauHalf},0 ${plateauHalf},24 L${300+plateauHalf},${cy+r+60} L${300-plateauHalf},${cy+r+60} Z" fill="${BONE2}" stroke="#fff" stroke-width="1.5"/><path d="M${300-plateauHalf},${cy+r} q0,-24 ${plateauHalf},-24 q${plateauHalf},0 ${plateauHalf},24" fill="none" stroke="${CART}" stroke-width="5"/>`;
      const cond=`<g transform="translate(${cx},${cy}) rotate(${cc.theta})"><rect x="-22" y="-150" width="44" height="120" rx="12" fill="${BONE}" stroke="#fff" stroke-width="1.5"/><circle cx="0" cy="0" r="${r}" fill="${BONE}" stroke="#fff" stroke-width="1.5"/><path d="M${-r},0 a${r},${r} 0 0 0 ${2*r},0" fill="none" stroke="${CART}" stroke-width="5"/><circle cx="0" cy="${r-6}" r="5" fill="#ff8a3d"/><line x1="0" y1="0" x2="0" y2="${r}" stroke="#ff8a3d" stroke-width="2" stroke-dasharray="4 3"/></g>`;
      const contact=`<circle cx="${cx}" cy="${cy+r}" r="5" fill="#22d3ee"/>`;
      const roll=arrow(cx-dir*10,28,cx+dir*70,28,"#7cff6b",4)+txt(cx+dir*40,18,"roll (bone direction)",`text-anchor="middle" style="fill:#7cff6b"`);
      const gl=cc.glide>0?arrow(cx+dir*10,cy+r+16,cx-dir*70,cy+r+16,"#22d3ee",4)+txt(cx-dir*40,cy+r+36,"glide (opposite)",`text-anchor="middle" style="fill:#22d3ee"`):"";
      const off=Math.abs(shift)>plateauHalf-r*0.6;
      scene=plate+cond+contact+roll+gl+(off?txt(300,cy+r+52,"⚠ without enough glide the convex surface rolls off the plateau",'text-anchor="middle" style="fill:#ff5a5a"'):"");
    } else {
      const cy=225; const headX=300; const head=`<circle cx="${headX}" cy="${cy}" r="${r}" fill="${BONE2}" stroke="#fff" stroke-width="1.5"/><path d="M${headX-r},${cy} a${r},${r} 0 0 1 ${2*r},0" fill="none" stroke="${CART}" stroke-width="5"/><rect x="${headX-22}" y="${cy}" width="44" height="70" rx="12" fill="${BONE2}" stroke="#fff" stroke-width="1.5"/>`;
      const pivotX=cc.glide===1?headX:headX-dir*70*(1-cc.glide), pivotY=cc.glide===1?cy:cy-r;
      const cup=`<g transform="rotate(${cc.theta} ${pivotX} ${pivotY})"><path d="M${headX-85},${cy-r+6} q85,-46 170,0 L${headX+85},${cy-r-50} L${headX-85},${cy-r-50} Z" fill="${BONE}" stroke="#fff" stroke-width="1.5"/><path d="M${headX-85},${cy-r+6} q85,-46 170,0" fill="none" stroke="${CART}" stroke-width="5"/><rect x="${headX-22}" y="${cy-r-160}" width="44" height="115" rx="12" fill="${BONE}" stroke="#fff" stroke-width="1.5"/><circle cx="${headX}" cy="${cy-r-16}" r="5" fill="#ff8a3d"/></g>`;
      const roll=arrow(headX-dir*10,28,headX+dir*70,28,"#7cff6b",4)+txt(headX+dir*40,18,"roll (bone direction)",`text-anchor="middle" style="fill:#7cff6b"`);
      const gl=cc.glide>0?arrow(headX-dir*10,cy-r-30,headX+dir*70,cy-r-30,"#22d3ee",4)+txt(headX+dir*40,cy-r-40,"glide (same)",`text-anchor="middle" style="fill:#22d3ee"`):"";
      scene=head+cup+roll+gl+(cc.glide<1?txt(300,cy+r+40,"⚠ without glide the concave surface tips and loses congruence",'text-anchor="middle" style="fill:#ff5a5a"'):"");
    }
    return svg(600,320,ARROW+scene); }
  function ccVerdict(){ const th=rad(cc.theta); return cc.mover==="convex"?`<b>Convex surface moving</b> (femur on tibia in closed chain, humerus on glenoid, talus on tibia): roll and glide are in <b>opposite</b> directions. Pure roll would carry the centre r·θ = ${f(Math.abs(th),2)} r along the plateau; a glide of ${f(cc.glide*100,0)} % of that pulls it back ${cc.glide===1?"to rest over the socket.":"only part-way."}`:`<b>Concave surface moving</b> (tibia on femur in open chain, ulna on humerus, proximal phalanx on metacarpal head): roll and glide are in the <b>same</b> direction, so the moving bone and its slide travel together.`; }
  const ccAnim=animator(()=>({get playing(){return cc.playing;},set playing(v){cc.playing=v;},get value(){return cc.theta;}}),(v)=>{ cc.theta=v; },(full)=>{ if(full) renderCC(); else { const el=$("#ccrule"); const s=el.querySelector(".scene"); if(s) s.innerHTML=ccScene(); const b=el.querySelector("#ccthv"); if(b) b.textContent=f(cc.theta,0)+"°"; const sl=el.querySelector("#ccth"); if(sl) sl.value=Math.round(cc.theta); const v=el.querySelector(".verdict"); if(v) v.innerHTML=ccVerdict(); } },-60,60,40);
  function renderCC(){ const el=$("#ccrule");
    el.innerHTML=`${seg("Moving surface",[["convex","Convex (ball) moves"],["concave","Concave (socket) moves"]],cc.mover,"data-mv")}
      <div class="ctl"><label>Rotation of the moving bone <b id="ccthv">${f(cc.theta,0)}°</b><input type="range" id="ccth" min="-60" max="60" step="1" value="${Math.round(cc.theta)}"></label>
      <label>Glide supplied (100 % = healthy joint; 0 % = roll only) <b>${f(cc.glide*100,0)} %</b><input type="range" id="ccg" min="0" max="1" step="0.05" value="${cc.glide}"></label><div class="playrow">${playBtn("ccplay",cc.playing)}<span class="note">plays the rotation back and forth — set the glide to 0 % first to see the joint fail</span></div></div>
      <div class="scene">${ccScene()}</div><p class="verdict">${ccVerdict()}</p>
      <p class="note"><b>The rule:</b> <i>convex-on-concave → roll and glide opposite; concave-on-convex → roll and glide same direction.</i> The roll is always in the direction the bone is moving. Memory hook: the convex head has to slide <i>back</i> to stay in its socket, like keeping a ball centred in a cup while you tilt it. Orange dot: the point on the moving surface that started in contact; cyan: where contact actually is.</p>`;
    el.querySelectorAll("[data-mv]").forEach(b=>b.onclick=()=>{ cc.mover=b.dataset.mv; renderCC(); }); $("#ccth").oninput=(e)=>{ cc.theta=+e.target.value; ccAnim.stop(); renderCC(); }; $("#ccg").oninput=(e)=>{ cc.glide=+e.target.value; renderCC(); }; $("#ccplay").onclick=()=>ccAnim.toggle(); fixSubs(el); }

  /* ---------- 3. knee: open vs closed chain, screw-home, ligaments ---------- */
  let kn={chain:"open",flex:30,ghost:true,lig:true,playing:false};
  function kneeScene(){ const r=52; const fl=kn.flex; const th=rad(fl); const kx=300, ky=205; const d=1; /* lateral view of a RIGHT knee: anterior → right; flexion swings the moving bone posteriorly (to the left) */
    /* bones drawn as outlined thick strokes: robust cartoon shapes at any angle */
    const bone=(d,w,fill)=>`<path d="${d}" fill="none" stroke="#fff" stroke-width="${w+3}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const femur=(tf,op=1)=>`<g transform="${tf}" opacity="${op}">${bone("M-4,-158 Q-12,-100 -6,-62",34,BONE)}<circle cx="16" cy="-24" r="${r*0.72}" fill="${BONE}" stroke="#fff" stroke-width="1.5"/><circle r="${r}" fill="${BONE}" stroke="#fff" stroke-width="1.5"/><circle cx="2" cy="-40" r="${r*0.55}" fill="${BONE}"/><path d="M${-r*0.94},${-r*0.34} A${r},${r} 0 1 0 ${r*0.94},${-r*0.34}" fill="none" stroke="${CART}" stroke-width="5"/></g>`;
    const tibia=(tf,op=1)=>`<g transform="${tf}" opacity="${op}">${bone(`M-30,${r+26} L-36,${r+150}`,9,BONE2)}<path d="M-60,${r+2} q60,-14 120,0 L56,${r+22} q-56,10 -112,0 Z" fill="${BONE2}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>${bone(`M-4,${r+20} L0,${r+80} L-4,${r+152}`,30,BONE2)}<circle cx="20" cy="${r+44}" r="9" fill="${BONE2}" stroke="#fff" stroke-width="1.2"/><path d="M-60,${r+2} q60,-14 120,0" fill="none" stroke="${CART}" stroke-width="5"/></g>`;
    let scene="", arrows=""; const ligOn=kn.lig; const ext=Math.max(0,Math.min(1,(30-fl)/30)); /* ACL taut near extension */ const flx=Math.max(0,Math.min(1,(fl-30)/60)); /* PCL taut in flexion */
    const lig=(x1,y1,x2,y2,c,t,name)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${3+3*t}" stroke-linecap="round" opacity="${0.35+0.65*t}"/>`+txt((x1+x2)/2+(name==="ACL"?14:-14),(y1+y2)/2,name,`text-anchor="${name==="ACL"?"start":"end"}" style="fill:${c};opacity:${0.5+0.5*t}"`);
    if(kn.chain==="open"){
      const T=`translate(${kx},${ky}) rotate(${fl})`;
      const ghost=(kn.ghost&&fl>8)?tibia(`translate(${kx},${ky}) rotate(${fl}) translate(${r*th},0)`,0.28)+txt(16,30,"faded = roll-only: the tibia would ride forward, contact slipping to the back of the plateau",'style="fill:#ff5a5a"'):"";
      /* ligaments in the femur frame: ACL from posterior femur (intercondylar) to anterior tibial plateau; PCL the reverse */
      const tp=(x,y)=>{ const c=Math.cos(th),s=Math.sin(th); return [kx+c*x-s*y, ky+s*x+c*y]; }; const aclT=tp(26,r-6), pclT=tp(-30,r+2);
      const ligs=ligOn?lig(kx-14,ky-10,aclT[0],aclT[1],"#ffd23f",ext,"ACL")+lig(kx+10,ky-6,pclT[0],pclT[1],"#ff8a3d",flx,"PCL"):"";
      scene=ghost+femur(`translate(${kx},${ky})`)+ligs+tibia(T)+`<circle cx="${kx+r*Math.sin(th)}" cy="${ky+r*Math.cos(th)}" r="5" fill="#22d3ee"/>`;
      arrows=arrow(kx+d*30,ky+r+128,kx-d*60,ky+r+128,"#7cff6b",4)+txt(kx-d*15,ky+r+150,"tibia rolls "+(fl>0?"posterior":"—"),`text-anchor="middle" style="fill:#7cff6b"`)
        +arrow(kx+d*30,ky+r+26,kx-d*60,ky+r+26,"#22d3ee",4)+txt(kx-d*15,ky+r+48,"glides posterior (same direction)",`text-anchor="middle" style="fill:#22d3ee"`);
    } else {
      const ghost=(kn.ghost&&fl>8)?femur(`translate(${kx-r*th},${ky}) rotate(${-fl})`,0.28)+txt(16,405,"faded = roll-only: the femur would roll off the back of the tibia",'style="fill:#ff5a5a"'):"";
      const fp=(x,y)=>{ const c=Math.cos(-th),s=Math.sin(-th); return [kx+c*x-s*y, ky+s*x+c*y]; }; const aclF=fp(-14,-10), pclF=fp(10,-6);
      const ligs=ligOn?lig(aclF[0],aclF[1],kx+26,ky+r-6,"#ffd23f",ext,"ACL")+lig(pclF[0],pclF[1],kx-30,ky+r+2,"#ff8a3d",flx,"PCL"):"";
      scene=ghost+tibia(`translate(${kx},${ky})`)+ligs+femur(`translate(${kx},${ky}) rotate(${-fl})`)+`<circle cx="${kx}" cy="${ky+r}" r="5" fill="#22d3ee"/>`;
      arrows=arrow(kx+d*30,26,kx-d*60,26,"#7cff6b",4)+txt(kx-d*15,16,"femur rolls "+(fl>0?"posterior":"—"),`text-anchor="middle" style="fill:#7cff6b"`)
        +arrow(kx-d*30,ky+r+26,kx+d*60,ky+r+26,"#22d3ee",4)+txt(kx+d*15,ky+r+48,"glides anterior (opposite direction)",`text-anchor="middle" style="fill:#22d3ee"`);
    }
    const sh=Math.max(0,Math.min(1,(20-fl)/20)); const shDeg=10*sh; const inset=`<g transform="translate(505,80)"><circle r="40" fill="#101a33" stroke="#2c4274"/><ellipse rx="26" ry="18" fill="${BONE2}" stroke="#fff" transform="rotate(${kn.chain==="open"?shDeg:0})"/><ellipse rx="22" ry="14" fill="none" stroke="#ffd23f" stroke-width="2" stroke-dasharray="4 3" transform="rotate(${kn.chain==="open"?0:-shDeg})"/><text y="-50" class="mlab" text-anchor="middle">top view · screw-home</text><text y="58" class="mlab" text-anchor="middle" style="fill:#ffd23f">${f(shDeg,0)}° ${kn.chain==="open"?"tibial external":"femoral internal"} rotation</text></g>`;
    return svg(600,420,ARROW+`<text x="590" y="412" class="mlab dim" text-anchor="end">anterior →</text><text x="10" y="412" class="mlab dim">lateral view · right knee</text>`+scene+arrows+inset); }
  function kneeStatus(){ const fl=kn.flex; const open=kn.chain==="open"; const phase=fl<30?"near extension":fl>60?"deep flexion":"mid-range";
    const stab=fl<30?"<b style='color:#ffd23f'>ACL</b> is the primary stabiliser near extension (resists anterior tibial / posterior femoral glide)":fl>60?"<b style='color:#ff8a3d'>PCL</b> is the primary stabiliser in flexion (resists posterior tibial / anterior femoral glide)":"load is shared; ACL tension falls and PCL tension rises as the knee bends";
    return `<div class="ro"><span>At ${f(fl,0)}° (${phase})</span><b style="font-family:inherit;font-weight:500">${open?"concave tibia on fixed femur — roll and glide both posterior in flexion":"convex femur on fixed tibia — roll posterior, glide anterior in flexion"} · ${stab}</b></div>`; }
  const knAnim=animator(()=>({get playing(){return kn.playing;},set playing(v){kn.playing=v;},get value(){return kn.flex;}}),(v)=>{ kn.flex=v; },(full)=>{ if(full) renderKnee(); else { const el=$("#knee"); const s=el.querySelector(".scene"); if(s) s.innerHTML=kneeScene(); const b=el.querySelector("#knflv"); if(b) b.textContent=f(kn.flex,0)+"° · included angle "+f(180-kn.flex,0)+"°"; const sl=el.querySelector("#knfl"); if(sl) sl.value=Math.round(kn.flex); const st=el.querySelector(".status"); if(st) st.innerHTML=kneeStatus(); } },0,120,45);
  function renderKnee(){ const el=$("#knee");
    el.innerHTML=`${seg("Which bone moves?",[["open","Open chain · tibia swings (seated leg extension / curl)"],["closed","Closed chain · femur moves on a planted tibia (squat)"]],kn.chain,"data-ch")}
      <div class="ctl"><label>Knee flexion (anatomical angle) <b id="knflv">${f(kn.flex,0)}° · included angle ${f(180-kn.flex,0)}°</b><input type="range" id="knfl" min="0" max="120" step="1" value="${Math.round(kn.flex)}"></label>
      <div class="playrow">${playBtn("knplay",kn.playing)}<label class="chk"><input type="checkbox" id="knghost" ${kn.ghost?"checked":""}> roll-only ghost</label><label class="chk"><input type="checkbox" id="knlig" ${kn.lig?"checked":""}> ACL / PCL</label></div></div>
      <div class="scene">${kneeScene()}</div><div class="status">${kneeStatus()}</div>
      <p>${kn.chain==="open"?"<b>Open chain</b> (foot free): the <b>concave</b> tibial plateau moves on the fixed convex femoral condyles → roll and glide in the <b>same</b> direction. Flexion (leg curl): tibia rolls and glides posteriorly; extension (leg extension): anteriorly.":"<b>Closed chain</b> (foot planted): the <b>convex</b> femoral condyles move on the fixed concave tibia → roll and glide in <b>opposite</b> directions. Squat descent: femur rolls posteriorly and glides anteriorly; ascent: rolls anteriorly, glides posteriorly."} The cyan dot is the contact point; the faded bone shows what pure rolling would do.</p>
      <details class="osim"><summary><b>Knee arthrokinematics at a glance</b> <span class="note">(from the ME 320 OKC/CKC handout)</span></summary>
      <table class="mini"><thead><tr><th></th><th>CKC flexion<br><span class="note">squat descent</span></th><th>CKC extension<br><span class="note">squat ascent</span></th><th>OKC flexion<br><span class="note">leg curl</span></th><th>OKC extension<br><span class="note">leg extension</span></th></tr></thead><tbody>
      <tr><td>Moving segment</td><td>convex femur</td><td>convex femur</td><td>concave tibia</td><td>concave tibia</td></tr>
      <tr><td>Roll</td><td>posterior</td><td>anterior</td><td>posterior</td><td>anterior</td></tr>
      <tr><td>Glide</td><td>anterior</td><td>posterior</td><td>posterior</td><td>anterior</td></tr>
      <tr><td>Spin (screw-home)</td><td>femur ER, first 10°</td><td>femur IR, last 10°</td><td>tibia IR, first 10°</td><td>tibia ER, last 10°</td></tr>
      <tr><td>Primary stabiliser</td><td>PCL</td><td>ACL</td><td>PCL</td><td>ACL</td></tr>
      <tr><td>Ligament most loaded</td><td>as flexion deepens</td><td>near full extension</td><td>as the knee bends</td><td>0–30° of flexion</td></tr></tbody></table>
      <p class="note">ACL resists anterior tibial glide, is protected by the hamstrings, and is most stressed by terminal open-chain extension. PCL resists posterior tibial glide, is protected by the quadriceps, and is most stressed by open-chain flexion (leg curls). The same logic gives the ankle and subtalar tables in the handout: talus convex in the mortise (OKC dorsiflexion → talus rolls anterior, glides posterior), talus concave on the convex calcaneus posterior facet.</p></details>
      <p class="note"><b>Screw-home mechanism.</b> The medial femoral condyle's articular surface is longer than the lateral one, so in the final ≈ 20° of extension the joint rotates ≈ 10° (tibia externally in open chain, femur internally in closed chain) to lock. The popliteus muscle unlocks it. Slide the flexion toward 0° and watch the inset.</p>`;
    el.querySelectorAll("[data-ch]").forEach(b=>b.onclick=()=>{ kn.chain=b.dataset.ch; renderKnee(); }); $("#knfl").oninput=(e)=>{ kn.flex=+e.target.value; knAnim.stop(); renderKnee(); }; $("#knghost").onchange=(e)=>{ kn.ghost=e.target.checked; renderKnee(); }; $("#knlig").onchange=(e)=>{ kn.lig=e.target.checked; renderKnee(); }; $("#knplay").onclick=()=>knAnim.toggle(); fixSubs(el); }

  /* ---------- 4. included vs anatomical angle ---------- */
  let ang={inc:135};
  function renderAng(){ const el=$("#angles"); const inc=ang.inc; const anat=180-inc; const sx=300, sy=50; const L=120;
    /* upper arm fixed, hanging down. forearm rotates about the elbow; included angle measured between the long axes */
    const ex=sx, ey=sy+L; const t=rad(anat); /* forearm direction measured from the anatomical (straight-down) reference, anterior = right */
    const fx=ex+L*Math.sin(t), fy=ey+L*Math.cos(t); /* inc=180 → straight down (anatomical 0); inc=90 → horizontal forward */
    const upper=`<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="${BONE}" stroke-width="22" stroke-linecap="round"/>`;
    const fore=`<line x1="${ex}" y1="${ey}" x2="${fx}" y2="${fy}" stroke="${BONE2}" stroke-width="18" stroke-linecap="round"/>`;
    const arcR=60; const a0=90, a1=90-inc; /* angle for svg arc: upward direction is -90 */
    const arcPath=(r,aStart,aEnd,col,dash="")=>{ const p=(a)=>[ex+r*Math.cos(rad(a)),ey+r*Math.sin(rad(a))]; const [x0,y0]=p(aStart),[x1,y1]=p(aEnd); const big=Math.abs(aEnd-aStart)>180?1:0; const sweep=aEnd>aStart?1:0; return `<path d="M${x0},${y0} A${r},${r} 0 ${big} ${sweep} ${x1},${y1}" fill="none" stroke="${col}" stroke-width="3" ${dash?`stroke-dasharray="${dash}"`:""}/>`; };
    /* upper arm axis proximal direction from elbow = -90° (up). forearm direction angle (svg) = 90 - inc ... compute directly */
    const foreA=Math.atan2(fy-ey,fx-ex)*180/Math.PI; const upA=-90; const downA=90;
    const incArc=arcPath(arcR,upA,foreA,"#ffd23f"); const anatArc=arcPath(arcR+22,downA,foreA,"#22d3ee","5 4");
    const ref=`<line x1="${ex}" y1="${ey}" x2="${ex}" y2="${ey+L}" stroke="#22d3ee" stroke-width="2" stroke-dasharray="6 5" opacity=".8"/>`;
    el.innerHTML=`<div class="ctl"><label>Move the forearm · included angle <b>${inc}°</b><input type="range" id="anginc" min="30" max="195" step="1" value="${inc}"></label></div>
      ${svg(600,330,ARROW+ref+upper+fore+incArc+anatArc+`<circle cx="${ex}" cy="${ey}" r="7" fill="#ff8a3d"/>`+txt(ex+110,ey-60,`included = ${inc}°`,'style="fill:#ffd23f"')+txt(ex+110,ey+L-6,`anatomical = ${anat>=0?"+":""}${anat}° ${anat<0?"(hyperextension)":anat===0?"(anatomical position)":"of flexion"}`,'style="fill:#22d3ee"')+txt(ex-20,ey+L+16,"dashed = anatomical position",'text-anchor="end" class="mlab dim"')+txt(590,318,"anterior →",'text-anchor="end" class="mlab dim"'))}
      <div class="two"><div class="ro"><span>Included angle (between the two long axes; always positive, no direction)</span><b>${inc}°</b></div><div class="ro"><span>Anatomical angle (moved from anatomical position; <i>keep the sign</i>)</span><b>${anat>=0?"+":""}${anat}°</b></div></div>
      <p class="note"><b>Relative angles</b> describe one bone relative to another. The <b>included</b> angle is what a goniometer reads directly; the <b>anatomical</b> angle is clinical ("45° of flexion"). They always sum to 180° in a single plane: anatomical = 180° − included. Joint rotation refers to motion of the <i>distal</i> segment even when it is the proximal one that physically moves. <b>Absolute</b> angles, by contrast, are measured from a fixed global direction (e.g. the vertical) and are used for segment angles in motion capture.</p>`;
    $("#anginc").oninput=(e)=>{ ang.inc=+e.target.value; renderAng(); }; }

  /* ---------- 5. mobilization planner (3-step workflow from Lecture 9) ---------- */
  /* directions follow the convex–concave rule as taught; roll is in the direction of bone motion */
  const JOINTS={
    gh:{n:"Glenohumeral (shoulder)",mover:"humeral head",shape:"convex",fixed:"glenoid fossa",chain:"open",motions:{"flexion":["anterior","posterior"],"extension":["posterior","anterior"],"abduction":["superior","inferior"],"external rotation":["posterior","anterior"],"internal rotation":["anterior","posterior"]}},
    hip:{n:"Hip (femoroacetabular)",mover:"femoral head",shape:"convex",fixed:"acetabulum",chain:"open",motions:{"flexion":["anterior","posterior"],"extension":["posterior","anterior"],"abduction":["superior","inferior"],"external rotation":["posterior","anterior"],"internal rotation":["anterior","posterior"]}},
    kneeO:{n:"Knee · open chain (tibia moves)",mover:"tibial plateau",shape:"concave",fixed:"femoral condyles",chain:"open",motions:{"flexion":["posterior","posterior"],"extension":["anterior","anterior"]}},
    kneeC:{n:"Knee · closed chain (femur moves)",mover:"femoral condyles",shape:"convex",fixed:"tibial plateau",chain:"closed",motions:{"flexion":["posterior","anterior"],"extension":["anterior","posterior"]}},
    ankle:{n:"Talocrural (ankle) · open chain",mover:"talar dome",shape:"convex",fixed:"tibiofibular mortise",chain:"open",motions:{"dorsiflexion":["anterior","posterior"],"plantarflexion":["posterior","anterior"]}},
    hu:{n:"Humeroulnar (elbow)",mover:"trochlear notch of the ulna",shape:"concave",fixed:"humeral trochlea",chain:"open",motions:{"flexion":["anterior","anterior"],"extension":["posterior","posterior"]}},
    rc:{n:"Radiocarpal (wrist)",mover:"proximal carpal row",shape:"convex",fixed:"distal radius",chain:"open",motions:{"flexion":["palmar","dorsal"],"extension":["dorsal","palmar"],"radial deviation":["radial","ulnar"],"ulnar deviation":["ulnar","radial"]}},
    mcp:{n:"Metacarpophalangeal (knuckle)",mover:"base of the proximal phalanx",shape:"concave",fixed:"metacarpal head",chain:"open",motions:{"flexion":["palmar","palmar"],"extension":["dorsal","dorsal"]}}
  };
  let mp={j:"gh",m:"extension"};
  function renderMob(){ const el=$("#mob"); const J=JOINTS[mp.j]; if(!J.motions[mp.m]) mp.m=Object.keys(J.motions)[0]; const [roll,slide]=J.motions[mp.m]; const same=roll===slide;
    el.innerHTML=`<div class="two"><label class="note">Joint<select id="mpj">${Object.keys(JOINTS).map(k=>`<option value="${k}" ${k===mp.j?"selected":""}>${JOINTS[k].n}</option>`).join("")}</select></label>
      <label class="note">Osteokinematic motion you want to improve<select id="mpm">${Object.keys(J.motions).map(k=>`<option value="${k}" ${k===mp.m?"selected":""}>${k}</option>`).join("")}</select></label></div>
      <ol class="steps" style="margin-top:12px"><li><div class="step-title">Identify the mobile component on the static component</div><div class="step-body"><div class="eq">${J.mover} (<b>${J.shape}</b>) moves on the ${J.fixed} (${J.shape==="convex"?"concave":"convex"}) · ${J.chain} chain</div></div></li>
      <li><div class="step-title">Directions of roll and slide</div><div class="step-body"><div class="eq">Roll follows the bone → <b style="color:#7cff6b">${roll}</b>. ${J.shape==="convex"?"Convex-on-concave → slide OPPOSITE":"Concave-on-convex → slide SAME"} → <b style="color:#22d3ee">${slide}</b></div></div></li>
      <li><div class="step-title">Mobilize in the direction of the slide</div><div class="step-body"><div class="eq">Apply a <b style="color:#ffd23f">${slide}</b> glide of the ${J.mover} to restore ${mp.m}.</div><div class="note">Stretching lengthens the muscle–tendon complex, but an intra-articular restriction (a lost glide) will not improve until the glide is restored.</div></div></li></ol>
      ${svg(600,120,ARROW+`<rect x="40" y="40" width="520" height="40" rx="8" fill="#1b2748" stroke="#2c4274"/><text x="50" y="65" class="mlab dim">moving bone · arrows show the relative sense of roll and slide</text>`+arrow(300,30,same?420:420,30,"#7cff6b",4)+txt(300,22,"roll: "+roll,'style="fill:#7cff6b"')+arrow(300,100,same?420:180,100,"#22d3ee",4)+txt(300,116,"slide: "+slide+(same?" (same)":" (opposite)"),'style="fill:#22d3ee"'))}
      <p class="note">Directions are given in the standard clinical convention for the open-chain mover (Kaltenborn / Neumann). Rotations are described by the motion of the anterior aspect of the moving bone. Class examples: shoulder extension → roll posterior, slide anterior, <b>mobilize anterior</b>; open-chain ankle dorsiflexion → roll anterior, slide posterior, <b>mobilize posterior</b>.</p>`;
    $("#mpj").onchange=(e)=>{ mp.j=e.target.value; renderMob(); }; $("#mpm").onchange=(e)=>{ mp.m=e.target.value; renderMob(); }; }

  /* ---------- 6. drills ---------- */
  const DR=(()=>{ const KEY="dpl-biomech-arthro"; let St={done:0,correct:0,streak:0,best:0}; try{ Object.assign(St,JSON.parse(localStorage.getItem(KEY))||{}); }catch(e){} const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(St)); }catch(e){} };
    const pick=(a)=>a[Math.floor(Math.random()*a.length)]; const shuffle=(a)=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
    const DIRS=["anterior","posterior","superior","inferior","palmar","dorsal","radial","ulnar"];
    const opp={anterior:"posterior",posterior:"anterior",superior:"inferior",inferior:"superior",palmar:"dorsal",dorsal:"palmar",radial:"ulnar",ulnar:"radial"};
    const jointQ=()=>{ const k=pick(Object.keys(JOINTS)); const J=JOINTS[k]; const m=pick(Object.keys(J.motions)); const [roll,slide]=J.motions[m]; const which=Math.random()<0.5;
      if(which) return {q:`${J.n}: during ${m}, the ${J.mover} (${J.shape}) rolls ${roll}. In which direction does it slide?`,opts:shuffle([slide,opp[slide],...shuffle(DIRS.filter(d=>d!==slide&&d!==opp[slide])).slice(0,2)]),ans:slide,why:`${J.shape==="convex"?"Convex-on-concave: slide opposite to the roll.":"Concave-on-convex: slide in the same direction as the roll."} So the slide is ${slide}.`};
      return {q:`A patient lacks ${m} at the ${J.n.toLowerCase()}. Using the 3-step workflow, which direction should the ${J.mover} be mobilized?`,opts:shuffle([slide,opp[slide],...shuffle(DIRS.filter(d=>d!==slide&&d!==opp[slide])).slice(0,2)]),ans:slide,why:`Mobilize in the direction of the slide: roll ${roll} → slide ${slide} (${J.shape} mover) → mobilize ${slide}.`}; };
    const angQ=()=>{ const inc=pick([120,135,150,165,90,110,170,185]); const an=180-inc; return {q:`A goniometer reads an included angle of ${inc}° at the knee. What is the anatomical angle?`,opts:shuffle([`${an>=0?"+":""}${an}°`,`${inc}°`,`${an>=0?"+":""}${an+10}°`,`${-an}°`]),ans:`${an>=0?"+":""}${an}°`,why:`anatomical = 180° − included = ${an}°${an<0?" (hyperextension: keep the sign)":""}.`}; };
    const Q=[jointQ,jointQ,jointQ,angQ,
      ()=>({q:"A tire rolling down the road is the analogy for…",opts:["roll","glide / slide","spin","none of these"],ans:"roll",why:"Many points contact many points."}),
      ()=>({q:"A locked tire skidding on ice is the analogy for…",opts:["glide / slide","roll","spin","circumduction"],ans:"glide / slide",why:"The same point on the mover contacts many points on the fixed surface."}),
      ()=>({q:"A wheel spinning in a pothole is the analogy for…",opts:["spin","roll","glide / slide","translation"],ans:"spin",why:"Many points of the mover contact the same point of the fixed surface."}),
      ()=>({q:"Osteokinematics describes…",opts:shuffle(["gross movement of bones (flexion, abduction, rotation)","movement between joint surfaces (roll, glide, spin)","muscle fiber shortening","ligament strain"]),ans:"gross movement of bones (flexion, abduction, rotation)",why:"Osteo = bone. Arthro = joint: roll, glide, spin at the articular surfaces."}),
      ()=>({q:"Complete the rule: when a CONVEX joint surface moves, roll and glide occur in…",opts:["opposite directions","the same direction","perpendicular directions","no fixed relation"],ans:"opposite directions",why:"The convex head must glide back to stay centred in the socket."}),
      ()=>({q:"Complete the rule: when a CONCAVE joint surface moves, roll and glide occur in…",opts:["the same direction","opposite directions","perpendicular directions","no fixed relation"],ans:"the same direction",why:"The concave surface travels with its roll."}),
      ()=>({q:"Which joint is more stable but has less range of motion?",opts:["hip (deep acetabulum, many ligaments)","shoulder (shallow glenoid, few ligaments)","they are equal","depends on the plane"],ans:"hip (deep acetabulum, many ligaments)",why:"Deep congruent fit + vast ligaments: stability traded for mobility. The shoulder is the reverse."}),
      ()=>({q:"Without glide, a convex surface rolling on a concave one would…",opts:shuffle(["roll right off the joint surface","stay perfectly centred","spin in place","increase its contact area"]),ans:"roll right off the joint surface",why:"Pure roll translates the centre by r·θ; the glide cancels that translation."}),
      ()=>({q:"The screw-home mechanism at terminal knee extension is about…",opts:shuffle(["≈ 10° of rotation to lock the knee, from unequal condyle lengths","≈ 45° of rotation","a posterior glide of the patella","hamstring stretch"]),ans:"≈ 10° of rotation to lock the knee, from unequal condyle lengths",why:"Tibia externally rotates (open chain) / femur internally rotates (closed chain); popliteus unlocks."}),
      ()=>({q:"A patient's limited shoulder flexion is caused by a restricted glenohumeral glide. Stretching the muscle–tendon complex will…",opts:shuffle(["improve extensibility but may not restore ROM — the glide must be mobilized","fully restore ROM","make the glide worse","change the convex–concave rule"]),ans:"improve extensibility but may not restore ROM — the glide must be mobilized",why:"Intra-articular restriction needs joint mobilization in the direction of the slide."}),
      ()=>({q:"In the mobilization workflow, step 3 says to mobilize…",opts:shuffle(["in the same direction as the slide","in the same direction as the roll","opposite to the slide","perpendicular to the joint plane"]),ans:"in the same direction as the slide",why:"Steps: (1) identify mover on static component; (2) roll and slide directions; (3) mobilize with the slide."}),
      ()=>({q:"Closed-chain knee flexion (squat): the femoral condyles…",opts:shuffle(["roll posteriorly and glide anteriorly","roll and glide posteriorly","roll anteriorly and glide posteriorly","spin only"]),ans:"roll posteriorly and glide anteriorly",why:"Convex femur moving on fixed tibia → opposite directions."}),
      ()=>({q:"Open-chain knee extension (seated kick): the tibial plateau…",opts:shuffle(["rolls and glides anteriorly","rolls anteriorly and glides posteriorly","rolls and glides posteriorly","spins medially"]),ans:"rolls and glides anteriorly",why:"Concave tibia moving on fixed femur → same direction."})];
    let cur=null; function next(){ cur=pick(Q)(); const el=$("#adrill"); el.innerHTML=`<div class="dq">${cur.q}</div><div class="dopts">${cur.opts.map(o=>`<button type="button" class="btn dopt" data-o="${o.replace(/"/g,"&quot;")}">${o}</button>`).join("")}</div><div class="dfb" id="adfb"></div><div class="dstat">Answered ${St.done} · correct ${St.correct} · streak ${St.streak} (best ${St.best})</div>`; el.querySelectorAll(".dopt").forEach(b=>b.onclick=()=>answer(b.dataset.o,b)); fixSubs(el); }
    function answer(o,b){ const ok=o===cur.ans; St.done++; if(ok){ St.correct++; St.streak++; St.best=Math.max(St.best,St.streak); } else St.streak=0; save(); $("#adrill").querySelectorAll(".dopt").forEach(x=>{ x.disabled=true; if(x.dataset.o===cur.ans) x.classList.add("good"); else if(x===b&&!ok) x.classList.add("bad"); }); $("#adfb").innerHTML=`<p class="${ok?"fb good":"fb bad"}">${ok?"Correct.":"Not quite — the answer is <b>"+cur.ans+"</b>."} ${cur.why}</p><button type="button" class="btn primary small" id="adnext">Next question →</button>`; $("#adnext").onclick=next; const ds=$("#adrill .dstat"); if(ds) ds.textContent=`Answered ${St.done} · correct ${St.correct} · streak ${St.streak} (best ${St.best})`; if(typeof GAME!=="undefined"&&ok) GAME.addXP(10,St.streak>1?`+10 XP · ${St.streak} in a row`:"+10 XP"); }
    return {next}; })();

  function init(){ renderRGS(); renderCC(); renderKnee(); renderAng(); renderMob();
    document.querySelectorAll("#mtabs .tabbtn").forEach(b=>b.onclick=()=>{ document.querySelectorAll("#mtabs .tabbtn").forEach(x=>x.classList.toggle("on",x===b)); document.querySelectorAll(".mpane").forEach(p=>p.hidden=p.id!==b.dataset.k); });
    rgsTimer=setInterval(rgsTick,40);
    $("#adrillstart").onclick=()=>{ DR.next(); $("#adrillstart").textContent="Skip →"; }; }
  return {init,JOINTS,get:()=>({kn,ang,mp,cc})};
})();
AL.init();
