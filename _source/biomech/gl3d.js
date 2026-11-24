/* ===================== GL3: WebGL body renderer for the Z-Anatomy mesh =====================
   Loads biomech/zanatomy.bin (ATLAS format: 'ZANA' + JSON header + int16 positions (×q m) + int8 normals + uint16 local indices),
   one draw range per part. API mirrors the old canvas renderer (B3) where the explorer and labs use it:
     GL3.load(url).then(parts)  GL3.init(canvasSelector,onPick)  GL3.S{sel,dirty,overlays,alphaFn,alwaysRender}  GL3.cam  GL3.flyTo
     GL3.views  GL3.project(p)  GL3.label3/arrow3 (2-D overlay canvas)  part.M (optional 4×4 model matrix for posing)
   Mesh: Z-Anatomy (CC BY-SA 4.0), decimated; coordinates in metres, ISB axes (X anterior, Y up, Z to the subject's right).      */
const GL3=(()=>{
  const GEOMCACHE={}; /* url -> promise of parsed geometry, shared by every instance on the page */
  function makeInstance(){
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; const norm=(v)=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; };
  const CAT={bone:{col:[0.93,0.90,0.84],gloss:0.25},cart:{col:[0.80,0.86,0.90],gloss:0.35},muscle:{col:[0.62,0.18,0.15],gloss:0.5},tendon:{col:[0.92,0.88,0.78],gloss:0.3},lig:{col:[0.85,0.80,0.66],gloss:0.3}};
  const cam={theta:Math.PI/2,phi:0.1,dist:2.6,target:[0,0.9,0],fov:34};
  const views={front:[Math.PI/2,0.12,2.6],side:[0,0.1,2.6],left:[Math.PI,0.1,2.6],back:[-Math.PI/2,0.12,2.6],iso:[0.95,0.25,2.6],top:[0.9,1.35,2.4]};
  const S={sel:null,hover:null,dirty:true,overlays:[],alphaFn:null,alwaysRender:false,viewDist:2.6,viewTarget:[0,0.9,0],parts:[],loaded:false,light:[0.35,0.8,0.55]};
  let gl,canvas,ov,octx,W=0,H=0,dpr=1,prog,pick,vbo,nbo,ibo,q=1e-4,onPickCb=null,loc={},ploc={},fbo=null,fbtex=null,fbrb=null;
  const VS=`attribute vec3 aP; attribute vec3 aN; uniform mat4 uPV; uniform mat4 uM; uniform float uQ; varying vec3 vN; varying vec3 vW;
    void main(){ vec4 w=uM*vec4(aP*uQ,1.0); vW=w.xyz; vN=normalize(mat3(uM)*aN); gl_Position=uPV*w; }`;
  const FS=`precision mediump float; varying vec3 vN; varying vec3 vW; uniform vec3 uCol; uniform float uA; uniform vec3 uEye; uniform vec3 uL; uniform float uGloss; uniform float uHi;
    void main(){ vec3 n=normalize(vN); vec3 v=normalize(uEye-vW); if(dot(n,v)<0.0) n=-n; vec3 l=normalize(uL); vec3 l2=normalize(vec3(-0.6,0.3,-0.5));
      float d=max(dot(n,l),0.0)*0.85+max(dot(n,l2),0.0)*0.35; vec3 h=normalize(l+v); float sp=pow(max(dot(n,h),0.0),28.0)*uGloss; float rim=pow(1.0-max(dot(n,v),0.0),3.0)*0.18;
      vec3 c=uCol*(0.30+d)+vec3(sp)+vec3(rim)*uCol; c=mix(c,vec3(1.0,0.85,0.35),uHi*0.55)+uHi*0.15; gl_FragColor=vec4(c,uA); }`;
  const PFS=`precision mediump float; uniform vec3 uId; void main(){ gl_FragColor=vec4(uId,1.0); }`;
  function shader(vs,fs){ const p=gl.createProgram(); [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]].forEach(([t,s])=>{ const sh=gl.createShader(t); gl.shaderSource(sh,s); gl.compileShader(sh); if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh)); gl.attachShader(p,sh); }); gl.linkProgram(p); return p; }
  /* ---------- loading ---------- */
  function parse(buf){ const dv=new DataView(buf); if(String.fromCharCode(dv.getUint8(0),dv.getUint8(1),dv.getUint8(2),dv.getUint8(3))!=="ZANA") throw new Error("bad mesh file");
    const hl=dv.getUint32(4,true); const hdr=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,8,hl))); let off=8+hl;
    const pos=new Int16Array(buf,off,hdr.nv*3); off+=hdr.nv*6; const nrm=new Int8Array(buf,off,hdr.nv*3); off+=hdr.nv*3; off+=(4-off%4)%4; const idx=new Uint16Array(buf,off,hdr.ni);
    const gidx=new Uint32Array(hdr.ni); hdr.parts.forEach(p=>{ for(let k=0;k<p.ic;k++) gidx[p.io+k]=idx[p.io+k]+p.vo; }); return {hdr,pos,nrm,gidx}; }
  async function load(url){ if(!GEOMCACHE[url]) GEOMCACHE[url]=fetch(url).then(r=>r.arrayBuffer()).then(parse); const g=await GEOMCACHE[url]; const hdr=g.hdr; q=hdr.q;
    S.parts=hdr.parts.map((p,i)=>({i,n:p.n,s:p.s,c:p.c,vo:p.vo,vc:p.vc,io:p.io,ic:p.ic,bb:p.bb,center:[(p.bb[0]+p.bb[3])/2,(p.bb[1]+p.bb[4])/2,(p.bb[2]+p.bb[5])/2],side:p.s==="R"?1:p.s==="L"?-1:0,
      col:CAT[p.c].col.slice(),gloss:CAT[p.c].gloss,alpha:1,M:null,sid:null,layer:p.c==="muscle"||p.c==="tendon"?"m1":p.c==="lig"?"lig":"bone",reg:null,kind:p.c}));
    /* slight per-muscle colour variation so neighbouring bellies read as separate */
    S.parts.forEach(p=>{ if(p.c==="muscle"){ let h=0; for(const ch of p.n) h=(h*31+ch.charCodeAt(0))&0xffff; const t=(h%100)/100; p.col=[0.60+0.14*t,0.18+0.06*(1-t),0.15+0.04*t]; } });
    S.credit=hdr.credit; S.lm=hdr.lm||null; S.geom={pos:g.pos,nrm:g.nrm,gidx:g.gidx}; S.loaded=true; if(gl) upload(); S.dirty=true; return S.parts; }
  /* ---------- extra geometry built at run time (ligament tubes, markers): float positions in metres + uint32 indices ---------- */
  let xvbo=null,xnbo=null,xibo=null; S.extras=[];
  function setExtras(list){ /* list: [{name,V:Float32Array(xyz...),N:Float32Array,I:Uint32Array,col,alpha,gloss,M}] */ S.extras=[]; if(!list.length){ S.dirty=true; return; }
    let nv=0,ni=0; list.forEach(e=>{ nv+=e.V.length/3; ni+=e.I.length; }); const P=new Int16Array(nv*3), N=new Int8Array(nv*3), I=new Uint32Array(ni); let vo=0,io=0;
    list.forEach((e,k)=>{ for(let i=0;i<e.V.length;i++){ P[vo*3+i]=Math.max(-32767,Math.min(32767,Math.round(e.V[i]/q))); N[vo*3+i]=Math.round(e.N[i]*127); } for(let i=0;i<e.I.length;i++) I[io+i]=e.I[i]+vo;
      let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9]; for(let i=0;i<e.V.length;i+=3){ for(let k2=0;k2<3;k2++){ mn[k2]=Math.min(mn[k2],e.V[i+k2]); mx[k2]=Math.max(mx[k2],e.V[i+k2]); } }
      S.extras.push({i:1e6+k,extra:true,n:e.name||"extra",c:e.c||"lig",s:"C",side:0,vo,vc:e.V.length/3,io,ic:e.I.length,bb:[...mn,...mx],center:[(mn[0]+mx[0])/2,(mn[1]+mx[1])/2,(mn[2]+mx[2])/2],col:e.col||[0.9,0.85,0.7],gloss:e.gloss??0.3,alpha:e.alpha??1,M:e.M||null,sid:e.sid||null,layer:"lig",kind:"extra",noPick:e.noPick||false}); vo+=e.V.length/3; io+=e.I.length; });
    if(gl){ if(!xvbo){ xvbo=gl.createBuffer(); xnbo=gl.createBuffer(); xibo=gl.createBuffer(); } gl.bindBuffer(gl.ARRAY_BUFFER,xvbo); gl.bufferData(gl.ARRAY_BUFFER,P,gl.DYNAMIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER,xnbo); gl.bufferData(gl.ARRAY_BUFFER,N,gl.DYNAMIC_DRAW); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,xibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,I,gl.DYNAMIC_DRAW); }
    S._xraw={P,N,I}; S.dirty=true; }
  function upload(){ if(S._xraw){ const r=S._xraw; xvbo=gl.createBuffer(); xnbo=gl.createBuffer(); xibo=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,xvbo); gl.bufferData(gl.ARRAY_BUFFER,r.P,gl.DYNAMIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER,xnbo); gl.bufferData(gl.ARRAY_BUFFER,r.N,gl.DYNAMIC_DRAW); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,xibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,r.I,gl.DYNAMIC_DRAW); } const g=S.geom; vbo=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,vbo); gl.bufferData(gl.ARRAY_BUFFER,g.pos,gl.STATIC_DRAW); nbo=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,nbo); gl.bufferData(gl.ARRAY_BUFFER,g.nrm,gl.STATIC_DRAW); ibo=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,g.gidx,gl.STATIC_DRAW); }
  /* ---------- camera ---------- */
  function camMatrix(){ const ct=Math.cos(cam.theta),st=Math.sin(cam.theta),cp=Math.cos(cam.phi),sp=Math.sin(cam.phi); const eye=[cam.target[0]+cam.dist*cp*st,cam.target[1]+cam.dist*sp,cam.target[2]+cam.dist*cp*ct];
    const f=norm(sub(cam.target,eye)); const r=norm(cross(f,[0,1,0])); const u=cross(r,f); return {eye,f,r,u}; }
  function pv(M){ const aspect=W/H, fy=1/Math.tan(cam.fov*Math.PI/360), n=0.05, fa=20; const P=[fy/aspect,0,0,0, 0,fy,0,0, 0,0,(fa+n)/(n-fa),-1, 0,0,2*fa*n/(n-fa),0];
    const e=M.eye,r=M.r,u=M.u,f=M.f; const V=[r[0],u[0],-f[0],0, r[1],u[1],-f[1],0, r[2],u[2],-f[2],0, -(r[0]*e[0]+r[1]*e[1]+r[2]*e[2]),-(u[0]*e[0]+u[1]*e[1]+u[2]*e[2]),(f[0]*e[0]+f[1]*e[1]+f[2]*e[2]),1];
    const o=new Float32Array(16); for(let i=0;i<4;i++) for(let j=0;j<4;j++){ let s=0; for(let k=0;k<4;k++) s+=P[k*4+j]*V[i*4+k]; o[i*4+j]=s; } return o; }
  function project(p,M){ M=M&&M.eye?M:camMatrix(); const d=sub(p,M.eye); const x=d[0]*M.r[0]+d[1]*M.r[1]+d[2]*M.r[2], y=d[0]*M.u[0]+d[1]*M.u[1]+d[2]*M.u[2], z=d[0]*M.f[0]+d[1]*M.f[1]+d[2]*M.f[2]; const s=(H/dpr/2)/Math.tan(cam.fov*Math.PI/360)/Math.max(z,0.05); return [W/dpr/2+x*s,H/dpr/2-y*s,z,s]; }
  const I4=new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  /* ---------- render ---------- */
  function partAlpha(p){ let a=S.alphaFn?S.alphaFn(p):p.alpha; return Math.max(0,Math.min(1,a)); }
  function bindMain(L){ gl.bindBuffer(gl.ARRAY_BUFFER,vbo); gl.enableVertexAttribArray(L.aP); gl.vertexAttribPointer(L.aP,3,gl.SHORT,false,0,0); if(L.aN>=0){ gl.bindBuffer(gl.ARRAY_BUFFER,nbo); gl.enableVertexAttribArray(L.aN); gl.vertexAttribPointer(L.aN,3,gl.BYTE,true,0,0); } gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo); }
  function bindExtra(L){ gl.bindBuffer(gl.ARRAY_BUFFER,xvbo); gl.enableVertexAttribArray(L.aP); gl.vertexAttribPointer(L.aP,3,gl.SHORT,false,0,0); if(L.aN>=0){ gl.bindBuffer(gl.ARRAY_BUFFER,xnbo); gl.enableVertexAttribArray(L.aN); gl.vertexAttribPointer(L.aN,3,gl.BYTE,true,0,0); } gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,xibo); }
  function render(){ if(!gl||!(S.loaded||S.extras.length)) return; const M=camMatrix(); const PV=pv(M); gl.viewport(0,0,W,H); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(prog); gl.uniformMatrix4fv(loc.uPV,false,PV); gl.uniform1f(loc.uQ,q); gl.uniform3fv(loc.uEye,M.eye); gl.uniform3fv(loc.uL,S.light);
    const pulse=0.55+0.45*Math.sin(performance.now()/300); const opaque=[],trans=[];
    const all=S.loaded?S.parts.concat(S.extras):S.extras; for(const p of all){ const a=p.extra?(p.alpha):partAlpha(p); if(a<=0.02) continue; p._a=a; (a>=0.98?opaque:trans).push(p); }
    let bound=null, offOn=false; gl.disable(gl.POLYGON_OFFSET_FILL); const draw=(p)=>{ const b=p.extra?"x":"m"; if(b!==bound){ (b==="x"?bindExtra:bindMain)(loc); bound=b; } const po=(p.c==="tendon"||p.c==="lig"); if(po!==offOn){ offOn=po; if(po){ gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2,-4); } else gl.disable(gl.POLYGON_OFFSET_FILL); } /* thin tendon sheets (iliotibial tract, aponeuroses) sit on the muscle surface: pull them forward in depth so they do not z-fight into speckles */ gl.uniformMatrix4fv(loc.uM,false,modelM(p)); gl.uniform3fv(loc.uCol,p.col); gl.uniform1f(loc.uA,p._a); gl.uniform1f(loc.uGloss,p.gloss); gl.uniform1f(loc.uHi,(S.sel&&p.sid&&p.sid===S.sel)||p.hi||(S.hover&&p===S.hover)?pulse:0); gl.drawElements(gl.TRIANGLES,p.ic,gl.UNSIGNED_INT,p.io*4); };
    gl.depthMask(true); opaque.forEach(draw);
    if(trans.length){ trans.forEach(p=>{ const c=p.M?mulM(p.M,p.center):p.center; const d=sub(c,M.eye); p._z=d[0]*M.f[0]+d[1]*M.f[1]+d[2]*M.f[2]; }); trans.sort((a,b)=>b._z-a._z); gl.depthMask(false); trans.forEach(draw); gl.depthMask(true); }
    octx.clearRect(0,0,W/dpr,H/dpr); S.overlays.forEach(fn=>fn(octx,M,project)); }
  /* model matrix: optional pose (p.M) composed with a small shrink about the part's own centre (p.shrink, e.g. 0.97 for bones so they do not poke through the muscles that wrap them) */
  const mulMat=(A,B)=>{ const o=new Float32Array(16); for(let i=0;i<4;i++) for(let j=0;j<4;j++){ let s=0; for(let k=0;k<4;k++) s+=A[k*4+j]*B[i*4+k]; o[i*4+j]=s; } return o; };
  function modelM(p){ const k=p.shrink; if(!k||k===1) return p.M||I4; if(p._shK!==k){ const c=p.center; p._shM=new Float32Array([k,0,0,0, 0,k,0,0, 0,0,k,0, c[0]*(1-k),c[1]*(1-k),c[2]*(1-k),1]); p._shK=k; } return p.M?mulMat(p.M,p._shM):p._shM; }
  const mulM=(m,p)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12], m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13], m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
  /* ---------- picking (ID render) ---------- */
  function pickAt(x,y){ if(!gl) return null; const M=camMatrix(); const PV=pv(M); if(!fbo){ fbo=gl.createFramebuffer(); fbtex=gl.createTexture(); fbrb=gl.createRenderbuffer(); }
    gl.bindFramebuffer(gl.FRAMEBUFFER,fbo); gl.bindTexture(gl.TEXTURE_2D,fbtex); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,W,H,0,gl.RGBA,gl.UNSIGNED_BYTE,null); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST); gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,fbtex,0);
    gl.bindRenderbuffer(gl.RENDERBUFFER,fbrb); gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,W,H); gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,fbrb);
    gl.viewport(0,0,W,H); gl.disable(gl.BLEND); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT); gl.useProgram(pick); gl.uniformMatrix4fv(ploc.uPV,false,PV); gl.uniform1f(ploc.uQ,q);
    let bound=null; const all=S.loaded?S.parts.concat(S.extras):S.extras;
    for(const p of all){ const a=p.extra?p.alpha:partAlpha(p); if(a<0.15||p.noPick) continue; const b=p.extra?"x":"m"; if(b!==bound){ (b==="x"?bindExtra:bindMain)(ploc); bound=b; } const id=(p.extra?(1e6+ (p.i-1e6)):p.i)+1; gl.uniform3f(ploc.uId,(id&255)/255,((id>>8)&255)/255,((id>>16)&255)/255); gl.uniformMatrix4fv(ploc.uM,false,modelM(p)); gl.drawElements(gl.TRIANGLES,p.ic,gl.UNSIGNED_INT,p.io*4); }
    const px=new Uint8Array(4); gl.readPixels(Math.round(x*dpr),Math.round(H-y*dpr),1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.enable(gl.BLEND); const id=px[0]|(px[1]<<8)|(px[2]<<16); if(!id) return null; return id>1e6?S.extras[id-1-1e6]:S.parts[id-1]; }
  /* ---------- overlay helpers (2-D canvas on top) ---------- */
  function arrow3(ctx,M,proj,a,b,color,label,width=2){ const A=project(a),B=project(b); if(A[2]<0.1||B[2]<0.1) return; ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=width; ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.stroke(); const ang=Math.atan2(B[1]-A[1],B[0]-A[0]); ctx.beginPath(); ctx.moveTo(B[0],B[1]); ctx.lineTo(B[0]-9*Math.cos(ang-0.4),B[1]-9*Math.sin(ang-0.4)); ctx.lineTo(B[0]-9*Math.cos(ang+0.4),B[1]-9*Math.sin(ang+0.4)); ctx.closePath(); ctx.fill(); if(label){ ctx.font="700 12px 'Chakra Petch', sans-serif"; const w=ctx.measureText(label).width+8; ctx.fillStyle="rgba(5,10,24,.85)"; ctx.fillRect(B[0]+6,B[1]-16,w,18); ctx.fillStyle=color; ctx.fillText(label,B[0]+10,B[1]-3); } }
  function label3(ctx,M,proj,p,txt,color="#ffd23f",dy=-14){ const P=project(p); if(P[2]<0.1) return; ctx.font="600 12px 'Chakra Petch', sans-serif"; const w=ctx.measureText(txt).width+10; ctx.fillStyle="rgba(5,10,24,.88)"; ctx.strokeStyle=color; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect?ctx.roundRect(P[0]-w/2,P[1]+dy-14,w,18,4):ctx.rect(P[0]-w/2,P[1]+dy-14,w,18); ctx.fill(); ctx.stroke(); ctx.fillStyle=color; ctx.textAlign="center"; ctx.fillText(txt,P[0],P[1]+dy-1); ctx.textAlign="left"; ctx.beginPath(); ctx.arc(P[0],P[1],2.5,0,Math.PI*2); ctx.fill(); }
  function quad3(ctx,M,proj,pts,fill,stroke){ const P=pts.map(p=>project(p)); if(P.some(p=>p[2]<0.1)) return; ctx.fillStyle=fill; ctx.strokeStyle=stroke; ctx.lineWidth=1.5; ctx.beginPath(); P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  function dot3(ctx,M,proj,p,color,r=4){ const P=project(p); if(P[2]<0.1) return; ctx.fillStyle=color; ctx.beginPath(); ctx.arc(P[0],P[1],r,0,Math.PI*2); ctx.fill(); }
  /* ---------- init, input, animation ---------- */
  let fly=null, lastT=0;
  function flyTo(target,dist,theta,phi){ fly={t0:performance.now(),a:{...cam,target:cam.target.slice()},b:{target,dist:dist??cam.dist,theta:theta??cam.theta,phi:phi??cam.phi}}; S.dirty=true; }
  function tick(){ if(fly){ const u=Math.min(1,(performance.now()-fly.t0)/700); const e=u<.5?2*u*u:-1+(4-2*u)*u; cam.dist=fly.a.dist+(fly.b.dist-fly.a.dist)*e; cam.theta=fly.a.theta+(fly.b.theta-fly.a.theta)*e; cam.phi=fly.a.phi+(fly.b.phi-fly.a.phi)*e; cam.target=[0,1,2].map(i=>fly.a.target[i]+(fly.b.target[i]-fly.a.target[i])*e); if(u>=1) fly=null; S.dirty=true; }
    const now=performance.now(); const dt=lastT?Math.min(0.1,(now-lastT)/1000):0; lastT=now; if(S.tick) S.tick(dt); if(S.dirty||S.alwaysRender||S.sel||S.hover){ render(); S.dirty=false; } requestAnimationFrame(tick); }
  function resize(){ dpr=Math.min(2,window.devicePixelRatio||1); const r=canvas.getBoundingClientRect(); W=Math.max(1,Math.round(r.width*dpr)); H=Math.max(1,Math.round(r.height*dpr)); canvas.width=W; canvas.height=H; ov.width=W; ov.height=H; ov.style.width=r.width+"px"; ov.style.height=r.height+"px"; octx.setTransform(dpr,0,0,dpr,0,0); S.dirty=true; }
  function init(sel,onPick){ canvas=document.querySelector(sel); onPickCb=onPick; const wrap=canvas.parentElement; if(getComputedStyle(wrap).position==="static") wrap.style.position="relative";
    ov=document.createElement("canvas"); ov.style.cssText="position:absolute;left:0;top:0;pointer-events:none"; canvas.insertAdjacentElement("afterend",ov); octx=ov.getContext("2d");
    gl=canvas.getContext("webgl",{antialias:true,alpha:true,premultipliedAlpha:false}); if(!gl){ canvas.insertAdjacentHTML("afterend","<p class='note'>WebGL is not available in this browser.</p>"); return; }
    gl.getExtension("OES_element_index_uint"); prog=shader(VS,FS); pick=shader(VS,PFS); ["uPV","uM","uQ","uCol","uA","uEye","uL","uGloss","uHi"].forEach(k=>loc[k]=gl.getUniformLocation(prog,k)); loc.aP=gl.getAttribLocation(prog,"aP"); loc.aN=gl.getAttribLocation(prog,"aN");
    ["uPV","uM","uQ","uId"].forEach(k=>ploc[k]=gl.getUniformLocation(pick,k)); ploc.aP=gl.getAttribLocation(pick,"aP"); ploc.aN=-1; if(S.loaded||S._xraw) upload();
    resize(); window.addEventListener("resize",resize); if(window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    let drag=null,moved=0; const pos=(e)=>{ const r=canvas.getBoundingClientRect(); return [e.clientX-r.left,e.clientY-r.top]; };
    let hook=null;
    canvas.addEventListener("pointerdown",(e)=>{ drag=pos(e); moved=0; canvas.setPointerCapture(e.pointerId); hook=null; if(S.dragHook){ const part=pickAt(drag[0],drag[1]); hook=S.dragHook(part)||null; } });
    canvas.addEventListener("pointermove",(e)=>{ if(!drag) return; const p=pos(e); const dx=p[0]-drag[0],dy=p[1]-drag[1]; moved+=Math.abs(dx)+Math.abs(dy); if(hook){ hook(dx,dy); drag=p; S.dirty=true; return; } if(e.shiftKey||e.buttons===4){ const M=camMatrix(); const k=cam.dist*0.0016; cam.target=add(cam.target,add(mul(M.r,-dx*k),mul(M.u,dy*k))); } else { cam.theta-=dx*0.008; cam.phi=Math.max(-1.45,Math.min(1.45,cam.phi+dy*0.008)); } drag=p; fly=null; S.dirty=true; });
    canvas.addEventListener("pointerup",(e)=>{ if(hook){ hook=null; drag=null; return; } if(drag&&moved<6&&onPickCb){ const p=pos(e); onPickCb(pickAt(p[0],p[1])); } drag=null; });
    canvas.addEventListener("wheel",(e)=>{ e.preventDefault(); cam.dist=Math.max(S.minDist||0.3,Math.min(6,cam.dist*(1+Math.sign(e.deltaY)*0.1))); fly=null; S.dirty=true; },{passive:false});
    canvas.addEventListener("dblclick",(e)=>{ const p=pos(e); const part=pickAt(p[0],p[1]); if(part) flyTo(part.M?mulM(part.M,part.center):part.center,Math.max(0.5,cam.dist*0.6)); });
    const host=canvas.parentElement&&canvas.parentElement.parentElement; if(host) host.querySelectorAll("[data-view]").forEach(b=>{ if(!b._gl3){ b._gl3=true; b.addEventListener("click",()=>view(b.dataset.view)); } });
    requestAnimationFrame(tick); }
  function view(k){ const v=views[k]; if(!v) return; flyTo(S.viewTarget.slice(),S.viewDist,v[0],v[1]); }
  return {load,init,S,cam,views,view,flyTo,project,arrow3,label3,quad3,dot3,pickAt,setExtras,add,sub,mul,norm,cross,CAT,mulM};
  }
  const main=makeInstance(); main.create=makeInstance; return main;
})();
