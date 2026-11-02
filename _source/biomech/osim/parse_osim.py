import xml.etree.ElementTree as ET, json, math, sys, re
import numpy as np
def rotXYZ(a):  # body-fixed X then Y then Z (OpenSim Rotation BodyRotationSequence XYZ) -> R = Rx*Ry*Rz
    x,y,z=a
    Rx=np.array([[1,0,0],[0,math.cos(x),-math.sin(x)],[0,math.sin(x),math.cos(x)]])
    Ry=np.array([[math.cos(y),0,math.sin(y)],[0,1,0],[-math.sin(y),0,math.cos(y)]])
    Rz=np.array([[math.cos(z),-math.sin(z),0],[math.sin(z),math.cos(z),0],[0,0,1]])
    return Rx@Ry@Rz
def vec(s): return np.array([float(v) for v in s.split()])
def fval0(fn):  # evaluate function element at x=0
    if fn is None: return 0.0
    tag=fn.tag
    if tag=='Constant': return float(fn.find('value').text)
    if tag=='LinearFunction': c=vec(fn.find('coefficients').text); return c[1]
    if tag in ('SimmSpline','NaturalCubicSpline','PiecewiseLinearFunction','GCVSpline'):
        x=vec(fn.find('x').text); y=vec(fn.find('y').text); return float(np.interp(0.0,x,y))
    if tag=='MultiplierFunction': return fval0([c for c in fn.find('function')][0])*float(fn.find('scale').text)
    return 0.0
def parse(path):
    root=ET.parse(path).getroot(); model=root.find('Model')
    bodies={b.get('name'):b for b in root.findall('.//BodySet/objects/Body')}
    T={'ground':(np.eye(3),np.zeros(3))}
    joints=list(root.find('.//JointSet/objects'))
    def frame(j,sock):
        name=j.find(sock).text.strip()
        for fr in j.findall('frames/PhysicalOffsetFrame'):
            if fr.get('name')==name:
                par=fr.find('socket_parent').text.strip().split('/')[-1]
                t=vec(fr.find('translation').text); o=vec(fr.find('orientation').text); return par,rotXYZ(o),t
        # direct socket to body
        return name.split('/')[-1],np.eye(3),np.zeros(3)
    jinfo={}
    pending=joints[:]
    for _ in range(50):
        rest=[]
        for j in pending:
            pb,Rp,tp=frame(j,'socket_parent_frame'); cb,Rc,tc=frame(j,'socket_child_frame')
            if pb not in T: rest.append(j); continue
            Rpar,tpar=T[pb]
            # joint frame in ground
            Rj=Rpar@Rp; tj=tpar+Rpar@tp
            # joint transform at default coords: translations along transform axes
            tr=np.zeros(3); Rq=np.eye(3)
            st=j.find('SpatialTransform')
            if st is not None:
                for ax in st.findall('TransformAxis'):
                    axis=vec(ax.find('axis').text); fn=[c for c in ax if c.tag not in ('coordinates','axis')]
                    v=fval0(fn[0]) if fn else 0.0
                    if ax.get('name').startswith('translation'): tr+=axis*v
            tjc=tj+Rj@tr; Rjc=Rj@Rq
            # child frame: T_child_offset in child body: X_child = Rjc * Rc^T ... child body origin = joint - Rchild*tc
            Rchild=Rjc@Rc.T; tchild=tjc-Rchild@tc
            T[cb]=(Rchild,tchild); jinfo[j.get('name')]={'type':j.tag,'parent':pb,'child':cb,'pos':tjc.round(4).tolist(),'coords':[c.get('name') for c in j.findall('coordinates/Coordinate')]}
        pending=rest
        if not pending: break
    muscles=[]
    for m in root.findall('.//ForceSet/objects/*'):
        if 'Muscle' not in m.tag: continue
        name=m.get('name')
        if name=='default': continue
        pts=[]
        for p in m.findall('GeometryPath/PathPointSet/objects/*'):
            body=p.find('socket_parent_frame').text.strip().split('/')[-1]
            if p.tag=='MovingPathPoint':
                loc=np.array([fval0([c for c in p.find(k)][0]) if p.find(k) is not None and len(list(p.find(k))) else 0.0 for k in ('x_location','y_location','z_location')])
            else:
                loc=vec(p.find('location').text)
            R,t=T.get(body,(np.eye(3),np.zeros(3)))
            g=t+R@loc
            pts.append({'body':body,'local':loc.round(4).tolist(),'g':g.round(4).tolist(),'type':p.tag})
        get=lambda k: float(m.find(k).text) if m.find(k) is not None else None
        muscles.append({'name':name,'Fmax':get('max_isometric_force'),'lopt':get('optimal_fiber_length'),'lslack':get('tendon_slack_length'),'alpha':get('pennation_angle_at_optimal'),'vmax':get('max_contraction_velocity'),'pts':pts})
    bodyinfo={b:{'pos':T[b][1].round(4).tolist(),'R':T[b][0].round(5).tolist(),'mass':float(bodies[b].find('mass').text) if b in bodies else None,'mesh':[mf.text.strip() for mf in bodies[b].iter('mesh_file') if mf.text] if b in bodies else []} for b in T}
    return {'model':model.get('name'),'bodies':bodyinfo,'joints':jinfo,'muscles':muscles}
if __name__=='__main__':
    out=parse(sys.argv[1]); json.dump(out,open(sys.argv[2],'w'),indent=0)
    print(out['model'],len(out['muscles']),'muscles')
    for b,v in out['bodies'].items(): print(f"{b:12s} {v['pos']} mass {v['mass']}")
