#!/usr/bin/env python3
"""Build the Biomechanics course pages into ../atlas/biomech/. Shared CSS/JS are taken from the built thermo pages
(kept in ../shared_css.css, ../fixsubs.js) so the course matches the rest of ATLAS."""
import os,re
W=os.path.dirname(os.path.abspath(__file__)); R=os.path.dirname(W); OUT=os.path.join(R,'atlas','biomech'); os.makedirs(OUT,exist_ok=True)
css=open(os.path.join(R,'shared_css.css')).read()
fix=open(os.path.join(R,'fixsubs.js')).read()
game_t=open(os.path.join(W,'game.js')).read()
game=lambda page,key: game_t.replace('__PAGE__',page).replace('__DRILLKEY__',key)
FONTS='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&display=swap">'
BCSS='''
/* ===== Biomechanics: frames & joints lab ===== */
#bscene{position:relative;width:100%;aspect-ratio:16/10;}
#bscene.tall{aspect-ratio:1/1}
#bscene{border:1px solid var(--line);border-radius:14px;background:radial-gradient(ellipse at 50% 35%,#101a33,#070b16 70%);overflow:hidden}
#bcanvas{width:100%;height:100%;display:block;cursor:grab;touch-action:none}
.jmeta{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 6px}
.chip{display:inline-block;padding:3px 9px;border-radius:999px;border:1px solid #2c4274;background:var(--surface-3);font:600 .72rem var(--display);letter-spacing:.04em;color:#eaf2ff}
.jt{width:100%;font-size:.82rem} .jt th{text-align:left;color:var(--muted);font-weight:600;padding:4px 6px 4px 0} .jt td{padding:5px 8px 5px 0;vertical-align:top;border-top:1px solid var(--line)} .jt tr.on td{background:rgba(255,210,63,.07)}
.pl,.ax{display:inline-block;padding:1px 7px;border-radius:6px;border:1px solid var(--c);color:var(--c);font:600 .72rem ui-monospace,monospace;white-space:nowrap}
.dq{font-size:1.05rem;margin:4px 0 10px;color:#fff} .dopts{display:grid;grid-template-columns:1fr 1fr;gap:8px} .dopt{text-align:left;white-space:normal}
.dopt.good{outline:2px solid var(--good);box-shadow:0 0 12px var(--good)} .dopt.bad{outline:2px solid #ff5a5a} .dopt:disabled{opacity:.85}
.dfb{margin-top:10px} .dstat{margin-top:8px;font-size:.78rem;color:var(--muted);font-family:ui-monospace,monospace}
.fb{padding:8px 10px;border-radius:8px;margin:0 0 8px} .fb.good{background:rgba(124,255,107,.12);color:#d8ffd2} .fb.bad{background:rgba(255,90,90,.12);color:#ffd6d6}
#jointsel{width:100%;background:var(--surface-3);color:var(--ink);border:1px solid #2c4274;border-radius:8px;padding:6px 8px;font:inherit;margin-top:6px}
.tog{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.82rem;color:var(--muted)} .tog label{display:flex;align-items:center;gap:5px} .tog i{display:inline-block;width:10px;height:10px;border-radius:2px}
.legend small{display:block;color:var(--muted);line-height:1.5}
'''+r'''
/* ===== Biomechanics: skeletal muscle lab ===== */
.mpane{margin-top:12px}
.mlsvg{width:100%;height:auto;display:block;border:1px solid var(--line);border-radius:12px;background:radial-gradient(120% 90% at 30% 20%,#0f1a38,#070b16 70%)}
.mlsvg .mlab{font:600 9.5px var(--display);fill:#c9d7ff;letter-spacing:.03em}
.hierscene .mlsvg,.mpane>.mlsvg{max-width:860px;margin-inline:auto}
.mlsvg .mlab.dim{fill:#8ea3cf}
.hierbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 10px}
.hierscene{margin:0 0 8px}
.hierzoom{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}
@media (max-width:900px){.two{grid-template-columns:1fr}}
.mpane p{max-width:72ch}
.mpane input[type=range]{width:100%}
.mpane select,aside select{width:100%;background:var(--surface-3);color:var(--ink);border:1px solid #2c4274;border-radius:8px;padding:6px 8px;font:inherit;margin-top:4px}
.hierbar label input{vertical-align:middle}
.plain{list-style:disc;padding-left:1.2em} .box ul.plain{display:block} .box ul.plain li{display:list-item;margin:3px 0}
.box ol.plain{margin:0;padding-left:1.2em} .box ol.plain li{display:list-item;margin:3px 0;font-size:.9rem;color:var(--muted)}
.box.known li,.box.find li{display:block;padding:2px 0}
.kf2{align-items:stretch}
.schemsvg{width:100%;height:auto;display:block}
.hints p{margin:0;padding:8px 10px;border-radius:8px;background:rgba(255,210,63,.08);border:1px solid rgba(255,210,63,.25);font-size:.92rem}
.layout{display:grid;grid-template-columns:250px minmax(0,1fr);gap:28px;align-items:start}
.figlayout{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:16px;align-items:start}
.figlayout>aside{position:sticky;top:12px}
@media (max-width:1100px){.figlayout{grid-template-columns:1fr}.figlayout>aside{position:static}}
.figlayout .layout{grid-template-columns:220px minmax(0,1fr);gap:16px}
#fignote{min-height:3em}
@media (max-width:900px){.layout{grid-template-columns:1fr}}
.solution .note{font-size:.88rem;color:var(--muted)}
.seg{display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:4px 6px 4px 10px;margin:0 0 10px;border:1px solid var(--line,#2c4274);border-radius:999px;background:rgba(12,20,44,.7);width:max-content;max-width:100%}
.seglab{font-size:.74rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-right:6px}
.segbtn{border:0;background:transparent;color:var(--muted);padding:6px 12px;border-radius:999px;font:inherit;font-size:.86rem;cursor:pointer;transition:background .15s,color .15s}
.segbtn:hover{color:var(--fg,#e8eefc);background:rgba(255,255,255,.05)}
.segbtn.on{background:linear-gradient(135deg,#ffb347,#ff7a59);color:#1a1200;font-weight:700;box-shadow:0 2px 12px rgba(255,138,61,.35)}
.playrow{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin:4px 0 8px}
.btn.play{min-width:92px}.btn.play.on{background:#22d3ee;color:#04202a;border-color:#22d3ee}
.chk{display:flex;align-items:center;gap:6px;font-size:.86rem;color:var(--muted);cursor:pointer}.chk input{accent-color:#ffb347}
table.mini{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}table.mini th,table.mini td{padding:3px 6px;text-align:right;border-bottom:1px solid rgba(120,140,200,.18)}table.mini th:first-child,table.mini td:first-child{text-align:left}table.mini th{color:var(--muted);font-weight:600}details.osim summary{cursor:pointer}
'''

FIG_ASIDE="""
    <aside><div class="panel"><h4>On a real body</h4>
      <div id="bscene" class="tall"><canvas id="bcanvas"></canvas></div>
      <div class="xray" style="margin-top:6px"><button type="button" class="btn small" data-view="front">Front</button><button type="button" class="btn small" data-view="side">Side</button><button type="button" class="btn small" data-view="back">Back</button><button type="button" class="btn small" data-view="iso">Iso</button></div>
      <div class="ctl"><label>Skin <input type="range" id="figskin" min="0" max="1" step="0.05" value="0.3"></label><label>Muscles <input type="range" id="figmus" min="0" max="1" step="0.05" value="1"></label><label>Bones <input type="range" id="figbone" min="0" max="1" step="0.05" value="0.9"></label></div>
      <p class="note" id="fignote"></p>
      <small class="note">Drag to rotate, wheel to zoom. The body follows the simulation; highlighted muscles are the ones doing the work. Full model: <a href="anatomy.html">Anatomy Explorer</a>.</small></div></aside>"""
def with_figure(body):
    return '<div class="figlayout"><section>'+body+'</section>'+FIG_ASIDE+'</div>'
OSIMJS=open(os.path.join(W,'osim_data.js')).read()
def fig_scripts(page):
    return '\n'+open(os.path.join(W,'body3d.js')).read()+'\n'+open(os.path.join(W,'anatomy_model.js')).read()+'\n'+open(os.path.join(W,'figure.js')).read()+'\nconst FIG_PAGE="'+page+'";\n'+open(os.path.join(W,'fig_hooks.js')).read()
def page(title,h1,blurb,body,scripts,zone):
    html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>'+title+' · ATLAS Biomechanics</title>\n'+FONTS+'\n<style>\n'+css+':root:root:root{--zone:'+zone+'}\n'+BCSS+'</style>\n</head><body>\n<div class="wrap">\n  <header class="top">\n    <div><a class="back" href="./">&larr; All topics</a><h1>'+h1+'</h1></div>\n    <p>'+blurb+'</p>\n  </header>\n'+body+'\n</div>\n<script>\n'+scripts+'\n</script>\n</body></html>'
    return html
def build_frames():
    body='''
  <div class="tabs" id="tabs"><button type="button" class="tabbtn on" data-k="explore">Explore the body</button><button type="button" class="tabbtn" data-k="drills">Drills · earn XP</button><button type="button" class="tabbtn" data-k="reference">Reference table</button></div>
  <div class="jetlayout">
    <section>
      <div id="bscene"><canvas id="bcanvas"></canvas></div>
      <div class="xray" style="margin-top:8px"><span class="note">View:</span><button type="button" class="btn small" data-view="front">Front</button><button type="button" class="btn small" data-view="side">Right side</button><button type="button" class="btn small" data-view="left">Left side</button><button type="button" class="btn small" data-view="back">Back</button><button type="button" class="btn small" data-view="iso">Iso</button><button type="button" class="btn small" data-view="top">Top</button></div>
      <div class="panel" id="explore" style="margin-top:12px"><div id="jointinfo"></div></div>
      <div class="panel" id="drills" style="margin-top:12px" hidden><h4>Drills</h4><p class="note">Random questions on planes, axes, joint types and degrees of freedom. The body animates the movement you are being asked about. +10 XP per correct answer.</p><button type="button" class="btn primary" id="drillstart">Start</button><div id="drill" style="margin-top:10px"></div></div>
      <div class="panel" id="reference" style="margin-top:12px" hidden><h4>Joints, types, movements, planes and axes</h4><div id="reftable"></div></div>
    </section>
    <aside>
      <div class="panel"><h4>Frames &amp; planes</h4>
        <div class="tog"><label><input type="checkbox" id="globalframe" checked> global frame</label><label><input type="checkbox" id="allframes"> all segment frames</label></div>
        <div class="tog" style="margin-top:6px"><label><input type="checkbox" id="pl-sagittal"><i style="background:#ff8a3d"></i> sagittal plane</label><label><input type="checkbox" id="pl-frontal"><i style="background:#22d3ee"></i> frontal plane</label><label><input type="checkbox" id="pl-transverse"><i style="background:#a78bfa"></i> transverse plane</label></div>
        <div class="ctl" style="margin-top:8px"><label>Body transparency <input type="range" id="bodyalpha" min="0.1" max="1" step="0.05" value="1"></label></div>
        <select id="jointsel"></select>
      </div>
      <div class="panel legend" style="margin-top:12px"><h4>ISB axes</h4>
        <small><b style="color:#ff5a5a">X</b> anterior–posterior (points forward). Frontal-plane movements rotate about X.</small>
        <small><b style="color:#7cff6b">Y</b> longitudinal / superior–inferior (points up, along the bone). Transverse-plane movements rotate about Y.</small>
        <small><b style="color:#5fa8ff">Z</b> medial–lateral (points to the subject's right). Sagittal-plane movements rotate about Z.</small>
        <small style="margin-top:6px">Each segment carries its own local frame with the same letters; the global frame sits on the floor. Movements are named for the plane they happen <i>in</i>, and rotate <i>about</i> the axis perpendicular to that plane.</small>
      </div>
      <div class="panel" style="margin-top:12px"><h4>Joint types</h4><small class="note">ball-and-socket (3 DOF) · condyloid / ellipsoid (2) · saddle (2) · hinge (1) · pivot (1) · plane / gliding (small slides) · modified hinge (1 + a little). Click any joint to see which it is.</small></div>
    </aside>
  </div>'''
    scripts=fix+'\n'+OSIMJS+'\n'+game('biomech-frames','dpl-biomech-frames')+'\n'+open(os.path.join(W,'body3d.js')).read()+'\n'+open(os.path.join(W,'frames_lab.js')).read()+'\nGAME.hud();'
    html=page('Frames & Joints Lab','Frames &amp; Joints Lab','Rotate a 3-D body, switch on the cardinal planes and the global or segment frames, click any joint to see its type and degrees of freedom, and animate every osteokinematic movement in its plane about its axis. Then drill it.',body,scripts,'#7cff6b')
    open(os.path.join(OUT,'frames.html'),'w').write(html); print('built frames.html',len(html)//1024,'KB')

def build_muscle():
    tabs=[("hier","Structure"),("sarc","Sarcomere · F–L"),("xbridge","Cross-bridge"),("serpar","Series vs parallel"),("arch","Architecture · PCSA"),("fv","Force–velocity"),("drills","Drills · XP"),("problems","Problems")]
    tabhtml='<div class="tabs" id="mtabs">'+''.join(f'<button type="button" class="tabbtn {"on" if i==0 else ""}" data-k="{k}">{n}</button>' for i,(k,n) in enumerate(tabs))+'</div>'
    body=tabhtml+"""
  <section class="panel mpane" id="hier"></section>
  <section class="panel mpane" id="sarc" hidden></section>
  <section class="panel mpane" id="xbridge" hidden></section>
  <section class="panel mpane" id="serpar" hidden></section>
  <section class="panel mpane" id="arch" hidden></section>
  <section class="panel mpane" id="fv" hidden></section>
  <section class="panel mpane" id="drills" hidden><h4>Drills</h4><p class="note">Quick questions on structure, sarcomere length, series/parallel, architecture and the Hill curve. +10 XP per correct answer; the simulators above are your reference.</p><button type="button" class="btn primary" id="mdrillstart">Start</button><div id="mdrill" style="margin-top:10px"></div></section>
  <section class="mpane" id="problems" hidden><div class="layout"><nav class="problems" id="pnav"></nav><main class="sheet" id="psheet"></main></div></section>"""
    body=with_figure(body)
    scripts=fix+'\n'+OSIMJS+'\n'+game('biomech-muscle','dpl-biomech-muscle')+'\n'+open(os.path.join(W,'muscle_lab.js')).read()+'\n'+open(os.path.join(W,'bioprob.js')).read()+'\n'+open(os.path.join(W,'muscle_problems.js')).read()+'\nBP.init(); GAME.hud();'+fig_scripts('muscle')
    html=page('Skeletal Muscle Lab','Skeletal Muscle: Structure, Sliding Filament &amp; Architecture','Zoom from whole muscle to a single sarcomere, slide the filaments to see where force comes from, step through the cross-bridge cycle, stack sarcomeres in series and parallel, change pennation and PCSA, and trace the Hill force–velocity curve. Then drill it and solve engineering problems in the ES 305 format.',body,scripts,'#ff8a3d')
    open(os.path.join(OUT,'muscle.html'),'w').write(html); print('built muscle.html',len(html)//1024,'KB')

def build_arthro():
    tabs=[("rgs","Roll · glide · spin"),("ccrule","Convex–concave rule"),("knee","Knee: open vs closed chain"),("angles","Included vs anatomical"),("mob","Mobilization planner"),("drills","Drills · XP"),("problems","Problems")]
    tabhtml='<div class="tabs" id="mtabs">'+''.join(f'<button type="button" class="tabbtn {"on" if i==0 else ""}" data-k="{k}">{n}</button>' for i,(k,n) in enumerate(tabs))+'</div>'
    body=tabhtml+"""
  <section class="panel mpane" id="rgs"></section>
  <section class="panel mpane" id="ccrule" hidden></section>
  <section class="panel mpane" id="knee" hidden></section>
  <section class="panel mpane" id="angles" hidden></section>
  <section class="panel mpane" id="mob" hidden></section>
  <section class="panel mpane" id="drills" hidden><h4>Drills</h4><p class="note">Roll/glide/spin analogies, the convex–concave rule, slide and mobilization directions for real joints, angle conversions, screw-home. +10 XP per correct answer.</p><button type="button" class="btn primary" id="adrillstart">Start</button><div id="adrill" style="margin-top:10px"></div></section>
  <section class="mpane" id="problems" hidden><div class="layout"><nav class="problems" id="pnav"></nav><main class="sheet" id="psheet"></main></div></section>"""
    body=with_figure(body)
    scripts=fix+'\n'+OSIMJS+'\n'+game('biomech-arthro','dpl-biomech-arthro')+'\n'+open(os.path.join(W,'arthro_lab.js')).read()+'\n'+open(os.path.join(W,'bioprob.js')).read()+'\n'+open(os.path.join(W,'arthro_problems.js')).read()+'\nBP.init(); GAME.hud();'+fig_scripts('arthro')
    html=page('Arthrokinematics Lab','Arthrokinematics: Roll, Glide, Spin &amp; the Convex–Concave Rule','Watch the tire analogies, move a convex or concave surface and see why the glide must go the way it does, flex a knee in open and closed chain with the screw-home twist, read included and anatomical angles off a protractor, and run the three-step mobilization workflow on real joints. Then drill it and solve problems in the ES 305 format.',body,scripts,'#22d3ee')
    open(os.path.join(OUT,'arthro.html'),'w').write(html); print('built arthro.html',len(html)//1024,'KB')

def build_invdyn():
    tabs=[("segs","Segment parameters"),("com","Whole-body COM"),("moi","Moment of inertia"),("invdyn","Inverse dynamics"),("drills","Drills · XP"),("problems","Problems")]
    tabhtml='<div class="tabs" id="mtabs">'+''.join(f'<button type="button" class="tabbtn {"on" if i==0 else ""}" data-k="{k}">{n}</button>' for i,(k,n) in enumerate(tabs))+'</div>'
    body=tabhtml+"""
  <section class="panel mpane" id="segs"></section>
  <section class="panel mpane" id="com" hidden></section>
  <section class="panel mpane" id="moi" hidden></section>
  <section class="panel mpane" id="invdyn" hidden></section>
  <section class="panel mpane" id="drills" hidden><h4>Drills</h4><p class="note">Segment masses, COM facts, parallel axis, GRF reasoning, moment sign conventions and joint power. +10 XP per correct answer.</p><button type="button" class="btn primary" id="iddrillstart">Start</button><div id="iddrill" style="margin-top:10px"></div></section>
  <section class="mpane" id="problems" hidden><div class="layout"><nav class="problems" id="pnav"></nav><main class="sheet" id="psheet"></main></div></section>"""
    body=with_figure(body)
    scripts=fix+'\n'+OSIMJS+'\n'+game('biomech-invdyn','dpl-biomech-invdyn')+'\n'+open(os.path.join(W,'invdyn_lab.js')).read()+'\n'+open(os.path.join(W,'bioprob.js')).read()+'\n'+open(os.path.join(W,'invdyn_problems.js')).read()+'\nBP.init(); GAME.hud();'+fig_scripts('invdyn')
    html=page('Anthropometry & Inverse Dynamics Lab','Anthropometry &amp; Inverse Dynamics: From Body Segments to Joint Moments','Turn body mass and height into segment masses, centres of mass and moments of inertia; pose a body and watch its whole-body COM move (even outside the body); see why a bent knee halves the leg’s inertia; then walk the link-segment model from the force plate up through ankle, knee and hip to get joint reactions, net moments and powers. Drills and ES 305 problems follow.',body,scripts,'#b58cff')
    open(os.path.join(OUT,'invdyn.html'),'w').write(html); print('built invdyn.html',len(html)//1024,'KB')

def build_anatomy():
    body="""
  <div class="tabs" id="tabs"><button type="button" class="tabbtn on" data-k="explore">Explore</button><button type="button" class="tabbtn" data-k="drills">Drills · earn XP</button><button type="button" class="tabbtn" data-k="reference">Reference tables</button></div>
  <div class="jetlayout">
    <section>
      <div id="bscene" class="tall"><canvas id="bcanvas"></canvas></div>
      <div class="xray" style="margin-top:8px"><span class="note">View:</span><button type="button" class="btn small" data-view="front">Front</button><button type="button" class="btn small" data-view="side">Right side</button><button type="button" class="btn small" data-view="left">Left side</button><button type="button" class="btn small" data-view="back">Back</button><button type="button" class="btn small" data-view="iso">Iso</button><button type="button" class="btn small" id="showall">Show all · reset</button></div>
      <div class="panel" id="explore" style="margin-top:12px"><div id="ainfo"></div></div>
      <div class="panel" id="drills" style="margin-top:12px" hidden><h4>Drills</h4><p class="note">A structure is highlighted and isolated on the body — name it, give its origin/insertion/action, or pick the prime mover for a movement. Rotate the body if you need another view. +10 XP per correct answer.</p><button type="button" class="btn primary" id="andrillstart">Start</button><div id="andrill" style="margin-top:10px"></div></div>
      <div class="panel" id="reference" style="margin-top:12px" hidden><h4>Muscles: origin · insertion · action</h4><div id="areftable"></div></div>
    </section>
    <aside>
      <div class="panel"><h4>Peel back the layers</h4>
        <div class="xray"><button type="button" class="btn small" data-preset="skin">Skin</button><button type="button" class="btn small" data-preset="muscles">Muscles</button><button type="button" class="btn small" data-preset="deep">Deep muscles</button><button type="button" class="btn small" data-preset="skeleton">Skeleton</button><button type="button" class="btn small" data-preset="joints">Joints</button></div>
        <div class="ctl" style="margin-top:6px">
          <label>Skin <input type="range" id="lay-skin" min="0" max="1" step="0.05"></label>
          <label>Superficial muscles <input type="range" id="lay-m1" min="0" max="1" step="0.05"></label>
          <label>Deep muscles <input type="range" id="lay-m2" min="0" max="1" step="0.05"></label>
          <label>Bones <input type="range" id="lay-bone" min="0" max="1" step="0.05"></label>
          <label>Joints <input type="range" id="lay-joint" min="0" max="1" step="0.05"></label>
        </div>
        <div class="two" style="margin-top:6px"><label class="note">Region<select id="aregion"><option value="all">Whole body</option><option value="head">Head &amp; neck</option><option value="trunk">Trunk</option><option value="upper">Upper limb</option><option value="lower">Lower limb</option></select></label>
        <label class="note">Sides<select id="aside"><option value="both">Both sides</option><option value="right">Right side only</option></select></label></div>
      </div>
      <div class="panel" style="margin-top:12px"><h4>Find a structure</h4><input type="search" id="asearch" placeholder="search…" style="width:100%;background:var(--surface-3);color:var(--ink);border:1px solid #2c4274;border-radius:8px;padding:6px 8px;font:inherit"><select id="astruct" style="margin-top:6px"></select>
        <small class="note" style="display:block;margin-top:8px">Click a muscle on the body to see its origin (green), insertion (yellow), action, joints and planes. Isolate it to see its path through the other layers.</small></div>
      <div class="panel legend" style="margin-top:12px"><h4>Colours</h4><small><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#b8413a"></i> superficial muscle &nbsp; <i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#8e2f3a"></i> deep muscle</small><small><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#e8e2d2"></i> bone &nbsp; <i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#22d3ee"></i> joint centre &nbsp; <i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#d9b38c"></i> skin</small><small style="margin-top:6px">Pelvis, sacrum, femur, tibia and fibula are the bone meshes of the open-source OpenSim lower-limb model, and the lower-limb muscles are drawn along that model's attachment paths with its Hill-type parameters (Rajagopal et al. 2016; Lai et al. 2017; Uhlrich et al. 2022 — OpenSim, Apache 2.0; see NOTICE). Everything else is the original ATLAS model built from anatomical dimensions; those shapes are schematic. Attachments, actions and joint types follow standard references (Neumann; Moore; Gray's).</small></div>
    </aside>
  </div>"""
    scripts=fix+'\n'+OSIMJS+'\n'+game('biomech-anatomy','dpl-biomech-anatomy')+'\n'+open(os.path.join(W,'body3d.js')).read()+'\n'+open(os.path.join(W,'anatomy_model.js')).read()+'\n'+open(os.path.join(W,'anatomy.js')).read()+'\nGAME.hud();'
    html=page('Anatomy Explorer','Anatomy Explorer: Peel Back the Body','Skin, superficial muscles, deep muscles, skeleton and joints of the whole body — fade each layer in and out, click any structure for its origin, insertion, action, joints and planes, isolate it, and drill until the names stick.',body,scripts,'#ff5a8a')
    open(os.path.join(OUT,'anatomy.html'),'w').write(html); print('built anatomy.html',len(html)//1024,'KB')

def build_kinetics():
    tabs=[("elbow","Elbow torque lab"),("vec","Vector resolution"),("strength","Strength curves"),("pf","Patellofemoral load"),("grf","Force plate · GRF"),("loads","Load types & fractures"),("drills","Drills · XP"),("problems","Problems")]
    tabhtml='<div class="tabs" id="mtabs">'+''.join(f'<button type="button" class="tabbtn {"on" if i==0 else ""}" data-k="{k}">{n}</button>' for i,(k,n) in enumerate(tabs))+'</div>'
    body=tabhtml+"""
  <section class="panel mpane" id="elbow"></section>
  <section class="panel mpane" id="vec" hidden></section>
  <section class="panel mpane" id="strength" hidden></section>
  <section class="panel mpane" id="pf" hidden></section>
  <section class="panel mpane" id="grf" hidden></section>
  <section class="panel mpane" id="loads" hidden></section>
  <section class="panel mpane" id="drills" hidden><h4>Drills</h4><p class="note">Moment arms and EMA, vector resolution, strength curves, GRF and impulse, patellofemoral loading, load types and fracture patterns. +10 XP per correct answer.</p><button type="button" class="btn primary" id="kdrillstart">Start</button><div id="kdrill" style="margin-top:10px"></div></section>
  <section class="mpane" id="problems" hidden><div class="layout"><nav class="problems" id="pnav"></nav><main class="sheet" id="psheet"></main></div></section>"""
    body=with_figure(body)
    scripts=fix+'\n'+OSIMJS+'\n'+game('biomech-kinetics','dpl-biomech-kinetics')+'\n'+open(os.path.join(W,'kinetics_lab.js')).read()+'\n'+open(os.path.join(W,'bioprob.js')).read()+'\n'+open(os.path.join(W,'kinetics_problems.js')).read()+'\nBP.init(); GAME.hud();'+fig_scripts('kinetics')
    html=page('Joint Kinetics Lab','Joint Kinetics: Torque, Leverage, Joint Loads &amp; the Force Plate','Hold a dumbbell and watch the external and muscle moment arms fight; resolve the biceps force into the part that turns and the part that squeezes; see why the bench press is hardest at the bottom; squat deeper and watch the patella load climb to several body weights; jump on a force plate and read impulse, take-off velocity and height; and learn which load type breaks a bone which way. Drills and ES 305 problems follow.',body,scripts,'#ffd23f')
    open(os.path.join(OUT,'kinetics.html'),'w').write(html); print('built kinetics.html',len(html)//1024,'KB')

def build_tissue():
    tabs=[("ss","Stress–strain curve"),("ve","Creep vs relaxation"),("hys","Hysteresis & rate"),("sd","Spring + damper"),("lig","Knee ligaments & tests"),("heal","Injury & healing"),("drills","Drills · XP"),("problems","Problems")]
    tabhtml='<div class="tabs" id="mtabs">'+''.join(f'<button type="button" class="tabbtn {"on" if i==0 else ""}" data-k="{k}">{n}</button>' for i,(k,n) in enumerate(tabs))+'</div>'
    body=tabhtml+"""
  <section class="panel mpane" id="ss"></section>
  <section class="panel mpane" id="ve" hidden></section>
  <section class="panel mpane" id="hys" hidden></section>
  <section class="panel mpane" id="sd" hidden></section>
  <section class="panel mpane" id="lig" hidden></section>
  <section class="panel mpane" id="heal" hidden></section>
  <section class="panel mpane" id="drills" hidden><h4>Drills</h4><p class="note">Curve regions, creep vs relaxation, hysteresis, rate dependence, tendon vs ligament, healing times, knee ligaments and their clinical tests. +10 XP per correct answer.</p><button type="button" class="btn primary" id="tdrillstart">Start</button><div id="tdrill" style="margin-top:10px"></div></section>
  <section class="mpane" id="problems" hidden><div class="layout"><nav class="problems" id="pnav"></nav><main class="sheet" id="psheet"></main></div></section>"""
    body=with_figure(body)
    scripts=fix+'\n'+OSIMJS+'\n'+game('biomech-tissue','dpl-biomech-tissue')+'\n'+open(os.path.join(W,'tissue_lab.js')).read()+'\n'+open(os.path.join(W,'bioprob.js')).read()+'\n'+open(os.path.join(W,'tissue_problems.js')).read()+'\nBP.init(); GAME.hud();'+fig_scripts('tissue')
    html=page('Ligaments & Tendons Lab','Ligaments &amp; Tendons: Viscoelastic Tissue','Pull a tendon or ligament through the toe, elastic, plastic and failure regions and release it; hold a calf stretch and watch the force relax, or a brace and watch the tissue creep; load and unload to see the hysteresis loop widen with speed; model the passive force as spring plus damper; test the knee ligaments with Lachman, drawer, pivot shift and stress tests; and see why these tissues heal so slowly. Drills and ES 305 problems follow.',body,scripts,'#9fd8ff')
    open(os.path.join(OUT,'tissue.html'),'w').write(html); print('built tissue.html',len(html)//1024,'KB')

def build_multi():
    tabs=[("pattern","Patterns · two-link player"),("fkin","Forward kinematics & reach"),("aa","Angle–angle · coupling"),("energy","Energy transfer · biarticular"),("seq","Proximal-to-distal"),("chain","Chain stiffness"),("drills","Drills · XP"),("problems","Problems")]
    tabhtml='<div class="tabs" id="mtabs">'+''.join(f'<button type="button" class="tabbtn {"on" if i==0 else ""}" data-k="{k}">{n}</button>' for i,(k,n) in enumerate(tabs))+'</div>'
    body=tabhtml+"""
  <section class="panel mpane" id="pattern"></section>
  <section class="panel mpane" id="fkin" hidden></section>
  <section class="panel mpane" id="aa" hidden></section>
  <section class="panel mpane" id="energy" hidden></section>
  <section class="panel mpane" id="seq" hidden></section>
  <section class="panel mpane" id="chain" hidden></section>
  <section class="panel mpane" id="drills" hidden><h4>Drills</h4><p class="note">Movement patterns, the 2 : 1 rule, coupling-angle quadrants, forward kinematics and reach, the four energy transfers, biarticular roles, sequencing and chain stiffness. +10 XP per correct answer.</p><button type="button" class="btn primary" id="mdrillstart2">Start</button><div id="mdrill2" style="margin-top:10px"></div></section>
  <section class="mpane" id="problems" hidden><div class="layout"><nav class="problems" id="pnav"></nav><main class="sheet" id="psheet"></main></div></section>"""
    body=with_figure(body)
    scripts=fix+'\n'+OSIMJS+'\n'+game('biomech-multi','dpl-biomech-multi')+'\n'+open(os.path.join(W,'multi_lab.js')).read()+'\n'+open(os.path.join(W,'bioprob.js')).read()+'\n'+open(os.path.join(W,'multi_problems.js')).read()+'\nBP.init(); GAME.hud();'+fig_scripts('multi')
    html=page('Multi-Joint Movement Lab','Multi-Joint Movement: Patterns, Coordination &amp; Energy Transfer','Drive a two-link chain and watch flexion, extension, swing and whip patterns draw their paths; turn joint angles into hand positions and map the reach area; read angle–angle and coupling-angle plots for gait; trace how energy moves between joints and links and why biarticular muscles matter; see why throwers sequence proximal-to-distal; and feel how a chain’s stiffness depends on its configuration. Drills and ES 305 problems follow.',body,scripts,'#b58cff')
    open(os.path.join(OUT,'multi.html'),'w').write(html); print('built multi.html',len(html)//1024,'KB')

def build_mtc():
    tabs=[("hill","Hill model rig"),("action","Motor · brake · strut · spring"),("recruit","Recruitment & rate coding"),("rfd","Force development & fatigue"),("stab","Joint stability"),("pop","Popping sarcomeres · injury"),("drills","Drills · XP"),("problems","Problems")]
    tabhtml='<div class="tabs" id="mtabs">'+''.join(f'<button type="button" class="tabbtn {"on" if i==0 else ""}" data-k="{k}">{n}</button>' for i,(k,n) in enumerate(tabs))+'</div>'
    body=tabhtml+"""
  <section class="panel mpane" id="hill"></section>
  <section class="panel mpane" id="action" hidden></section>
  <section class="panel mpane" id="recruit" hidden></section>
  <section class="panel mpane" id="rfd" hidden></section>
  <section class="panel mpane" id="stab" hidden></section>
  <section class="panel mpane" id="pop" hidden></section>
  <section class="panel mpane" id="drills" hidden><h4>Drills</h4><p class="note">Hill-model elements, the seven force factors, MTC roles, recruitment and rate coding, EMD and RFD, fatigue vs task failure, stability vocabulary and injury mechanisms. +10 XP per correct answer.</p><button type="button" class="btn primary" id="hdrillstart">Start</button><div id="hdrill" style="margin-top:10px"></div></section>
  <section class="mpane" id="problems" hidden><div class="layout"><nav class="problems" id="pnav"></nav><main class="sheet" id="psheet"></main></div></section>"""
    body=with_figure(body)
    scripts=fix+'\n'+OSIMJS+'\n'+game('biomech-mtc','dpl-biomech-mtc')+'\n'+open(os.path.join(W,'mtc_lab.js')).read()+'\n'+open(os.path.join(W,'bioprob.js')).read()+'\n'+open(os.path.join(W,'mtc_problems.js')).read()+'\nBP.init(); GAME.hud();'+fig_scripts('mtc')
    html=page('MTC & Joint Stability Lab','The Muscle–Tendon Complex, Neural Control &amp; Joint Stability','Drive a three-element Hill model and watch the fibres shorten as the tendon stretches; set an MTC against a load and see it act as motor, brake, strut or spring; recruit motor units by size and fuse twitches into tetanus; race a fast-developing muscle against a strong one and watch fatigue meet task failure; perturb a joint held by one ligament and add co-contraction; and run the popping-sarcomere cascade. Drills and ES 305 problems follow.',body,scripts,'#ff5a8a')
    open(os.path.join(OUT,'mtc.html'),'w').write(html); print('built mtc.html',len(html)//1024,'KB')

def build_capstone():
    tabs=[("frame","Four steps · hierarchical model"),("invu","Inverted U"),("balance","Standing balance"),("jump","Jump & landing"),("cycle","Cycling"),("glass","Drinking from a glass"),("chair","Wheelchair push"),("gait","Gait viewer"),("drills","Final review · XP"),("problems","Problems")]
    tabhtml='<div class="tabs" id="mtabs">'+''.join(f'<button type="button" class="tabbtn {"on" if i==0 else ""}" data-k="{k}">{n}</button>' for i,(k,n) in enumerate(tabs))+'</div>'
    body=tabhtml+"""
  <section class="panel mpane" id="frame"></section>
  <section class="panel mpane" id="invu" hidden></section>
  <section class="panel mpane" id="balance" hidden></section>
  <section class="panel mpane" id="jump" hidden></section>
  <section class="panel mpane" id="cycle" hidden></section>
  <section class="panel mpane" id="glass" hidden></section>
  <section class="panel mpane" id="chair" hidden></section>
  <section class="panel mpane" id="gait" hidden></section>
  <section class="panel mpane" id="drills" hidden><h4>Final review</h4><p class="note">Questions from the capstone cases and from every earlier topic — frames, muscle, tissue, MTC, arthrokinematics, kinetics, inverse dynamics, multi-joint, stability. Each card shows which topic it is from. +10 XP per correct answer.</p><button type="button" class="btn primary" id="cdrillstart">Start</button><div id="cdrill" style="margin-top:10px"></div></section>
  <section class="mpane" id="problems" hidden><div class="layout"><nav class="problems" id="pnav"></nav><main class="sheet" id="psheet"></main></div></section>"""
    body=with_figure(body)
    scripts=fix+'\n'+OSIMJS+'\n'+open(os.path.join(W,'gait_data.js')).read()+'\n'+game('biomech-capstone','dpl-biomech-capstone')+'\n'+open(os.path.join(W,'capstone_lab.js')).read()+'\n'+open(os.path.join(W,'bioprob.js')).read()+'\n'+open(os.path.join(W,'capstone_problems.js')).read()+'\nBP.init(); GAME.hud();'+fig_scripts('capstone')
    html=page('Movement Analysis Capstone','Putting It All Together: The Four-Step Movement Analysis','Build a hierarchical model and cross out what cannot be changed; see why more is not always better on the inverted U; balance an inverted-pendulum body by moving its centre of pressure; jump, land, pedal, lift a glass and push a wheelchair with the numbers attached; read a gait cycle; then take the final review that pulls from every topic in the course, and solve the capstone problems.',body,scripts,'#ffd23f')
    open(os.path.join(OUT,'capstone.html'),'w').write(html); print('built capstone.html',len(html)//1024,'KB')
def build_home():
    h=open(os.path.join(W,'bhome.html')).read()
    html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'+h[:h.index('</style>')+8]+'</head><body>'+h[h.index('</style>')+8:]+'</body></html>'
    open(os.path.join(OUT,'index.html'),'w').write(html); print('built biomech index.html')
if __name__=='__main__':
    build_frames(); build_muscle(); build_arthro(); build_invdyn(); build_anatomy(); build_kinetics(); build_tissue(); build_multi(); build_mtc(); build_capstone(); build_home()
