#!/usr/bin/env python3
"""Z-Anatomy GLB (Blender export) -> ATLAS compact body mesh (zanatomy.bin + header). Coordinates: ATLAS = (z, y, -x) of the glTF export, metres."""
import sys, json, re, numpy as np, struct
sys.path.insert(0,'.'); from glbread import load
SRC='/mnt/user-data/uploads/ZAnatomy/zanatomy_muscles_bones.glb'
MUS={'Internal rotator','External rotation','Flexion','Extension','Orbicularis/Constrictor','Depressor','Levator','Phonation','Ingestion','Abductor','Biarticular','Masticator','Adductor','Superficial','Extensor extremities','Extension hand/foot','Flexion hand/foot','Flexion fingers','Trapezius','Diaphragm'}
def cat_of(mat):
    if mat.startswith('Bone') or mat.startswith('Suture') or mat in ('Teeth','Teeth-roots','Dentine'): return 'bone'
    if mat=='Cartilage': return 'cart'
    if mat in MUS: return 'muscle'
    if mat=='Tendon': return 'tendon'
    if mat in ('Ligament','Articular capsule'): return 'lig'
    return None
SKIP=re.compile(r'bursa|fascia|sheath|Trochlea of superior|Tendinous arch|Take a picture|HOW TO|Internal intercostal|Innermost intercostal',re.I)
def cluster(P,F,cell):
    key=np.floor(P/cell+0.5).astype(np.int64); k=key[:,0]*73856093 ^ key[:,1]*19349663 ^ key[:,2]*83492791
    uniq,inv=np.unique(k,return_inverse=True); n=len(uniq)
    V=np.zeros((n,3)); cnt=np.zeros(n); np.add.at(V,inv,P); np.add.at(cnt,inv,1); V/=cnt[:,None]
    T=inv[F]; ok=(T[:,0]!=T[:,1])&(T[:,1]!=T[:,2])&(T[:,0]!=T[:,2]); T=T[ok]
    if len(T): s=np.sort(T,1); _,ui=np.unique(s,axis=0,return_index=True); T=T[np.sort(ui)]
    used=np.unique(T); remap=-np.ones(n,dtype=np.int64); remap[used]=np.arange(len(used)); return V[used],remap[T]
def smooth(V,T,it=2,lam=0.5):
    """Laplacian smoothing (umbrella operator) to take the clustering crumple out of thin sheets"""
    e=np.vstack([T[:,[0,1]],T[:,[1,2]],T[:,[2,0]]]); e=np.vstack([e,e[:,::-1]])
    for _ in range(it):
        acc=np.zeros_like(V); cnt=np.zeros(len(V)); np.add.at(acc,e[:,0],V[e[:,1]]); np.add.at(cnt,e[:,0],1); cnt[cnt==0]=1
        V=V+lam*(acc/cnt[:,None]-V)
    return V
def normals(V,T):
    N=np.zeros_like(V); a=V[T[:,0]],V[T[:,1]],V[T[:,2]]; fn=np.cross(a[1]-a[0],a[2]-a[0])
    for i in range(3): np.add.at(N,T[:,i],fn)
    l=np.linalg.norm(N,axis=1); l[l==0]=1; return N/l[:,None]
parts=load(SRC); out=[]; Vs=[]; Ns=[]; Is=[]; vbase=0; tri_in=0; tri_out=0
for name,prims in parts:
    if SKIP.search(name): continue
    groups={}
    for mat,P,I in prims:
        c=cat_of(mat)
        if c is None: continue
        groups.setdefault(c,[]).append((P,I))
    side='R' if name.endswith('.r') else 'L' if name.endswith('.l') else 'C'
    base=re.sub(r'\.[lr]$','',name)
    for c,lst in groups.items():
        P=np.vstack([p for p,_ in lst]); I=np.vstack([i+off for (_,i),off in zip(lst,np.cumsum([0]+[len(p) for p,_ in lst[:-1]]))])
        P=np.stack([P[:,2],P[:,1],-P[:,0]],1)   # -> ATLAS axes
        ext=P.max(0)-P.min(0); diag=np.linalg.norm(ext); thin=np.sort(ext)[0]
        a=P[I[:,0]],P[I[:,1]],P[I[:,2]]; fn=np.cross(a[1]-a[0],a[2]-a[0]); area=0.5*np.linalg.norm(fn,axis=1).sum(); vol=abs(np.einsum('ij,ij->i',a[0],fn).sum()/6); tmean=2*vol/max(area,1e-9)  # mean shell thickness
        cell=min(0.007,max(0.0022,min(diag/40,thin/1.6))) if c!='muscle' else min(0.007,max(0.002,min(diag/35,thin/2.6)))
        if c=='muscle' and area>0.015 and tmean<0.009 and 'Diaphragm' not in name: cell=min(cell,max(0.0022,tmean/1.8))   # thin sheets (obliques, serratus, intercostals) need cells well below their thickness or the two faces merge
        tri_in+=len(I); V,T=cluster(P,I,cell)
        if len(T)==0: continue
        if c in ('muscle','tendon','lig'): V=smooth(V,T,2,0.5)
        N=normals(V,T); tri_out+=len(T)
        out.append({'n':base,'s':side,'c':c,'vo':vbase,'vc':len(V),'io':sum(len(x) for x in Is)*3,'ic':len(T)*3,'bb':[*P.min(0).round(4).tolist(),*P.max(0).round(4).tolist()]})
        assert len(V)<65536, (name,len(V)); Vs.append(V); Ns.append(N); Is.append(T); vbase+=len(V)
V=np.vstack(Vs); N=np.vstack(Ns); I=np.vstack(Is).astype(np.uint16)  # indices local to each part (vo added by the loader)
Q=0.0001; Vq=np.clip(np.round(V/Q),-32767,32767).astype(np.int16); Nq=np.clip(np.round(N*127),-127,127).astype(np.int8)
hdr={'q':Q,'nv':len(V),'ni':I.size,'parts':out,'credit':'Z-Anatomy (CC BY-SA 4.0), decimated'}
hj=json.dumps(hdr,separators=(',',':')).encode(); pad=(4-len(hj)%4)%4; hj+=b' '*pad
with open('zanatomy.bin','wb') as f:
    f.write(b'ZANA'); f.write(struct.pack('<I',len(hj))); f.write(hj); f.write(Vq.tobytes()); f.write(Nq.tobytes()); f.write(b'\0'*((4-(len(Vq.tobytes())+len(Nq.tobytes()))%4)%4)); f.write(I.tobytes())
import os; print('parts',len(out),'verts',len(V),'tris in',tri_in,'out',I.size//3,'file MB',os.path.getsize('zanatomy.bin')/1e6)
import collections; print(collections.Counter(p['c'] for p in out))

# ---------- kinematic landmarks from the bones (right side, ATLAS axes) → header 'lm' ----------
def verts_of(name, side='R'):
    for n,prims in parts:
        if n==name+('.'+side.lower() if side!='C' else '') :
            P=np.vstack([p for m,p,i in prims if cat_of(m) in ('bone','cart')]); return np.stack([P[:,2],P[:,1],-P[:,0]],1)
    return None
def cen(P): return P.mean(0)
def region(P,axis,frac,top=True):
    lo,hi=P[:,axis].min(),P[:,axis].max(); cut=hi-(hi-lo)*frac if top else lo+(hi-lo)*frac
    return P[P[:,axis]>=cut] if top else P[P[:,axis]<=cut]
fem=verts_of('Femur'); tib=verts_of('Tibia'); tal=verts_of('Talus'); cal=verts_of('Calcaneus'); nav=verts_of('Navicular bone'); mt1=verts_of('First metatarsal bone'); dp1f=verts_of('Distal phalanx of first finger of foot')
hum=verts_of('Humerus'); rad=verts_of('Radius'); uln=verts_of('Ulna'); mc3=verts_of('Third metacarpal bone'); mc1=verts_of('First metacarpal bone'); dp3=verts_of('Distal phalanx of third finger of hand'); dp1=verts_of('Distal phalanx of first finger of hand')
clav=verts_of('Clavicle'); scap=verts_of('Scapula'); hip=verts_of('Hip bone'); sac=verts_of('Sacrum','C'); c7=verts_of('Vertebra C7','C'); c2=verts_of('Axis (C2)','C'); c1=verts_of('Atlas (C1)','C'); mand=verts_of('Mandible','C'); occ=verts_of('Occipital bone','C'); par=verts_of('Parietal bone','R'); l5=verts_of('Vertebra L5','C'); t12=verts_of('Vertebra T12','C')
head=region(fem,1,0.07,True); headc=cen(head)
LM={'HIP':headc,'KN':cen(region(fem,1,0.05,False)),'AN':cen(tal),'SUB':cen(region(tal,1,0.3,False)),'MID':cen(nav),'MTP':cen(region(mt1,0,0.15,True)),'TOE':cen(region(dp1f,0,0.2,True)),
    'GH':cen(region(hum,1,0.07,True)),'EL':cen(region(hum,1,0.05,False)),'RU':cen(region(rad,1,0.06,True)),'WR':cen(region(rad,1,0.06,False)),'MCP':cen(region(mc3,1,0.15,False)),'FING':cen(region(dp3,1,0.25,False)),'CMC':cen(region(mc1,1,0.15,True)),'THUMB':cen(region(dp1,1,0.25,False)),
    'SC':cen(clav[np.abs(clav[:,2])<np.abs(clav[:,2]).min()+0.012]),'AC':cen(clav[np.abs(clav[:,2])>np.abs(clav[:,2]).max()-0.012]),'SCAP':cen(scap),
    'C7':cen(c7),'AA':cen(c2),'AO':cen(c1),'TMJ':cen((lambda R:R[R[:,2]>0])(region(region(mand,1,0.08,True),0,0.5,False))),'CHIN':cen(region(mand,0,0.1,True)),'HEADTOP':cen(region(par,1,0.05,True)),
    'L5S1':cen(region(sac,1,0.1,True)),'T12':cen(t12),'ASIS':cen(region(hip,0,0.06,True)),'GT':cen(hip[hip[:,1]<hip[:,1].min()+0.001]) }
LM['ASIS'][2]=abs(LM['ASIS'][2]); LM['PELV']=np.array([LM['ASIS'][0],LM['ASIS'][1],0.0])
hdr['lm']={k:[round(float(x),4) for x in v] for k,v in LM.items()}
hj=json.dumps(hdr,separators=(',',':')).encode(); pad=(4-len(hj)%4)%4; hj+=b' '*pad
with open('zanatomy.bin','wb') as f:
    f.write(b'ZANA'); f.write(struct.pack('<I',len(hj))); f.write(hj); f.write(Vq.tobytes()); f.write(Nq.tobytes()); f.write(b'\0'*((4-(len(Vq.tobytes())+len(Nq.tobytes()))%4)%4)); f.write(I.tobytes())
print({k:hdr['lm'][k] for k in ['HIP','KN','AN','GH','EL','WR','MCP','SC','AC','AO','TMJ','PELV','L5S1','HEADTOP']})
