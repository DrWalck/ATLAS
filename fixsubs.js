function fixSubs(root){
  if(!root) return;
  const SVGNS="http://www.w3.org/2000/svg";
  const skip=(n)=>{ for(let p=n.parentNode;p&&p!==root.parentNode;p=p.parentNode){ const t=p.nodeName; if(t==="MATH"||t==="math"||t==="CODE"||t==="PRE"||t==="SCRIPT"||t==="STYLE"||t==="TEXTAREA"||t==="INPUT"||t==="SUB"||(p.getAttribute&&p.getAttribute("data-sub")==="1")||(p.classList&&(p.classList.contains("eq")||p.classList.contains("ceq")||p.classList.contains("katex")||p.classList.contains("mlcode")))) return true; } return false; };
  const inSvgText=(n)=>{ for(let p=n.parentNode;p;p=p.parentNode){ if(p.nodeName==="text"||p.nodeName==="tspan") return true; if(p.nodeName==="svg"||p.nodeName==="BODY") return false; } return false; };
  const re=/([^\s_(])_([A-Za-z0-9]+(?:,[a-z]+)?(?:\/[A-Z][A-Za-z]*(?![_A-Za-z]))?|[θαωρμ∞])/g;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null); const nodes=[];
  while(w.nextNode()){ const n=w.currentNode; if(n.nodeValue.indexOf("_")>=0 && !skip(n)) nodes.push(n); }
  nodes.forEach(n=>{ const s=n.nodeValue; re.lastIndex=0; if(!re.test(s)) return; re.lastIndex=0; const svg=inSvgText(n); const frag=document.createDocumentFragment(); let last=0, afterSub=false;
    const plain=(t)=>{ if(!t) return; if(svg&&afterSub){ const ts=document.createElementNS(SVGNS,"tspan"); ts.setAttribute("dy","-0.19em"); ts.setAttribute("data-sub","1"); ts.textContent=t; frag.appendChild(ts); } else frag.appendChild(document.createTextNode(t)); afterSub=false; };
    s.replace(re,(m,a,b,i)=>{ plain(s.slice(last,i)+a); let sb; if(svg){ sb=document.createElementNS(SVGNS,"tspan"); sb.setAttribute("dy","0.25em"); sb.setAttribute("font-size","75%"); sb.setAttribute("data-sub","1"); } else sb=document.createElement("sub"); sb.textContent=b; frag.appendChild(sb); afterSub=true; last=i+m.length; return m; });
    const rest=s.slice(last); if(rest) plain(rest); else if(svg&&afterSub){ const ts=document.createElementNS(SVGNS,"tspan"); ts.setAttribute("dy","-0.19em"); ts.setAttribute("data-sub","1"); ts.textContent="​"; frag.appendChild(ts); }
    n.parentNode.replaceChild(frag,n); });
}
/* diagrams and feedback that are re-drawn without calling fixSubs (animations, drills): tidy them automatically */
(function(){ if(typeof MutationObserver==="undefined"||typeof document==="undefined") return; let queued=false;
  /* keep diagram labels inside their drawing: nudge any <text> that sticks out of the viewBox back in */
  const keepIn=()=>{ document.querySelectorAll("svg.mlsvg, svg.schemsvg").forEach(svg=>{ const vb=svg.viewBox&&svg.viewBox.baseVal; if(!vb||!vb.width||!svg.getBoundingClientRect().width) return; svg.querySelectorAll("text").forEach(t=>{ if(t.closest("g[transform]")||(t.getAttribute("transform")&&!t.dataset.nudged)) return; let b; try{ b=t.getBBox(); }catch(e){ return; } if(!b.width) return; let dx=0,dy=0; if(b.x+b.width>vb.x+vb.width-3) dx=vb.x+vb.width-3-(b.x+b.width); if(b.x+dx<vb.x+3) dx=vb.x+3-b.x; if(b.y<vb.y+1) dy=vb.y+1-b.y; if(b.y+b.height>vb.y+vb.height-1) dy=vb.y+vb.height-1-(b.y+b.height); const cur=t.getAttribute("transform")||""; const want=(Math.abs(dx)>0.5||Math.abs(dy)>0.5)?`translate(${dx.toFixed(1)},${dy.toFixed(1)})`:""; if(want!==cur){ if(want){ t.setAttribute("transform",want); t.dataset.nudged="1"; } else if(t.dataset.nudged){ t.removeAttribute("transform"); } } }); }); };
  const run=()=>{ queued=false; try{ keepIn(); }catch(e){} try{ document.querySelectorAll("svg text, .dfb, .dq, .dopts, .ro, .note, table.mini, table.jt, .verdict, .chip, .tag, li, .ptag, h3, h4").forEach(el=>{ if(el.textContent.indexOf("_")>=0) fixSubs(el); }); }catch(e){} };
  const start=()=>{ new MutationObserver(()=>{ if(!queued){ queued=true; requestAnimationFrame(run); } }).observe(document.body,{childList:true,subtree:true,characterData:true}); run(); };
  if(document.body) start(); else document.addEventListener("DOMContentLoaded",start); })();
