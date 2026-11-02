/* ===================== ANTHROPOMETRY & INVERSE DYNAMICS LAB =====================
   Tabs: segment parameters · whole-body COM · moment of inertia · inverse dynamics (link-segment) · drills.
   Sources: Dempster (1955) segment data as tabulated by Winter, Biomechanics and Motor Control of Human Movement (Table 4.1);
   segment lengths as fractions of stature after Drillis & Contini (1966); sign conventions and P = M·ω from ME 320 Lecture 10. */
const ID=(()=>{
  const $=(s)=>document.querySelector(s); const f=(x,d=2)=>isFinite(x)?(+x).toFixed(d):"—"; const rad=(d)=>d*Math.PI/180; const g=9.81;
  let svgN=0; const svg=(w,h,inner,cls="")=>{ const uid="i"+(svgN++); return `<svg viewBox="0 0 ${w} ${h}" class="mlsvg ${cls}" preserveAspectRatio="xMidYMid meet">${inner.split("@@").join(uid)}</svg>`; };
  const MK={"#7cff6b":"ahg","#22d3ee":"ahc","#ffd23f":"ahy","#ff8a3d":"aho","#ff5a5a":"ahr","#b58cff":"ahp"};
  const ARROW=`<defs>${Object.entries(MK).map(([c,id])=>`<marker id="${id}@@" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join("")}</defs>`;
  const arrow=(x1,y1,x2,y2,col,w=3)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" marker-end="url(#${MK[col]||"ahc"}@@)"/>`;
  const txt=(x,y,s,o="")=>`<text x="${x}" y="${y}" class="mlab" ${o}>${s}</text>`;
  const BONE="#e8e2d2";

  /* ---------- anthropometric table (Dempster via Winter; lengths after Drillis & Contini) ----------
     m: mass fraction of body mass · cp: COM location from the proximal end as a fraction of segment length ·
     k: radius of gyration about the COM as a fraction of segment length · L: segment length as a fraction of stature H   */
  const SEG={
    hand:{n:"Hand",m:0.006,cp:0.506,k:0.297,L:0.108,def:"wrist axis → knuckle II of the middle finger"},
    forearm:{n:"Forearm",m:0.016,cp:0.430,k:0.303,L:0.146,def:"elbow axis → ulnar styloid"},
    upperarm:{n:"Upper arm",m:0.028,cp:0.436,k:0.322,L:0.186,def:"glenohumeral axis → elbow axis"},
    fahand:{n:"Forearm + hand",m:0.022,cp:0.682,k:0.468,L:0.254,def:"elbow axis → knuckle II"},
    arm:{n:"Whole arm",m:0.050,cp:0.530,k:0.368,L:0.440,def:"glenohumeral axis → knuckle II"},
    foot:{n:"Foot",m:0.0145,cp:0.50,k:0.475,L:0.152,def:"lateral malleolus → head of metatarsal II (COM & k along the foot length)"},
    shank:{n:"Shank (leg)",m:0.0465,cp:0.433,k:0.302,L:0.246,def:"femoral condyles → medial malleolus"},
    thigh:{n:"Thigh",m:0.100,cp:0.433,k:0.323,L:0.245,def:"greater trochanter → femoral condyles"},
    footshank:{n:"Foot + shank",m:0.061,cp:0.606,k:0.416,L:0.285,def:"femoral condyles → medial malleolus (COM referenced to this length)"},
    leg:{n:"Whole leg",m:0.161,cp:0.447,k:0.326,L:0.530,def:"greater trochanter → medial malleolus"},
    headneck:{n:"Head + neck",m:0.081,cp:1.000,k:0.495,L:0.182,def:"C7–T1 & first rib → ear canal (COM given at the distal end of this line)"},
    thn:{n:"Trunk + head + neck",m:0.578,cp:0.66,k:0.503,L:0.288,def:"greater trochanter → glenohumeral axis (COM 0.66 of the way up from the hip)"},
    hat:{n:"HAT (head, arms, trunk)",m:0.678,cp:0.626,k:0.496,L:0.288,def:"greater trochanter → glenohumeral axis"}
  };
  let ap={M:70,H:1.75,seg:"thigh"};
  const segVals=(key,M,H)=>{ const s=SEG[key]; const L=s.L*H, m=s.m*M, cm=s.cp*L, I=m*Math.pow(s.k*L,2); return {s,L,m,cm,I,Ip:I+m*cm*cm,Id:I+m*Math.pow(L-cm,2)}; };
  /* stick figure (sagittal, anterior → right) for highlighting */
  const FIG={hip:[300,190],knee:[300,275],ankle:[300,360],toe:[352,370],heel:[280,370],shoulder:[300,88],elbow:[322,150],wrist:[332,200],knuckle:[336,238],ear:[300,40]};
  const HILITE={hand:["wrist","knuckle"],forearm:["elbow","wrist"],upperarm:["shoulder","elbow"],fahand:["elbow","knuckle"],arm:["shoulder","knuckle"],foot:["heel","toe"],shank:["knee","ankle"],thigh:["hip","knee"],footshank:["knee","ankle"],leg:["hip","ankle"],headneck:["shoulder","ear"],thn:["hip","shoulder"],hat:["hip","shoulder"]};
  function figure(hl){ const L=(a,b,c="#6f86b3",w=10)=>`<line x1="${FIG[a][0]}" y1="${FIG[a][1]}" x2="${FIG[b][0]}" y2="${FIG[b][1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    let s=`<circle cx="300" cy="40" r="22" fill="#6f86b3"/>`+L("shoulder","hip")+L("hip","knee")+L("knee","ankle")+L("heel","toe")+L("ankle","heel")+L("shoulder","elbow")+L("elbow","wrist")+L("wrist","knuckle",`#6f86b3`,8);
    if(hl){ const [a,b]=HILITE[hl]; s+=L(a,b,"#ffd23f",14); if(hl==="hat"||hl==="headneck"||hl==="thn") s+=`<circle cx="300" cy="40" r="24" fill="none" stroke="#ffd23f" stroke-width="4"/>`; if(hl==="hat") s+=L("shoulder","knuckle","#ffd23f",14); const v=segVals(hl,ap.M,ap.H); const [x1,y1]=FIG[a],[x2,y2]=FIG[b]; const cx=x1+(x2-x1)*v.s.cp, cy=y1+(y2-y1)*v.s.cp; s+=`<circle cx="${cx}" cy="${cy}" r="7" fill="#ff8a3d" stroke="#fff" stroke-width="2"/>`+txt(cx+14,cy+4,"segment COM",'style="fill:#ff8a3d"'); }
    return s; }
  function renderSeg(){ const el=$("#segs"); const v=segVals(ap.seg,ap.M,ap.H);
    el.innerHTML=`<div class="two"><div><div class="ctl"><label>Body mass M <b>${ap.M} kg</b><input type="range" id="apM" min="40" max="120" step="1" value="${ap.M}"></label><label>Stature H <b>${f(ap.H,2)} m</b><input type="range" id="apH" min="1.45" max="2.05" step="0.01" value="${ap.H}"></label></div>
        <label class="note">Segment<select id="apseg">${Object.keys(SEG).map(k=>`<option value="${k}" ${k===ap.seg?"selected":""}>${SEG[k].n}</option>`).join("")}</select></label>
        <p class="note" style="margin-top:8px">${v.s.def}</p>
        <div class="ro"><span>Segment length L = ${v.s.L} H</span><b>${f(v.L,3)} m</b></div>
        <div class="ro"><span>Segment mass m = ${v.s.m} M</span><b>${f(v.m,2)} kg</b></div>
        <div class="ro"><span>COM from proximal end = ${v.s.cp} L</span><b>${f(v.cm,3)} m</b></div>
        <div class="ro"><span>Radius of gyration about COM k = ${v.s.k} L</span><b>${f(v.s.k*v.L,3)} m</b></div>
        <div class="ro"><span>I about COM = m (kL)²</span><b>${f(v.I,4)} kg·m²</b></div>
        <div class="ro"><span>I about proximal joint = I_cm + m·c²</span><b>${f(v.Ip,4)} kg·m²</b></div>
        <div class="ro"><span>I about distal joint = I_cm + m·(L−c)²</span><b>${f(v.Id,4)} kg·m²</b></div></div>
      <div>${svg(600,400,figure(ap.seg)+txt(300,392,"sagittal view · anterior →",'text-anchor="middle" class="mlab dim"'))}</div></div>
      <h4 style="margin:14px 0 6px">The whole table (fractions)</h4>
      <table class="jt"><tr><th>Segment</th><th>mass / M</th><th>COM from proximal / L</th><th>k_cm / L</th><th>L / H</th></tr>${Object.keys(SEG).map(k=>`<tr class="${k===ap.seg?"on":""}"><td>${SEG[k].n}</td><td>${SEG[k].m}</td><td>${SEG[k].cp}</td><td>${SEG[k].k}</td><td>${SEG[k].L}</td></tr>`).join("")}</table>
      <p class="note">Mass, COM and radius-of-gyration fractions: Dempster's cadaver study (1955) as tabulated by Winter (<i>Biomechanics and Motor Control of Human Movement</i>, Table 4.1). Length fractions of stature: Drillis &amp; Contini (1966). These are population averages for adult males — expect ±5–10 % for an individual; de Leva (1996) gives sex-specific values from living subjects.</p>`;
    $("#apM").oninput=(e)=>{ ap.M=+e.target.value; renderSeg(); }; $("#apH").oninput=(e)=>{ ap.H=+e.target.value; renderSeg(); }; $("#apseg").onchange=(e)=>{ ap.seg=e.target.value; renderSeg(); }; fixSubs(el); }

  /* ---------- whole-body COM by the segmental method ---------- */
  const POSES={stand:{n:"Standing",trunk:0,thigh:0,knee:0,sh:0,el:0},squat:{n:"Squat",trunk:35,thigh:70,knee:100,sh:60,el:10},reach:{n:"Reach forward",trunk:45,thigh:15,knee:10,sh:110,el:0},pike:{n:"Pike / toe-touch",trunk:100,thigh:10,knee:0,sh:75,el:0},sit:{n:"Sitting",trunk:0,thigh:90,knee:90,sh:20,el:90}};
  let pose={...POSES.stand};
  function comCalc(p,M,H){ /* 2-D sagittal; metres; hip at origin; anterior +x, up +y. Both legs/arms identical. */
    const d=(ang,len)=>[len*Math.sin(rad(ang)),-len*Math.cos(rad(ang))]; /* from a joint, segment hanging at angle 'ang' from vertical-down, positive anterior */
    const Lth=SEG.thigh.L*H, Lsh=SEG.shank.L*H, Lft=SEG.foot.L*H, Ltr=SEG.thn.L*H, Lua=SEG.upperarm.L*H, Lfh=SEG.fahand.L*H;
    const hip=[0,0]; const knee=add(hip,d(p.thigh,Lth)); const shAng=p.thigh-p.knee; const ankle=add(knee,d(shAng,Lsh));
    const footAng=0; /* foot flat: heel 0.25 L behind the ankle, toe 0.75 L in front */ const heel=add(ankle,[-0.25*Lft,-0.039*H]), toe=add(ankle,[0.75*Lft,-0.039*H]);
    const shoulder=add(hip,[Ltr*Math.sin(rad(p.trunk)),Ltr*Math.cos(rad(p.trunk))]); const elbow=add(shoulder,d(p.sh,Lua)); const wrist=add(elbow,d(p.sh-p.el,Lfh));
    const segs=[
      {n:"trunk+head+neck",m:SEG.thn.m,pt:lerp(hip,shoulder,SEG.thn.cp)},
      {n:"thighs (2)",m:2*SEG.thigh.m,pt:lerp(hip,knee,SEG.thigh.cp)},
      {n:"shanks (2)",m:2*SEG.shank.m,pt:lerp(knee,ankle,SEG.shank.cp)},
      {n:"feet (2)",m:2*SEG.foot.m,pt:lerp(heel,toe,0.5)},
      {n:"upper arms (2)",m:2*SEG.upperarm.m,pt:lerp(shoulder,elbow,SEG.upperarm.cp)},
      {n:"forearms+hands (2)",m:2*SEG.fahand.m,pt:lerp(elbow,wrist,SEG.fahand.cp)}];
    const mt=segs.reduce((a,s)=>a+s.m,0); const com=[segs.reduce((a,s)=>a+s.m*s.pt[0],0)/mt,segs.reduce((a,s)=>a+s.m*s.pt[1],0)/mt];
    return {segs,mt,com,J:{hip,knee,ankle,heel,toe,shoulder,elbow,wrist},M}; }
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1]], lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  function renderCOM(){ const el=$("#com"); const r=comCalc(pose,ap.M,ap.H); const J=r.J; const headC0=add(J.shoulder,[0.12*ap.H*Math.sin(rad(pose.trunk)),0.12*ap.H*Math.cos(rad(pose.trunk))]); const ground=Math.min(...Object.values(J).map(p=>p[1]),headC0[1]-0.06*ap.H);
    const S=240; const X=(p)=>300+p[0]*S, Y=(p)=>372-(p[1]-ground)*S; const L=(a,b,c="#6f86b3",w=10)=>`<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    const headC=add(J.shoulder,[0.12*ap.H*Math.sin(rad(pose.trunk)),0.12*ap.H*Math.cos(rad(pose.trunk))]);
    const fig=L(J.hip,J.shoulder)+L(J.hip,J.knee)+L(J.knee,J.ankle)+L(J.heel,J.toe)+L(J.ankle,J.heel)+L(J.shoulder,J.elbow)+L(J.elbow,J.wrist,"#6f86b3",8)+`<circle cx="${X(headC)}" cy="${Y(headC)}" r="${0.06*ap.H*S}" fill="#6f86b3"/>`;
    const dots=r.segs.map(s=>`<circle cx="${X(s.pt)}" cy="${Y(s.pt)}" r="${4+s.m*18}" fill="#ffd23f" fill-opacity=".85" stroke="#fff"/>`).join("");
    const gy=Y([0,ground]); const inBase=r.com[0]>=J.heel[0]&&r.com[0]<=J.toe[0];
    const comMark=`<line x1="${X(r.com)}" y1="${Y(r.com)}" x2="${X(r.com)}" y2="${gy}" stroke="${inBase?"#7cff6b":"#ff5a5a"}" stroke-width="2" stroke-dasharray="6 4"/><circle cx="${X(r.com)}" cy="${Y(r.com)}" r="9" fill="#ff8a3d" stroke="#fff" stroke-width="2"/><path d="M${X(r.com)-9},${Y(r.com)} a9,9 0 0 1 9,-9 v9 z M${X(r.com)},${Y(r.com)} h9 a9,9 0 0 1 -9,9 z" fill="#fff"/>`+txt(X(r.com)+14,Y(r.com)-8,"whole-body COM",'style="fill:#ff8a3d"');
    const base=`<line x1="${X(J.heel)}" y1="${gy+8}" x2="${X(J.toe)}" y2="${gy+8}" stroke="${inBase?"#7cff6b":"#ff5a5a"}" stroke-width="4"/>`+txt(X(J.toe)+8,gy+12,inBase?"COM over the base of support":"COM outside the base → falls / needs support",`style="fill:${inBase?"#7cff6b":"#ff5a5a"}"`);
    el.innerHTML=`<div class="hierbar">${Object.keys(POSES).map(k=>`<button type="button" class="tabbtn" data-p="${k}">${POSES[k].n}</button>`).join("")}<span class="note">M = ${ap.M} kg, H = ${ap.H} m (set on the first tab)</span></div>
      <div class="two"><div class="ctl">
        <label>Trunk lean (from vertical, forward +) <b>${pose.trunk}°</b><input type="range" data-k="trunk" min="-60" max="110" step="1" value="${pose.trunk}"></label>
        <label>Hip: thigh from vertical (flexion +) <b>${pose.thigh}°</b><input type="range" data-k="thigh" min="-40" max="120" step="1" value="${pose.thigh}"></label>
        <label>Knee flexion <b>${pose.knee}°</b><input type="range" data-k="knee" min="0" max="140" step="1" value="${pose.knee}"></label>
        <label>Shoulder: arm from vertical (flexion +) <b>${pose.sh}°</b><input type="range" data-k="sh" min="-170" max="180" step="1" value="${pose.sh}"></label>
        <label>Elbow flexion <b>${pose.el}°</b><input type="range" data-k="el" min="0" max="140" step="1" value="${pose.el}"></label></div>
        ${svg(600,420,ARROW+`<line x1="0" y1="${gy}" x2="600" y2="${gy}" stroke="#2c4274" stroke-width="2"/>`+fig+dots+comMark+base+txt(590,412,"anterior →",'text-anchor="end" class="mlab dim"'))}</div>
      <table class="jt" style="margin-top:10px"><tr><th>Segment</th><th>m_i (kg)</th><th>x_i (m)</th><th>y_i (m)</th><th>m_i·x_i</th><th>m_i·y_i</th></tr>${r.segs.map(s=>`<tr><td>${s.n}</td><td>${f(s.m*ap.M,2)}</td><td>${f(s.pt[0],3)}</td><td>${f(s.pt[1],3)}</td><td>${f(s.m*ap.M*s.pt[0],3)}</td><td>${f(s.m*ap.M*s.pt[1],3)}</td></tr>`).join("")}<tr class="on"><td><b>Σ → COM = Σm_i r_i / Σm_i</b></td><td>${f(r.mt*ap.M,2)}</td><td><b>${f(r.com[0],3)}</b></td><td><b>${f(r.com[1],3)}</b></td><td>${f(r.segs.reduce((a,s)=>a+s.m*ap.M*s.pt[0],0),3)}</td><td>${f(r.segs.reduce((a,s)=>a+s.m*ap.M*s.pt[1],0),3)}</td></tr></table>
      <p class="note">Coordinates are metres from the hip joint (anterior +x, up +y). The COM is a <i>weighted average</i> of the segment COMs — it need not lie inside the body (try the back arch: a high-jumper's COM can pass under the bar while the body goes over). Standing, the COM sits just anterior to S2 at ≈ 55 % of stature.</p>`;
    el.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{ pose={...POSES[b.dataset.p]}; renderCOM(); }); el.querySelectorAll("input[data-k]").forEach(i=>i.oninput=()=>{ pose[i.dataset.k]=+i.value; renderCOM(); }); fixSubs(el); }

  /* ---------- moment of inertia: parallel axis, straight vs bent leg about the hip ---------- */
  let moi={knee:0};
  function legI(kneeDeg,M,H){ const th=segVals("thigh",M,H), sh=segVals("shank",M,H), ft=segVals("foot",M,H);
    /* thigh hangs vertically from the hip; shank rotated by knee flexion; foot perpendicular to shank (ankle neutral) */
    const kn=[0,-th.L]; const a=rad(kneeDeg); const dir=[ -Math.sin(a),-Math.cos(a)]; /* knee flexion moves the foot posteriorly */
    const shCM=[kn[0]+dir[0]*sh.cm,kn[1]+dir[1]*sh.cm]; const ank=[kn[0]+dir[0]*sh.L,kn[1]+dir[1]*sh.L]; const fdir=[Math.cos(a),-Math.sin(a)]; const ftCM=[ank[0]+fdir[0]*ft.L*0.5*0.5,ank[1]+fdir[1]*ft.L*0.5*0.5];
    const d2=(p)=>p[0]*p[0]+p[1]*p[1];
    const Ith=th.I+th.m*th.cm*th.cm, Ish=sh.I+sh.m*d2(shCM), Ift=ft.I+ft.m*d2(ftCM); return {Ith,Ish,Ift,I:Ith+Ish+Ift,kn,ank,shCM,ftCM,th,sh,ft,dsh:Math.sqrt(d2(shCM)),dft:Math.sqrt(d2(ftCM))}; }
  function renderMOI(){ const el=$("#moi"); const r=legI(moi.knee,ap.M,ap.H); const r0=legI(0,ap.M,ap.H); const S=380; const X=(p)=>330+p[0]*S, Y=(p)=>50-p[1]*S;
    const fig=`<line x1="${X([0,0])}" y1="${Y([0,0])}" x2="${X(r.kn)}" y2="${Y(r.kn)}" stroke="${BONE}" stroke-width="14" stroke-linecap="round"/><line x1="${X(r.kn)}" y1="${Y(r.kn)}" x2="${X(r.ank)}" y2="${Y(r.ank)}" stroke="${BONE}" stroke-width="12" stroke-linecap="round"/><line x1="${X(r.ank)}" y1="${Y(r.ank)}" x2="${X([r.ank[0]+Math.cos(rad(moi.knee))*r.ft.L*0.75,r.ank[1]-Math.sin(rad(moi.knee))*r.ft.L*0.75])}" y2="${Y([r.ank[0]+Math.cos(rad(moi.knee))*r.ft.L*0.75,r.ank[1]-Math.sin(rad(moi.knee))*r.ft.L*0.75])}" stroke="${BONE}" stroke-width="9" stroke-linecap="round"/><circle cx="${X([0,0])}" cy="${Y([0,0])}" r="8" fill="#ff8a3d"/>`+txt(X([0,0])+14,Y([0,0])+4,"hip axis",'style="fill:#ff8a3d"')
      +[["thigh",[0,-r.th.cm]],["shank",r.shCM],["foot",r.ftCM]].map(([n,p])=>`<circle cx="${X(p)}" cy="${Y(p)}" r="6" fill="#ffd23f" stroke="#fff"/><line x1="${X([0,0])}" y1="${Y([0,0])}" x2="${X(p)}" y2="${Y(p)}" stroke="#ffd23f" stroke-width="1.5" stroke-dasharray="4 4" opacity=".7"/>`+txt(X(p)+10,Y(p)+4,n+" COM",'style="fill:#ffd23f"')).join("");
    el.innerHTML=`<div class="two"><div><div class="ctl"><label>Knee flexion <b>${moi.knee}°</b><input type="range" id="moik" min="0" max="140" step="1" value="${moi.knee}"></label></div>
        <div class="ro"><span>Thigh: I_cm + m d² (d = ${f(r.th.cm,3)} m)</span><b>${f(r.Ith,3)} kg·m²</b></div>
        <div class="ro"><span>Shank: I_cm + m d² (d = ${f(r.dsh,3)} m)</span><b>${f(r.Ish,3)} kg·m²</b></div>
        <div class="ro"><span>Foot: I_cm + m d² (d = ${f(r.dft,3)} m)</span><b>${f(r.Ift,3)} kg·m²</b></div>
        <div class="ro"><span><b>Whole leg about the hip</b></span><b>${f(r.I,3)} kg·m²</b></div>
        <div class="ro"><span>Relative to the straight leg (${f(r0.I,3)} kg·m²)</span><b>${f(100*r.I/r0.I,0)} %</b></div>
        <div class="ro"><span>Hip torque for α = 10 rad/s² (inertial part only)</span><b>${f(10*r.I,1)} N·m</b></div>
        <p class="note" style="margin-top:8px"><b>Parallel-axis theorem:</b> I_axis = I_cm + m·d². Each segment's own I_cm is small; what dominates is m·d², the mass times its distance from the hip. Bending the knee pulls the shank and foot toward the hip, so the leg becomes much easier to swing — which is why the swing leg flexes in running and why a sprinter's recovery leg is tightly folded.</p></div>
      <div>${svg(600,420,ARROW+fig+txt(590,412,"anterior →",'text-anchor="end" class="mlab dim"'))}</div></div>`;
    $("#moik").oninput=(e)=>{ moi.knee=+e.target.value; renderMOI(); }; fixSubs(el); }

  /* ---------- inverse dynamics: link-segment model, distal → proximal ---------- */
  /* Presets give segment orientations, kinematics and the GRF for one instant. Angles: foot from horizontal (toes-up +), shank and thigh from vertical (distal end anterior +). Accelerations in m/s², rad/s². ω rad/s (CCW +). */
  const PRESETS={
    stand:{n:"Quiet standing (one leg)",Fx:0,Fy:1.00,cop:0.05,foot:0,shank:0,thigh:0,a:{foot:[0,0,0],shank:[0,0,0],thigh:[0,0,0]},w:{ankle:0,knee:0,hip:0}},
    heel:{n:"Walking · loading response",Fx:-0.18,Fy:1.10,cop:-0.03,foot:10,shank:15,thigh:25,a:{foot:[-1,2,-30],shank:[-1,1.5,-8],thigh:[-1,1,-4]},w:{ankle:-2.5,knee:-2.0,hip:-1.5}},
    mid:{n:"Walking · midstance",Fx:0.00,Fy:0.80,cop:0.04,foot:0,shank:-5,thigh:0,a:{foot:[0,0,0],shank:[0.3,0.2,-2],thigh:[0.5,0.3,-3]},w:{ankle:1.0,knee:0.5,hip:-1.2}},
    push:{n:"Walking · push-off",Fx:0.20,Fy:1.10,cop:0.15,foot:-20,shank:-35,thigh:-20,a:{foot:[2,3,-20],shank:[1.5,1.5,-6],thigh:[1.5,0.8,2]},w:{ankle:-4.0,knee:-1.5,hip:1.5}},
    squat:{n:"Deep squat · hold",Fx:0,Fy:0.50,cop:0.02,foot:0,shank:-30,thigh:70,a:{foot:[0,0,0],shank:[0,0,0],thigh:[0,0,0]},w:{ankle:0,knee:0,hip:0}}
  };
  let idv={p:"push",static:false,M:70,H:1.75,Fx:0.20,Fy:1.10,cop:0.15};
  const cross=(r,F)=>r[0]*F[1]-r[1]*F[0];
  function solveID(P,o){ const M=o.M,H=o.H; const ft=segVals("foot",M,H), sh=segVals("shank",M,H), th=segVals("thigh",M,H); const stat=o.static;
    const GRF=[o.Fx*M*g,o.Fy*M*g]; /* ankle joint centre at origin; anterior +x, up +y */
    const ankle=[0,0]; const fa=rad(P.foot); /* foot: from the ankle, COM is ahead by (0.5·L − 0.25·L) along the foot and 0.039H below the ankle in standing */
    const hA=0.039*H; /* ankle height above the sole */ const perp=[Math.sin(fa),-Math.cos(fa)]; /* unit vector from the ankle line down to the sole, rotating with the foot */
    const ftCM=[0.25*ft.L*Math.cos(fa)+hA*perp[0],0.25*ft.L*Math.sin(fa)+hA*perp[1]]; /* foot COM: mid-foot (0.5 L from the heel, ankle at 0.25 L), on the sole line */
    const cop=[o.cop*Math.cos(fa)+hA*perp[0],o.cop*Math.sin(fa)+hA*perp[1]];
    const sa=rad(P.shank); const knee=[ankle[0]-sh.L*Math.sin(sa),ankle[1]+sh.L*Math.cos(sa)]; const shCM=lerp(knee,ankle,sh.s.cp);
    const ta=rad(P.thigh); const hip=[knee[0]-th.L*Math.sin(ta),knee[1]+th.L*Math.cos(ta)]; const thCM=lerp(hip,knee,th.s.cp);
    const acc=(k)=>stat?[0,0,0]:P.a[k];
    /* foot */ let [ax,ay,al]=acc("foot"); const Ra=[ft.m*ax-GRF[0],ft.m*ay+ft.m*g-GRF[1]]; const Ma=ft.I*al-cross(sub(cop,ftCM),GRF)-cross(sub(ankle,ftCM),Ra);
    /* shank: distal end receives −Ra, −Ma */ [ax,ay,al]=acc("shank"); const Rk=[sh.m*ax+Ra[0],sh.m*ay+sh.m*g+Ra[1]]; const Mk=sh.I*al+Ma-cross(sub(ankle,shCM),[-Ra[0],-Ra[1]])-cross(sub(knee,shCM),Rk);
    /* thigh */ [ax,ay,al]=acc("thigh"); const Rh=[th.m*ax+Rk[0],th.m*ay+th.m*g+Rk[1]]; const Mh=th.I*al+Mk-cross(sub(knee,thCM),[-Rk[0],-Rk[1]])-cross(sub(hip,thCM),Rh);
    const w=stat?{ankle:0,knee:0,hip:0}:P.w; return {GRF,ankle,knee,hip,cop,ftCM,shCM,thCM,ft,sh,th,Ra,Ma,Rk,Mk,Rh,Mh,Pa:Ma*w.ankle,Pk:Mk*w.knee,Ph:Mh*w.hip,w,acc}; }
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
  const interp=(M,j)=>{ const tag={ankle:["dorsiflexor","plantarflexor"],knee:["extensor","flexor"],hip:["flexor","extensor"]}[j]; return Math.abs(M)<0.5?"≈ zero":`net <b>${M>0?tag[0]:tag[1]}</b> moment`; };
  function renderID(){ const el=$("#invdyn"); const P=PRESETS[idv.p]; const o={M:idv.M,H:idv.H,Fx:idv.Fx,Fy:idv.Fy,cop:idv.cop,static:idv.static}; const r=solveID(P,o);
    const S=300; const X=(p)=>260+p[0]*S, Y=(p)=>345-p[1]*S; const sc=0.00016*S; /* px per N */ const mArc=(c,M,col)=>{ const rr=26; const big=Math.min(1,Math.abs(M)/120); const a0=-20, a1=a0-(M>0?1:-1)*(60+200*big); const p=(a)=>[X(c)+rr*Math.cos(rad(a)),Y(c)-rr*Math.sin(rad(a))]; const [x0,y0]=p(a0),[x1,y1]=p(a1); return Math.abs(M)<0.5?"":`<path d="M${x0},${y0} A${rr},${rr} 0 ${Math.abs(a1-a0)>180?1:0} ${M>0?0:1} ${x1},${y1}" fill="none" stroke="${col}" stroke-width="3" marker-end="url(#${MK[col]}@@)"/>`; };
    const bone=(a,b,w)=>`<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="${BONE}" stroke-width="${w}" stroke-linecap="round"/>`;
    const fa=rad(P.foot), hA=0.039*idv.H, perp=[Math.sin(fa),-Math.cos(fa)]; const toe=[0.75*r.ft.L*Math.cos(fa)+hA*perp[0],0.75*r.ft.L*Math.sin(fa)+hA*perp[1]], heelPt=[-0.25*r.ft.L*Math.cos(fa)+hA*perp[0],-0.25*r.ft.L*Math.sin(fa)+hA*perp[1]];
    const fig=bone(r.hip,r.knee,16)+bone(r.knee,r.ankle,13)+bone(r.ankle,heelPt,9)+bone(heelPt,toe,9)
      +[r.ftCM,r.shCM,r.thCM].map(p=>`<circle cx="${X(p)}" cy="${Y(p)}" r="5" fill="#ffd23f" stroke="#fff"/>`).join("")
      +[["ankle",r.ankle],["knee",r.knee],["hip",r.hip]].map(([n,p])=>`<circle cx="${X(p)}" cy="${Y(p)}" r="7" fill="#101a33" stroke="#fff" stroke-width="2"/>`+txt(X(p)-14,Y(p)+4,n,'text-anchor="end" class="mlab dim"')).join("")
      +arrow(X(r.cop),Y(r.cop),X(r.cop)+r.GRF[0]*sc,Y(r.cop)-r.GRF[1]*sc,"#7cff6b",4)+txt(X(r.cop)+r.GRF[0]*sc+8,Y(r.cop)-r.GRF[1]*sc,`GRF ${f(Math.hypot(...r.GRF),0)} N`,'style="fill:#7cff6b"')
      +`<circle cx="${X(r.cop)}" cy="${Y(r.cop)}" r="5" fill="#7cff6b"/>`+txt(X(r.cop)+8,Y(r.cop)+14,"COP",'style="fill:#7cff6b"')
      +[["ankle",r.ankle,r.Ra,r.Ma],["knee",r.knee,r.Rk,r.Mk],["hip",r.hip,r.Rh,r.Mh]].map(([n,p,R,Mm])=>arrow(X(p),Y(p),X(p)+R[0]*sc,Y(p)-R[1]*sc,"#22d3ee",3)+mArc(p,Mm,"#ff8a3d")+txt(X(p)+40,Y(p)-26,`M = ${f(Mm,1)} N·m`,'style="fill:#ff8a3d"')).join("")
      +`<line x1="0" y1="${Y([0,Math.min(toe[1],heelPt[1])])+4}" x2="600" y2="${Y([0,Math.min(toe[1],heelPt[1])])+4}" stroke="#2c4274" stroke-width="2"/>`+txt(590,412,"anterior →",'text-anchor="end" class="mlab dim"');
    const row=(lab,val,u)=>`<div class="ro"><span>${lab}</span><b>${val} ${u}</b></div>`;
    const fbd=(title,seg,distName,distR,distM,proxName,R,Mm,cm,prox,dist,extra)=>`<div class="box"><h3>${title}</h3><div class="eq">ΣF_x = m a_x: R_${proxName}x ${distR?`${distR[0]>=0?"−":"+"} ${f(Math.abs(distR[0]),1)}`:`+ GRF_x`} = ${f(seg.m,2)}·a_x → <b>R_${proxName}x = ${f(R[0],1)} N</b></div><div class="eq">ΣF_y = m a_y: R_${proxName}y ${distR?`${distR[1]>=0?"−":"+"} ${f(Math.abs(distR[1]),1)}`:`+ GRF_y`} − ${f(seg.m*g,1)} = ${f(seg.m,2)}·a_y → <b>R_${proxName}y = ${f(R[1],1)} N</b></div><div class="eq">ΣM_cm = I α: M_${proxName} ${distM!==null?`− (${f(distM,1)})`:""} + r×R terms = ${f(seg.I,4)}·α → <b>M_${proxName} = ${f(Mm,1)} N·m</b> → ${interp(Mm,proxName==="a"?"ankle":proxName==="k"?"knee":"hip")}</div>${extra||""}</div>`;
    el.innerHTML=`<div class="hierbar">${Object.keys(PRESETS).map(k=>`<button type="button" class="tabbtn ${k===idv.p?"on":""}" data-pr="${k}">${PRESETS[k].n}</button>`).join("")}<label class="note" style="margin-left:auto"><input type="checkbox" id="idstatic" ${idv.static?"checked":""}> quasi-static (ignore accelerations)</label></div>
      <div class="two"><div class="ctl">
        <label>Body mass <b>${idv.M} kg</b><input type="range" data-k="M" min="40" max="120" step="1" value="${idv.M}"></label>
        <label>Vertical GRF <b>${f(idv.Fy,2)} BW = ${f(idv.Fy*idv.M*g,0)} N</b><input type="range" data-k="Fy" min="0" max="2.5" step="0.01" value="${idv.Fy}"></label>
        <label>Anterior–posterior GRF (anterior +) <b>${f(idv.Fx,2)} BW</b><input type="range" data-k="Fx" min="-0.5" max="0.5" step="0.01" value="${idv.Fx}"></label>
        <label>Centre of pressure from the ankle, along the foot <b>${f(idv.cop*100,0)} cm</b><input type="range" data-k="cop" min="-0.06" max="0.22" step="0.005" value="${idv.cop}"></label>
        <p class="note">Segment angles and accelerations come from the preset (foot ${P.foot}°, shank ${P.shank}°, thigh ${P.thigh}°${idv.static?"; accelerations set to zero":`; α_foot ${P.a.foot[2]} rad/s², α_shank ${P.a.shank[2]}, α_thigh ${P.a.thigh[2]}`}).</p>
        ${row("Ankle joint reaction on the foot",`(${f(r.Ra[0],0)}, ${f(r.Ra[1],0)})`,"N")}${row("Ankle net moment",f(r.Ma,1)+" N·m → "+interp(r.Ma,"ankle"),"")}
        ${row("Knee joint reaction on the shank",`(${f(r.Rk[0],0)}, ${f(r.Rk[1],0)})`,"N")}${row("Knee net moment",f(r.Mk,1)+" N·m → "+interp(r.Mk,"knee"),"")}
        ${row("Hip joint reaction on the thigh",`(${f(r.Rh[0],0)}, ${f(r.Rh[1],0)})`,"N")}${row("Hip net moment",f(r.Mh,1)+" N·m → "+interp(r.Mh,"hip"),"")}
        ${idv.static?"":row("Joint power P = M·ω (ankle / knee / hip)",`${f(r.Pa,0)} / ${f(r.Pk,0)} / ${f(r.Ph,0)}`,"W")}
      </div><div>${svg(600,420,ARROW+fig)}</div></div>
      <h4 style="margin:14px 0 6px">Free-body diagrams, distal → proximal</h4>
      <div class="cols">${fbd("1 · Foot",r.ft,"GRF",null,null,"a",r.Ra,r.Ma,r.ftCM,r.ankle,r.cop,`<p class="note">Known: GRF at the COP, foot weight at its COM, foot kinematics. Unknown: ankle reaction R_a and net ankle moment M_a.</p>`)}
      ${fbd("2 · Shank",r.sh,"ankle",r.Ra,r.Ma,"k",r.Rk,r.Mk,r.shCM,r.knee,r.ankle,`<p class="note">Newton's 3rd law: the shank receives −R_a and −M_a at the ankle. Solve for R_k and M_k.</p>`)}
      ${fbd("3 · Thigh",r.th,"knee",r.Rk,r.Mk,"h",r.Rh,r.Mh,r.thCM,r.hip,r.knee,`<p class="note">Same again with −R_k and −M_k at the knee. Solve for R_h and M_h.</p>`)}</div>
      <p class="note" style="margin-top:10px"><b>Reading the signs.</b> Moments are reported on the distal segment at its proximal joint, counter-clockwise positive in this right-side view, which gives the class convention: positive = ankle dorsiflexor, knee extensor, hip flexor; negative = plantarflexor, knee flexor, hip extensor. In stance the ankle moment is plantarflexor almost throughout, peaking just before toe-off. <b>Power</b> P = M·ω &gt; 0 means the muscles are generating (concentric), &lt; 0 absorbing (eccentric). The joint reaction force is the <i>net</i> bone-on-bone-plus-muscle resultant from the equations of motion — the actual compressive bone contact force is larger because the muscle forces that create M also press the surfaces together.</p>
      <p class="note"><b>Workflow.</b> (1) Kinematics: segment positions, velocities, accelerations (motion capture). (2) Anthropometrics: m, COM, I for each segment (first tab). (3) External force: GRF and COP from a force plate. (4) FBD of the most distal segment, solve ΣF = ma and ΣM_cm = Iα; pass −R, −M to the next segment; repeat up the chain.</p>`;
    el.querySelectorAll("[data-pr]").forEach(b=>b.onclick=()=>{ const pr=PRESETS[b.dataset.pr]; idv.p=b.dataset.pr; idv.Fx=pr.Fx; idv.Fy=pr.Fy; idv.cop=pr.cop; renderID(); }); el.querySelectorAll("input[data-k]").forEach(i=>i.oninput=()=>{ idv[i.dataset.k]=+i.value; renderID(); }); $("#idstatic").onchange=(e)=>{ idv.static=e.target.checked; renderID(); }; el.querySelectorAll('.cols .eq').forEach(e=>e.innerHTML=e.innerHTML.replace(/([A-Za-zΣ])_([A-Za-z0-9]+)/g,'$1<sub>$2</sub>')); fixSubs(el); }

  /* ---------- drills ---------- */
  const DR=(()=>{ const KEY="dpl-biomech-invdyn"; let St={done:0,correct:0,streak:0,best:0}; try{ Object.assign(St,JSON.parse(localStorage.getItem(KEY))||{}); }catch(e){} const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(St)); }catch(e){} };
    const pick=(a)=>a[Math.floor(Math.random()*a.length)]; const shuffle=(a)=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
    const segQ=()=>{ const ks=["thigh","shank","foot","upperarm","forearm","hand","thn"]; const k=pick(ks); const M=pick([60,70,80,90]); const ans=`${(SEG[k].m*M).toFixed(1)} kg`; const wrong=shuffle(ks.filter(x=>x!==k)).slice(0,3).map(x=>`${(SEG[x].m*M).toFixed(1)} kg`); return {q:`Body mass ${M} kg. Using Dempster's fractions, what is the mass of one ${SEG[k].n.toLowerCase()}?`,opts:shuffle([ans,...wrong]),ans,why:`${SEG[k].n}: ${SEG[k].m} × ${M} = ${(SEG[k].m*M).toFixed(1)} kg.`}; };
    const signQ=()=>{ const j=pick(["ankle","knee","hip"]); const s=pick([1,-1]); const map={ankle:["dorsiflexor","plantarflexor"],knee:["extensor","flexor"],hip:["flexor","extensor"]}; const ans=map[j][s>0?0:1]; return {q:`Inverse dynamics returns a ${s>0?"positive":"negative"} net ${j} moment (class convention). Which muscle group dominates?`,opts:shuffle([`${j} ${map[j][0]}s`,`${j} ${map[j][1]}s`,"antagonists co-contracting equally","cannot tell from a moment"]),ans:`${j} ${ans}s`,why:`Positive = hip flexion, knee extension, ankle dorsiflexion; negative = the opposite group. A net moment is the dominant group's moment minus any co-contraction.`}; };
    const powQ=()=>{ const M=pick([-80,-40,40,120]); const w=pick([-3,-1.5,1.5,3]); const P=M*w; const ans=P>0?"generating (concentric)":"absorbing (eccentric)"; return {q:`Net joint moment ${M} N·m with joint angular velocity ${w} rad/s (same sign convention). Joint power = ${P} W. The muscles are…`,opts:shuffle(["generating (concentric)","absorbing (eccentric)","isometric","transferring with no work"]),ans,why:`P = M·ω = ${P} W; positive = generation, negative = absorption.`}; };
    const Q=[segQ,segQ,signQ,signQ,powQ,
      ()=>({q:"Where is the COM of the standing adult body?",opts:shuffle(["≈ 55 % of stature, just anterior to S2","at the navel exactly, ≈ 45 % of stature","at the hip joint centre","at the sternum"]),ans:"≈ 55 % of stature, just anterior to S2",why:"Slightly above the hip joints; it moves with posture and sex/build."}),
      ()=>({q:"Can the whole-body COM lie outside the body?",opts:shuffle(["yes — e.g. a high-jumper's arch or a pike","no, it is always inside the trunk","only in zero gravity","only if a segment is missing"]),ans:"yes — e.g. a high-jumper's arch or a pike",why:"The COM is a weighted average of segment COMs; curl the body around a point and the average lands in the gap."}),
      ()=>({q:"Parallel-axis theorem: I about a joint equals…",opts:shuffle(["I_cm + m·d²","I_cm − m·d²","m·d² only","I_cm × d"]),ans:"I_cm + m·d²",why:"d is the distance from the COM to the new axis; the m·d² term usually dominates for limbs."}),
      ()=>({q:"Why does the swing leg flex at the knee during running?",opts:shuffle(["to reduce the leg's moment of inertia about the hip so it swings through faster for a given hip torque","to increase the moment of inertia","to shorten the stance phase","to lift the COM"]),ans:"to reduce the leg's moment of inertia about the hip so it swings through faster for a given hip torque",why:"Pulling the shank and foot toward the hip cuts m·d² — roughly halving I."}),
      ()=>({q:"Standing on a scale, you quickly squat down. During the downward acceleration the scale reads…",opts:shuffle(["less than body weight (GRF − W = m·a with a downward)","more than body weight","exactly body weight","zero"]),ans:"less than body weight (GRF − W = m·a with a downward)",why:"GRF = m(g + a); a is negative while speeding up downward. It reads more when you decelerate at the bottom."}),
      ()=>({q:"Inverse dynamics proceeds…",opts:shuffle(["from the most distal segment (in contact with the force plate) toward proximal","from the trunk outward","from the head down","in any order"]),ans:"from the most distal segment (in contact with the force plate) toward proximal",why:"Only the foot has a fully known external force (GRF); each solved joint feeds the next segment via Newton's 3rd law."}),
      ()=>({q:"The three inputs inverse dynamics needs are…",opts:shuffle(["kinematics, anthropometrics, external forces (GRF)","EMG, kinematics, heart rate","GRF, EMG, body mass","muscle forces, moment arms, kinematics"]),ans:"kinematics, anthropometrics, external forces (GRF)",why:"Motion capture + segment m/COM/I + force plate → joint reactions and net moments."}),
      ()=>({q:"The joint reaction force from inverse dynamics is…",opts:shuffle(["a net force — the true bone-on-bone force is larger because muscle forces add compression","the exact bone-on-bone contact force","the muscle force","always equal to the GRF"]),ans:"a net force — the true bone-on-bone force is larger because muscle forces add compression",why:"Muscles that create the net moment also press the joint surfaces together; that compression does not appear in ΣF = ma for the segment."}),
      ()=>({q:"Which segment holds about 10 % of body mass?",opts:shuffle(["one thigh","one shank","one foot","one upper arm"]),ans:"one thigh",why:"Thigh 0.100; shank 0.0465; foot 0.0145; upper arm 0.028."}),
      ()=>({q:"Dempster's COM location for the thigh and shank is about…",opts:shuffle(["43 % of the length from the proximal end","50 % — the midpoint","43 % from the distal end","at the proximal joint"]),ans:"43 % of the length from the proximal end",why:"0.433 L from the hip (thigh) and from the knee (shank): limb segments are heavier proximally."})];
    let cur=null; function next(){ cur=pick(Q)(); const el=$("#iddrill"); el.innerHTML=`<div class="dq">${cur.q}</div><div class="dopts">${cur.opts.map(o=>`<button type="button" class="btn dopt" data-o="${o.replace(/"/g,"&quot;")}">${o}</button>`).join("")}</div><div class="dfb" id="iddfb"></div><div class="dstat">Answered ${St.done} · correct ${St.correct} · streak ${St.streak} (best ${St.best})</div>`; el.querySelectorAll(".dopt").forEach(b=>b.onclick=()=>answer(b.dataset.o,b)); fixSubs(el); }
    function answer(o,b){ const ok=o===cur.ans; St.done++; if(ok){ St.correct++; St.streak++; St.best=Math.max(St.best,St.streak); } else St.streak=0; save(); $("#iddrill").querySelectorAll(".dopt").forEach(x=>{ x.disabled=true; if(x.dataset.o===cur.ans) x.classList.add("good"); else if(x===b&&!ok) x.classList.add("bad"); }); $("#iddfb").innerHTML=`<p class="${ok?"fb good":"fb bad"}">${ok?"Correct.":"Not quite — the answer is <b>"+cur.ans+"</b>."} ${cur.why}</p><button type="button" class="btn primary small" id="idnext">Next question →</button>`; $("#idnext").onclick=next; const ds=$("#iddrill .dstat"); if(ds) ds.textContent=`Answered ${St.done} · correct ${St.correct} · streak ${St.streak} (best ${St.best})`; if(typeof GAME!=="undefined"&&ok) GAME.addXP(10,St.streak>1?`+10 XP · ${St.streak} in a row`:"+10 XP"); }
    return {next}; })();

  function init(){ renderSeg(); renderCOM(); renderMOI(); renderID();
    document.querySelectorAll("#mtabs .tabbtn").forEach(b=>b.onclick=()=>{ document.querySelectorAll("#mtabs .tabbtn").forEach(x=>x.classList.toggle("on",x===b)); document.querySelectorAll(".mpane").forEach(p=>p.hidden=p.id!==b.dataset.k); if(b.dataset.k==="com") renderCOM(); if(b.dataset.k==="moi") renderMOI(); });
    $("#iddrillstart").onclick=()=>{ DR.next(); $("#iddrillstart").textContent="Skip →"; }; }
  return {init,SEG,segVals,solveID,PRESETS,legI,comCalc,get:()=>({pose,idv,moi,ap})};
})();
ID.init();
