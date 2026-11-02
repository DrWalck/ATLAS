/* ===================== FRAMES & JOINTS LAB =====================
   Global frame (ISB): X anterior, Y superior (longitudinal), Z to the subject's right (medial–lateral).
   Cardinal planes: sagittal (X–Y, normal Z), frontal/coronal (Y–Z, normal X), transverse (X–Z, normal Y).
   Osteokinematic movements rotate a distal segment about one of those axes through the joint centre.
   Angles: anatomical position = 0. Ranges are typical adult values (approximate; sources: AAOS, Norkin & White). */
const FL=(()=>{
  const $=(s)=>document.querySelector(s); const {addPart,capsule,box,sphere,lathe,cam,S,arrow3,quad3,label3,rotAxis,add,sub,mul,norm}=B3;
  const SKIN="#c9a98a", BONE="#dfe6f3", JOINT="#ffd23f";
  const AXIS={X:{name:"anterior–posterior",color:"#ff5a5a",v:[1,0,0]},Y:{name:"longitudinal (superior–inferior)",color:"#7cff6b",v:[0,1,0]},Z:{name:"medial–lateral",color:"#5fa8ff",v:[0,0,1]}};
  const PLANE={sagittal:{axis:"Z",color:"#ff8a3d",desc:"divides left from right; movements in it rotate about the medial–lateral (Z) axis"},frontal:{axis:"X",color:"#22d3ee",desc:"(coronal) divides front from back; movements in it rotate about the anterior–posterior (X) axis"},transverse:{axis:"Y",color:"#a78bfa",desc:"(horizontal) divides top from bottom; movements in it rotate about the longitudinal (Y) axis"}};
  /* ---------- skeleton: segments with proximal joint (pivot) and parent ---------- */
  const SEG={};  /* id -> {name, parent, pivot, end, parts:[], side} */
  const seg=(id,name,parent,pivot,end,side)=>{ SEG[id]={id,name,parent,pivot,end,side:side||null,parts:[]}; return SEG[id]; };
  const H=1.0;  /* hip centre height */
  function buildBody(){
    /* trunk & head */
    seg("pelvis","Pelvis",null,[0,H,0],[0,H+0.1,0]); seg("trunk","Trunk (thorax & lumbar spine)","pelvis",[0,H+0.1,0],[0,H+0.5,0]); seg("neck","Neck (cervical spine)","trunk",[0,H+0.5,0],[0,H+0.62,0]); seg("head","Head","neck",[0,H+0.62,0],[0,H+0.82,0]); seg("jaw","Mandible","head",[-0.02,H+0.66,0],[0.07,H+0.6,0]);
    const side=(s)=>{ const z=s==="R"?1:-1; const L=s==="R"?"right":"left";
      seg("scap"+s,`Scapula (${L})`,"trunk",[0,H+0.48,0.03*z],[0,H+0.5,0.18*z],s);
      seg("uarm"+s,`Upper arm / humerus (${L})`,"scap"+s,[0,H+0.45,0.21*z],[0,H+0.14,0.21*z],s);
      seg("farm"+s,`Forearm (${L})`,"uarm"+s,[0,H+0.14,0.21*z],[0,H-0.1,0.21*z],s);
      seg("hand"+s,`Hand (${L})`,"farm"+s,[0,H-0.1,0.21*z],[0,H-0.19,0.21*z],s);
      seg("fing"+s,`Fingers (${L})`,"hand"+s,[0,H-0.19,0.21*z],[0,H-0.28,0.21*z],s);
      seg("thumb"+s,`Thumb (${L})`,"hand"+s,[0.02,H-0.12,0.17*z],[0.05,H-0.18,0.14*z],s);
      seg("thigh"+s,`Thigh / femur (${L})`,"pelvis",[0,H,0.09*z],[0,H-0.45,0.09*z],s);
      seg("shank"+s,`Shank / leg (${L})`,"thigh"+s,[0,H-0.45,0.09*z],[0,H-0.9,0.09*z],s);
      seg("foot"+s,`Foot (talus & midfoot, ${L})`,"shank"+s,[0,H-0.9,0.09*z],[0.12,H-0.97,0.09*z],s);
      seg("calc"+s,`Calcaneus / hindfoot (${L})`,"foot"+s,[0,H-0.92,0.09*z],[-0.06,H-0.98,0.09*z],s);
      seg("toes"+s,`Toes (${L})`,"foot"+s,[0.14,H-0.97,0.09*z],[0.21,H-0.97,0.09*z],s); };
    side("R"); side("L");
    /* geometry per segment (world coords in anatomical position) */
    const P=(id,color,alpha,build)=>{ const p=addPart({id,segment:id,color,alpha,name:SEG[id].name}); SEG[id].parts.push(p); build(p); return p; };
    P("pelvis",SKIN,1,p=>box(p,-0.08,H-0.07,-0.15,0.08,H+0.1,0.15));
    P("trunk",SKIN,1,p=>{ lathe(p,[[0,0.13],[0.15,0.15],[0.32,0.16],[0.4,0.14]],14,[0,H+0.1,0],"y",1); box(p,-0.04,H+0.1,-0.17,0.04,H+0.5,0.17); });
    P("neck",SKIN,1,p=>capsule(p,[0,H+0.5,0],[0,H+0.6,0],0.045,10));
    P("head",SKIN,1,p=>{ sphere(p,[0,H+0.74,0],0.1,14); });
    P("jaw","#b89078",1,p=>box(p,-0.03,H+0.6,-0.055,0.075,H+0.66,0.055));
    ["R","L"].forEach(s=>{ const z=s==="R"?1:-1;
      P("scap"+s,BONE,1,p=>{ box(p,-0.07,H+0.3,0.03*z,-0.05,H+0.48,0.16*z); capsule(p,[0.02,H+0.48,0.03*z],[0.0,H+0.5,0.19*z],0.012,8); });
      P("uarm"+s,SKIN,1,p=>capsule(p,[0,H+0.45,0.21*z],[0,H+0.14,0.21*z],0.045,10));
      P("farm"+s,SKIN,1,p=>capsule(p,[0,H+0.14,0.21*z],[0,H-0.1,0.21*z],0.035,10));
      P("hand"+s,SKIN,1,p=>box(p,-0.012,H-0.19,(0.21-0.04)*z,0.012,H-0.1,(0.21+0.04)*z));
      P("fing"+s,SKIN,1,p=>{ for(let i=0;i<4;i++){ const zz=(0.21-0.035+i*0.023)*z; capsule(p,[0,H-0.19,zz],[0,H-0.27,zz],0.008,6); } });
      P("thumb"+s,SKIN,1,p=>capsule(p,[0.02,H-0.12,0.17*z],[0.05,H-0.18,0.14*z],0.01,6));
      P("thigh"+s,SKIN,1,p=>capsule(p,[0,H,0.09*z],[0,H-0.45,0.09*z],0.07,12));
      P("shank"+s,SKIN,1,p=>capsule(p,[0,H-0.45,0.09*z],[0,H-0.9,0.09*z],0.05,10));
      P("foot"+s,SKIN,1,p=>box(p,-0.02,H-1.0,(0.09-0.045)*z,0.14,H-0.93,(0.09+0.045)*z));
      P("calc"+s,"#b89078",1,p=>box(p,-0.07,H-1.0,(0.09-0.04)*z,-0.02,H-0.9,(0.09+0.04)*z));
      P("toes"+s,SKIN,1,p=>box(p,0.14,H-1.0,(0.09-0.045)*z,0.21,H-0.955,(0.09+0.045)*z)); });
    /* joint markers */
    JOINTS.forEach(j=>{ const p=addPart({id:"J_"+j.id,joint:j.id,segment:j.child,color:JOINT,alpha:0.95,name:j.name,noPick:false}); sphere(p,j.pos,j.r||0.022,8); });
    /* local frame origin markers are drawn as overlays */
  }
  /* ---------- joints ----------
     mv: movements. plane; axis letter; sign: direction of +angle about that axis for the RIGHT side (mirrored for the left);
     rng: [min,max] degrees, anatomical position 0, positive = first-named movement; tr: translation (m) instead of rotation. */
  const J=(o)=>o;
  const JOINTS=[];
  function defineJoints(){
    const both=(fn)=>["R","L"].forEach(s=>JOINTS.push(fn(s,s==="R"?1:-1,s==="R"?"right":"left")));
    JOINTS.push(J({id:"lumbar",name:"Trunk: lumbar & thoracic spine (intervertebral joints)",type:"cartilaginous (symphysis) + facet (plane) joints acting together",dof:3,child:"trunk",pos:[0,H+0.1,0],r:0.03,note:"Many small joints act as one 3-DOF unit: flexion/extension, lateral flexion and axial rotation.",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:-1,rng:[-30,80],rom:"flexion ≈ 80°, extension ≈ 25°"},{n:"Lateral flexion (right / left)",plane:"frontal",axis:"X",sign:1,rng:[-35,35],rom:"≈ 35° each way"},{n:"Axial rotation (right / left)",plane:"transverse",axis:"Y",sign:-1,rng:[-45,45],rom:"≈ 45° each way"}]}));
    JOINTS.push(J({id:"ao",name:"Atlanto-occipital joint (skull – C1)",type:"condyloid (ellipsoid)",dof:2,child:"head",pos:[0,H+0.62,0],r:0.022,note:"The 'yes' joint: nodding. Lateral flexion is small.",
      mv:[{n:"Flexion / extension (nodding)",plane:"sagittal",axis:"Z",sign:-1,rng:[-25,15],rom:"≈ 15° flexion, 25° extension"},{n:"Lateral flexion (slight)",plane:"frontal",axis:"X",sign:1,rng:[-5,5],rom:"≈ 5°"}]}));
    JOINTS.push(J({id:"aa",name:"Atlanto-axial joint (C1 – C2)",type:"pivot (trochoid)",dof:1,child:"neck",pos:[0,H+0.56,0],r:0.02,note:"The 'no' joint: about half of all neck rotation happens here, about the longitudinal axis (the dens of C2).",
      mv:[{n:"Rotation (right / left)",plane:"transverse",axis:"Y",sign:-1,rng:[-45,45],rom:"≈ 45° each way (whole neck ≈ 80°)"}]}));
    JOINTS.push(J({id:"cerv",name:"Cervical spine (C2 – C7)",type:"facet (plane) + intervertebral joints",dof:3,child:"neck",pos:[0,H+0.5,0],r:0.02,note:"Flexion/extension, lateral flexion and rotation of the neck below the atlas.",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:-1,rng:[-50,45],rom:"flexion ≈ 50°, extension ≈ 60°"},{n:"Lateral flexion",plane:"frontal",axis:"X",sign:1,rng:[-40,40],rom:"≈ 45°"},{n:"Rotation",plane:"transverse",axis:"Y",sign:-1,rng:[-40,40],rom:"≈ 80° total with C1–C2"}]}));
    JOINTS.push(J({id:"tmj",name:"Temporomandibular joint (TMJ)",type:"modified hinge (ginglymoarthrodial: hinge + gliding)",dof:3,child:"jaw",pos:[-0.02,H+0.66,0.06],r:0.015,note:"Rotation in the lower compartment (hinge), translation in the upper (gliding). Opening combines both.",
      mv:[{n:"Depression / elevation (opening / closing)",plane:"sagittal",axis:"Z",sign:-1,rng:[0,30],rom:"opening ≈ 40–50 mm between the incisors"},{n:"Protrusion / retrusion",plane:"transverse",tr:[1,0,0],rng:[0,0.012],rom:"≈ 10 mm",axis:"X",translation:true},{n:"Lateral deviation (right / left)",plane:"transverse",tr:[0,0,1],rng:[-0.01,0.01],rom:"≈ 10 mm each way",axis:"Z",translation:true}]}));
    both((s,z,L)=>J({id:"scapt"+s,name:`Scapulothoracic 'joint' (${L})`,type:"physiological (functional) joint: scapula gliding on the rib cage — not a true synovial joint",dof:3,child:"scap"+s,pos:[-0.06,H+0.4,0.1*z],r:0.02,note:"Moves with the SC and AC joints (the shoulder girdle). The scapula slides, it does not have a fixed pivot.",
      mv:[{n:"Elevation / depression (shrug)",plane:"frontal",tr:[0,1,0],rng:[-0.02,0.05],rom:"≈ 10–12 cm total",axis:"Y",translation:true},{n:"Protraction / retraction",plane:"transverse",tr:[0,0,z],rng:[-0.03,0.04],rom:"≈ 15 cm total",axis:"Z",translation:true},{n:"Upward / downward rotation",plane:"frontal",axis:"X",sign:-z,rng:[-10,60],rom:"upward ≈ 60° during full arm elevation"}]}));
    both((s,z,L)=>J({id:"sc"+s,name:`Sternoclavicular joint (${L})`,type:"saddle (sellar), functionally 3 DOF",dof:3,child:"scap"+s,pos:[0,H+0.48,0.03*z],r:0.016,note:"The only bony link between the arm and the axial skeleton. Elevation/depression, protraction/retraction, and rotation of the clavicle.",
      mv:[{n:"Elevation / depression",plane:"frontal",axis:"X",sign:-z,rng:[-10,45],rom:"elevation ≈ 45°, depression ≈ 10°"},{n:"Protraction / retraction",plane:"transverse",axis:"Y",sign:z,rng:[-30,30],rom:"≈ 30° each way"},{n:"Posterior rotation",plane:"frontal",axis:"Z",sign:1,rng:[0,0],rom:"≈ 45° about the clavicle's own long axis (not animated)"}]}));
    both((s,z,L)=>J({id:"ac"+s,name:`Acromioclavicular joint (${L})`,type:"plane (gliding)",dof:3,child:"scap"+s,pos:[0,H+0.5,0.19*z],r:0.014,note:"Small gliding and rotational adjustments between clavicle and scapula; lets the scapula tip and rotate on the clavicle.",
      mv:[{n:"Upward / downward rotation of the scapula",plane:"frontal",axis:"X",sign:-z,rng:[0,30],rom:"≈ 30°"},{n:"Anterior / posterior tipping",plane:"sagittal",axis:"Z",sign:1,rng:[-15,15],rom:"small"},{n:"Internal / external rotation",plane:"transverse",axis:"Y",sign:z,rng:[-15,15],rom:"small"}]}));
    both((s,z,L)=>J({id:"gh"+s,name:`Shoulder: glenohumeral joint (${L})`,type:"ball-and-socket (spheroidal)",dof:3,child:"uarm"+s,pos:[0,H+0.45,0.21*z],r:0.03,note:"The most mobile joint in the body: all three planes, large ranges, shallow socket (hence the labrum, capsule and rotator cuff).",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:1,rng:[-60,180],rom:"flexion ≈ 180°, extension ≈ 60°"},{n:"Abduction / adduction",plane:"frontal",axis:"X",sign:-z,rng:[-30,180],rom:"abduction ≈ 180°, adduction ≈ 30–45° (in front of the body)"},{n:"Internal (medial) / external (lateral) rotation",plane:"transverse",axis:"Y",sign:z,rng:[-90,70],rom:"internal ≈ 70°, external ≈ 90° (arm at side)"},{n:"Horizontal adduction / abduction (arm abducted 90°)",plane:"transverse",axis:"Y",sign:z,rng:[-45,135],rom:"adduction ≈ 135°, abduction ≈ 45°",pre:{mv:1,ang:90}}]}));
    both((s,z,L)=>J({id:"elbow"+s,name:`Elbow: humeroulnar joint (${L})`,type:"hinge (ginglymus)",dof:1,child:"farm"+s,pos:[0,H+0.14,0.21*z],r:0.025,note:"One degree of freedom: flexion/extension in the sagittal plane about the medial–lateral axis. The humeroradial joint shares the hinge.",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:1,rng:[-5,145],rom:"flexion ≈ 145°, extension 0° (≈ 5° hyperextension in some people)"}]}));
    both((s,z,L)=>J({id:"ru"+s,name:`Proximal & distal radioulnar joints (${L})`,type:"pivot (trochoid)",dof:1,child:"farm"+s,pos:[0,H+0.05,0.21*z],r:0.018,note:"The radius spins about the ulna: pronation/supination in the transverse plane about the forearm's longitudinal axis. The hand goes along for the ride.",
      mv:[{n:"Pronation / supination",plane:"transverse",axis:"Y",sign:z,rng:[-85,80],rom:"≈ 80° each way"}]}));
    both((s,z,L)=>J({id:"wrist"+s,name:`Wrist: radiocarpal joint (${L})`,type:"condyloid (ellipsoid)",dof:2,child:"hand"+s,pos:[0,H-0.1,0.21*z],r:0.02,note:"Two degrees of freedom: flexion/extension and radial/ulnar deviation. No axial rotation (that comes from the radioulnar joints).",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:1,rng:[-70,80],rom:"flexion ≈ 80°, extension ≈ 70°"},{n:"Radial / ulnar deviation",plane:"frontal",axis:"X",sign:-z,rng:[-30,20],rom:"radial ≈ 20°, ulnar ≈ 30°"}]}));
    both((s,z,L)=>J({id:"mcp"+s,name:`Metacarpophalangeal (knuckle) joints (${L})`,type:"condyloid",dof:2,child:"fing"+s,pos:[0,H-0.19,0.21*z],r:0.014,note:"Flexion/extension plus abduction/adduction (spreading the fingers). The interphalangeal joints beyond them are pure hinges.",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:1,rng:[-45,90],rom:"flexion ≈ 90°, extension ≈ 45°"},{n:"Abduction / adduction (finger spread)",plane:"frontal",axis:"X",sign:-z,rng:[-10,20],rom:"≈ 20°"}]}));
    both((s,z,L)=>J({id:"cmc"+s,name:`Thumb: first carpometacarpal joint (${L})`,type:"saddle (sellar)",dof:2,child:"thumb"+s,pos:[0.02,H-0.12,0.17*z],r:0.013,note:"Saddle joint: flexion/extension and abduction/adduction, whose combination gives opposition. The thumb's planes are rotated ~90° relative to the fingers.",
      mv:[{n:"Flexion / extension",plane:"frontal",axis:"X",sign:z,rng:[-20,15],rom:"flexion ≈ 15°, extension ≈ 20° (in the plane of the palm)"},{n:"Palmar abduction / adduction",plane:"sagittal",axis:"Z",sign:1,rng:[0,70],rom:"≈ 70° (perpendicular to the palm)"},{n:"Opposition (combined)",plane:"transverse",axis:"Y",sign:-z,rng:[0,60],rom:"thumb tip to the little finger"}]}));
    both((s,z,L)=>J({id:"hip"+s,name:`Hip: acetabulofemoral joint (${L})`,type:"ball-and-socket (spheroidal)",dof:3,child:"thigh"+s,pos:[0,H,0.09*z],r:0.03,note:"Deep socket, very stable; three planes of motion with smaller ranges than the shoulder.",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:1,rng:[-20,120],rom:"flexion ≈ 120° (knee bent), extension ≈ 20°"},{n:"Abduction / adduction",plane:"frontal",axis:"X",sign:-z,rng:[-30,45],rom:"abduction ≈ 45°, adduction ≈ 30°"},{n:"Internal / external rotation",plane:"transverse",axis:"Y",sign:z,rng:[-45,45],rom:"≈ 45° each way"}]}));
    both((s,z,L)=>J({id:"knee"+s,name:`Knee: tibiofemoral joint (${L})`,type:"modified hinge (bicondylar)",dof:2,child:"shank"+s,pos:[0,H-0.45,0.09*z],r:0.03,note:"Primarily a hinge: flexion/extension in the sagittal plane. A small amount of axial rotation is possible when the knee is flexed (the 'screw-home' mechanism locks it in extension).",
      mv:[{n:"Flexion / extension",plane:"sagittal",axis:"Z",sign:-1,rng:[0,140],rom:"flexion ≈ 135–140°, extension 0°"},{n:"Internal / external rotation (knee flexed)",plane:"transverse",axis:"Y",sign:z,rng:[-10,30],rom:"≈ 10° internal, 30° external at 90° flexion",pre:{mv:0,ang:90}}]}));
    both((s,z,L)=>J({id:"ankle"+s,name:`Ankle: talocrural joint (${L})`,type:"hinge (ginglymus)",dof:1,child:"foot"+s,pos:[0,H-0.9,0.09*z],r:0.025,note:"Dorsiflexion/plantarflexion in the sagittal plane about a nearly medial–lateral axis through the malleoli.",
      mv:[{n:"Dorsiflexion / plantarflexion",plane:"sagittal",axis:"Z",sign:1,rng:[-50,20],rom:"dorsiflexion ≈ 20°, plantarflexion ≈ 50°"}]}));
    both((s,z,L)=>J({id:"subtalar"+s,name:`Subtalar (talocalcaneal) joint (${L})`,type:"plane (gliding), functionally a single oblique hinge",dof:1,child:"calc"+s,pos:[0,H-0.93,0.09*z],r:0.018,note:"Inversion/eversion: described in the frontal plane about an anterior–posterior axis (the true axis is oblique, which is why inversion couples with adduction and plantarflexion as 'supination').",
      mv:[{n:"Inversion / eversion",plane:"frontal",axis:"X",sign:z,rng:[-15,35],rom:"inversion ≈ 35°, eversion ≈ 15°"}]}));
    both((s,z,L)=>J({id:"midtarsal"+s,name:`Midtarsal (transverse tarsal) joint (${L})`,type:"plane / saddle combination",dof:2,child:"foot"+s,pos:[0.04,H-0.95,0.09*z],r:0.014,note:"Lets the forefoot twist relative to the hindfoot; adds to inversion/eversion and lets the foot adapt to uneven ground.",
      mv:[{n:"Inversion / eversion (forefoot)",plane:"frontal",axis:"X",sign:z,rng:[-10,20],rom:"small"},{n:"Abduction / adduction (forefoot)",plane:"transverse",axis:"Y",sign:-z,rng:[-10,10],rom:"small"}]}));
    both((s,z,L)=>J({id:"mtp"+s,name:`Metatarsophalangeal joints (${L})`,type:"condyloid",dof:2,child:"toes"+s,pos:[0.14,H-0.97,0.09*z],r:0.014,note:"Extension of the toes is what lets the heel rise in walking (the windlass mechanism tightens the plantar fascia).",
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
  const U={joint:null,mv:null,anim:null,showGlobal:true,showPlanes:{sagittal:false,frontal:false,transverse:false},showFrames:false,segFrames:new Set(),labels:true,bodyAlpha:1};
  const planeOf=(p)=>PLANE[p];
  function setMovement(j,i){ /* start oscillating animation of movement i of joint j */
    U.joint=j; U.mv=i; for(const k in angles) delete angles[k]; const m=j.mv[i]; if(m.pre) angles[j.id+"|"+m.pre.mv]=m.pre.ang;
    U.anim={j,i,t:0}; U.showPlanes={sagittal:false,frontal:false,transverse:false}; if(!U.quiz) U.showPlanes[m.plane]=true; renderPanel(); }
  function tick(dt){ if(U.anim){ U.anim.t+=dt; const m=U.anim.j.mv[U.anim.i]; const [a,b]=m.rng; const mid=(a+b)/2, amp=(b-a)/2; angles[U.anim.j.id+"|"+U.anim.i]=mid+amp*Math.sin(U.anim.t*1.2-Math.PI/2); } transformAll(); }
  /* ---------- overlays: global frame, planes, local frames, joint callouts ---------- */
  function overlays(ctx,M,project){
    const O=[-0.55,H-1.05,-0.45];           /* global frame origin: on the floor, in front-left of the body */
    if(U.showGlobal){ ["X","Y","Z"].forEach(k=>{ const A=AXIS[k]; B3.arrow3(ctx,M,project,O,add(O,mul(A.v,0.35)),A.color,`${k} · ${A.name}`,2.5); }); B3.label3(ctx,M,project,O,"global frame (ISB)","#eaf2ff",22); }
    /* cardinal planes through the body centre */
    const C=[0,H+0.1,0]; const ext=1.2;
    const planeQuad={sagittal:[[C[0],C[1]-ext,C[2]],[C[0]+0.5,C[1]-ext,C[2]],[C[0]+0.5,C[1]+ext*0.75,C[2]],[C[0],C[1]+ext*0.75,C[2]],[C[0]-0.5,C[1]+ext*0.75,C[2]],[C[0]-0.5,C[1]-ext,C[2]]],
      frontal:[[C[0],C[1]-ext,C[2]-0.9],[C[0],C[1]-ext,C[2]+0.9],[C[0],C[1]+ext*0.75,C[2]+0.9],[C[0],C[1]+ext*0.75,C[2]-0.9]],
      transverse:[[C[0]-0.5,C[1],C[2]-0.9],[C[0]+0.5,C[1],C[2]-0.9],[C[0]+0.5,C[1],C[2]+0.9],[C[0]-0.5,C[1],C[2]+0.9]]};
    for(const k in U.showPlanes){ if(!U.showPlanes[k]) continue; const col=PLANE[k].color; let q=planeQuad[k]; if(U.anim){ const j=U.anim.j; q=q.map(p=>{ const d=sub(p,C); return add(j.pos,d); }); } /* when animating, move the plane through the joint */
      B3.quad3(ctx,M,project,q,col.replace(")",",0.16)").replace("#",""),col); fixColor(ctx,col,q,M,project,k); }
    /* local segment frames */
    const frames=U.showFrames?Object.keys(SEG):[...U.segFrames]; frames.forEach(id=>{ const s=SEG[id]; const o=tfPoint(id,s.pivot); const L=0.14; ["X","Y","Z"].forEach(k=>{ const A=AXIS[k]; const e=tfPoint(id,add(s.pivot,mul(A.v,L))); B3.arrow3(ctx,M,project,o,e,A.color,U.showFrames?"":`${k}`,2); }); if(!U.showFrames) B3.label3(ctx,M,project,o,s.name+" frame","#eaf2ff",-18); });
    /* animated joint: axis of rotation + callout */
    if(U.anim&&U.quiz){ /* during a drill: show the motion only, not its plane/axis labels */ }
    else if(U.anim){ const j=U.anim.j, m=j.mv[U.anim.i]; const A=AXIS[m.axis]; const o=j.pos; if(!m.translation){ ctx.setLineDash([6,5]); B3.arrow3(ctx,M,project,add(o,mul(A.v,-0.25)),add(o,mul(A.v,0.25)),A.color,`axis: ${m.axis} · ${A.name}`,2.5); ctx.setLineDash([]); } else { B3.arrow3(ctx,M,project,o,add(o,mul(m.tr,0.15)),"#ffd23f",`translation along ${m.axis}`,2.5); }
      const a=angles[j.id+"|"+U.anim.i]||0; B3.label3(ctx,M,project,tfPoint(j.child,SEG[j.child].end),`${m.n.split(" / ")[0]}… ${m.translation?(a*1000).toFixed(0)+" mm":a.toFixed(0)+"°"}`,"#ffd23f",-16); }
    else if(U.joint&&U.labels){ B3.label3(ctx,M,project,U.joint.pos,U.joint.name,"#ffd23f",-18); }
  }
  function fixColor(ctx,col,q,M,project,k){ /* plane name tag at the top edge */ const top=q.reduce((a,b)=>b[1]>a[1]?b:a); B3.label3(ctx,M,project,top,`${k} plane`,col,-10); }
  /* rgba from hex */
  const rgba=(hex,a)=>{ const n=parseInt(hex.slice(1),16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; };
  /* patch quad fill to use rgba */
  const _quad=B3.quad3; const quadFill=(ctx,M,project,pts,hex,stroke)=>_quad(ctx,M,project,pts,rgba(stroke,0.16),stroke);
  /* ---------- panel ---------- */
  function renderPanel(){ const el=$("#jointinfo"); if(U.quiz){ el.innerHTML=`<p class="note">Drill in progress — the joint panel is hidden so it doesn't give the answer away.</p>`; return; } const j=U.joint; if(!j){ el.innerHTML=`<p class="note">Click a yellow joint marker or a body segment, or pick a joint from the list. Each joint shows its type, degrees of freedom and the osteokinematic movements it allows, with the plane and axis of each. Press a movement to animate it.</p>`; return; }
    el.innerHTML=`<h4>${j.name}</h4><div class="jmeta"><span class="chip">${j.type}</span><span class="chip">${j.dof} DOF</span></div><p class="note">${j.note}</p>
      <table class="ptab jt"><thead><tr><th>Movement</th><th>Plane</th><th>Axis</th><th>Typical range</th><th></th></tr></thead><tbody>${j.mv.map((m,i)=>`<tr class="${U.mv===i?"on":""}"><td>${m.n}</td><td><span class="pl" style="--c:${PLANE[m.plane].color}">${m.plane}</span></td><td><span class="ax" style="--c:${AXIS[m.axis].color}">${m.axis} · ${AXIS[m.axis].name}</span>${m.translation?" (translation)":""}</td><td>${m.rom||""}</td><td><button type="button" class="btn small" data-mv="${i}">${U.mv===i?"■ stop":"▶ animate"}</button></td></tr>`).join("")}</tbody></table>
      <p class="note">Frame reminder: for every segment the <b>Y</b> axis is longitudinal (along the bone), <b>X</b> points anterior, <b>Z</b> points to the subject's right. Movements <i>in</i> a plane rotate <i>about</i> the axis perpendicular to it.</p>
      <div class="xray"><button type="button" class="btn small" id="segframe">${U.segFrames.has(j.child)?"Hide":"Show"} the ${SEG[j.child].name} local frame</button><button type="button" class="btn small" id="clearsel">Clear</button></div>`;
    el.querySelectorAll("[data-mv]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.mv; if(U.mv===i&&U.anim){ U.anim=null; U.mv=null; for(const k in angles) delete angles[k]; renderPanel(); } else setMovement(j,i); });
    $("#segframe").onclick=()=>{ const c=j.child; if(U.segFrames.has(c)) U.segFrames.delete(c); else U.segFrames.add(c); renderPanel(); };
    $("#clearsel").onclick=()=>{ U.joint=null; U.mv=null; U.anim=null; for(const k in angles) delete angles[k]; U.showPlanes={sagittal:false,frontal:false,transverse:false}; B3.S.sel=null; renderPanel(); syncToggles(); };
    fixSubs(el); }
  function selectJoint(j,fly=true){ U.joint=j; U.mv=null; U.anim=null; for(const k in angles) delete angles[k]; B3.S.sel="J_"+j.id; renderPanel(); if(fly){ const side=j.pos[2]; B3.flyTo(j.pos.slice(),1.5,side<-0.05?Math.PI-0.9:0.9,0.2); } const sel=$("#jointsel"); if(sel) sel.value=j.id; }
  function onPick(part){ if(!part){ return; } if(part.joint){ selectJoint(JOINTS.find(j=>j.id===part.joint)); return; } /* segment clicked: toggle its frame and select its proximal joint */ const sid=part.segment; const j=JOINTS.find(j=>j.child===sid); if(j) selectJoint(j); if(sid){ U.segFrames.add(sid); renderPanel(); } }
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
    function next(){ cur=make(); const el=$("#drill"); el.innerHTML=`<div class="dq">${cur.q}</div><div class="dopts">${cur.opts.map(o=>`<button type="button" class="btn dopt" data-o="${o.replace(/"/g,"&quot;")}">${o}</button>`).join("")}</div><div class="dfb" id="dfb"></div><div class="dstat">Answered ${St.done} · correct ${St.correct} · streak ${St.streak} (best ${St.best})</div>`;
      U.quiz=true; if(cur.j){ selectJoint(cur.j,true); if(cur.m){ const i=cur.j.mv.indexOf(cur.m); if(i>=0) setMovement(cur.j,i); } } $("#jointinfo").innerHTML=`<p class="note">Drill in progress — the joint panel is hidden so it doesn't give the answer away.</p>`;
      el.querySelectorAll(".dopt").forEach(b=>b.onclick=()=>answer(b.dataset.o,b)); fixSubs(el); }
    function answer(o,b){ const ok=o===cur.ans; U.quiz=false; if(U.anim){ U.showPlanes[U.anim.j.mv[U.anim.i].plane]=true; } renderPanel(); St.done++; if(ok){ St.correct++; St.streak++; St.best=Math.max(St.best,St.streak); } else St.streak=0; save();
      $("#drill").querySelectorAll(".dopt").forEach(x=>{ x.disabled=true; if(x.dataset.o===cur.ans) x.classList.add("good"); else if(x===b&&!ok) x.classList.add("bad"); });
      $("#dfb").innerHTML=`<p class="${ok?"fb good":"fb bad"}">${ok?"Correct.":"Not quite — the answer is <b>"+cur.ans+"</b>."} ${cur.why}</p><button type="button" class="btn primary small" id="dnext">Next question →</button>`; $("#dnext").onclick=next;
      if(typeof GAME!=="undefined"){ if(ok) GAME.addXP(10,St.streak>1?`+10 XP · ${St.streak} in a row`:"+10 XP"); else GAME.addXP(0); } }
    return {next}; })();
  /* ---------- init ---------- */
  function init(){ defineJoints(); buildBody(); transformAll();
    B3.S.tick=tick; B3.S.overlays=[overlays]; B3.quad3=quadFill; B3.S.transform=(v,part)=>tfPoint(part.segment,v);
    B3.init("#bcanvas",onPick);
    const sel=$("#jointsel"); sel.innerHTML=`<option value="">Jump to a joint…</option>`+JOINTS.map(j=>`<option value="${j.id}">${j.name}</option>`).join(""); sel.onchange=()=>{ const j=JOINTS.find(x=>x.id===sel.value); if(j) selectJoint(j); };
    for(const k in U.showPlanes){ const e=$("#pl-"+k); if(e) e.onchange=()=>{ U.showPlanes[k]=e.checked; }; }
    $("#globalframe").onchange=(e)=>U.showGlobal=e.target.checked; $("#allframes").onchange=(e)=>U.showFrames=e.target.checked;
    const ba=$("#bodyalpha"); ba.oninput=()=>{ B3.parts.forEach(p=>{ if(p.segment&&!p.joint) p.alpha=+ba.value; }); };
    $("#drillstart").onclick=()=>{ DR.next(); $("#drillstart").textContent="Skip →"; };
    document.querySelectorAll("#tabs .tabbtn").forEach(b=>b.onclick=()=>{ document.querySelectorAll("#tabs .tabbtn").forEach(x=>x.classList.toggle("on",x===b)); $("#explore").hidden=b.dataset.k!=="explore"; $("#drills").hidden=b.dataset.k!=="drills"; $("#reference").hidden=b.dataset.k!=="reference"; if(b.dataset.k==="reference") renderReference(); });
    renderPanel(); syncToggles(); }
  function renderReference(){ const el=$("#reftable"); if(el.dataset.done) return; el.dataset.done=1; const seen=new Set(); const rows=JOINTS.filter(j=>{ const b=j.name.replace(/ \((left|right)\)/,""); if(seen.has(b)) return false; seen.add(b); return true; });
    el.innerHTML=`<table class="ptab jt"><thead><tr><th>Joint</th><th>Type</th><th>DOF</th><th>Movements · plane · axis · typical range</th></tr></thead><tbody>${rows.map(j=>`<tr><td><b>${j.name.replace(/ \((left|right)\)/,"")}</b></td><td>${j.type}</td><td>${j.dof}</td><td>${j.mv.map(m=>`<div>${m.n} — <span class="pl" style="--c:${PLANE[m.plane].color}">${m.plane}</span> · <span class="ax" style="--c:${AXIS[m.axis].color}">${m.axis}</span> ${m.rom?"· "+m.rom:""}</div>`).join("")}</td></tr>`).join("")}</tbody></table><p class="note">Ranges are typical adult values and vary with age, sex, and measurement method (AAOS; Norkin &amp; White, <i>Measurement of Joint Motion</i>). Plane and axis follow the ISB recommendation (Wu et al., J. Biomech. 2002, 2005).</p>`; fixSubs(el); }
  return {init,JOINTS,SEG,U,selectJoint,setMovement,angles};
})();
FL.init();
