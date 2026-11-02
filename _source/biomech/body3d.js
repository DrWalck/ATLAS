/* ===================== BODY 3D: dependency-free low-poly renderer + articulated body =====================
   Software renderer on a 2-D canvas (painter's algorithm, flat shading, translucency, click picking, orbit camera).
   Axes follow the ISB convention: X anterior, Y superior (longitudinal), Z to the subject's right (medial–lateral).
   Geometry is defined in the anatomical position; joints rotate their distal segments about anatomical axes.   */
const B3=(()=>{
  const $=(s)=>document.querySelector(s);
  /* ---------- small vector helpers ---------- */
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=(a)=>{ const L=Math.hypot(...a)||1; return a.map(c=>c/L); };
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
  const rotAxis=(v,ax,ang)=>{ /* Rodrigues: rotate v about unit axis ax by ang (rad) */ const c=Math.cos(ang),s=Math.sin(ang); const k=norm(ax); const d=k[0]*v[0]+k[1]*v[1]+k[2]*v[2]; const cx=cross(k,v); return [v[0]*c+cx[0]*s+k[0]*d*(1-c), v[1]*c+cx[1]*s+k[1]*d*(1-c), v[2]*c+cx[2]*s+k[2]*d*(1-c)]; };
  /* ---------- geometry builders (vertices in anatomical-position world coordinates) ---------- */
  const parts=[]; const addPart=(p)=>{ p.tris=p.tris||[]; parts.push(p); return p; }; const vc=new WeakMap(); /* vertex → ring centre, for skinning */ const vseg=new WeakMap(); /* vertex → forced body segment (mesh bones) */
  const lathe=(part,profile,seg,c,axis,dir)=>{ /* profile [[t,r]] along 'axis' from centre c; dir = +1/-1 along the axis */
    const ring=(t,r,r2)=>{ const o=[]; const cc=c.slice(); if(axis==="y") cc[1]+=t*(dir||1); else if(axis==="x") cc[0]+=t*(dir||1); else cc[2]+=t*(dir||1); for(let i=0;i<seg;i++){ const a=2*Math.PI*i/seg; const u=r*Math.cos(a),v=(r2??r)*Math.sin(a); const p=c.slice(); if(axis==="y"){ p[1]+=t*(dir||1); p[0]+=u; p[2]+=v; } else if(axis==="x"){ p[0]+=t*(dir||1); p[1]+=u; p[2]+=v; } else { p[2]+=t*(dir||1); p[0]+=u; p[1]+=v; } vc.set(p,cc); o.push(p); } return o; };
    const rings=profile.map(([t,r,r2])=>ring(t,Math.max(r,1e-4),r2==null?null:Math.max(r2,1e-4)));
    for(let k=0;k<rings.length-1;k++){ const A=rings[k],B=rings[k+1]; for(let i=0;i<seg;i++){ const j=(i+1)%seg; part.tris.push([A[i],B[i],B[j]],[A[i],B[j],A[j]]); } }
    const cap=(R,rev)=>{ const cc=R.reduce((s,p)=>add(s,mul(p,1/R.length)),[0,0,0]); for(let i=0;i<seg;i++){ const j=(i+1)%seg; part.tris.push(rev?[cc,R[j],R[i]]:[cc,R[i],R[j]]); } };
    if(profile[0][1]>0.004) cap(rings[0],false); if(profile[profile.length-1][1]>0.004) cap(rings[rings.length-1],true); };
  const capsule=(part,a,b,r,seg=10)=>{ /* rounded bone/segment between points a and b */
    const d=sub(b,a), L=Math.hypot(...d); const ax=norm(d); let up=Math.abs(ax[1])<0.9?[0,1,0]:[1,0,0]; const n1=norm(cross(ax,up)), n2=cross(n1,ax);
    const prof=[]; const nr=4; for(let i=0;i<=nr;i++){ const t=-r+ r*Math.sin(-Math.PI/2+Math.PI/2*i/nr)+r; prof.push([t-r, r*Math.cos(-Math.PI/2+Math.PI/2*i/nr)]); } /* start cap */
    const P=[[-r*0.9,r*0.45],[-r*0.5,r*0.85],[0,r],[L,r],[L+r*0.5,r*0.85],[L+r*0.9,r*0.45],[L+r,0.002]];
    const rings=P.map(([t,rr])=>{ const o=[]; for(let i=0;i<seg;i++){ const an=2*Math.PI*i/seg; o.push(add(add(add(a,mul(ax,t)),mul(n1,rr*Math.cos(an))),mul(n2,rr*Math.sin(an)))); } return o; });
    for(let k=0;k<rings.length-1;k++){ const A=rings[k],B=rings[k+1]; for(let i=0;i<seg;i++){ const j=(i+1)%seg; part.tris.push([A[i],B[i],B[j]],[A[i],B[j],A[j]]); } }
    const c0=add(a,mul(ax,-r)); for(let i=0;i<seg;i++){ const j=(i+1)%seg; part.tris.push([c0,rings[0][i],rings[0][j]]); } };
  const tube=(part,pts,radii,seg=8,capEnds=true)=>{ /* polyline pts, radius per point (number or array); smooth frames by parallel transport */
    const n=pts.length; const R=(i)=>Array.isArray(radii)?radii[Math.min(i,radii.length-1)]:radii; const tangents=pts.map((p,i)=>norm(sub(pts[Math.min(i+1,n-1)],pts[Math.max(i-1,0)])));
    let up=Math.abs(tangents[0][1])<0.9?[0,1,0]:[1,0,0]; let n1=norm(cross(tangents[0],up)); const rings=[];
    for(let i=0;i<n;i++){ if(i){ n1=norm(sub(n1,mul(tangents[i],n1[0]*tangents[i][0]+n1[1]*tangents[i][1]+n1[2]*tangents[i][2]))); } const n2=cross(n1,tangents[i]); const o=[]; const r=Math.max(R(i),1e-4); for(let k=0;k<seg;k++){ const a=2*Math.PI*k/seg; const v=add(add(pts[i],mul(n1,r*Math.cos(a))),mul(n2,r*Math.sin(a))); vc.set(v,pts[i]); o.push(v); } rings.push(o); }
    for(let k=0;k<n-1;k++){ const A=rings[k],B=rings[k+1]; for(let i=0;i<seg;i++){ const j=(i+1)%seg; part.tris.push([A[i],B[j],B[i]],[A[i],A[j],B[j]]); } }
    if(capEnds){ for(let i=0;i<seg;i++){ const j=(i+1)%seg; part.tris.push([pts[0],rings[0][j],rings[0][i]],[pts[n-1],rings[n-1][i],rings[n-1][j]]); } } };
  const box=(part,x0,y0,z0,x1,y1,z1)=>{ const p=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]; [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]].forEach(q=>{ part.tris.push([p[q[0]],p[q[1]],p[q[2]]],[p[q[0]],p[q[2]],p[q[3]]]); }); };
  const sphere=(part,c,r,seg=12)=>{ const prof=[]; for(let i=0;i<=8;i++){ const a=-Math.PI/2+Math.PI*i/8; prof.push([r*Math.sin(a),r*Math.cos(a)]); } lathe(part,prof,seg,c,"y",1); };
  /* ---------- camera ---------- */
  const cam={theta:0.95,phi:0.22,dist:3.6,target:[0,0.95,0],fov:36};
  let canvas,ctx,Wc,Hc;
  function camMatrix(){ const ct=Math.cos(cam.theta),st=Math.sin(cam.theta),cp=Math.cos(cam.phi),sp=Math.sin(cam.phi);
    const eye=[cam.target[0]+cam.dist*cp*st, cam.target[1]+cam.dist*sp, cam.target[2]+cam.dist*cp*ct];   /* theta = 0 looks at the front of the body (from +Z... no: from +Z is the right side); see views */
    const f=norm(sub(cam.target,eye)); const r=norm(cross(f,[0,1,0])); const u=cross(r,f); return {eye,f,r,u}; }
  function project(p,M){ const d=sub(p,M.eye); const x=d[0]*M.r[0]+d[1]*M.r[1]+d[2]*M.r[2], y=d[0]*M.u[0]+d[1]*M.u[1]+d[2]*M.u[2], z=d[0]*M.f[0]+d[1]*M.f[1]+d[2]*M.f[2]; const s=(Hc/2)/Math.tan(cam.fov*Math.PI/360)/Math.max(z,0.05); return [Wc/2+x*s, Hc/2-y*s, z, s]; }
  const light=norm([0.4,0.9,0.6]);
  const shade=(hex,k)=>{ const n=parseInt(hex.slice(1),16); const r=(n>>16)&255,g=(n>>8)&255,b=n&255; return `rgb(${Math.round(r*k)},${Math.round(g*k)},${Math.round(b*k)})`; };
  /* ---------- scene state ---------- */
  const S={sel:null,hover:null,alpha:{body:1},transform:null,overlays:[],drawn:[],alwaysRender:true,dirty:true};
  function render(){ const M=camMatrix(); ctx.clearRect(0,0,Wc,Hc); const list=[]; const T=S.transform||((v,part)=>v);
    for(const p of parts){ const a=(p.alphaFn?p.alphaFn():p.alpha); if(a<=0.02) continue; const tf=p.segment?(v)=>T(v,p):(v)=>v;
      for(const t of p.tris){ const w0=tf(t[0]),w1=tf(t[1]),w2=tf(t[2]); const a0=project(w0,M),a1=project(w1,M),a2=project(w2,M); if(a0[2]<0.1||a1[2]<0.1||a2[2]<0.1) continue;
        const n=norm(cross(sub(w1,w0),sub(w2,w0))); const toEye=norm(sub(M.eye,w0)); const facing=n[0]*toEye[0]+n[1]*toEye[1]+n[2]*toEye[2]; if(facing<0&&a>0.9&&!p.twoSided) continue;
        const area=Math.abs((a1[0]-a0[0])*(a2[1]-a0[1])-(a2[0]-a0[0])*(a1[1]-a0[1])); if(area<0.5) continue;
        const k=0.5+0.5*Math.max(0,n[0]*light[0]+n[1]*light[1]+n[2]*light[2])*(facing<0?0.6:1);
        list.push({z:(a0[2]+a1[2]+a2[2])/3,pts:[a0,a1,a2],col:shade(p.color,k),a:facing<0?a*0.5:a,part:p}); } }
    list.sort((u,v)=>v.z-u.z); S.drawn=list; const pulse=0.5+0.5*Math.sin(performance.now()/300);
    for(const t of list){ ctx.globalAlpha=t.a; ctx.fillStyle=t.col; ctx.beginPath(); ctx.moveTo(t.pts[0][0],t.pts[0][1]); ctx.lineTo(t.pts[1][0],t.pts[1][1]); ctx.lineTo(t.pts[2][0],t.pts[2][1]); ctx.closePath(); ctx.fill(); if(t.part.id===S.sel||(t.part.sid&&t.part.sid===S.sel)){ ctx.globalAlpha=0.5+0.5*pulse; ctx.strokeStyle="#ffd23f"; ctx.lineWidth=1; ctx.stroke(); } else if(t.a<0.9){ ctx.strokeStyle="rgba(200,220,255,.2)"; ctx.lineWidth=0.5; ctx.stroke(); } }
    ctx.globalAlpha=1; S.overlays.forEach(fn=>fn(ctx,M,project)); }
  function pick(x,y){ const inTri=(p,a,b,c)=>{ const d=(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]); const e=(c[0]-b[0])*(p[1]-b[1])-(c[1]-b[1])*(p[0]-b[0]); const f=(a[0]-c[0])*(p[1]-c[1])-(a[1]-c[1])*(p[0]-c[0]); return (d>=0&&e>=0&&f>=0)||(d<=0&&e<=0&&f<=0); };
    for(let i=S.drawn.length-1;i>=0;i--){ const t=S.drawn[i]; if(t.a<0.15||t.part.noPick) continue; if(inTri([x,y],t.pts[0],t.pts[1],t.pts[2])) return t.part; } return null; }
  /* ---------- drawing helpers for overlays ---------- */
  function arrow3(ctx,M,project,a,b,color,label,width=2){ const A=project(a,M),B=project(b,M); if(A[2]<0.1||B[2]<0.1) return; ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=width; ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.stroke(); const ang=Math.atan2(B[1]-A[1],B[0]-A[0]); ctx.beginPath(); ctx.moveTo(B[0],B[1]); ctx.lineTo(B[0]-9*Math.cos(ang-0.4),B[1]-9*Math.sin(ang-0.4)); ctx.lineTo(B[0]-9*Math.cos(ang+0.4),B[1]-9*Math.sin(ang+0.4)); ctx.closePath(); ctx.fill(); if(label){ ctx.font="700 12px 'Chakra Petch', sans-serif"; const w=ctx.measureText(label).width+8; ctx.fillStyle="rgba(5,10,24,.85)"; ctx.fillRect(B[0]+6,B[1]-16,w,18); ctx.fillStyle=color; ctx.fillText(label,B[0]+10,B[1]-3); } }
  function quad3(ctx,M,project,pts,fill,stroke){ const P=pts.map(p=>project(p,M)); if(P.some(p=>p[2]<0.1)) return; ctx.fillStyle=fill; ctx.strokeStyle=stroke; ctx.lineWidth=1.5; ctx.beginPath(); P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  function label3(ctx,M,project,p,txt,color="#ffd23f",dy=-14){ const P=project(p,M); if(P[2]<0.1) return; ctx.font="600 12px 'Chakra Petch', sans-serif"; const w=ctx.measureText(txt).width+10; ctx.fillStyle="rgba(5,10,24,.88)"; ctx.strokeStyle=color; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect?ctx.roundRect(P[0]-w/2,P[1]+dy-14,w,18,4):ctx.rect(P[0]-w/2,P[1]+dy-14,w,18); ctx.fill(); ctx.stroke(); ctx.fillStyle=color; ctx.textAlign="center"; ctx.fillText(txt,P[0],P[1]+dy-1); ctx.textAlign="left"; ctx.fillStyle=color; ctx.beginPath(); ctx.arc(P[0],P[1],2.5,0,Math.PI*2); ctx.fill(); }
  /* ---------- init ---------- */
  const views={front:[Math.PI/2,0.12,3.6],side:[0,0.1,3.6],left:[Math.PI,0.1,3.6],back:[-Math.PI/2,0.12,3.6],iso:[0.95,0.25,3.6],top:[0.9,1.35,3.4]};
  const goal={active:false};
  function flyTo(target,dist,theta,phi){ goal.active=true; goal.target=target; goal.dist=dist; goal.theta=theta??cam.theta; goal.phi=phi??cam.phi; }
  function init(id,onPick){ canvas=$(id); ctx=canvas.getContext("2d");
    const resize=()=>{ const r=canvas.getBoundingClientRect(); Wc=r.width; Hc=r.height; canvas.width=Math.round(Wc*devicePixelRatio); canvas.height=Math.round(Hc*devicePixelRatio); ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); S.dirty=true; }; resize(); window.addEventListener("resize",resize);
    let drag=null; canvas.addEventListener("pointerdown",e=>{ drag={x:e.clientX,y:e.clientY,t:cam.theta,p:cam.phi,moved:false}; goal.active=false; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove",e=>{ if(!drag) return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; if(Math.abs(dx)+Math.abs(dy)>3) drag.moved=true; cam.theta=drag.t-dx*0.008; cam.phi=Math.max(-1.3,Math.min(1.4,drag.p+dy*0.008)); S.dirty=true; });
    canvas.addEventListener("pointerup",e=>{ if(drag&&!drag.moved){ const r=canvas.getBoundingClientRect(); const p=pick(e.clientX-r.left,e.clientY-r.top); onPick&&onPick(p); } drag=null; });
    canvas.addEventListener("wheel",e=>{ e.preventDefault(); goal.active=false; cam.dist=Math.max(0.6,Math.min(8,cam.dist*(1+Math.sign(e.deltaY)*0.08))); S.dirty=true; },{passive:false});
    document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{ const v=views[b.dataset.view]; flyTo(S.viewTarget?S.viewTarget.slice():cam.target.slice(),S.viewDist||v[2],v[0],v[1]); });
    let last=performance.now(); const loop=(now)=>{ const dt=Math.min(0.05,(now-last)/1000); last=now; try{ if(goal.active){ const k=Math.min(1,dt*4); cam.target=cam.target.map((c,i)=>c+(goal.target[i]-c)*k); cam.dist+=(goal.dist-cam.dist)*k; cam.phi+=(goal.phi-cam.phi)*k; let dth=goal.theta-cam.theta; dth=Math.atan2(Math.sin(dth),Math.cos(dth)); cam.theta+=dth*k; if(Math.abs(cam.dist-goal.dist)<0.005&&Math.abs(dth)<0.005) goal.active=false; } S.tick&&S.tick(dt); if(S.alwaysRender||S.dirty||goal.active||drag||(S.sel&&(now%400)<40)){ render(); S.dirty=false; } }catch(err){ console.warn(err); } requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  return {parts,addPart,lathe,capsule,tube,box,sphere,cam,S,init,flyTo,vc,vseg,arrow3,quad3,label3,rotAxis,add,sub,mul,norm,cross,views};
})();
