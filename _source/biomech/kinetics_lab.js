/* ===================== JOINT KINETICS LAB =====================
   Tabs: elbow torque lab (external vs muscle moment arm, EMA) · biceps vector resolution · strength curves · patellofemoral
   compression · ground reaction force plate (squat, countermovement jump, impulse) · load types & fracture patterns · drills.
   Source: ME 320 Lecture 10 (Dr. Walck); Dempster segment data via Winter; Hill 1938.                                    */
const KL=(()=>{
  const $=(s)=>document.querySelector(s); const f=(x,d=2)=>isFinite(x)?(+x).toFixed(d):"—"; const rad=(d)=>d*Math.PI/180; const g=9.81;
  let svgN=0; const svg=(w,h,inner,cls="")=>{ const uid="k"+(svgN++); return `<svg viewBox="0 0 ${w} ${h}" class="mlsvg ${cls}" preserveAspectRatio="xMidYMid meet">${inner.split("@@").join(uid)}</svg>`; };
  const MK={"#7cff6b":"ahg","#22d3ee":"ahc","#ffd23f":"ahy","#ff8a3d":"aho","#ff5a5a":"ahr","#b58cff":"ahp"};
  const ARROW=`<defs>${Object.entries(MK).map(([c,id])=>`<marker id="${id}@@" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join("")}</defs>`;
  const arrow=(x1,y1,x2,y2,col,w=3,dash="")=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" marker-end="url(#${MK[col]||"ahc"}@@)" ${dash?`stroke-dasharray="${dash}"`:""}/>`;
  const txt=(x,y,s,o="")=>`<text x="${x}" y="${y}" class="mlab" ${o}>${s}</text>`;
  const BONE="#e8e2d2";

  /* ---------- 1. elbow torque lab ---------- */
  let eb={inc:90,m:8,l:0.30,M:70,rb:0.04,muscle:"biceps"};
  const rbOf=(inc,r0)=>r0*(0.75+0.25*Math.sin(rad(inc)));                 /* muscle moment arm varies little with angle */
  function elbowCalc(o){ const th=rad(o.inc); const mf=0.016*o.M, lcm=0.43*o.l*1.0; /* forearm (Dempster): 0.016 M, COM 0.43 L */
    const dExt=o.l*Math.sin(th), dF=lcm*Math.sin(th); const Mext=o.m*g*dExt+mf*g*dF; const rb=o.muscle==="biceps"?rbOf(o.inc,o.rb):0.06*(0.6+0.4*Math.sin(th)); /* brachioradialis: long muscle, line of action nearly along the forearm, moment arm ≈ 5–6 cm */
    const Fm=Mext/rb; const EMA=rb/dExt; /* muscle line of action: from insertion to origin on the humerus — angle with forearm ≈ included angle for biceps; small for brachioradialis */
    const ang=o.muscle==="biceps"?th:Math.atan2(rb,0.75*o.l); const Frot=Fm*Math.sin(ang), Fstab=Fm*Math.cos(ang);
    const Rjy=Fm*Math.sin(ang)-(o.m+mf)*g; const Rjx=-Fstab; return {mf,lcm,dExt,dF,Mext,rb,Fm,EMA,ang,Frot,Fstab,Rjx,Rjy}; }
  function renderElbow(){ const el=$("#elbow"); const r=elbowCalc(eb); const th=rad(eb.inc);
    const ex=220,ey=300; const S=950; /* forearm hangs from the elbow at the included angle from the (vertical, upward) humerus */
    const hx=ex, hy=ey-0.26*S; const fx=ex+eb.l*S*Math.sin(th), fy=ey+eb.l*S*Math.cos(th);
    const ins=0.05, ix=ex+ins*S*Math.sin(th), iy=ey+ins*S*Math.cos(th); const ox=ex, oy=ey-0.24*S;
    const scene=`<line x1="${ex}" y1="${hy}" x2="${ex}" y2="${ey}" stroke="${BONE}" stroke-width="20" stroke-linecap="round"/><line x1="${ex}" y1="${ey}" x2="${fx}" y2="${fy}" stroke="#cfc6b0" stroke-width="16" stroke-linecap="round"/><circle cx="${ex}" cy="${ey}" r="8" fill="#ff8a3d"/>
      <circle cx="${fx}" cy="${fy}" r="${8+eb.m*1.2}" fill="#394b78" stroke="#9fb3e6" stroke-width="3"/>
      ${eb.muscle==="biceps"?`<line x1="${ox}" y1="${oy}" x2="${ix}" y2="${iy}" stroke="#b8413a" stroke-width="12" stroke-linecap="round" opacity=".9"/>`:`<line x1="${ex-0.01*S}" y1="${ey-0.04*S}" x2="${ex+0.9*eb.l*S*Math.sin(th)}" y2="${ey+0.9*eb.l*S*Math.cos(th)}" stroke="#b8413a" stroke-width="9" stroke-linecap="round" opacity=".9"/>`}
      ${arrow(fx,fy,fx,fy+Math.min(120,eb.m*g*0.5),"#ffd23f",3)}${txt(fx+10,fy+30,`W = ${f(eb.m*g,0)} N`,'style="fill:#ffd23f"')}
      <line x1="${ex}" y1="${fy}" x2="${fx}" y2="${fy}" stroke="#22d3ee" stroke-width="2" stroke-dasharray="5 4"/><line x1="${ex}" y1="${ey}" x2="${ex}" y2="${fy}" stroke="#22d3ee" stroke-width="1" stroke-dasharray="2 4" opacity=".6"/>${txt((ex+fx)/2,fy+16,`external moment arm d = l·sinθ = ${f(r.dExt*100,1)} cm`,'text-anchor="middle" style="fill:#22d3ee"')}
      ${arrow(ix,iy,ix+(ox-ix)*0.5,iy+(oy-iy)*0.5,"#ff5a5a",4)}${txt(ix+14,iy-6,`F_m = ${f(r.Fm,0)} N`,'style="fill:#ff5a5a"')}
      <path d="M${ex},${ey-40} A40,40 0 0 ${th>0?1:0} ${ex+40*Math.sin(th)},${ey+40*Math.cos(th)}" fill="none" stroke="#ffd23f" stroke-width="2"/>${txt(ex+52*Math.sin(th/2)+6,ey-52*Math.cos(th/2)+4,`θ = ${eb.inc}°`,'style="fill:#ffd23f"')}`;
    el.innerHTML=`<div class="hierbar"><button type="button" class="tabbtn ${eb.muscle==="biceps"?"on":""}" data-mus="biceps">Biceps brachii</button><button type="button" class="tabbtn ${eb.muscle==="brd"?"on":""}" data-mus="brd">Brachioradialis</button><span class="note">pick the flexor doing the work</span></div>
      <div class="two"><div class="ctl">
        <label>Elbow included angle θ (180° = straight) <b>${eb.inc}°</b><input type="range" data-k="inc" min="20" max="175" step="1" value="${eb.inc}"></label>
        <label>Dumbbell mass <b>${eb.m} kg</b><input type="range" data-k="m" min="0" max="25" step="0.5" value="${eb.m}"></label>
        <label>Forearm + hand length l <b>${f(eb.l*100,0)} cm</b><input type="range" data-k="l" min="0.22" max="0.38" step="0.005" value="${eb.l}"></label>
        <label>Body mass (sets forearm weight) <b>${eb.M} kg</b><input type="range" data-k="M" min="45" max="120" step="1" value="${eb.M}"></label>
        <label>Biceps moment arm at 90° <b>${f(eb.rb*100,1)} cm</b><input type="range" data-k="rb" min="0.025" max="0.06" step="0.0025" value="${eb.rb}"></label></div>
        ${svg(600,600,ARROW+scene)}</div>
      <div class="ro"><span>External moment: dumbbell W·l·sinθ + forearm w_f·l_cm·sinθ</span><b>${f(r.Mext,1)} N·m</b></div>
      <div class="ro"><span>Muscle moment arm r_m (${eb.muscle==="biceps"?"changes little with angle":"line of action runs almost along the forearm, so the perpendicular distance stays small"})</span><b>${f(r.rb*100,1)} cm</b></div>
      <div class="ro"><span>Muscle force needed F_m = M_ext / r_m</span><b>${f(r.Fm,0)} N (${f(r.Fm/(eb.m*g||1),1)}× the dumbbell weight)</b></div>
      <div class="ro"><span>Effective mechanical advantage EMA = r_m / d_ext</span><b>${f(r.EMA,2)} ${r.EMA<1?"→ disadvantage":"→ advantage"}</b></div>
      <div class="ro"><span>Rotary component F_m·sin(angle to forearm)</span><b>${f(r.Frot,0)} N</b></div>
      <div class="ro"><span>Stabilising (+ compresses joint) / destabilising (−) component</span><b>${f(r.Fstab,0)} N</b></div>
      <div class="ro"><span>Joint reaction force on the forearm (x along forearm toward elbow, y up)</span><b>(${f(-r.Rjx,0)}, ${f(-r.Rjy,0)}) N · |R| = ${f(Math.hypot(r.Rjx,r.Rjy),0)} N</b></div>
      <p class="note"><b>Why the muscle works so hard.</b> The load acts far from the joint (long external moment arm, longest at 90°); the muscle acts close to it (short internal moment arm). EMA &lt; 1 means the muscle force is a multiple of the load, and the joint has to carry that force too. Only two things improve the situation: skill (positioning that shortens the external moment arm) and hypertrophy (more force) — you cannot move your attachment points.</p>`;
    el.querySelectorAll("[data-mus]").forEach(b=>b.onclick=()=>{ eb.muscle=b.dataset.mus; renderElbow(); }); el.querySelectorAll("input[data-k]").forEach(i=>i.oninput=()=>{ eb[i.dataset.k]=+i.value; renderElbow(); }); fixSubs(el); }

  /* ---------- 2. vector resolution of the muscle force across the range ---------- */
  let vr={inc:90,F:500};
  function renderVec(){ const el=$("#vec"); const th=rad(vr.inc); const Frot=vr.F*Math.sin(th), Fstab=vr.F*Math.cos(th);
    const pts=[]; for(let a=20;a<=175;a+=5){ pts.push([a,vr.F*Math.sin(rad(a)),vr.F*Math.cos(rad(a))]); }
    const X=(a)=>60+(a-20)/155*500, Y=(v)=>180-v/vr.F*110;
    const plot=svg(600,260,ARROW+`<line x1="60" y1="180" x2="560" y2="180" stroke="#2c4274"/><line x1="60" y1="60" x2="60" y2="300" stroke="#2c4274"/>`
      +`<polyline points="${pts.map(p=>X(p[0])+","+Y(p[1])).join(" ")}" fill="none" stroke="#7cff6b" stroke-width="3"/><polyline points="${pts.map(p=>X(p[0])+","+Y(p[2])).join(" ")}" fill="none" stroke="#22d3ee" stroke-width="3"/>`
      +`<line x1="${X(vr.inc)}" y1="60" x2="${X(vr.inc)}" y2="300" stroke="#ffd23f" stroke-dasharray="4 4"/><circle cx="${X(vr.inc)}" cy="${Y(Frot)}" r="5" fill="#7cff6b"/><circle cx="${X(vr.inc)}" cy="${Y(Fstab)}" r="5" fill="#22d3ee"/>`
      +txt(560,196,"included angle θ →",'text-anchor="end" class="mlab dim"')+txt(65,56,"rotary F·sinθ (turns the forearm)",'style="fill:#7cff6b"')+txt(65,250,"stabilising F·cosθ (+ pulls radius/ulna into the humerus; − pulls them away)",'style="fill:#22d3ee"')+txt(X(90)+4,296,"90°",'class="mlab dim"')+txt(X(20),296,"20°",'class="mlab dim"')+txt(X(175)-20,296,"175°",'class="mlab dim"'));
    el.innerHTML=`<div class="ctl"><label>Elbow included angle <b>${vr.inc}°</b><input type="range" data-k="inc" min="20" max="175" step="1" value="${vr.inc}"></label><label>Biceps force <b>${vr.F} N</b><input type="range" data-k="F" min="100" max="1500" step="50" value="${vr.F}"></label></div>
      ${plot}
      <div class="ro"><span>Rotary component R_y = F sinθ</span><b>${f(Frot,0)} N</b></div><div class="ro"><span>Stabilising / destabilising component R_x = F cosθ</span><b>${f(Fstab,0)} N ${Fstab>5?"(compresses the joint)":Fstab<-5?"(destabilising — tends to pull the forearm away)":"(≈ 0 — all rotary)"}</b></div>
      <p class="note">At 90° the biceps pulls straight across the forearm: all of its force makes torque. Near full extension most of the force runs along the forearm into the joint (stabilising, but little torque — so a curl is hardest to start). Past 90° the along-forearm component points away from the elbow (destabilising). The brachioradialis, inserting near the wrist, keeps a large stabilising component through the whole range — a joint protector more than a torque producer.</p>`;
    el.querySelectorAll("input[data-k]").forEach(i=>i.oninput=()=>{ vr[i.dataset.k]=+i.value; renderVec(); }); fixSubs(el); }

  /* ---------- 3. strength curves ---------- */
  const SC={asc:{n:"Ascending",ex:"bench / chest press, squat",d:"Torque rises as the joint extends: the bottom of the lift is the hardest part (long external moment arm, muscles at long length with poor leverage). Sticking point low in the range.",fn:(t)=>0.35+0.65*t},
            desc:{n:"Descending",ex:"chin-up, rowing, hamstring curl",d:"Torque falls as the joint moves through the range: the start is easy and the finish is the hardest part.",fn:(t)=>1-0.6*t},
            ad:{n:"Ascending–descending",ex:"biceps curl, knee extension",d:"Strongest in mid-range, where the muscle moment arm and the force–length curve both peak; weak at both ends. The sticking point is near the start (long external moment arm, short muscle moment arm).",fn:(t)=>0.45+0.55*Math.sin(Math.PI*t)}};
  let sc={k:"ad",vel:0};
  function renderSC(){ const el=$("#strength"); const C=SC[sc.k]; const vf=1-0.6*sc.vel/100; const pts=[]; for(let i=0;i<=40;i++){ const t=i/40; pts.push([60+t*500,220-C.fn(t)*vf*150]); }
    const plot=svg(600,260,`<line x1="60" y1="220" x2="560" y2="220" stroke="#2c4274"/><line x1="60" y1="40" x2="60" y2="220" stroke="#2c4274"/><polyline points="${pts.map(p=>p.join(",")).join(" ")}" fill="none" stroke="#ff8a3d" stroke-width="4"/>`+txt(560,238,"joint angle through the range →",'text-anchor="end" class="mlab dim"')+txt(66,36,"max torque",'class="mlab dim"')+txt(300,30,`${C.n} · e.g. ${C.ex}`,'text-anchor="middle"'));
    el.innerHTML=`<div class="hierbar">${Object.keys(SC).map(k=>`<button type="button" class="tabbtn ${k===sc.k?"on":""}" data-sc="${k}">${SC[k].n}</button>`).join("")}</div>
      <div class="ctl"><label>Joint angular velocity (torque falls as speed rises — Hill) <b>${sc.vel} %</b><input type="range" id="scvel" min="0" max="100" step="5" value="${sc.vel}"></label></div>${plot}
      <p><b>${C.n}.</b> ${C.d}</p><p class="note">A strength curve is the maximum joint torque a person can produce at each joint angle. It is the product of three angle-dependent things: the muscle force–length relation, the muscle moment arm, and — for the external load — the external moment arm. Cams on gym machines are shaped to match it; free weights are not, which is why they have sticking points.</p>`;
    el.querySelectorAll("[data-sc]").forEach(b=>b.onclick=()=>{ sc.k=b.dataset.sc; renderSC(); }); $("#scvel").oninput=(e)=>{ sc.vel=+e.target.value; renderSC(); }; fixSubs(el); }

  /* ---------- 4. patellofemoral compression ---------- */
  let pf={flex:60,M:75,rpt:0.045,load:0};
  function pfCalc(o){ const W=o.M*g; const d=0.02+0.14*Math.sin(rad(o.flex)); /* external moment arm of the (half) body weight + bar about the knee grows with depth */
    const Fy=(W+o.load*g)/2; const Mk=Fy*d; const Fq=Mk/o.rpt; const beta=rad(o.flex); const CF=2*Fq*Math.sin(beta/2); /* QT and PT tensions equal; angle between them = 180° − flexion */
    const A=(2.0+2.8*Math.min(1,o.flex/90))*1e-4; /* contact area grows from ≈2 to ≈4.8 cm² */ return {W,d,Fy,Mk,Fq,CF,A,sigma:CF/A}; }
  function renderPF(){ const el=$("#pf"); const r=pfCalc(pf); const th=rad(pf.flex);
    const kx=300,ky=190; const S=400; const hip=[kx-0.4*S*Math.sin(th*0.9),ky-0.4*S*Math.cos(th*0.9)]; const ank=[kx+0.42*S*Math.sin(th*0.35),ky+0.42*S*Math.cos(th*0.35)];
    const patX=kx+44*Math.cos(th*0.5)+14, patY=ky-16+30*Math.sin(th*0.5);
    const scene=`<line x1="${hip[0]}" y1="${hip[1]}" x2="${kx}" y2="${ky}" stroke="${BONE}" stroke-width="34" stroke-linecap="round"/><line x1="${kx}" y1="${ky}" x2="${ank[0]}" y2="${ank[1]}" stroke="#cfc6b0" stroke-width="28" stroke-linecap="round"/><circle cx="${kx}" cy="${ky}" r="34" fill="${BONE}" stroke="#fff"/>
      <ellipse cx="${patX}" cy="${patY}" rx="13" ry="20" fill="#f1e9d2" stroke="#fff"/>
      ${arrow(patX,patY,patX+(hip[0]-kx)*0.6,patY+(hip[1]-ky)*0.6,"#ff5a5a",4)}${txt(patX+(hip[0]-kx)*0.6+6,patY+(hip[1]-ky)*0.6,"QT",'style="fill:#ff5a5a"')}
      ${arrow(patX,patY,patX+(ank[0]-kx)*0.5,patY+(ank[1]-ky)*0.5,"#ff5a5a",4)}${txt(patX+(ank[0]-kx)*0.5+6,patY+(ank[1]-ky)*0.5+4,"PT",'style="fill:#ff5a5a"')}
      ${arrow(patX,patY,patX-Math.min(110,r.CF/25),patY,"#22d3ee",5)}${txt(patX-Math.min(110,r.CF/25)-6,patY-10,`CF = ${f(r.CF/r.W,2)} BW`,'text-anchor="end" style="fill:#22d3ee"')}
      ${txt(300,372,`knee flexion ${pf.flex}° · angle between the tendons ≈ ${180-pf.flex}°`,'text-anchor="middle"')}`;
    const refs=[["walking",1.3],["straight-leg raise",2.6],["stairs",3.3],["deep knee bend",7.8]];
    el.innerHTML=`<div class="two"><div class="ctl">
        <label>Knee flexion (squat depth) <b>${pf.flex}°</b><input type="range" data-k="flex" min="5" max="140" step="1" value="${pf.flex}"></label>
        <label>Body mass <b>${pf.M} kg</b><input type="range" data-k="M" min="45" max="120" step="1" value="${pf.M}"></label>
        <label>Added load (bar) <b>${pf.load} kg</b><input type="range" data-k="load" min="0" max="150" step="5" value="${pf.load}"></label>
        <label>Patellar tendon moment arm <b>${f(pf.rpt*100,1)} cm</b><input type="range" data-k="rpt" min="0.035" max="0.055" step="0.0025" value="${pf.rpt}"></label></div>${svg(600,390,ARROW+scene)}</div>
      <div class="ro"><span>External moment arm about the knee (grows with depth)</span><b>${f(r.d*100,1)} cm</b></div>
      <div class="ro"><span>Knee extensor moment per leg = (W + load)/2 × d</span><b>${f(r.Mk,0)} N·m</b></div>
      <div class="ro"><span>Quadriceps / patellar tendon force F_q = M_k / r_pt</span><b>${f(r.Fq,0)} N = ${f(r.Fq/r.W,2)} BW</b></div>
      <div class="ro"><span>Patellofemoral compression = vector sum of QT and PT = 2 F_q sin(flexion/2)</span><b>${f(r.CF,0)} N = ${f(r.CF/r.W,2)} BW</b></div>
      <div class="ro"><span>Contact area (rises with flexion) → stress σ = CF / A</span><b>${f(r.A*1e4,1)} cm² → ${f(r.sigma/1e6,1)} MPa</b></div>
      <p class="note"><b>Class reference values (patellofemoral compression):</b> ${refs.map(x=>`${x[0]} ≈ ${x[1]} BW`).join(" · ")}. Deeper squat → smaller angle between QT and PT → the same tendon tension produces a larger resultant pressing the patella into the femur, <i>and</i> the tendon tension itself rises because the external moment arm grows. Contact area also increases with flexion, which spreads the load (stress rises more slowly than force).</p>
      <p class="note">Direction relative to the joint plane decides the effect: force perpendicular to the articular surface (parallel to the axis of rotation) is always compression or distraction; force parallel to the surface is always shear — the ACL and vertical pelvic shear fractures are shear failures.</p>`;
    el.querySelectorAll("input[data-k]").forEach(i=>i.oninput=()=>{ pf[i.dataset.k]=+i.value; renderPF(); }); fixSubs(el); }

  /* ---------- 5. ground reaction force plate ---------- */
  let gr={mode:"cmj",M:75,depth:0.35,vto:2.6,t:0.5,playing:false};
  /* synthesise a COM velocity history: unweighting/descent → braking → propulsion → flight → landing */
  function grfProfile(o){ const T=[]; const dt=0.005; let t=0; const seg=[];
    if(o.mode==="stand"){ for(;t<2;t+=dt) T.push({t,a:0,v:0,y:0,F:o.M*g,ph:"standing"}); return T; }
    if(o.mode==="squat"){ /* down over 0.8 s, hold 0.4 s, up over 0.8 s; smooth velocity bumps */
      let y=0,v=0; for(;t<2.4;t+=dt){ let a=0,ph="hold"; if(t<0.8){ const u=t/0.8; v=-(o.depth/0.8)*Math.PI/2*Math.sin(Math.PI*u); a=-(o.depth/0.8)*Math.PI/2*Math.cos(Math.PI*u)*Math.PI/0.8; ph=u<0.5?"accelerating down (scale reads less)":"decelerating down (scale reads more)"; } else if(t<1.2){ v=0; } else if(t<2.0){ const u=(t-1.2)/0.8; v=(o.depth/0.8)*Math.PI/2*Math.sin(Math.PI*u); a=(o.depth/0.8)*Math.PI/2*Math.cos(Math.PI*u)*Math.PI/0.8; ph=u<0.5?"accelerating up (scale reads more)":"decelerating up (scale reads less)"; } else v=0; y+=v*dt; T.push({t,a,v,y,F:Math.max(0,o.M*(g+a)),ph}); } return T; }
    /* countermovement jump */
    const t3=1.0; const vmin=-Math.sqrt(2*0.9*o.depth*2)*0.6; /* downward peak speed */ const t1=2*Math.abs(vmin)*t3/(o.vto+2*Math.abs(vmin)); /* chosen so the acceleration is continuous at the bottom */
    const tf=2*o.vto/g; let y=0; const yTo=[]; for(t=0;t<t3+tf+0.35;t+=dt){ let v,a,ph;
      if(t<t1){ const u=t/t1; v=vmin*Math.sin(Math.PI*u/1.0); a=vmin*Math.cos(Math.PI*u)*Math.PI/t1; ph=u<0.5?"unweighting (GRF < W)":"braking the descent (GRF > W)"; if(u>=0.5) ph="braking (eccentric, GRF > W)"; }
      else if(t<t3){ const u=(t-t1)/(t3-t1); v=o.vto*Math.sin(Math.PI*u/2); a=o.vto*Math.cos(Math.PI*u/2)*Math.PI/2/(t3-t1); ph="propulsion (concentric, GRF > W)"; }
      else if(t<t3+tf){ const u=t-t3; v=o.vto-g*u; a=-g; ph="flight (GRF = 0)"; }
      else { const u=(t-t3-tf)/0.35; v=-o.vto*(1-u); a=o.vto/0.35; ph="landing (impact, GRF ≫ W)"; }
      y+=v*dt; T.push({t,a,v,y,F:ph.startsWith("flight")?0:Math.max(0,o.M*(g+a)),ph}); } return T; }
  function renderGRF(){ const el=$("#grf"); const T=grfProfile(gr); const tmax=T[T.length-1].t; const Fmax=Math.max(...T.map(p=>p.F),gr.M*g*1.2);
    const X=(t)=>60+t/tmax*500, Y=(F)=>230-F/Fmax*180; const W=gr.M*g; const i=Math.min(T.length-1,Math.floor(gr.t*(T.length-1))); const cur=T[i];
    /* impulse shading above/below W up to takeoff for the CMJ */
    let shade=""; if(gr.mode!=="stand"){ const to=T.findIndex((p,k)=>k>10&&p.F===0); const pre=to>0?T.slice(0,to):T; const above=pre.map(p=>`${X(p.t)},${Y(Math.max(p.F,W))}`).join(" "), below=pre.map(p=>`${X(p.t)},${Y(Math.min(p.F,W))}`).join(" "); const tEnd=pre[pre.length-1].t;
      shade=`<polygon points="${X(0)},${Y(W)} ${above} ${X(tEnd)},${Y(W)}" fill="#7cff6b" fill-opacity=".22"/><polygon points="${X(0)},${Y(W)} ${below} ${X(tEnd)},${Y(W)}" fill="#ff5a5a" fill-opacity=".25"/>`; }
    const net=T.reduce((s,p,k)=>k&&p.t<=(gr.mode==="cmj"?1.0:tmax)?s+(p.F-W)*(p.t-T[k-1].t):s,0); const vto=net/gr.M; const h=gr.mode==="cmj"?vto*vto/(2*g):0;
    const plot=svg(600,300,ARROW+shade+`<line x1="60" y1="230" x2="560" y2="230" stroke="#2c4274"/><line x1="60" y1="30" x2="60" y2="230" stroke="#2c4274"/><line x1="60" y1="${Y(W)}" x2="560" y2="${Y(W)}" stroke="#ffd23f" stroke-dasharray="5 4"/>`+txt(64,Y(W)-6,`body weight W = ${f(W,0)} N`,'style="fill:#ffd23f"')
      +`<polyline points="${T.map(p=>`${X(p.t)},${Y(p.F)}`).join(" ")}" fill="none" stroke="#22d3ee" stroke-width="3"/><line x1="${X(cur.t)}" y1="30" x2="${X(cur.t)}" y2="230" stroke="#fff" stroke-width="1.5"/><circle cx="${X(cur.t)}" cy="${Y(cur.F)}" r="5" fill="#fff"/>`
      +txt(560,250,"time →",'text-anchor="end" class="mlab dim"')+txt(66,26,"vertical GRF",'class="mlab dim"')+txt(300,290,cur.ph,'text-anchor="middle" style="fill:#fff"'));
    /* little body on a plate */
    const py=0.0; const bodyY=170-cur.y*160; const fig=svg(220,300,ARROW+`<rect x="40" y="250" width="140" height="10" fill="#6f86b3"/>`+`<circle cx="110" cy="${bodyY-110}" r="14" fill="#9fb3e6"/><line x1="110" y1="${bodyY-96}" x2="110" y2="${bodyY-30}" stroke="#9fb3e6" stroke-width="12" stroke-linecap="round"/>`
      +(()=>{ const kneeBend=Math.max(0,-cur.y)*1.4+(gr.mode==="squat"?0:0); const kx=110+40*kneeBend, hy=bodyY-30, ky=hy+(250-hy)*0.5; return `<line x1="110" y1="${hy}" x2="${kx}" y2="${ky}" stroke="#9fb3e6" stroke-width="12" stroke-linecap="round"/><line x1="${kx}" y1="${ky}" x2="100" y2="${Math.min(250,cur.F?250:250-cur.y*160)}" stroke="#9fb3e6" stroke-width="12" stroke-linecap="round"/>`; })()
      +`<circle cx="110" cy="${bodyY-20}" r="6" fill="#ff8a3d"/>`+txt(122,bodyY-16,"COM",'style="fill:#ff8a3d"')+(cur.F>0?arrow(110,260,110,260-Math.min(120,cur.F/W*45),"#7cff6b",5)+txt(118,260-Math.min(120,cur.F/W*45)+4,`GRF ${f(cur.F/W,2)} W`,'style="fill:#7cff6b"'):txt(110,275,"in the air: GRF = 0",'text-anchor="middle" style="fill:#7cff6b"')));
    el.innerHTML=`<div class="hierbar"><button type="button" class="tabbtn ${gr.mode==="stand"?"on":""}" data-g="stand">Stand still</button><button type="button" class="tabbtn ${gr.mode==="squat"?"on":""}" data-g="squat">Squat down &amp; up</button><button type="button" class="tabbtn ${gr.mode==="cmj"?"on":""}" data-g="cmj">Countermovement jump</button><button type="button" class="btn small" id="grplay">${gr.playing?"■ pause":"▶ play"}</button></div>
      <div class="ctl"><label>Time <b>${f(gr.t*tmax,2)} s</b><input type="range" id="grt" min="0" max="1" step="0.002" value="${gr.t}"></label><label>Body mass <b>${gr.M} kg</b><input type="range" data-k="M" min="45" max="120" step="1" value="${gr.M}"></label>
        ${gr.mode!=="stand"?`<label>Countermovement depth <b>${f(gr.depth*100,0)} cm</b><input type="range" data-k="depth" min="0.1" max="0.6" step="0.01" value="${gr.depth}"></label>`:""}${gr.mode==="cmj"?`<label>Take-off velocity <b>${f(gr.vto,2)} m/s</b><input type="range" data-k="vto" min="1.2" max="3.8" step="0.05" value="${gr.vto}"></label>`:""}</div>
      <div class="two" style="grid-template-columns:3fr 1fr">${plot}${fig}</div>
      <div class="ro"><span>Now: GRF = m(g + a) with a = ${f(cur.a,2)} m/s², v = ${f(cur.v,2)} m/s</span><b>${f(cur.F,0)} N = ${f(cur.F/W,2)} W</b></div>
      ${gr.mode==="cmj"?`<div class="ro"><span>Net impulse to take-off ∫(GRF − W)dt (green minus red area)</span><b>${f(net,0)} N·s</b></div><div class="ro"><span>Take-off velocity = impulse / m</span><b>${f(vto,2)} m/s</b></div><div class="ro"><span>Jump height = v²/2g · flight time = 2v/g</span><b>${f(h*100,0)} cm · ${f(2*vto/g,2)} s</b></div>`:""}
      <p class="note">${gr.mode==="stand"?"Standing still: the ground pushes up with exactly your weight (Newton's 3rd law pair of you pushing down).":gr.mode==="squat"?"Why does the scale read less when you squat down? To accelerate the COM downward the net force must be downward: GRF &lt; W. To stop at the bottom it must decelerate: GRF &gt; W. Standing up reverses the pattern. The scale never 'lies' — it reports m(g + a).":"Don't forget acceleration! The dip below W is the unweighting; the rise above it is braking then propulsion. The faster and harder the braking phase, the bigger the propulsion peak and the higher the jump (the stretch–shortening cycle). Only the <i>net</i> impulse before take-off sets the take-off velocity."}</p>`;
    el.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{ gr.mode=b.dataset.g; gr.t=0.5; renderGRF(); }); $("#grt").oninput=(e)=>{ gr.t=+e.target.value; renderGRF(); }; el.querySelectorAll("input[data-k]").forEach(i=>i.oninput=()=>{ gr[i.dataset.k]=+i.value; renderGRF(); }); $("#grplay").onclick=()=>{ gr.playing=!gr.playing; renderGRF(); }; fixSubs(el); }
  setInterval(()=>{ if(gr.playing&&!$("#grf").hidden){ gr.t=(gr.t+0.006)%1; const s=$("#grt"); if(s){ s.value=gr.t; } renderGRF(); } },40);

  /* ---------- 6. load types & fracture patterns ---------- */
  const LOADS={tension:{n:"Tension",d:"Equal and opposite pulls along the axis stretch the bone. Bone is weakest in tension; typical injury: <b>avulsion fracture</b> — a tendon or ligament tears its attachment off (e.g. fifth metatarsal base, tibial tuberosity in adolescents).",draw:(x,y)=>arrow(x,y-70,x,y-120,"#ffd23f",5)+arrow(x,y+70,x,y+120,"#ffd23f",5)+`<path d="M${x-12},${y-60} l8,6 -8,6" fill="none" stroke="#ff5a5a" stroke-width="3"/>`},
    compression:{n:"Compression",d:"Pushes along the axis shorten the bone. Bone is strongest in compression; failure by <b>buckling / crush</b> (vertebral compression fracture, calcaneus after a fall from height). Column buckling: slender bones fail sideways before they crush.",draw:(x,y)=>arrow(x,y-120,x,y-72,"#ffd23f",5)+arrow(x,y+120,x,y+72,"#ffd23f",5)+`<path d="M${x-14},${y+10} q14,-18 28,0" fill="none" stroke="#ff5a5a" stroke-width="3"/>`},
    bending:{n:"Bending",d:"A transverse load bends the bone: one side goes into tension, the other into compression (zero at the neutral axis). Failure starts on the tension side → <b>transverse fracture</b>; in children the compression side may only buckle → <b>greenstick fracture</b>.",draw:(x,y)=>arrow(x-60,y,x-16,y,"#ffd23f",5)+arrow(x+90,y-100,x+40,y-100,"#ffd23f",3)+arrow(x+90,y+100,x+40,y+100,"#ffd23f",3)+txt(x+20,y-30,"T",'style="fill:#ff5a5a"')+txt(x-30,y-30,"C",'style="fill:#22d3ee"')+`<path d="M${x+14},${y-8} l-10,8 10,8" fill="none" stroke="#ff5a5a" stroke-width="3"/>`},
    shear:{n:"Shear",d:"Forces parallel to the surface slide one part across the other. Articular surfaces and ligaments fail this way: <b>ACL tear</b> from anterior tibial shear, <b>vertical shear fracture of the pelvis</b> (one hemipelvis driven upward), growth-plate slips.",draw:(x,y)=>arrow(x-70,y-40,x-20,y-40,"#ffd23f",5)+arrow(x+70,y+40,x+20,y+40,"#ffd23f",5)+`<line x1="${x-14}" y1="${y+6}" x2="${x+14}" y2="${y-6}" stroke="#ff5a5a" stroke-width="3"/>`},
    torsion:{n:"Torsion",d:"Twisting about the long axis produces shear that spirals around the shaft; the tensile component acts at 45°, so the crack runs helically → <b>spiral fracture</b> (humerus in arm-wrestling, tibia with a planted ski boot).",draw:(x,y)=>`<path d="M${x-30},${y-110} a30,12 0 1 1 60,0" fill="none" stroke="#ffd23f" stroke-width="4" marker-end="url(#ahy@@)"/><path d="M${x+30},${y+110} a30,12 0 1 1 -60,0" fill="none" stroke="#ffd23f" stroke-width="4" marker-end="url(#ahy@@)"/><path d="M${x-14},${y-30} q14,20 28,0 q-14,30 -28,60" fill="none" stroke="#ff5a5a" stroke-width="3"/>`}};
  let ld="bending";
  function renderLoads(){ const el=$("#loads"); const L=LOADS[ld]; const x=300,y=150;
    const bone=`<rect x="${x-16}" y="${y-70}" width="32" height="140" rx="10" fill="${BONE}" stroke="#fff"/><ellipse cx="${x}" cy="${y-70}" rx="26" ry="14" fill="${BONE}" stroke="#fff"/><ellipse cx="${x}" cy="${y+70}" rx="26" ry="14" fill="${BONE}" stroke="#fff"/>`;
    el.innerHTML=`<div class="hierbar">${Object.keys(LOADS).map(k=>`<button type="button" class="tabbtn ${k===ld?"on":""}" data-ld="${k}">${LOADS[k].n}</button>`).join("")}</div>${svg(600,300,ARROW+bone+L.draw(x,y))}<p><b>${L.n}.</b> ${L.d}</p>
      <p class="note"><b>Stress, not force, breaks things:</b> σ = F/A. The same force on a smaller area (a stiletto heel, a bone's narrow waist, a small joint contact patch) gives a higher stress. The <i>direction</i> of the force defines its effect — the same 1 kN is harmless in compression along a femur and dangerous as shear across a growth plate.</p>`;
    el.querySelectorAll("[data-ld]").forEach(b=>b.onclick=()=>{ ld=b.dataset.ld; renderLoads(); }); fixSubs(el); }

  /* ---------- drills ---------- */
  const DR=(()=>{ const KEY="dpl-biomech-kinetics"; let St={done:0,correct:0,streak:0,best:0}; try{ Object.assign(St,JSON.parse(localStorage.getItem(KEY))||{}); }catch(e){} const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(St)); }catch(e){} };
    const pick=(a)=>a[Math.floor(Math.random()*a.length)]; const shuffle=(a)=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
    const Q=[
      ()=>{ const m=pick([5,8,10,12]), l=pick([0.28,0.30,0.32]), th=pick([30,60,90,120,150]); const M=m*g*l*Math.sin(rad(th)); return {q:`A ${m} kg dumbbell is held with the forearm (l = ${l} m) at an included elbow angle of ${th}°. External moment about the elbow?`,opts:shuffle([`${M.toFixed(1)} N·m`,`${(m*g*l).toFixed(1)} N·m`,`${(m*l*Math.sin(rad(th))).toFixed(2)} N·m`,`${(m*g*l*Math.cos(rad(th))).toFixed(1)} N·m`]),ans:`${M.toFixed(1)} N·m`,why:`M = W·l·sinθ = ${(m*g).toFixed(1)} × ${l} × sin ${th}° = ${M.toFixed(1)} N·m. Maximum at 90°.`}; },
      ()=>{ const r=pick([0.03,0.04,0.05]), d=pick([0.25,0.30,0.35]); const e=r/d; return {q:`Muscle moment arm ${r*100} cm, external moment arm ${d*100} cm. EMA?`,opts:shuffle([e.toFixed(2),(1/e).toFixed(2),(r*d).toFixed(3),(d-r).toFixed(2)]),ans:e.toFixed(2),why:`EMA = r_MTC / r_external = ${r}/${d} = ${e.toFixed(2)} — a mechanical disadvantage; the muscle force is ${(1/e).toFixed(1)}× the load.`}; },
      ()=>({q:"At which elbow angle is ALL of the biceps force rotary (no stabilising component)?",opts:shuffle(["90°","45°","180° (full extension)","135°"]),ans:"90°",why:"R_y = F sinθ is maximal and R_x = F cosθ = 0 at 90°."}),
      ()=>({q:"Past 90° of elbow flexion the along-forearm component of the biceps force becomes…",opts:shuffle(["destabilising (pulls the forearm away from the humerus)","stabilising (compresses the joint)","zero","equal to the rotary component"]),ans:"destabilising (pulls the forearm away from the humerus)",why:"cosθ is negative beyond 90°: the component points away from the joint."}),
      ()=>({q:"The bench press has which strength curve?",opts:shuffle(["ascending (hardest at the bottom)","descending","ascending–descending","flat"]),ans:"ascending (hardest at the bottom)",why:"Torque capacity rises as the joint extends; the sticking point is low."}),
      ()=>({q:"The biceps curl has which strength curve?",opts:shuffle(["ascending–descending (strongest mid-range)","ascending","descending","flat"]),ans:"ascending–descending (strongest mid-range)",why:"Moment arm and force–length both peak near 90°."}),
      ()=>({q:"The chin-up has which strength curve?",opts:shuffle(["descending (hardest at the top)","ascending","ascending–descending","flat"]),ans:"descending (hardest at the top)",why:"Easiest at the start (arms extended), hardest as the chin approaches the bar."}),
      ()=>({q:"Only two things improve a muscle's mechanical situation at a joint. They are…",opts:shuffle(["skill (positioning) and hypertrophy","moving the attachment point and stretching","longer bones and more tendon","warm-up and flexibility"]),ans:"skill (positioning) and hypertrophy",why:"You cannot change where a muscle attaches."}),
      ()=>{ const a=pick([-3,-2,-1,1,2,3]); const m=pick([60,70,80]); const N=m*(g+a); return {q:`A ${m} kg person on a force plate has a vertical COM acceleration of ${a} m/s² (up +). Plate reading?`,opts:shuffle([`${N.toFixed(0)} N`,`${(m*g).toFixed(0)} N`,`${(m*(g-a)).toFixed(0)} N`,`${(m*a).toFixed(0)} N`]),ans:`${N.toFixed(0)} N`,why:`GRF − W = m a → GRF = m(g + a) = ${N.toFixed(0)} N (${a<0?"less":"more"} than body weight).`}; },
      ()=>({q:"During the unweighting phase of a countermovement jump the GRF is…",opts:shuffle(["less than body weight (COM accelerating downward)","more than body weight","zero","equal to body weight"]),ans:"less than body weight (COM accelerating downward)",why:"Net force must be downward to start the COM moving down."}),
      ()=>{ const J=pick([150,180,200,240]); const m=pick([60,70,80]); const v=J/m; const h=v*v/(2*g); return {q:`Net vertical impulse before take-off is ${J} N·s for a ${m} kg jumper. Jump height?`,opts:shuffle([`${(h*100).toFixed(0)} cm`,`${(J/m*100/2).toFixed(0)} cm`,`${(J/g).toFixed(0)} cm`,`${(h*200).toFixed(0)} cm`]),ans:`${(h*100).toFixed(0)} cm`,why:`v = J/m = ${v.toFixed(2)} m/s; h = v²/2g = ${(h*100).toFixed(0)} cm.`}; },
      ()=>({q:"Patellofemoral compression in a deep knee bend is roughly how many body weights?",opts:shuffle(["≈ 7.8 BW","≈ 1.3 BW","≈ 2.6 BW","≈ 3.3 BW"]),ans:"≈ 7.8 BW",why:"Walking ≈ 1.3, straight-leg raise ≈ 2.6, stairs ≈ 3.3, deep knee bend ≈ 7.8 BW."}),
      ()=>({q:"A deeper squat increases patellofemoral compression because…",opts:shuffle(["the angle between quadriceps and patellar tendons gets smaller and the external moment arm grows","the patella gets heavier","the tendons get longer","contact area decreases to zero"]),ans:"the angle between quadriceps and patellar tendons gets smaller and the external moment arm grows",why:"CF = vector sum of QT and PT; a sharper angle gives a larger resultant for the same tension."}),
      ()=>({q:"A spiral fracture of the humerus in arm wrestling is caused by…",opts:shuffle(["torsion","pure compression","tension","bending only"]),ans:"torsion",why:"Twisting about the long axis → helical crack."}),
      ()=>({q:"A greenstick fracture is a…",opts:shuffle(["bending failure in a child's bone that fails in tension on one side only","compression crush of the vertebra","torsion failure","shear fracture of the pelvis"]),ans:"bending failure in a child's bone that fails in tension on one side only",why:"The compression side bends/buckles without breaking through."}),
      ()=>({q:"Force perpendicular to the articular surface (parallel to the axis of rotation) always produces…",opts:shuffle(["compression or distraction","shear","torsion","bending"]),ans:"compression or distraction",why:"Parallel to the joint surface → shear."}),
      ()=>({q:"George (moment arm 5 mm) and Jim (6 mm) have identical muscles. Who lifts more weight at a given joint speed?",opts:shuffle(["Jim — the larger moment arm gives more torque, and at a given joint speed his muscle shortens only slightly faster","George — a shorter moment arm means a faster, stronger muscle","they are identical","cannot be determined"]),ans:"Jim — the larger moment arm gives more torque, and at a given joint speed his muscle shortens only slightly faster",why:"Torque = F(v)·r with v = r·ω; the larger r wins unless the velocity penalty on F outweighs it."}),
      ()=>({q:"Positive net joint moments in the class convention are…",opts:shuffle(["hip flexion, knee extension, ankle dorsiflexion","hip extension, knee flexion, ankle plantarflexion","all flexions","all extensions"]),ans:"hip flexion, knee extension, ankle dorsiflexion",why:"The ankle moment is negative (plantarflexor) through almost all of stance."})];
    let cur=null; function next(){ cur=pick(Q)(); const el=$("#kdrill"); el.innerHTML=`<div class="dq">${cur.q}</div><div class="dopts">${cur.opts.map(o=>`<button type="button" class="btn dopt" data-o="${o.replace(/"/g,"&quot;")}">${o}</button>`).join("")}</div><div class="dfb" id="kdfb"></div><div class="dstat">Answered ${St.done} · correct ${St.correct} · streak ${St.streak} (best ${St.best})</div>`; el.querySelectorAll(".dopt").forEach(b=>b.onclick=()=>answer(b.dataset.o,b)); fixSubs(el); }
    function answer(o,b){ const ok=o===cur.ans; St.done++; if(ok){ St.correct++; St.streak++; St.best=Math.max(St.best,St.streak); } else St.streak=0; save(); $("#kdrill").querySelectorAll(".dopt").forEach(x=>{ x.disabled=true; if(x.dataset.o===cur.ans) x.classList.add("good"); else if(x===b&&!ok) x.classList.add("bad"); }); $("#kdfb").innerHTML=`<p class="${ok?"fb good":"fb bad"}">${ok?"Correct.":"Not quite — the answer is <b>"+cur.ans+"</b>."} ${cur.why}</p><button type="button" class="btn primary small" id="knext">Next question →</button>`; $("#knext").onclick=next; const ds=$("#kdrill .dstat"); if(ds) ds.textContent=`Answered ${St.done} · correct ${St.correct} · streak ${St.streak} (best ${St.best})`; if(typeof GAME!=="undefined"&&ok) GAME.addXP(10,St.streak>1?`+10 XP · ${St.streak} in a row`:"+10 XP"); }
    return {next}; })();

  function init(){ renderElbow(); renderVec(); renderSC(); renderPF(); renderGRF(); renderLoads();
    document.querySelectorAll("#mtabs .tabbtn").forEach(b=>b.onclick=()=>{ document.querySelectorAll("#mtabs .tabbtn").forEach(x=>x.classList.toggle("on",x===b)); document.querySelectorAll(".mpane").forEach(p=>p.hidden=p.id!==b.dataset.k); });
    $("#kdrillstart").onclick=()=>{ DR.next(); $("#kdrillstart").textContent="Skip →"; }; }
  return {init,elbowCalc,pfCalc,grfProfile,get:()=>({eb,vr,sc,pf,gr,ld})};
})();
KL.init();
