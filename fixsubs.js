function fixSubs(root){
  if(!root) return;
  const skip=(n)=>{ for(let p=n.parentNode;p&&p!==root.parentNode;p=p.parentNode){ const t=p.nodeName; if(t==="svg"||t==="text"||t==="tspan"||t==="MATH"||t==="math"||t==="CODE"||t==="SCRIPT"||t==="STYLE"||t==="TEXTAREA"||t==="SUB"||(p.classList&&(p.classList.contains("eq")||p.classList.contains("ceq")))) return true; } return false; };
  const re=/([^\s_(])_([A-Za-z0-9]+(?:\/[A-Z][A-Za-z]*(?![_A-Za-z]))?|[θαωρμ∞])/g;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null); const nodes=[];
  while(w.nextNode()){ const n=w.currentNode; if(n.nodeValue.indexOf("_")>=0 && !skip(n)) nodes.push(n); }
  nodes.forEach(n=>{ const s=n.nodeValue; const frag=document.createDocumentFragment(); let last=0; s.replace(re,(m,a,b,i)=>{ frag.appendChild(document.createTextNode(s.slice(last,i)+a)); const sb=document.createElement("sub"); sb.textContent=b; frag.appendChild(sb); last=i+m.length; return m; }); frag.appendChild(document.createTextNode(s.slice(last))); n.parentNode.replaceChild(frag,n); });
}