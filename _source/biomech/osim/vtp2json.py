#!/usr/bin/env python3
"""Convert OpenSim Geometry .vtp (ASCII VTK PolyData) files into a compact JSON mesh bundle.

usage: python3 -I vtp2json.py out.json name=path.vtp [name=path.vtp ...] [mirror:newname=name ...]

Each mesh → {"v":[x,y,z,...] (meters, 4 dp), "f":[i,j,k,...] (triangles, outward CCW winding)}.
Quads/polygons are fan-triangulated.  Winding is checked with the signed volume and flipped
if the mesh is inside-out.  mirror:l_x=r_x produces a z-mirrored copy with corrected winding.
"""
import sys, json, re, xml.etree.ElementTree as ET

def parse_vtp(path):
    root = ET.parse(path).getroot()
    piece = root.find('.//Piece')
    pts_el = piece.find('./Points/DataArray')
    assert pts_el.get('format') == 'ascii', 'only ASCII .vtp supported (export uncompressed)'
    nums = [float(x) for x in pts_el.text.split()]
    V = [nums[i:i+3] for i in range(0, len(nums), 3)]
    polys = piece.find('./Polys')
    conn = offs = None
    for da in polys.findall('DataArray'):
        if da.get('Name') == 'connectivity': conn = [int(x) for x in da.text.split()]
        if da.get('Name') == 'offsets': offs = [int(x) for x in da.text.split()]
    F = []; start = 0
    for o in offs:
        poly = conn[start:o]; start = o
        for k in range(1, len(poly)-1):
            F.append((poly[0], poly[k], poly[k+1]))
    return V, F

def signed_volume(V, F):
    s = 0.0
    for a, b, c in F:
        A, B, C = V[a], V[b], V[c]
        s += (A[0]*(B[1]*C[2]-B[2]*C[1]) - A[1]*(B[0]*C[2]-B[2]*C[0]) + A[2]*(B[0]*C[1]-B[1]*C[0]))
    return s/6.0

def fix_winding(V, F):
    if signed_volume(V, F) < 0:
        F = [(a, c, b) for a, b, c in F]
    return F

def cluster(V, F, cell):
    """vertex-clustering decimation: snap vertices to a grid of size `cell` (m), merge, drop degenerate triangles"""
    import collections
    key = {}; newV = []; acc = collections.defaultdict(lambda: [0.0, 0.0, 0.0, 0]); idx = {}
    for i, p in enumerate(V):
        k = (int(round(p[0]/cell)), int(round(p[1]/cell)), int(round(p[2]/cell)))
        if k not in idx: idx[k] = len(newV); newV.append(None)
        a = acc[k]; a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; a[3] += 1; key[i] = idx[k]
    for k, j in idx.items():
        a = acc[k]; newV[j] = [a[0]/a[3], a[1]/a[3], a[2]/a[3]]
    seen = set(); newF = []
    for a, b, c in F:
        t = (key[a], key[b], key[c])
        if len(set(t)) < 3: continue
        s = tuple(sorted(t))
        if s in seen: continue
        seen.add(s); newF.append(t)
    return newV, newF

def components(V, F):
    """connected components of the triangle mesh → list of face-index lists"""
    parent = list(range(len(V)))
    def find(x):
        while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
        return x
    for a, b, c in F:
        ra, rb, rc = find(a), find(b), find(c); parent[rb] = ra; parent[find(rc)] = find(ra)
    groups = {}
    for i, (a, b, c) in enumerate(F): groups.setdefault(find(a), []).append(i)
    return list(groups.values())

def pack(V, F):
    return {"v": [round(x, 4) for p in V for x in p], "f": [i for t in F for i in t]}

def main():
    out = sys.argv[1]; meshes = {}
    for arg in sys.argv[2:]:
        if arg.startswith('mirror:'):
            new, src = arg[7:].split('=')
            m = meshes[src]; V = [m['v'][i:i+3] for i in range(0, len(m['v']), 3)]
            F = [tuple(m['f'][i:i+3]) for i in range(0, len(m['f']), 3)]
            V = [[x, y, -z] for x, y, z in V]
            F = fix_winding(V, F)
            meshes[new] = pack(V, F)
            print(f'{new}: mirrored from {src}')
        elif arg.startswith('split:'):
            new, rest = arg[6:].split('=', 1); src, box = rest.split(':'); lim = [float(x) if x not in ('*',) else None for x in box.split(',')]
            m = meshes[src]; V = [m['v'][i:i+3] for i in range(0, len(m['v']), 3)]; F = [tuple(m['f'][i:i+3]) for i in range(0, len(m['f']), 3)]
            def inside(t):
                c = [(V[t[0]][k]+V[t[1]][k]+V[t[2]][k])/3 for k in range(3)]
                for k in range(3):
                    lo, hi = lim[2*k], lim[2*k+1]
                    if lo is not None and c[k] < lo: return False
                    if hi is not None and c[k] > hi: return False
                return True
            keep = [t for t in F if inside(t)]; rest_f = [t for t in F if not inside(t)]
            used = sorted({i for t in keep for i in t}); remap = {o: n for n, o in enumerate(used)}
            meshes[new] = pack([V[i] for i in used], [(remap[a], remap[b], remap[c]) for a, b, c in keep])
            used2 = sorted({i for t in rest_f for i in t}); remap2 = {o: n for n, o in enumerate(used2)}
            meshes[src] = pack([V[i] for i in used2], [(remap2[a], remap2[b], remap2[c]) for a, b, c in rest_f])
            print(f'{new}: split {len(keep)} tris out of {src} ({len(rest_f)} left)')
        else:
            name, spec = arg.split('=', 1)
            cell = None
            if '@' in spec: spec, cell = spec.split('@'); cell = float(cell)
            V, F = [], []
            for path in spec.split('+'):
                v, f = parse_vtp(path); off = len(V); V += v; F += [(a+off, b+off, c+off) for a, b, c in f]
            if cell: V, F = cluster(V, F, cell)
            F = fix_winding(V, F)
            meshes[name] = pack(V, F)
            print(f'{name}: {len(V)} verts, {len(F)} tris, vol {signed_volume(V,F)*1e6:.1f} cm^3')
    json.dump(meshes, open(out, 'w'), separators=(',', ':'))
    print('wrote', out)

if __name__ == '__main__':
    main()
