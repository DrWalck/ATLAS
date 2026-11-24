/* ===================== KNEE3D: the convex–concave rule on the real right knee =====================
   Femur, patella, tibia and fibula from the Z-Anatomy mesh. The moving bone rotates by θ about the femoral condyle centre
   (the healthy case: roll fully compensated by glide) plus a translation of (1 − glide)·r·θ along the plateau in the roll direction
   (pure roll when glide = 0), so the bones never pass through each other: with too little glide the joint simply rolls apart.
   Convex moves = closed chain (squat): femur on a fixed tibia, roll posterior / glide anterior.
   Concave moves = open chain (seated): tibia on a fixed femur, roll and glide both posterior. Drag the moving bone to rotate it. */
const KNEE3D=(()=>{
  let R=null; let ready=false; let LM=null; let st={mover:"convex",theta:35,glide:1}; let onChange=null; let parts=[];
  const rad=(d)=>d*Math.PI/180; const r=0.021; /* posterior femoral condyle radius, m */
  const KEEP=/^(Femur|Patella|Tibia|Fibula)$/;
  const rotZ=(a,c)=>{ const ca=Math.cos(a),sa=Math.sin(a); return new Float32Array([ca,sa,0,0, -sa,ca,0,0, 0,0,1,0, c[0]-ca*c[0]+sa*c[1], c[1]-sa*c[0]-ca*c[1], 0,1]); };
  const mulM=(A,B)=>{ const o=new Float32Array(16); for(let i=0;i<4;i++) for(let j=0;j<4;j++){ let s=0; for(let k=0;k<4;k++) s+=A[k*4+j]*B[i*4+k]; o[i*4+j]=s; } return o; };
  const trans=(t)=>new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, t[0],t[1],t[2],1]);
  const apply=(M,p)=>[M[0]*p[0]+M[4]*p[1]+M[8]*p[2]+M[12],M[1]*p[0]+M[5]*p[1]+M[9]*p[2]+M[13],M[2]*p[0]+M[6]*p[1]+M[10]*p[2]+M[14]];
  let Mf=null,Mt=null,Cc=null,P0=null,base=null;
  function update(){ if(!ready) return; const th=rad(st.theta); const g=st.glide; const K=LM.KN; Cc=[K[0]-0.004,K[1]+r,K[2]]; P0=[Cc[0],Cc[1]-r,Cc[2]];
    if(st.mover==="convex"){ base=null; /* standing: femur rotates by +θ about the condyle centre (hip goes back = flexion) and rolls posteriorly by rθ, glide brings (g·rθ) back */
      const roll=-(1-g)*r*th; Mf=mulM(trans([roll,0,0]),rotZ(th,Cc)); Mt=null; }
    else { /* seated: whole knee turned so the femur points backwards; the tibia swings by −θ about the condyle centre and its concave plateau rolls posteriorly by (1−g)·rθ along its own tangent */
      base=rotZ(Math.PI/2,Cc); const roll=(1-g)*r*th; const dirx=Math.cos(-th),diry=Math.sin(-th); /* tangent direction after the rotation, in the seated frame the plateau's forward direction is (cos,sin) of the swing */
      const local=mulM(trans([ -roll*Math.cos(th), -roll*Math.sin(th),0]),rotZ(-th,Cc)); Mt=mulM(base,local); Mf=base; }
    parts.forEach(p=>{ if(p.n==="Tibia"||p.n==="Fibula") p.M=Mt; else p.M=Mf; }); R.S.dirty=true; }
  function set(s){ Object.assign(st,s); update(); }
  function alphaOf(p){ return (p.side>0&&KEEP.test(p.n))?1:0; }
  function overlays(ctx,M,project){ if(!ready) return; const th=rad(st.theta); const K=LM.KN; const moving=st.mover==="convex"?Mf:Mt; const fixedM=st.mover==="convex"?null:Mf;
    const tfm=(p,Mx)=>Mx?apply(Mx,p):p; const P=tfm(P0,moving); /* the point of the moving surface that started in contact */
    /* current contact: the lowest point of the condyle over the plateau ≈ the condyle centre dropped by r (convex) / the plateau point under the centre (concave) */
    const centre=tfm(Cc,moving); const contact=st.mover==="convex"?[centre[0],centre[1]-r,centre[2]]:tfm([Cc[0],Cc[1]-r,Cc[2]],fixedM);
    const dir=Math.sign(st.theta)||1; const sx=st.mover==="convex"?-dir:-dir; /* roll direction of the moving bone (posterior for flexion) */
    const rollFrom=tfm([Cc[0],Cc[1]+0.05,Cc[2]+0.03],moving), rollTo=tfm([Cc[0]+sx*0.045,Cc[1]+0.05,Cc[2]+0.03],moving);
    R.arrow3(ctx,M,project,rollFrom,rollTo,"#7cff6b","roll (bone direction)",3);
    const gl=st.mover==="convex"?-sx:sx; if(st.glide>0.02){ R.arrow3(ctx,M,project,[contact[0],contact[1]-0.035,contact[2]+0.03],[contact[0]+gl*0.04*st.glide,contact[1]-0.035,contact[2]+0.03],"#22d3ee",st.mover==="convex"?"glide (opposite)":"glide (same)",3); }
    R.dot3(ctx,M,project,P,"#ff8a3d",5); R.dot3(ctx,M,project,contact,"#22d3ee",5);
    const off=Math.abs((1-st.glide)*r*th)*1000; if(off>6){ ctx.font="700 12px 'Chakra Petch', sans-serif"; ctx.fillStyle="#ff5a5a"; ctx.fillText(`⚠ roll without glide: the contact has walked ${off.toFixed(0)} mm along the plateau — the joint is rolling apart`,12,ctx.canvas.height/(window.devicePixelRatio>1?2:1)-12); } }
  function mount(sel,cb){ R=GL3.create(); onChange=cb; R.S.alphaFn=alphaOf; R.S.alwaysRender=false; R.S.minDist=0.12; R.cam.target=[0,0.44,0.08]; R.cam.dist=0.42; R.cam.theta=0.15; R.cam.phi=0.12; R.S.viewDist=0.42; R.S.viewTarget=[0,0.44,0.08];
    R.S.dragHook=(part)=>{ if(!part) return null; const moving=st.mover==="convex"?/^(Femur|Patella)$/:/^(Tibia|Fibula)$/; if(!moving.test(part.n)) return null; return (dx,dy)=>{ st.theta=Math.max(-60,Math.min(60,st.theta+(st.mover==="convex"?-dx:-dx)*0.4)); update(); if(onChange) onChange(st); }; };
    R.init(sel,null); R.S.overlays=[overlays];
    R.load("zanatomy.bin").then(ps=>{ parts=ps.filter(p=>p.side>0&&KEEP.test(p.n)); LM=R.S.lm; ready=true; R.cam.target=[LM.KN[0],LM.KN[1],LM.KN[2]]; R.S.viewTarget=R.cam.target.slice(); update(); }); }
  return {mount,set,get:()=>st,get R(){ return R; },isReady:()=>ready};
})();
