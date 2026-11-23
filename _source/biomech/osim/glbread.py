import json, struct, numpy as np
CT={5120:np.int8,5121:np.uint8,5122:np.int16,5123:np.uint16,5125:np.uint32,5126:np.float32}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
def load(p):
    f=open(p,'rb'); f.seek(12); clen,ct=struct.unpack('<II',f.read(8)); js=json.loads(f.read(clen)); blen,bt=struct.unpack('<II',f.read(8)); buf=f.read(blen)
    def acc(i):
        a=js['accessors'][i]; bv=js['bufferViews'][a['bufferView']]; dt=CT[a['componentType']]; n=NC[a['type']]
        off=bv.get('byteOffset',0)+a.get('byteOffset',0); stride=bv.get('byteStride',0); cnt=a['count']; itemsize=np.dtype(dt).itemsize*n
        if stride and stride!=itemsize:
            raw=np.frombuffer(buf,dtype=np.uint8,count=stride*cnt,offset=off).reshape(cnt,stride)[:, :itemsize].copy(); return np.frombuffer(raw.tobytes(),dtype=dt).reshape(cnt,n)
        return np.frombuffer(buf,dtype=dt,count=cnt*n,offset=off).reshape(cnt,n)
    def quat(q):
        x,y,z,w=q; return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
    parent={}
    for i,n in enumerate(js['nodes']):
        for c in n.get('children',[]): parent[c]=i
    def local(n):
        M=np.eye(4)
        if 'matrix' in n: return np.array(n['matrix']).reshape(4,4).T
        T=np.array(n.get('translation',[0,0,0])); R=quat(n.get('rotation',[0,0,0,1])); S=np.array(n.get('scale',[1,1,1]))
        M[:3,:3]=R*S[None,:]; M[:3,3]=T; return M
    def world(i):
        M=local(js['nodes'][i]); return (world(parent[i])@M) if i in parent else M
    out=[]
    for i,n in enumerate(js['nodes']):
        if 'mesh' not in n: continue
        W=world(i)
        prims=[]
        for pr in js['meshes'][n['mesh']]['primitives']:
            P=acc(pr['attributes']['POSITION']).astype(np.float64); P=P@W[:3,:3].T+W[:3,3]
            I=acc(pr['indices']).reshape(-1,3).astype(np.int64)
            mat=js['materials'][pr['material']].get('name','') if 'material' in pr else ''
            prims.append((mat,P,I))
        out.append((n['name'],prims))
    return out
