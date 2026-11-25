/* ===================== FRAMES & JOINTS LAB =====================
   Global frame (ISB): X anterior, Y superior (longitudinal), Z to the subject's right (medial–lateral).
   Cardinal planes: sagittal (X–Y, normal Z), frontal/coronal (Y–Z, normal X), transverse (X–Z, normal Y).
   Osteokinematic movements rotate a distal segment about one of those axes through the joint center.
   Angles: anatomical position = 0. Ranges are typical adult values (approximate; sources: AAOS, Norkin & White). */
const FL=(()=>{
  const $=(s)=>document.querySelector(s); const {rotAxis,add,sub,mul,norm}=B3; /* vector helpers; the body is rendered by GL3 (Z-Anatomy mesh) */
  const SKIN="#c9a98a", BONE="#dfe6f3", JOINT="#22d3ee";
  const AXIS={X:{name:"anterior–posterior",color:"#ff5a5a",v:[1,0,0]},Y:{name:"longitudinal (superior–inferior)",color:"#7cff6b",v:[0,1,0]},Z:{name:"medial–lateral",color:"#5fa8ff",v:[0,0,1]}};
  const PLANE={sagittal:{axis:"Z",color:"#ff8a3d",desc:"divides left from right; movements in it rotate about the medial–lateral (Z) axis"},frontal:{axis:"X",color:"#22d3ee",desc:"(coronal) divides front from back; movements in it rotate about the anterior–posterior (X) axis"},transverse:{axis:"Y",color:"#a78bfa",desc:"(horizontal) divides top from bottom; movements in it rotate about the longitudinal (Y) axis"}};
  /* ---------- skeleton: segments with proximal joint (pivot) and parent ---------- */
  const SEG={};  /* id -> {name, parent, pivot, end, parts:[], side} */
  const seg=(id,name,parent,pivot,end,side)=>{ SEG[id]={id,name,parent,pivot,end,side:side||null,parts:[]}; return SEG[id]; };
  /* landmarks: joint centers measured on the Z-Anatomy skeleton (right side; header 'lm' of zanatomy.bin), mirrored for the left */
  let LMK=null; const P=(k,z=1)=>{ const p=LMK[k]; return [p[0],p[1],p[2]*z]; }; const PC=(k)=>[LMK[k][0],LMK[k][1],0];
  function buildBody(){
    seg("pelvis","Pelvis",null,[LMK.HIP[0],LMK.HIP[1],0],[LMK.HIP[0],LMK.HIP[1]+0.1,0]); seg("trunk","Trunk (thorax & lumbar spine)","pelvis",PC("L5S1"),PC("C7")); seg("neck","Neck (cervical spine)","trunk",PC("C7"),PC("AA")); seg("head","Head","neck",PC("AO"),PC("HEADTOP")); seg("jaw","Mandible","head",PC("TMJ"),PC("CHIN"));
    const side=(s)=>{ const z=s==="R"?1:-1; const L=s==="R"?"right":"left";
      seg("scap"+s,`Scapula & clavicle (${L})`,"trunk",P("SC",z),P("AC",z),s);
      seg("uarm"+s,`Upper arm / humerus (${L})`,"scap"+s,P("GH",z),P("EL",z),s);
      seg("farm"+s,`Forearm (${L})`,"uarm"+s,P("EL",z),P("WR",z),s);
      seg("hand"+s,`Hand (${L})`,"farm"+s,P("WR",z),P("MCP",z),s);
      seg("fing"+s,`Fingers (${L})`,"hand"+s,P("MCP",z),P("FING",z),s);
      seg("thumb"+s,`Thumb (${L})`,"hand"+s,P("CMC",z),P("THUMB",z),s);
      seg("thigh"+s,`Thigh / femur (${L})`,"pelvis",P("HIP",z),P("KN",z),s);
      seg("shank"+s,`Shank / leg (${L})`,"thigh"+s,P("KN",z),P("AN",z),s);
      seg("foot"+s,`Foot (talus, hindfoot & midfoot, ${L})`,"shank"+s,P("AN",z),P("MTP",z),s);
      seg("toes"+s,`Toes (${L})`,"foot"+s,P("MTP",z),P("TOE",z),s); };
    side("R"); side("L"); }
  const segOfPart=(p)=>ZA_RIG.segOfPart(p,LMK);
  function assignSegments(parts){ parts.forEach(p=>{ p.segment=segOfPart(p); }); }
  /* 4×4 column-major matrix of a segment's current pose, from the point transform (affine) */
  const segM={};
  function updateMatrices(){ for(const id in SEG){ const f=cache[id]; if(!f){ segM[id]=null; continue; } const o=f([0,0,0]); const ex=sub(f([1,0,0]),o), ey=sub(f([0,1,0]),o), ez=sub(f([0,0,1]),o); segM[id]=new Float32Array([ex[0],ex[1],ex[2],0, ey[0],ey[1],ey[2],0, ez[0],ez[1],ez[2],0, o[0],o[1],o[2],1]); }
    GL3.S.parts.forEach(p=>{ p.M=segM[p.segment]||null; }); }
  /* ---------- joints ----------
     mv: movements. plane; axis letter; sign: direction of +angle about that axis for the RIGHT side (mirrored for the left);
     rng: [min,max] degrees, anatomical position 0, positive = first-named movement; tr: translation (m) instead of rotation. */
  const J=(o)=>o;
  const JOINTS=[];
  function defineJoints(){
    const both=(fn)=>["R","L"].forEach(s=>JOINTS.push(fn(s,s==="R"?1:-1,s==="R"?"right":"left")));
    JOINTS.push(J({id:"lumbar",name:"Trunk: lumbar & thoracic spine (intervertebral joints)",type:"cartilaginous (symphysis) + facet (plane) joints acting together",dof:3,child:"trunk",pos:PC("L5S1"),r:0.03,note:"Many small joints act as one 3-DOF unit: flexion/extension, lateral flexion and axial rotation.",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:-1,rng:[-30,80],rom:"flexion ≈ 80°, extension ≈ 25°"},{n:"Lateral flexion (right / left)",plane:"frontal",axis:"X",sign:1,rng:[-35,35],rom:"≈ 35° each way"},{n:"Axial rotation (right / left)",plane:"transverse",axis:"Y",sign:-1,rng:[-45,45],rom:"≈ 45° each way"}]}));
    JOINTS.push(J({id:"ao",name:"Atlanto-occipital joint (skull – C1)",type:"condyloid (ellipsoid)",dof:2,child:"head",pos:PC("AO"),r:0.022,note:"The 'yes' joint: nodding. Lateral flexion is small.",
      mv:[{n:"Flexion / extension (nodding)",plane:"sagittal",axis:"Z",sign:-1,rng:[-25,15],rom:"≈ 15° flexion, 25° extension"},{n:"Lateral flexion (slight)",plane:"frontal",axis:"X",sign:1,rng:[-5,5],rom:"≈ 5°"}]}));
    JOINTS.push(J({id:"aa",name:"Atlanto-axial joint (C1 – C2)",type:"pivot (trochoid)",dof:1,child:"neck",pos:PC("AA"),r:0.02,note:"The 'no' joint: about half of all neck rotation happens here, about the longitudinal axis (the dens of C2).",
      mv:[{n:"Rotation (right / left)",plane:"transverse",axis:"Y",sign:-1,rng:[-45,45],rom:"≈ 45° each way (whole neck ≈ 80°)"}]}));
    JOINTS.push(J({id:"cerv",name:"Cervical spine (C2 – C7)",type:"facet (plane) + intervertebral joints",dof:3,child:"neck",pos:[LMK.C7[0],(LMK.C7[1]+LMK.AA[1])/2,0],r:0.02,note:"Flexion/extension, lateral flexion and rotation of the neck below the atlas.",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:-1,rng:[-50,45],rom:"flexion ≈ 50°, extension ≈ 60°"},{n:"Lateral flexion",plane:"frontal",axis:"X",sign:1,rng:[-40,40],rom:"≈ 45°"},{n:"Rotation",plane:"transverse",axis:"Y",sign:-1,rng:[-40,40],rom:"≈ 80° total with C1–C2"}]}));
    JOINTS.push(J({id:"tmj",name:"Temporomandibular joint (TMJ)",type:"modified hinge (ginglymoarthrodial: hinge + gliding)",dof:3,child:"jaw",pos:P("TMJ"),r:0.015,note:"Rotation in the lower compartment (hinge), translation in the upper (gliding). Opening combines both.",
      mv:[{n:"Depression / elevation (opening / closing)",plane:"sagittal",axis:"Z",sign:-1,rng:[0,30],rom:"opening ≈ 40–50 mm between the incisors"},{n:"Protrusion / retrusion",plane:"transverse",tr:[1,0,0],rng:[0,0.012],rom:"≈ 10 mm",axis:"X",translation:true},{n:"Lateral deviation (right / left)",plane:"transverse",tr:[0,0,1],rng:[-0.01,0.01],rom:"≈ 10 mm each way",axis:"Z",translation:true}]}));
    both((s,z,L)=>J({id:"scapt"+s,name:`Scapulothoracic 'joint' (${L})`,type:"physiological (functional) joint: scapula gliding on the rib cage — not a true synovial joint",dof:3,child:"scap"+s,pos:P("SCAP",z),r:0.02,note:"Moves with the SC and AC joints (the shoulder girdle). The scapula slides, it does not have a fixed pivot.",
      mv:[{n:"Elevation / depression (shrug)",plane:"frontal",tr:[0,1,0],rng:[-0.02,0.05],rom:"≈ 10–12 cm total",axis:"Y",translation:true},{n:"Protraction / retraction",plane:"transverse",tr:[0,0,z],rng:[-0.03,0.04],rom:"≈ 15 cm total",axis:"Z",translation:true},{n:"Upward / downward rotation",plane:"frontal",axis:"X",sign:-z,rng:[-10,60],rom:"upward ≈ 60° during full arm elevation"}]}));
    both((s,z,L)=>J({id:"sc"+s,name:`Sternoclavicular joint (${L})`,type:"saddle (sellar), functionally 3 DOF",dof:3,child:"scap"+s,pos:P("SC",z),r:0.016,note:"The only bony link between the arm and the axial skeleton. Elevation/depression, protraction/retraction, and rotation of the clavicle.",
      mv:[{n:"Elevation / depression",plane:"frontal",axis:"X",sign:-z,rng:[-10,45],rom:"elevation ≈ 45°, depression ≈ 10°"},{n:"Protraction / retraction",plane:"transverse",axis:"Y",sign:z,rng:[-30,30],rom:"≈ 30° each way"},{n:"Posterior rotation",plane:"frontal",axis:"Z",sign:1,rng:[0,0],rom:"≈ 45° about the clavicle's own long axis (not animated)"}]}));
    both((s,z,L)=>J({id:"ac"+s,name:`Acromioclavicular joint (${L})`,type:"plane (gliding)",dof:3,child:"scap"+s,pos:P("AC",z),r:0.014,note:"Small gliding and rotational adjustments between clavicle and scapula; lets the scapula tip and rotate on the clavicle.",
      mv:[{n:"Upward / downward rotation of the scapula",plane:"frontal",axis:"X",sign:-z,rng:[0,30],rom:"≈ 30°"},{n:"Anterior / posterior tipping",plane:"sagittal",axis:"Z",sign:1,rng:[-15,15],rom:"small"},{n:"Internal / external rotation",plane:"transverse",axis:"Y",sign:z,rng:[-15,15],rom:"small"}]}));
    both((s,z,L)=>J({id:"gh"+s,name:`Shoulder: glenohumeral joint (${L})`,type:"ball-and-socket (spheroidal)",dof:3,child:"uarm"+s,pos:P("GH",z),r:0.03,note:"The most mobile joint in the body: all three planes, large ranges, shallow socket (hence the labrum, capsule and rotator cuff).",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:1,rng:[-60,180],rom:"flexion ≈ 180°, extension ≈ 60°"},{n:"Abduction / adduction",plane:"frontal",axis:"X",sign:-z,rng:[-30,180],rom:"abduction ≈ 180°, adduction ≈ 30–45° (in front of the body)"},{n:"Internal (medial) / external (lateral) rotation",plane:"transverse",axis:"Y",sign:z,rng:[-90,70],rom:"internal ≈ 70°, external ≈ 90° (arm at side)"},{n:"Horizontal adduction / abduction (arm abducted 90°)",plane:"transverse",axis:"Y",sign:z,rng:[-45,135],rom:"adduction ≈ 135°, abduction ≈ 45°",pre:{mv:1,ang:90}}]}));
    both((s,z,L)=>J({id:"elbow"+s,name:`Elbow: humeroulnar joint (${L})`,type:"hinge (ginglymus)",dof:1,child:"farm"+s,pos:P("EL",z),r:0.025,note:"One degree of freedom: flexion/extension in the sagittal plane about the medial–lateral axis. The humeroradial joint shares the hinge.",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:1,rng:[-5,145],rom:"flexion ≈ 145°, extension 0° (≈ 5° hyperextension in some people)"}]}));
    both((s,z,L)=>J({id:"ru"+s,name:`Proximal & distal radioulnar joints (${L})`,type:"pivot (trochoid)",dof:1,child:"farm"+s,pos:P("RU",z),r:0.018,note:"The radius spins about the ulna: pronation/supination in the transverse plane about the forearm's longitudinal axis. The hand goes along for the ride.",
      mv:[{n:"Pronation / supination",plane:"transverse",axis:"Y",sign:z,rng:[-85,80],rom:"≈ 80° each way"}]}));
    both((s,z,L)=>J({id:"wrist"+s,name:`Wrist: radiocarpal joint (${L})`,type:"condyloid (ellipsoid)",dof:2,child:"hand"+s,pos:P("WR",z),r:0.02,note:"Two degrees of freedom: flexion/extension and radial/ulnar deviation. No axial rotation (that comes from the radioulnar joints).",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:1,rng:[-70,80],rom:"flexion ≈ 80°, extension ≈ 70°"},{n:"Radial / ulnar deviation",plane:"frontal",axis:"X",sign:-z,rng:[-30,20],rom:"radial ≈ 20°, ulnar ≈ 30°"}]}));
    both((s,z,L)=>J({id:"mcp"+s,name:`Metacarpophalangeal (knuckle) joints (${L})`,type:"condyloid",dof:2,child:"fing"+s,pos:P("MCP",z),r:0.014,note:"Flexion/extension plus abduction/adduction (spreading the fingers). The interphalangeal joints beyond them are pure hinges.",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:1,rng:[-45,90],rom:"flexion ≈ 90°, extension ≈ 45°"},{n:"Abduction / adduction (finger spread)",plane:"frontal",axis:"X",sign:-z,rng:[-10,20],rom:"≈ 20°"}]}));
    both((s,z,L)=>J({id:"cmc"+s,name:`Thumb: first carpometacarpal joint (${L})`,type:"saddle (sellar)",dof:2,child:"thumb"+s,pos:P("CMC",z),r:0.013,note:"Saddle joint: flexion/extension and abduction/adduction, whose combination gives opposition. The thumb's planes are rotated ~90° relative to the fingers.",
      mv:[{n:"Flexion / extension",plane:"frontal",axis:"X",sign:z,rng:[-20,15],rom:"flexion ≈ 15°, extension ≈ 20° (in the plane of the palm)"},{n:"Palmar abduction / adduction",plane:"sagittal",axis:"Z",sign:1,rng:[0,70],rom:"≈ 70° (perpendicular to the palm)"},{n:"Opposition (combined)",plane:"transverse",axis:"Y",sign:-z,rng:[0,60],rom:"thumb tip to the little finger"}]}));
    both((s,z,L)=>J({id:"hip"+s,name:`Hip: acetabulofemoral joint (${L})`,type:"ball-and-socket (spheroidal)",dof:3,child:"thigh"+s,pos:P("HIP",z),r:0.03,note:"Deep socket, very stable; three planes of motion with smaller ranges than the shoulder.",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:1,rng:[-20,120],rom:"flexion ≈ 120° (knee bent), extension ≈ 20°"},{n:"Abduction / adduction",plane:"frontal",axis:"X",sign:-z,rng:[-30,45],rom:"abduction ≈ 45°, adduction ≈ 30°"},{n:"Internal / external rotation",plane:"transverse",axis:"Y",sign:z,rng:[-45,45],rom:"≈ 45° each way"}]}));
    both((s,z,L)=>J({id:"knee"+s,name:`Knee: tibiofemoral joint (${L})`,type:"modified hinge (bicondylar)",dof:2,child:"shank"+s,pos:P("KN",z),r:0.03,note:"Primarily a hinge: flexion/extension in the sagittal plane. A small amount of axial rotation is possible when the knee is flexed (the 'screw-home' mechanism locks it in extension).",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:-1,rng:[0,140],rom:"flexion ≈ 135–140°, extension 0°"},{n:"Internal / external rotation (knee flexed)",plane:"transverse",axis:"Y",sign:z,rng:[-10,30],rom:"≈ 10° internal, 30° external at 90° flexion",pre:{mv:0,ang:90}}]}));
    both((s,z,L)=>J({id:"ankle"+s,name:`Ankle: talocrural joint (${L})`,type:"hinge (ginglymus)",dof:1,child:"foot"+s,pos:P("AN",z),r:0.025,note:"Dorsiflexion/plantarflexion in the sagittal plane about a nearly medial–lateral axis through the malleoli.",
      mv:[{n:"Dorsiflexion / plantarflexion",plane:"sagittal",axis:"Z",sign:1,rng:[-50,20],rom:"dorsiflexion ≈ 20°, plantarflexion ≈ 50°"}]}));
    both((s,z,L)=>J({id:"subtalar"+s,name:`Subtalar (talocalcaneal) joint (${L})`,type:"plane (gliding), functionally a single oblique hinge",dof:1,child:"foot"+s,pos:P("SUB",z),r:0.018,note:"Inversion/eversion: described in the frontal plane about an anterior–posterior axis (the true axis is oblique, which is why inversion couples with adduction and plantarflexion as 'supination').",
      mv:[{n:"Inversion / eversion",plane:"frontal",axis:"X",sign:z,rng:[-15,35],rom:"inversion ≈ 35°, eversion ≈ 15°"}]}));
    both((s,z,L)=>J({id:"midtarsal"+s,name:`Midtarsal (transverse tarsal) joint (${L})`,type:"plane / saddle combination",dof:2,child:"foot"+s,pos:P("MID",z),r:0.014,note:"Lets the forefoot twist relative to the hindfoot; adds to inversion/eversion and lets the foot adapt to uneven ground.",
      mv:[{n:"Inversion / eversion (forefoot)",plane:"frontal",axis:"X",sign:z,rng:[-10,20],rom:"small"},{n:"Abduction / adduction (forefoot)",plane:"transverse",axis:"Y",sign:-z,rng:[-10,10],rom:"small"}]}));
    both((s,z,L)=>J({id:"mtp"+s,name:`Metatarsophalangeal joints (${L})`,type:"condyloid",dof:2,child:"toes"+s,pos:P("MTP",z),r:0.014,note:"Extension of the toes is what lets the heel rise in walking (the windlass mechanism tightens the plantar fascia).",
      mv:[{n:"Extension / flexion",plane:"sagittal",axis:"Z",sign:1,rng:[-45,70],rom:"extension ≈ 70°, flexion ≈ 45°"},{n:"Abduction / adduction",plane:"transverse",axis:"Y",sign:-z,rng:[-10,10],rom:"small"}]}));
  }
  /* ---------- kinematics: current joint angles → world transform of each segment ---------- */
  const angles={};  /* key `${joint}|${mvIndex}` -> value (deg or m) */
  function segTransform(id){ /* returns function v -> v' for a segment, composing parent transforms */
    const chain=[]; for(let s=SEG[id];s;s=SEG[s.parent]) chain.unshift(s);
    const ops=[]; for(const s of chain){ JOINTS.filter(j=>j.child===s.id).forEach(j=>{ j.mv.forEach((m,i)=>{ const a=angles[j.id+"|"+i]; if(!a) return; if(m.translation) ops.push({tr:mul(m.tr,a)}); else ops.push({pivot:j.pos,axis:AXIS[m.axis].v,ang:a*Math.PI/180*(m.sign||1)}); }); }); }
    if(!ops.length) return null;
    /* ops are in order root → distal; apply distal first so each proximal rotation also carries the distal pivot */
    return (v)=>{ let p=v.slice(); for(let k=ops.length-1;k>=0;k--){ const o=ops[k]; if(o.tr) p=add(p,o.tr); else p=add(o.pivot,rotAxis(sub(p,o.pivot),o.axis,o.ang)); } return p; };
  }
  const cache={}; function transformAll(){ for(const id in SEG) cache[id]=segTransform(id); }
  const tfPoint=(segId,v)=>{ const f=cache[segId]; return f?f(v):v; };
  /* ---------- UI state ---------- */
  const U={typeSet:null,joint:null,mv:null,anim:null,showGlobal:true,showPlanes:{sagittal:false,frontal:false,transverse:false},showFrames:false,segFrames:new Set(),labels:true,layers:{skin:0,muscles:1,bones:1},split:true,globalBeside:true,showJoints:false};
  const planeOf=(p)=>PLANE[p];
  function setMovement(j,i){ /* start oscillating animation of movement i of joint j */
    U.joint=j; U.mv=i; for(const k in angles) delete angles[k]; const m=j.mv[i]; if(m.pre) angles[j.id+"|"+m.pre.mv]=m.pre.ang;
    U.anim={j,i,t:0}; U.showPlanes={sagittal:false,frontal:false,transverse:false}; if(!U.quiz) U.showPlanes[m.plane]=true; renderPanel(); }
  function tick(dt){ if(U.anim){ U.anim.t+=dt; const m=U.anim.j.mv[U.anim.i]; const [a,b]=m.rng; const mid=(a+b)/2, amp=(b-a)/2; angles[U.anim.j.id+"|"+U.anim.i]=mid+amp*Math.sin(U.anim.t*1.2-Math.PI/2); } transformAll(); updateMatrices(); }
  /* segment center of mass as a fraction of the segment length from the proximal end (Dempster via Winter 2009) */
  const COMF={trunk:0.50,head:0.50,neck:0.5,pelvis:0.5,uarm:0.436,farm:0.430,hand:0.506,fing:0.5,thumb:0.5,thigh:0.433,shank:0.433,foot:0.50,toes:0.5,scap:0.5,jaw:0.5};
  const segCOM=(s)=>{ const f=COMF[s.id.replace(/[RL]$/,"")]??0.45; return add(s.pivot,mul(sub(s.end,s.pivot),f)); };
  /* ---------- overlays: global frame, planes, local frames, joint callouts ---------- */
  function overlays(ctx,M,project){
    const O=PC("PELV");   /* global frame origin at the pelvis origin (lower abdomen, midway between the ASIS), as in the ISB / lab convention */
    if(U.showGlobal){ const G=U.globalBeside?[O[0],O[1],O[2]+0.55]:O; /* drawn beside the body (to the subject's right) so it does not cover the pelvis; a dashed tie marks the true origin */
      if(U.globalBeside){ const a=project(O,M),b=project(G,M); if(a[2]>0.1&&b[2]>0.1){ ctx.save(); ctx.strokeStyle="rgba(234,242,255,.5)"; ctx.setLineDash([4,4]); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); ctx.restore(); ctx.fillStyle="#eaf2ff"; ctx.beginPath(); ctx.arc(a[0],a[1],3,0,Math.PI*2); ctx.fill(); } }
      ["X","Y","Z"].forEach(k=>{ const A=AXIS[k]; GL3.arrow3(ctx,M,project,G,add(G,mul(A.v,0.2)),A.color,k,2.5); });
      /* legend in the corner instead of labels over the body */ ctx.save(); ctx.font="600 12px 'Chakra Petch', sans-serif"; const rows=[["Global frame (ISB) · origin at the pelvis (dot)","#eaf2ff"],["X anterior–posterior","#ff5a5a"],["Y longitudinal (superior–inferior)","#7cff6b"],["Z medial–lateral (to the right)","#5fa8ff"]]; const w=Math.max(...rows.map(r=>ctx.measureText(r[0]).width))+16; ctx.fillStyle="rgba(5,10,24,.82)"; ctx.fillRect(10,10,w,rows.length*17+10); rows.forEach((r,i)=>{ ctx.fillStyle=r[1]; ctx.fillText(r[0],18,27+i*17); }); ctx.restore(); }
    /* cardinal planes through the body center */
    const C=[0,0.95,0]; const ext=1.0;
    const planeQuad={sagittal:[[C[0],C[1]-ext,C[2]],[C[0]+0.5,C[1]-ext,C[2]],[C[0]+0.5,C[1]+ext*0.85,C[2]],[C[0],C[1]+ext*0.85,C[2]],[C[0]-0.5,C[1]+ext*0.85,C[2]],[C[0]-0.5,C[1]-ext,C[2]]],
      frontal:[[C[0],C[1]-ext,C[2]-0.9],[C[0],C[1]-ext,C[2]+0.9],[C[0],C[1]+ext*0.85,C[2]+0.9],[C[0],C[1]+ext*0.85,C[2]-0.9]],
      transverse:[[C[0]-0.5,C[1],C[2]-0.9],[C[0]+0.5,C[1],C[2]-0.9],[C[0]+0.5,C[1],C[2]+0.9],[C[0]-0.5,C[1],C[2]+0.9]]};
    for(const k in U.showPlanes){ if(!U.showPlanes[k]) continue; const col=PLANE[k].color; let q=planeQuad[k]; if(U.anim){ const j=U.anim.j; q=q.map(p=>{ const d=sub(p,C); return add(j.pos,d); }); } /* when animating, move the plane through the joint */
      quadFill(ctx,M,project,q,col,col); fixColor(ctx,col,q,M,project,k); }
    /* local segment frames */
    const frames=U.showFrames?Object.keys(SEG).filter(k=>!/^(jaw|thumb|scap)/.test(k)):[...U.segFrames]; frames.forEach(id=>{ const s=SEG[id]; const c=segCOM(s); const o=tfPoint(id,c); const L=0.12; ["X","Y","Z"].forEach(k=>{ const A=AXIS[k]; const e=tfPoint(id,add(c,mul(A.v,L))); GL3.arrow3(ctx,M,project,o,e,A.color,U.showFrames?"":`${k}`,2); }); if(!U.showFrames) GL3.label3(ctx,M,project,o,s.name+" frame (at the segment COM)","#eaf2ff",-18); });
    /* animated joint: axis of rotation + callout */
    if(U.anim&&U.quiz){ /* during a drill: show the motion only, not its plane/axis labels */ }
    else if(U.anim){ const j=U.anim.j, m=j.mv[U.anim.i]; const A=AXIS[m.axis]; const o=j.pos; if(!m.translation){ ctx.setLineDash([6,5]); GL3.arrow3(ctx,M,project,add(o,mul(A.v,-0.25)),add(o,mul(A.v,0.25)),A.color,`axis: ${m.axis} · ${A.name}`,2.5); ctx.setLineDash([]); } else { GL3.arrow3(ctx,M,project,o,add(o,mul(m.tr,0.15)),"#ffd23f",`translation along ${m.axis}`,2.5); }
      const a=angles[j.id+"|"+U.anim.i]||0; GL3.label3(ctx,M,project,tfPoint(j.child,SEG[j.child].end),`${m.n.split(" / ")[0]}… ${m.translation?(a*1000).toFixed(0)+" mm":a.toFixed(0)+"°"}`,"#ffd23f",-16); }
    else if(U.joint&&U.labels){ GL3.label3(ctx,M,project,tfPoint(U.joint.child,U.joint.pos),U.joint.name,"#ffd23f",-18); }
    JOINTS.forEach(j=>{ const typed=U.typeSet&&U.typeSet.has(j.id); const selj=U.joint&&U.joint.id===j.id; if(U.showJoints||typed||selj){ const p=tfPoint(j.child,j.pos); if(typed||selj){ const P=project(p); if(P[2]>0.1){ const r=Math.max(9,(j.r||0.02)*P[3]*1.3); ctx.strokeStyle="#22d3ee"; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.arc(P[0],P[1],r,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]); } } GL3.dot3(ctx,M,project,p,selj?"#22d3ee":"rgba(34,211,238,.75)",selj?6:4); } });
  }
  function fixColor(ctx,col,q,M,project,k){ /* plane name tag at the top edge */ const top=q.reduce((a,b)=>b[1]>a[1]?b:a); GL3.label3(ctx,M,project,top,`${k} plane`,col,-10); }
  /* rgba from hex */
  const rgba=(hex,a)=>{ const n=parseInt(hex.slice(1),16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; };
  /* patch quad fill to use rgba */
  const quadFill=(ctx,M,project,pts,hex,stroke)=>GL3.quad3(ctx,M,project,pts,rgba(stroke,0.16),stroke);
  /* ---------- panel ---------- */
  function renderPanel(){ const el=$("#jointinfo"); if(U.quiz){ el.innerHTML=`<p class="note">Drill in progress — the joint panel is hidden so it doesn't give the answer away.</p>`; return; } const j=U.joint; if(!j){ el.innerHTML=`<p class="note">Click a body segment, pick a joint from the list, or choose a joint type to light up every joint of that kind. Each joint shows its type, degrees of freedom and the osteokinematic movements it allows, with the plane and axis of each. Press a movement to animate it.</p>`; return; }
    el.innerHTML=`<h4>${j.name}</h4><div class="jmeta"><span class="chip">${j.type}</span><span class="chip">${j.dof} DOF</span></div><p class="note">${j.note}</p>
      <table class="ptab jt"><thead><tr><th>Movement</th><th>Plane</th><th>Axis</th><th>Typical range</th><th></th></tr></thead><tbody>${j.mv.map((m,i)=>`<tr class="${U.mv===i?"on":""}"><td>${m.n}</td><td><span class="pl" style="--c:${PLANE[m.plane].color}">${m.plane}</span></td><td><span class="ax" style="--c:${AXIS[m.axis].color}">${m.axis} · ${AXIS[m.axis].name}</span>${m.translation?" (translation)":""}</td><td>${m.rom||""}</td><td><button type="button" class="btn small" data-mv="${i}">${U.mv===i?"■ stop":"▶ animate"}</button></td></tr>`).join("")}</tbody></table>
      <p class="note">Frame reminder: each segment's local frame sits at its <b>center of mass</b>; its <b>Y</b> axis is longitudinal (along the bone), <b>X</b> points anterior, <b>Z</b> points to the subject's right. The global frame sits at the pelvis origin. Movements <i>in</i> a plane rotate <i>about</i> the axis perpendicular to it.</p>
      <div class="xray"><button type="button" class="btn small" id="segframe">${U.segFrames.has(j.child)?"Hide":"Show"} the ${SEG[j.child].name} local frame</button><button type="button" class="btn small" id="clearsel">Clear</button></div>`;
    el.querySelectorAll("[data-mv]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.mv; if(U.mv===i&&U.anim){ U.anim=null; U.mv=null; for(const k in angles) delete angles[k]; renderPanel(); } else setMovement(j,i); });
    $("#segframe").onclick=()=>{ const c=j.child; if(U.segFrames.has(c)) U.segFrames.delete(c); else U.segFrames.add(c); renderPanel(); };
    $("#clearsel").onclick=()=>{ U.joint=null; U.mv=null; U.anim=null; for(const k in angles) delete angles[k]; U.showPlanes={sagittal:false,frontal:false,transverse:false}; renderPanel(); syncToggles(); const sp0=$("#split"); if(sp0) sp0.checked=U.split; };
    fixSubs(el); }
  function selectJoint(j,fly=true){ U.joint=j; U.mv=null; U.anim=null; for(const k in angles) delete angles[k]; renderPanel(); if(fly){ const side=j.pos[2]; GL3.flyTo(j.pos.slice(),1.3,side<-0.05?Math.PI-0.9:0.9,0.2); } const sel=$("#jointsel"); if(sel) sel.value=j.id; }
  function onPick(part){ if(!part){ return; } if(part.joint){ selectJoint(JOINTS.find(j=>j.id===part.joint)); return; } /* segment clicked: toggle its frame and select its proximal joint */ const sid=part.segment; if(!sid) return; const j=JOINTS.find(j=>j.child===sid); if(j) selectJoint(j); U.segFrames.add(sid); renderPanel(); }
  function syncToggles(){ for(const k in U.showPlanes){ const e=$("#pl-"+k); if(e) e.checked=U.showPlanes[k]; } const g=$("#globalframe"); if(g) g.checked=U.showGlobal; const f=$("#allframes"); if(f) f.checked=U.showFrames; }
  /* ---------- drills ---------- */
  const DR=(()=>{ const KEY="dpl-biomech-frames"; let St={done:0,correct:0,best:0,streak:0}; try{ Object.assign(St,JSON.parse(localStorage.getItem(KEY))||{}); }catch(e){} const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(St)); }catch(e){} };
    const pick=(a)=>a[Math.floor(Math.random()*a.length)]; const shuffle=(a)=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
    const TYPES=[...new Set(JOINTS.map(j=>j.type.split(" (")[0]))];
    const baseName=(j)=>j.name.replace(/ \((left|right)\)/,"");
    function make(){ const j=pick(JOINTS.filter(j=>!/left/.test(j.name))); const m=pick(j.mv); const kind=pick(["plane","axis","type","dof","which","global","segaxis","plane2"]);
      if(kind==="plane") return {j,m,q:`${m.n} of the <b>${baseName(j)}</b> takes place in which plane?`,opts:shuffle(["sagittal","frontal","transverse"]),ans:m.plane,why:`${m.n} happens in the ${m.plane} plane, about the ${AXIS[m.axis].name} (${m.axis}) axis.`};
      if(kind==="axis") return {j,m,q:`${m.n} of the <b>${baseName(j)}</b> occurs about which axis?`,opts:shuffle(["X · anterior–posterior","Y · longitudinal","Z · medial–lateral"]),ans:{X:"X · anterior–posterior",Y:"Y · longitudinal",Z:"Z · medial–lateral"}[m.axis],why:`A movement in the ${m.plane} plane rotates about the axis perpendicular to that plane: ${m.axis} (${AXIS[m.axis].name}).`};
      if(kind==="type") return {j,m,q:`What type of joint is the <b>${baseName(j)}</b>?`,opts:shuffle([j.type.split(" (")[0],...shuffle(TYPES.filter(t=>t!==j.type.split(" (")[0])).slice(0,3)]),ans:j.type.split(" (")[0],why:`${baseName(j)}: ${j.type}, ${j.dof} DOF. ${j.note}`};
      if(kind==="dof") return {j,m,q:`How many rotational degrees of freedom does the <b>${baseName(j)}</b> have?`,opts:["1","2","3"],ans:String(j.dof),why:`${j.dof} DOF: ${j.mv.map(x=>x.n.toLowerCase()).join("; ")}.`};
      if(kind==="which"){ const others=JOINTS.filter(o=>o!==j&&!/left/.test(o.name)).flatMap(o=>o.mv.map(x=>x.n)).filter(n=>!j.mv.some(x=>x.n===n)); return {j,m,q:`Which of these movements occurs at the <b>${baseName(j)}</b> in the <b>${m.plane}</b> plane?`,opts:shuffle([m.n,...shuffle([...new Set(others)]).slice(0,3)]),ans:m.n,why:`${m.n} is the ${j.dof>1?"":"only "}${m.plane}-plane movement of the ${baseName(j)}.`}; }
      if(kind==="global"){ const k=pick(["X","Y","Z"]); const d={X:"anteriorly (forward)",Y:"superiorly (up, along the long axis of the body)",Z:"to the subject's right (medial–lateral)"}[k]; return {j:null,q:`In the ISB global frame, which axis points <b>${d}</b>?`,opts:["X","Y","Z"],ans:k,why:`ISB convention: X anterior, Y superior, Z to the right.`}; }
      if(kind==="segaxis"){ const s=pick(Object.values(SEG).filter(s=>!/left/.test(s.name)&&s.parent)); const k=pick(["longitudinal (along the bone)","anterior–posterior","medial–lateral"]); const ans={"longitudinal (along the bone)":"Y","anterior–posterior":"X","medial–lateral":"Z"}[k]; return {j:JOINTS.find(x=>x.child===s.id)||null,q:`In the local frame of the <b>${s.name.replace(/ \((left|right)\)/,"")}</b>, the <b>${k}</b> axis is…`,opts:["X","Y","Z"],ans,why:`Every segment frame follows the body frame: Y along the segment, X anterior, Z medial–lateral.`}; }
      /* plane2: plane -> perpendicular axis */ const p=pick(["sagittal","frontal","transverse"]); return {j:null,q:`Movements in the <b>${p}</b> plane rotate about which axis?`,opts:shuffle(["X · anterior–posterior","Y · longitudinal","Z · medial–lateral"]),ans:{Z:"Z · medial–lateral",X:"X · anterior–posterior",Y:"Y · longitudinal"}[PLANE[p].axis],why:`The ${p} plane ${PLANE[p].desc}.`}; }
    let cur=null;
    function next(){ cur=make(); const el=$("#drill"); el.innerHTML=`<div class="dq">${cur.q}</div><div class="dopts">${shuffle(cur.opts).map(o=>`<button type="button" class="btn dopt" data-o="${o.replace(/"/g,"&quot;")}">${o}</button>`).join("")}</div><div class="dfb" id="dfb"></div><div class="dstat">Answered ${St.done} · correct ${St.correct} · in a row ${St.streak} (best ${St.best})</div>`;
      U.quiz=true; if(cur.j){ selectJoint(cur.j,true); if(cur.m){ const i=cur.j.mv.indexOf(cur.m); if(i>=0) setMovement(cur.j,i); } } $("#jointinfo").innerHTML=`<p class="note">Drill in progress — the joint panel is hidden so it doesn't give the answer away.</p>`;
      el.querySelectorAll(".dopt").forEach(b=>b.onclick=()=>answer(b.dataset.o,b)); fixSubs(el); }
    function answer(o,b){ const ok=o===cur.ans; U.quiz=false; if(U.anim){ U.showPlanes[U.anim.j.mv[U.anim.i].plane]=true; } renderPanel(); St.done++; if(ok){ St.correct++; St.streak++; St.best=Math.max(St.best,St.streak); } else St.streak=0; save();
      $("#drill").querySelectorAll(".dopt").forEach(x=>{ x.disabled=true; if(x.dataset.o===cur.ans) x.classList.add("good"); else if(x===b&&!ok) x.classList.add("bad"); });
      $("#dfb").innerHTML=`<p class="${ok?"fb good":"fb bad"}">${ok?"Correct.":"Not quite — the answer is <b>"+cur.ans+"</b>."} ${cur.why}</p><button type="button" class="btn primary small" id="dnext">Next question →</button>`; $("#dnext").onclick=next; const ds=$("#drill .dstat"); if(ds) ds.textContent=`Answered ${St.done} · correct ${St.correct} · in a row ${St.streak} (best ${St.best})`;
      if(typeof GAME!=="undefined"){ if(ok) GAME.addXP(10,St.streak>1?`+10 XP · ${St.streak} in a row`:"+10 XP"); else GAME.addXP(0); } }
    return {next}; })();
  /* ---------- init ---------- */
  function alphaOf(p){ const isBone=p.c==="bone"||p.c==="cart"; if(p.c==="lig") return U.layers.skin; const a=isBone?U.layers.bones:U.layers.muscles; if(!U.split||p.side===0) return a; return p.side>0?(isBone?U.layers.bones:0):(isBone?0:U.layers.muscles); }
  function init(){
    GL3.S.alphaFn=alphaOf; GL3.S.alwaysRender=true; GL3.S.viewDist=2.6; GL3.S.viewTarget=[0,0.88,0]; GL3.cam.target=[0,0.88,0]; GL3.cam.dist=2.7; GL3.cam.theta=0.95; GL3.cam.phi=0.2;
    GL3.init("#bcanvas",onPick);
    const ld=document.createElement("div"); ld.className="note"; ld.style.cssText="position:absolute;left:12px;bottom:12px"; ld.textContent="loading the body (10 MB)…"; $("#bscene").appendChild(ld);
    GL3.load("zanatomy.bin").then(parts=>{ LMK=GL3.S.lm; defineJoints(); buildBody(); assignSegments(parts); transformAll(); updateMatrices(); GL3.S.tick=tick; GL3.S.overlays=[overlays]; ld.remove(); afterLoad(); }).catch(e=>{ ld.textContent="Could not load the body mesh: "+e.message; }); }
  function afterLoad(){
    const sel=$("#jointsel"); sel.innerHTML=`<option value="">Jump to a joint…</option>`+JOINTS.map(j=>`<option value="${j.id}">${j.name}</option>`).join(""); sel.onchange=()=>{ const j=JOINTS.find(x=>x.id===sel.value); if(j) selectJoint(j); };
    for(const k in U.showPlanes){ const e=$("#pl-"+k); if(e) e.onchange=()=>{ U.showPlanes[k]=e.checked; }; }
    $("#globalframe").onchange=(e)=>U.showGlobal=e.target.checked; const gb=$("#globalbeside"); if(gb) gb.onchange=(e)=>U.globalBeside=e.target.checked; const sj=$("#showjoints"); if(sj) sj.onchange=(e)=>U.showJoints=e.target.checked; $("#allframes").onchange=(e)=>U.showFrames=e.target.checked;
    ["skin","muscles","bones"].forEach(k=>{ const e=$("#lay-"+k); if(e){ e.value=U.layers[k]; e.oninput=()=>{ U.layers[k]=+e.value; }; } }); const sp=$("#split"); if(sp) sp.onchange=()=>{ U.split=sp.checked; }; document.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>{ const p=b.dataset.preset; U.split=false; if(p==="skin") U.layers={skin:1,muscles:1,bones:1}; if(p==="muscles") U.layers={skin:0,muscles:1,bones:1}; if(p==="bones") U.layers={skin:0,muscles:0,bones:1}; if(p==="half"){ U.layers={skin:0,muscles:1,bones:1}; U.split=true; } ["skin","muscles","bones"].forEach(k=>{ const e=$("#lay-"+k); if(e) e.value=U.layers[k]; }); if(sp) sp.checked=U.split; });
    $("#drillstart").onclick=()=>{ DR.next(); $("#drillstart").textContent="Skip →"; };
    document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>GL3.view(b.dataset.view));
    document.querySelectorAll("[data-jtype]").forEach(b=>b.onclick=()=>{ const t=b.dataset.jtype; const on=b.classList.contains("on"); document.querySelectorAll("[data-jtype]").forEach(x=>x.classList.remove("on")); const list=$("#jtypelist");
      if(on){ U.typeSet=null; list.textContent="Pick a type to light up every joint of that kind on the body."; return; }
      b.classList.add("on"); const hits=JOINTS.filter(j=>j.type.toLowerCase().startsWith(t)||(t==="plane"&&/^plane/.test(j.type))||(t==="modified hinge"&&/^modified hinge/.test(j.type))); U.typeSet=new Set(hits.map(j=>j.id)); const seen=new Set();
      list.innerHTML=hits.filter(j=>{ const n=j.name.replace(/ \((left|right)\)/,""); if(seen.has(n)) return false; seen.add(n); return true; }).map(j=>`<a href="#" data-jid="${j.id}">${j.name.replace(/ \((left|right)\)/,"")}</a>`).join(" · ")||"none in this body";
      list.querySelectorAll("[data-jid]").forEach(a=>a.onclick=(ev)=>{ ev.preventDefault(); const j=JOINTS.find(x=>x.id===a.dataset.jid); if(j) selectJoint(j); }); GL3.flyTo([0,0.88,0],2.7); });
    document.querySelectorAll("#tabs .tabbtn").forEach(b=>b.onclick=()=>{ document.querySelectorAll("#tabs .tabbtn").forEach(x=>x.classList.toggle("on",x===b)); $("#explore").hidden=b.dataset.k!=="explore"; $("#drills").hidden=b.dataset.k!=="drills"; $("#reference").hidden=b.dataset.k!=="reference"; if(b.dataset.k==="reference") renderReference(); });
    renderPanel(); syncToggles(); const sp0=$("#split"); if(sp0) sp0.checked=U.split; }
  function renderReference(){ const el=$("#reftable"); if(el.dataset.done) return; el.dataset.done=1; const seen=new Set(); const rows=JOINTS.filter(j=>{ const b=j.name.replace(/ \((left|right)\)/,""); if(seen.has(b)) return false; seen.add(b); return true; });
    el.innerHTML=`<table class="ptab jt"><thead><tr><th>Joint</th><th>Type</th><th>DOF</th><th>Movements · plane · axis · typical range</th></tr></thead><tbody>${rows.map(j=>`<tr><td><a href="#" data-jid="${j.id}"><b>${j.name.replace(/ \((left|right)\)/,"")}</b></a></td><td>${j.type}</td><td>${j.dof}</td><td>${j.mv.map(m=>`<div>${m.n} — <span class="pl" style="--c:${PLANE[m.plane].color}">${m.plane}</span> · <span class="ax" style="--c:${AXIS[m.axis].color}">${m.axis}</span> ${m.rom?"· "+m.rom:""}</div>`).join("")}</td></tr>`).join("")}</tbody></table><p class="note">Ranges are typical adult values and vary with age, sex, and measurement method (AAOS; Norkin &amp; White, <i>Measurement of Joint Motion</i>). Plane and axis follow the ISB recommendation (Wu et al., J. Biomech. 2002, 2005).</p>`; fixSubs(el); el.querySelectorAll("[data-jid]").forEach(a=>a.onclick=(ev)=>{ ev.preventDefault(); document.querySelector('#tabs [data-k="explore"]').click(); const j=JOINTS.find(x=>x.id===a.dataset.jid); if(j) selectJoint(j); window.scrollTo({top:0,behavior:"smooth"}); }); }
  return {init,JOINTS,SEG,U,selectJoint,setMovement,angles};
})();
FL.init();
