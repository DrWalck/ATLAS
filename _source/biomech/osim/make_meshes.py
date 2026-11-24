#!/usr/bin/env python3
"""Build meshes.json for ATLAS from the OpenSim Geometry folder (staged at GEO).
Run: python3 -I make_meshes.py
Each mesh is stored in its OpenSim body frame (meters); make_osim_data.py places it on the ATLAS body.
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vtp2json import parse_vtp, fix_winding, cluster, components, pack, signed_volume
GEO = '/mnt/user-data/uploads/Geometry'
UP = '/root/.claude/uploads/f4ccbc87-50bb-57ff-a31b-cf49b02b4071'
meshes = {}

def load(path, cell=None):
    V, F = parse_vtp(path)
    if cell: V, F = cluster(V, F, cell)
    F = fix_winding(V, F)
    return V, F

def put(name, V, F, note=''):
    meshes[name] = pack(V, F); print(f'{name:16s} {len(V):5d} v {len(F):5d} t {note}')

def mirror(name, src):
    m = meshes[src]; V = [[m['v'][i], m['v'][i+1], -m['v'][i+2]] for i in range(0, len(m['v']), 3)]
    F = [(m['f'][i], m['f'][i+2], m['f'][i+1]) for i in range(0, len(m['f']), 3)]   # flip winding with the mirror
    put(name, V, F, f'(mirror of {src})')

def sub(V, F, faces):
    used = sorted({i for fi in faces for i in F[fi]}); remap = {o: n for n, o in enumerate(used)}
    return [V[i] for i in used], [(remap[F[fi][0]], remap[F[fi][1]], remap[F[fi][2]]) for fi in faces]

def centroid(V, F, faces):
    pts = [V[i] for fi in faces for i in F[fi]]
    return [sum(p[k] for p in pts)/len(pts) for k in range(3)]

# ---------- pelvis / sacrum / legs ----------
V, F = load(f'{UP}/27bae7c3-r_pelvis.vtp'); put('r_pelvis', V, F)
V, F = load(f'{UP}/262ffbc1-l_pelvis.vtp'); put('l_pelvis', V, F)
V, F = load(f'{UP}/cfb561b7-sacrum.vtp'); put('sacrum', V, F)
V, F = load(f'{GEO}/l_femur.vtp'); put('l_femur', V, F); mirror('r_femur', 'l_femur')
V, F = load(f'{UP}/9cb83ff1-r_tibia.vtp'); put('r_tibia', V, F)
V, F = load(f'{UP}/2ba2af78-l_tibia.vtp'); put('l_tibia', V, F)
V, F = load(f'{UP}/7080d1dd-r_fibula.vtp'); put('r_fibula', V, F); mirror('l_fibula', 'r_fibula')
V, F = load(f'{GEO}/r_patella.vtp'); put('r_patella', V, F); mirror('l_patella', 'r_patella')
V, F = load(f'{GEO}/r_talus.vtp'); put('r_talus', V, F); mirror('l_talus', 'r_talus')
V, F = load(f'{GEO}/r_foot.vtp', 0.006); put('r_foot', V, F); mirror('l_foot', 'r_foot')
V, F = load(f'{GEO}/r_bofoot.vtp', 0.006); put('r_bofoot', V, F); mirror('l_bofoot', 'r_bofoot')

# ---------- torso: skull, jaw, spine (split C / T / L by vertebra), ribs + sternum, scapulae, clavicles ----------
V, F = load(f'{GEO}/hat_skull.vtp', 0.010); put('hat_skull', V, F)
V, F = load(f'{GEO}/hat_jaw.vtp', 0.007); put('hat_jaw', V, F)
V, F = parse_vtp(f'{GEO}/hat_spine.vtp'); F = fix_winding(V, F)
comps = components(V, F); cerv, thor, lumb = [], [], []
for c in comps:
    y = centroid(V, F, c)[1]
    (cerv if y > 0.40 else thor if y > 0.16 else lumb).extend(c)
for name, faces in [('spine_cerv', cerv), ('spine_thor', thor), ('spine_lumb', lumb)]:
    v, f = sub(V, F, faces); v, f = cluster(v, f, 0.0075); put(name, v, f)
V, F = parse_vtp(f'{GEO}/hat_ribs_scap.vtp'); F = fix_winding(V, F)
comps = components(V, F); ribs, stern, scapR, scapL, clavR, clavL = [], [], [], [], [], []
for c in comps:
    cx, cy, cz = centroid(V, F, c); n = len(c)
    if n > 1000 and abs(cz) > 0.08: (scapR if cz > 0 else scapL).extend(c)
    elif n > 1000: stern.extend(c)
    elif n > 300 and cy > 0.36: (clavR if cz > 0 else clavL).extend(c)
    else: ribs.extend(c)
for name, faces, cell in [('ribs', ribs, 0.008), ('sternum', stern, 0.008), ('scapula_r', scapR, 0.006), ('scapula_l', scapL, 0.006), ('clavicle_r', clavR, 0.005), ('clavicle_l', clavL, 0.005)]:
    v, f = sub(V, F, faces); v, f = cluster(v, f, cell); put(name, v, f)

# ---------- arms and hands ----------
for b in ['humerus', 'radius', 'ulna']:
    V, F = load(f'{GEO}/{b}_rv.vtp'); put(f'{b}_rv', V, F)
    V, F = load(f'{GEO}/{b}_lv.vtp'); put(f'{b}_lv', V, F)
CARP = ['capitate', 'hamate', 'lunate', 'pisiform', 'scaphoid', 'triquetrum', 'trapezoid', 'trapezium']
META = ['metacarpal1', 'metacarpal2', 'metacarpal3', 'metacarpal4', 'metacarpal5', 'thumb_proximal', 'thumb_distal'] + [f'{f}_{p}' for f in ['index', 'middle', 'ring', 'little'] for p in ['proximal', 'medial', 'distal']]
def merge(names, cell):
    V, F = [], []
    for n in names:
        v, f = parse_vtp(f'{GEO}/{n}_rvs.vtp'); off = len(V); V += v; F += [(a+off, b+off, c+off) for a, b, c in f]
    V, F = cluster(V, F, cell); return V, F
V, F = merge(CARP, 0.005); put('carpals_r', V, F); mirror('carpals_l', 'carpals_r')
V, F = merge(META, 0.006); put('hand_r', V, F); mirror('hand_l', 'hand_r')

json.dump(meshes, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'meshes.json'), 'w'), separators=(',', ':'))
tot = sum(len(m['f'])//3 for m in meshes.values()); print(f'{len(meshes)} meshes, {tot} triangles total')
