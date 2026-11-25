/* ===================== FIGURE (WebGL): posable Z-Anatomy body for the simulations =====================
   Same API as the old procedural figure: mount(canvasSel,opts), setPose({hipR,kneeR,ankR,hipL,kneeL,ankL,trunk,trunkBend,trunkRot,head,
   shR,shL,shAbdR,shAbdL,elR,elL,wrR,wrL,hipAbdR,hipAbdL,pelvisTilt,rootX,rootY,rootZ}), highlight(ids,dim,side), layers({...}),
   pose(), jointWorld(name,side), C (joint centers). Angles in degrees, sagittal plane unless noted: hip/shoulder/elbow/trunk/head
   flexion +, knee flexion +, ankle dorsiflexion +. Every mesh part is attached to one segment (ZA_RIG) and posed with a 4×4 matrix. */
const FIG=(()=>{
  function makeFigure(){
  const {rotAxis,add,sub,mul}=B3; const rad=(d)=>d*Math.PI/180; const Z=[0,0,1],X=[1,0,0],Y=[0,1,0];
  const R=GL3.create(); let LMK=null; const C={}; let parts=[]; let pose={}; let pending=null; let ready=false;
  const P=(k)=>pose[k]||0;
  const LAYER={skin:0,m1:1,m2:1,bone:1,joint:0,lig:0,opacity:1,dim:0.35}; let hl=new Set(); let dimOthers=false; let hlSide=null; let onReady=[];
  const PARENT={head:"neck",jaw:"head",neck:"trunk",trunk:"pelvis",scapR:"trunk",scapL:"trunk",uarmR:"scapR",uarmL:"scapL",farmR:"uarmR",farmL:"uarmL",handR:"farmR",handL:"farmL",fingR:"handR",fingL:"handL",thumbR:"handR",thumbL:"handL",thighR:"pelvis",thighL:"pelvis",shankR:"thighR",shankL:"thighL",footR:"shankR",footL:"shankL",toesR:"footR",toesL:"footL",pelvis:null};
  const mirror=(c,side)=>side==="L"?[c[0],c[1],-c[2]]:c;
  function setLandmarks(lm){ LMK=lm; C.hip=lm.HIP; C.knee=lm.KN; C.ank=lm.AN; C.sh=lm.GH; C.el=lm.EL; C.wr=lm.WR; C.trunk=lm.L5S1; C.head=lm.AO; C.pelvis=[lm.HIP[0],lm.HIP[1],0]; C.mtp=lm.MTP; C.mcp=lm.MCP; }
  function local(seg,p){ const side=seg.endsWith("L")?"L":"R"; const base=seg.replace(/[RL]$/,"");
    const rot=(c,ax,deg)=>deg?add(c,rotAxis(sub(p,c),ax,rad(deg))):p;
    switch(base){
      case "pelvis": { let q=rot(C.pelvis,Z,-P("pelvisTilt")); return add(q,[P("rootX")||0,P("rootY")||0,P("rootZ")||0]); }
      case "trunk": { let q=p; q=add(C.trunk,rotAxis(sub(q,C.trunk),Z,-rad(P("trunk")))); if(P("trunkBend")) q=add(C.trunk,rotAxis(sub(q,C.trunk),X,rad(P("trunkBend")))); if(P("trunkRot")) q=add(C.trunk,rotAxis(sub(q,C.trunk),Y,rad(P("trunkRot")))); return q; }
      case "head": return rot(C.head,Z,-P("head"));
      case "uarm": { const c=mirror(C.sh,side); let q=p; const ab=P("shAbd"+side); if(ab) q=add(c,rotAxis(sub(q,c),X,rad(side==="R"?-ab:ab))); return add(c,rotAxis(sub(q,c),Z,rad(P("sh"+side)))); }
      case "farm": { const c=mirror(C.el,side); let q=p; const pro=P("pro"+side); if(pro){ const w=mirror(C.wr,side); const ax=sub(w,c); const l=Math.hypot(ax[0],ax[1],ax[2])||1; q=add(c,rotAxis(sub(q,c),[ax[0]/l,ax[1]/l,ax[2]/l],rad(side==="R"?-pro:pro))); } return add(c,rotAxis(sub(q,c),Z,rad(P("el"+side)))); }
      case "hand": return rot(mirror(C.wr,side),Z,P("wr"+side));
      case "thigh": { const c=mirror(C.hip,side); let q=p; const ab=P("hipAbd"+side); if(ab) q=add(c,rotAxis(sub(q,c),X,rad(side==="R"?-ab:ab))); return add(c,rotAxis(sub(q,c),Z,rad(P("hip"+side)))); }
      case "shank": return rot(mirror(C.knee,side),Z,-P("knee"+side));
      case "foot": return rot(mirror(C.ank,side),Z,P("ank"+side));
      case "toes": return rot(mirror(C.mtp,side),Z,P("toe"+side));
    } return p; }
  function tf(seg,p){ let q=local(seg,p); const par=PARENT[seg]; return par?tf(par,q):q; }
  const segM={};
  function updateMatrices(){ if(!ready) return; for(const seg in PARENT){ segM[seg]=ZA_RIG.matrixOf((v)=>tf(seg,v)); } parts.forEach(p=>{ p.M=segM[p.segment]||null; if(p.extra&&p.segment) p.M=segM[p.segment]||null; }); R.S.dirty=true; }
  function alphaOf(p){ const isBone=p.c==="bone"||p.c==="cart"; let a=isBone?LAYER.bone:p.c==="lig"?LAYER.lig:(p.layer==="m2"?LAYER.m2:LAYER.m1); if(a<=0.02) return 0;
    if(hl.size&&(p.c==="muscle"||p.c==="tendon")){ const on=p.sid&&hl.has(p.sid)&&(!hlSide||(hlSide==="R"?p.side>0:p.side<0)); p.hi=!!on; if(on){ if(p._dimmed){ p.col=p._col0; p._dimmed=false; } return 1; } if(dimOthers&&!p._dimmed){ p._col0=p._col0||p.col.slice(); const c=p._col0; const g=(c[0]+c[1]+c[2])/3; p.col=[c[0]*0.72+g*0.14,c[1]*0.72+g*0.14,c[2]*0.72+g*0.14]; p._dimmed=true; } /* others stay solid but muted, so the body keeps its shape */ }
    else { p.hi=false; if(p._dimmed){ p.col=p._col0; p._dimmed=false; } }
    return a*LAYER.opacity; }
  function mount(canvasSel,opts={}){ Object.assign(LAYER,opts.layers||{}); R.S.alphaFn=alphaOf; R.S.alwaysRender=false; R.cam.target=opts.target||[0,0.95,0]; R.cam.dist=opts.dist||2.6; R.cam.theta=opts.theta??0; R.cam.phi=opts.phi??0.08; R.S.viewDist=R.cam.dist; R.S.viewTarget=R.cam.target.slice();
    R.init(canvasSel,opts.onPick||null); const cv=document.querySelector(canvasSel); const ld=document.createElement("div"); ld.className="note"; ld.style.cssText="position:absolute;left:10px;bottom:8px;pointer-events:none"; ld.textContent="loading the body…"; cv.parentElement.appendChild(ld);
    R.load("zanatomy.bin").then(ps=>{ parts=ps; setLandmarks(R.S.lm); parts.forEach(p=>{ p.sid=ZA_MAP.idOf(p); const e=p.sid&&typeof ANM!=="undefined"&&ANM.MUSCLES.find(m=>m.id===p.sid); if(e) p.layer=e.lay===1?"m1":"m2"; p.segment=ZA_RIG.segOfPart(p,LMK); }); parts.forEach(p=>{ if(p.c==="bone"||p.c==="cart") p.shrink=0.965; }); ready=true; ld.remove(); if(pending) setPose(pending.p,pending.o); else updateMatrices(); onReady.forEach(f=>f()); onReady=[]; }).catch(e=>{ ld.textContent="Could not load the body: "+e.message; }); }
  /* keep the lowest foot point on the floor */
  function groundFix(){ if(!ready) return; const pts=[LMK.AN,LMK.MTP,LMK.TOE,[LMK.AN[0]-0.05,0.01,LMK.AN[2]]]; pose.rootY=0; let minY=Infinity; pts.forEach(p=>{ ["R","L"].forEach(s=>{ const q=tf(s==="R"?"footR":"footL",mirror(p,s)); minY=Math.min(minY,q[1]); const t=tf(s==="R"?"toesR":"toesL",mirror(p,s)); minY=Math.min(minY,t[1]); }); }); pose.rootY=-minY+0.005; }
  function setPose(p,{fixGround=true}={}){ if(!ready){ pending={p,o:{fixGround}}; return; } pose={...p}; if(fixGround) groundFix(); updateMatrices(); }
  function highlight(ids,dim=true,side=null){ hl=new Set(ids||[]); dimOthers=dim; hlSide=side; R.S.dirty=true; }
  function layers(l){ Object.assign(LAYER,l); R.S.dirty=true; }
  const jointWorld=(name,side="R")=>{ if(!ready) return [0,0,0]; const c=mirror(C[name],side); const seg={sh:"uarm",el:"farm",wr:"hand",hip:"thigh",knee:"shank",ank:"foot",mtp:"toes"}[name]; return tf(seg?seg+side:name,c); };
  const segOf=(v)=>{ const az=Math.abs(v[2]); return ZA_RIG.segOfPart({center:v,side:v[2]>=0?1:-1,n:"",c:"muscle"},LMK||{AO:[0,1.54,0],TMJ:[0,1.57,0],EL:[0,1.1,0],WR:[0,0.86,0],HIP:[0,0.86,0],KN:[0,0.44,0],AN:[0,0.066,0],MTP:[0.1,0,0],C7:[0,1.44,0],L5S1:[0,0.975,0],GH:[0,1.39,0]}); };
  return {mount,setPose,highlight,layers,pose:()=>pose,LAYER,jointWorld,C,segOf,tf,R,isReady:()=>ready,onReady:(f)=>ready?f():onReady.push(f),parts:()=>parts,updateMatrices};
  }
  const main=makeFigure(); main.create=makeFigure; return main;
})();
