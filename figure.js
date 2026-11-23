/* ===================== FIGURE: posable anatomical body for the simulations =====================
   Uses the ANM model (skin, muscles, bones, joints) and rigs it with a kinematic chain. Vertices are skinned to the body
   segment they lie in (anatomical position), so a bi-articular muscle stretches between its two segments when posed.
   Angles in degrees, sagittal plane unless noted: hip/shoulder/elbow/trunk/head flexion +, knee flexion +, ankle dorsiflexion +. */
const FIG=(()=>{
  const {rotAxis,add,sub,mul}=B3; const rad=(d)=>d*Math.PI/180;
  const L=ANM.L;
  /* joint centres (right side); left mirrored */
  const C={trunk:[-0.01,1.00,0],head:[-0.02,1.50,0],sh:[-0.02,1.43,0.19],el:[-0.01,1.14,0.21],wr:[0.0,0.875,0.235],hip:[0,0.92,0.09],knee:[0,0.48,0.09],ank:[0,0.08,0.085]}; if(typeof OSIM!=="undefined"){ const j=OSIM.joints; C.hip=[j.hip_r[0],j.hip_r[1],0.09]; C.knee=[j.walker_knee_r[0],j.walker_knee_r[1],0.09]; C.ank=[j.ankle_r[0],j.ankle_r[1],0.085]; }
  const Z=[0,0,1],X=[1,0,0],Y=[0,1,0];
  let pose={};
  const P=(k)=>pose[k]||0;
  const LAYER={skin:0.35,m1:1,m2:1,bone:0.9,joint:0}; let hl=new Set(); let dimOthers=false; let hlSide=null;
  /* segment of a vertex in the anatomical position */
  const segCache=new WeakMap();
  function segOf(v){ let s=segCache.get(v); if(s) return s; const fs=B3.vseg.get(v); if(fs){ segCache.set(v,fs); return fs; } const c=B3.vc.get(v)||v; const x=c[0],y=c[1],z=c[2],az=Math.abs(z),side=z>=0?"R":"L";
    if(az>0.17&&y<1.49){ s=y>1.145?"uarm"+side:y>0.875?"farm"+side:"hand"+side; }
    else if(y>1.50&&az<0.13){ s="head"; }
    else if(y<0.09&&az>0.02){ s="foot"+side; }
    else if(y<0.475&&az>0.02){ s="shank"+side; }
    else if((y<0.86&&az>0.02)||(y<0.90&&az>0.075)||(y<0.94&&az>0.15)){ s="thigh"+side; }
    else if(y<1.03&&y>=0.84){ s="pelvis"; }
    else if(y>=1.03){ s="trunk"; }
    else s="pelvis";
    segCache.set(v,s); return s; }
  const PARENT={head:"trunk",trunk:"pelvis",uarmR:"trunk",uarmL:"trunk",farmR:"uarmR",farmL:"uarmL",handR:"farmR",handL:"farmL",thighR:"pelvis",thighL:"pelvis",shankR:"thighR",shankL:"thighL",footR:"shankR",footL:"shankL",pelvis:null};
  const mirror=(c,side)=>side==="L"?[c[0],c[1],-c[2]]:c;
  function local(seg,p){ /* apply this segment's own rotation about its proximal joint */
    const side=seg.endsWith("L")?"L":"R"; const base=seg.replace(/[RL]$/,"");
    const rot=(c,ax,deg)=>deg?add(c,rotAxis(sub(p,c),ax,rad(deg))):p;
    switch(base){
      case "pelvis": { let q=rot([0,0.92,0],Z,-P("pelvisTilt")); return add(q,[P("rootX")||0,P("rootY")||0,P("rootZ")||0]); }
      case "trunk": { let q=p; q=add(C.trunk,rotAxis(sub(q,C.trunk),Z,-rad(P("trunk")))); if(P("trunkBend")) q=add(C.trunk,rotAxis(sub(q,C.trunk),X,rad(P("trunkBend")))); if(P("trunkRot")) q=add(C.trunk,rotAxis(sub(q,C.trunk),Y,rad(P("trunkRot")))); return q; }
      case "head": return rot(C.head,Z,-P("head"));
      case "uarm": { const c=mirror(C.sh,side); let q=p; const ab=P("shAbd"+side); if(ab) q=add(c,rotAxis(sub(q,c),X,rad(side==="R"?-ab:ab))); return add(c,rotAxis(sub(q,c),Z,rad(P("sh"+side)))); }
      case "farm": return rot(mirror(C.el,side),Z,P("el"+side));
      case "hand": return rot(mirror(C.wr,side),Z,P("wr"+side));
      case "thigh": { const c=mirror(C.hip,side); let q=p; const ab=P("hipAbd"+side); if(ab) q=add(c,rotAxis(sub(q,c),X,rad(side==="R"?-ab:ab))); return add(c,rotAxis(sub(q,c),Z,rad(P("hip"+side)))); }
      case "shank": return rot(mirror(C.knee,side),Z,-P("knee"+side));
      case "foot": return rot(mirror(C.ank,side),Z,P("ank"+side));
    } return p; }
  function tf(seg,p){ let q=local(seg,p); const par=PARENT[seg]; return par?tf(par,q):q; }
  const transform=(v,part)=>tf(segOf(v),v);
  function alphaOf(p){ let a=LAYER[p.layer]??1; if(a<=0.02) return 0; if(hl.size&&p.kind==="muscle"){ a=(hl.has(p.sid)&&(!hlSide||(hlSide==="R"?p.side>0:p.side<0)))?1:(dimOthers?Math.min(a,0.12):a); } if(hl.size&&dimOthers&&p.kind==="skin") a=Math.min(a,0.15); return a; }
  let byId={}, partsOf={};
  function mount(canvasSel,opts={}){ const r=ANM.build(alphaOf); byId=r.byId; partsOf=r.partsOf; B3.parts.forEach(p=>{ p.segment="rig"; }); B3.S.transform=transform; B3.S.alwaysRender=false;
    Object.assign(LAYER,opts.layers||{}); B3.cam.target=opts.target||[0,0.95,0]; B3.cam.dist=opts.dist||2.6; B3.cam.theta=opts.theta??0; B3.cam.phi=opts.phi??0.08; B3.S.viewDist=B3.cam.dist; B3.S.viewTarget=B3.cam.target.slice();
    B3.init(canvasSel,opts.onPick||null); groundFix(); B3.S.dirty=true; }
  /* keep the lowest foot point on the floor */
  function groundFix(){ const pts=[[-0.07,0.03,0.09],[0.20,0.02,0.09],[0,0.0,0.09],[-0.07,0.03,-0.09],[0.20,0.02,-0.09],[0,0.0,-0.09]]; pose.rootY=0; let minY=Infinity; pts.forEach(p=>{ const q=tf(segOf(p),p); minY=Math.min(minY,q[1]); }); pose.rootY=-minY; }
  function setPose(p,{fixGround=true}={}){ pose={...p}; if(fixGround) groundFix(); B3.S.dirty=true; }
  function highlight(ids,dim=true,side=null){ hl=new Set(ids||[]); dimOthers=dim; hlSide=side; B3.S.dirty=true; }
  function layers(l){ Object.assign(LAYER,l); B3.S.dirty=true; }
  const jointWorld=(name,side="R")=>{ const c=mirror(C[name],side); const seg={sh:"uarm",el:"farm",wr:"hand",hip:"thigh",knee:"shank",ank:"foot"}[name]; return tf(seg?seg+side:name,c); };
  return {mount,setPose,highlight,layers,pose:()=>pose,LAYER,jointWorld,C,segOf};
})();
