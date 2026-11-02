#!/usr/bin/env python3
"""Convert OpenSim Geometry .vtp (ASCII VTK PolyData) files into a compact JSON mesh bundle.

usage: python3 -I vtp2json.py out.json name=path.vtp [name=path.vtp ...] [mirror:newname=name ...]

Each mesh → {"v":[x,y,z,...] (metres, 4 dp), "f":[i,j,k,...] (triangles, outward CCW winding)}.
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
        else:
            name, path = arg.split('=', 1)
            V, F = parse_vtp(path)
            F = fix_winding(V, F)
            meshes[name] = pack(V, F)
            print(f'{name}: {len(V)} verts, {len(F)} tris, vol {signed_volume(V,F)*1e6:.1f} cm^3')
    json.dump(meshes, open(out, 'w'), separators=(',', ':'))
    print('wrote', out)

if __name__ == '__main__':
    main()
