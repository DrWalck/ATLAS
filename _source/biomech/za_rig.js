/* ===================== ZA_RIG: kinematic rig for the Z-Anatomy body =====================
   Shared by the Frames lab and the posable figure: which body segment each mesh part belongs to, and the joint-center
   landmarks measured on the skeleton (header 'lm' of zanatomy.bin, right side; the left is mirrored in z). */
const ZA_RIG=(()=>{
  const BONESEG={skull:"head",mand:"jaw",cerv:"neck",thor:"trunk",lumb:"trunk",sacr:"pelvis",ribs:"trunk",stern:"trunk",pelv:"pelvis",clav:"scap",scap:"scap",hum:"uarm",rad:"farm",uln:"farm",carp:"hand",fem:"thigh",pat:"thigh",tib:"shank",fib:"shank",tars:"foot"};
  function segOfPart(p,LMK){ const c=p.center; const side=p.side>0?"R":p.side<0?"L":(c[2]>=0?"R":"L"); const id=ZA_MAP.idOf(p); const withSide=(k)=>/^(head|jaw|neck|trunk|pelvis)$/.test(k)?k:k+side;
    if(id&&BONESEG[id]) return withSide(BONESEG[id]);
    if(id==="meta") return /metacarpal/.test(p.n)?"hand"+side:(/first finger/.test(p.n)?"thumb"+side:"fing"+side);
    if(id==="mtt") return /metatarsal|Sesamoid/.test(p.n)?"foot"+side:"toes"+side;
    if(/^(Hyoid|Thyroid cartilage|Cricoid|Arytenoid|Corniculate)/.test(p.n)) return "neck";
    const az=Math.abs(c[2]);
    if(c[1]>LMK.AO[1]+0.015&&az<0.12) return /masseter|pterygoid|Mentalis|Orbicularis oris|Depressor|Platysma/i.test(p.n)&&c[1]<LMK.TMJ[1]?"jaw":"head";
    if(az>0.13&&c[1]>0.66){ if(c[1]>LMK.EL[1]+0.015) return "uarm"+side; if(c[1]>LMK.WR[1]+0.01) return "farm"+side; return "hand"+side; }
    if(c[1]<=LMK.HIP[1]+0.01&&c[1]>LMK.KN[1]+0.01&&az>0.02) return "thigh"+side;
    if(c[1]<=LMK.KN[1]+0.01&&c[1]>LMK.AN[1]+0.015) return "shank"+side;
    if(c[1]<=LMK.AN[1]+0.015) return c[0]>LMK.MTP[0]?"toes"+side:"foot"+side;
    if(c[1]>LMK.C7[1]-0.01&&az<0.09) return "neck";
    if(c[1]<LMK.L5S1[1]-0.01||/^(Gluteus|Piriformis|Obturator|Gemellus|Quadratus femoris|Iliacus|Psoas|Pubo|Iliococcygeus|Coccygeus|Levator ani)/.test(p.n)) return "pelvis";
    if(az>0.12&&c[1]>LMK.GH[1]-0.12&&/deltoid|Teres|Coracobrachialis|triceps|biceps brachii|Subscapularis|Infraspinatus|Supraspinatus/i.test(p.n)) return "uarm"+side;
    return "trunk"; }
  /* 4×4 column-major matrix from an affine point transform f */
  function matrixOf(f){ const o=f([0,0,0]); const d=(v)=>{ const w=f(v); return [w[0]-o[0],w[1]-o[1],w[2]-o[2]]; }; const ex=d([1,0,0]),ey=d([0,1,0]),ez=d([0,0,1]); return new Float32Array([ex[0],ex[1],ex[2],0, ey[0],ey[1],ey[2],0, ez[0],ez[1],ez[2],0, o[0],o[1],o[2],1]); }
  return {segOfPart,matrixOf,BONESEG};
})();
