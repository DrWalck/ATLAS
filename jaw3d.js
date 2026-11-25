/* ===================== JAW3D: the implant-comparison study on the real skull =====================
   Skull + mandible (and the jaw-closing muscles) from the Z-Anatomy mesh. The mandible is driven with the two-phase kinematics of
   Walck, Lim & Rosenstein: pure rotation about the condylar ICR from 0° to 22° of jaw rotation, then rotation plus translation of the
   condyle along the fossa path up to 32° (maximum mouth open, MMO). Four systems: healthy jaw, patient-specific implant (rotation +
   a 7.65 % shorter translation path), generic implant and free fibula flap (rotation only, 22° maximum). Muscle lines of action use the
   study's origin/insertion coordinates (mm, relative to the ICR; cut muscles drawn dashed).                                           */
const JAW3D=(()=>{
  let R=null, ready=false, LM=null, parts=[], st={system:"healthy",angle:0,showMuscles:false,showLines:true}, T=null, inc0=null;
  const rad=(d)=>d*Math.PI/180;
  const SYS={healthy:{n:"Healthy jaw",max:32,trans:1.0},ps:{n:"Patient-specific implant",max:32,trans:16.9/18.3},generic:{n:"Generic implant",max:22,trans:0},fff:{n:"Free fibula flap",max:22,trans:0}};
  const JAWPART=/^(Mandible|Lower .*(incisor|canine|molar|premolar))$/; const MUSPART=/masseter|Temporalis muscle|pterygoid/i;
  const rotZ=(a,c)=>{ const ca=Math.cos(a),sa=Math.sin(a); return new Float32Array([ca,sa,0,0, -sa,ca,0,0, 0,0,1,0, c[0]-ca*c[0]+sa*c[1], c[1]-sa*c[0]-ca*c[1], 0,1]); };
  const apply=(M,p)=>M?[M[0]*p[0]+M[4]*p[1]+M[8]*p[2]+M[12],M[1]*p[0]+M[5]*p[1]+M[9]*p[2]+M[13],M[2]*p[0]+M[6]*p[1]+M[10]*p[2]+M[14]]:p;
  let Mj=null;
  function kin(){ const S=SYS[st.system]; const a=Math.min(st.angle,S.max); const ph2=Math.max(0,a-22)/10; /* 0→1 over the translation phase */
    const tx=0.0183*S.trans*ph2, ty=-0.0039*S.trans*ph2; /* condyle: 18.3 mm anterior, 3.9 mm inferior at MMO (healthy) */
    const M=rotZ(-rad(a),T); M[12]+=tx; M[13]+=ty; return {M,a,tx,ty}; }
  function update(){ if(!ready) return; const k=kin(); Mj=k.M; parts.forEach(p=>{ if(p._jaw) p.M=Mj; }); R.S.dirty=true; }
  function alphaOf(p){ if(p._jaw||p._skull) return 1; if(p._mus) return st.showMuscles?(cutSet().has(p._musName)?0.12:0.85):0; return 0; }
  function cutSet(){ const F=JAWDATA.force[st.system]; const s=new Set(); JAWDATA.muscles.forEach((m,i)=>{ if(F[i]===0) s.add(m.n); }); return s; }
  /* study coordinates (mm, origin at the ICR; x lateral, y up, z anterior) → ATLAS meters */
  const P=(c)=>[T[0]+c[2]/1000, T[1]+c[1]/1000, T[2]+c[0]/1000];
  function overlays(ctx,M,project){ if(!ready||!st.showLines) return; const F=JAWDATA.force[st.system]; const full=JAWDATA.force.healthy;
    JAWDATA.muscles.forEach((m,i)=>{ if(/lateral pterygoid/.test(m.n)) return; const o=P(m.org), ins=apply(Mj,P(m.ins)); const A=project(o),B=project(ins); if(A[2]<0.1||B[2]<0.1) return; const cut=F[i]===0, partial=F[i]>0&&F[i]<full[i];
      ctx.save(); ctx.lineWidth=cut?1.5:2.5; ctx.strokeStyle=cut?"rgba(200,200,220,.45)":partial?"#ffd23f":"#7cff6b"; if(cut) ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.stroke(); ctx.restore();
      ctx.fillStyle=cut?"rgba(200,200,220,.6)":"#7cff6b"; ctx.beginPath(); ctx.arc(A[0],A[1],3,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#ffd23f"; ctx.beginPath(); ctx.arc(B[0],B[1],3,0,Math.PI*2); ctx.fill();
      const t=0.28+0.09*(i%3); const lx=A[0]+(B[0]-A[0])*t, ly=A[1]+(B[1]-A[1])*t; const txt=m.n+(cut?" (cut)":partial?" (20 % cut)":"")+" · "+F[i].toFixed(0)+" N"; ctx.font="600 11px 'Chakra Petch', sans-serif"; const w=ctx.measureText(txt).width+8; ctx.fillStyle="rgba(5,10,24,.8)"; ctx.fillRect(lx+4,ly-13,w,16); ctx.fillStyle=cut?"rgba(200,200,220,.7)":"#eaf2ff"; ctx.fillText(txt,lx+8,ly-1); });
    const icr=apply(null,T); R.dot3(ctx,M,project,icr,"#22d3ee",5); R.label3(ctx,M,project,icr,"ICR of the condyle (origin)","#22d3ee",22);
    const k=kin(); if(k.tx>0){ R.arrow3(ctx,M,project,T,[T[0]+k.tx*3,T[1]+k.ty*3,T[2]],"#ff8a3d",`condyle slide ${(Math.hypot(k.tx,k.ty)*1000).toFixed(1)} mm`,2); } }
  function incisor(){ const p=parts.find(x=>x.n==="Lower medial incisor"&&x.side>=0)||parts.find(x=>x.n==="Mandible"); if(!p) return null; const c=[(p.bb[0]+p.bb[3])/2,p.bb[4],0]; return c; }
  function readout(){ if(!ready) return null; const i0=incisor(); const i1=apply(Mj,i0); const k=kin(); return {disp:Math.hypot(i1[0]-i0[0],i1[1]-i0[1])*1000,inferior:(i0[1]-i1[1])*1000,angle:k.a,slide:Math.hypot(k.tx,k.ty)*1000,max:SYS[st.system].max}; }
  function mount(sel){ R=GL3.create(); R.S.alphaFn=alphaOf; R.S.alwaysRender=false; R.S.minDist=0.15; R.cam.theta=0.25; R.cam.phi=0.05; R.S.overlays=[overlays];
    R.init(sel,null);
    R.load("zanatomy.bin").then(ps=>{ parts=ps; LM=R.S.lm; T=[LM.TMJ[0],LM.TMJ[1],0]; /* rotation axis through both condyles */
      parts.forEach(p=>{ p._jaw=JAWPART.test(p.n); p._skull=!p._jaw&&(ZA_MAP.idOf(p)==="skull"||/^(Upper .*(incisor|canine|molar|premolar)|Hyoid)/.test(p.n)); p._mus=MUSPART.test(p.n)&&(p.c==="muscle"||p.c==="tendon"); if(p._mus){ p._musName=/Superficial part of masseter/.test(p.n)?"Superficial masseter":/Deep part of masseter/.test(p.n)?"Deep masseter":/Temporalis/.test(p.n)?"Anterior temporalis":/Medial pterygoid/.test(p.n)?"Medial pterygoid":/lateral pterygoid/i.test(p.n)?"Inferior lateral pterygoid":""; }
        /* muscles that insert on the mandible stay with the skull in this view (their lines of action are drawn separately) */ });
      ready=true; R.cam.target=[T[0]+0.02,T[1]-0.04,0]; R.cam.dist=0.42; R.S.viewTarget=R.cam.target.slice(); R.S.viewDist=0.42; update(); if(onReady) onReady(); }); }
  let onReady=null;
  function set(s){ Object.assign(st,s); update(); }
  return {mount,set,get:()=>st,readout,SYS,isReady:()=>ready,onReady:(f)=>{ onReady=f; if(ready) f(); },get R(){ return R; }};
})();
