#!/usr/bin/env python3
"""Build biomech/gait_data.js from the OpenSim Rajagopal example walking trial (subject11, free-speed walking):
   grf_walk.mot (force plates, 2000 Hz), motion_capture_walk.trc (41 markers, 100 Hz), emg_walk_raw.anc (10 EMG channels, 2000 Hz).
One right-side gait cycle (right heel strike → next right heel strike) is extracted and time-normalised to 0–100 %.
Sagittal joint angles come from a planar link-segment reading of the markers (hip centre by the Harrington 2007 regression).
Run with: python3 -I make_gait_data.py
"""
import numpy as np, json
from scipy.signal import butter, filtfilt
U = '/root/.claude/uploads/f4ccbc87-50bb-57ff-a31b-cf49b02b4071/'

# ---------- force plates ----------
L = open(U + '8f46acff-grf_walk.mot').read().splitlines()
h = L.index('endheader'); cols = L[h+1].split('\t')
G = np.array([[float(x) for x in l.split('\t')] for l in L[h+2:] if l.strip()])
tg = G[:, 0]
def gc(n): return G[:, cols.index(n)]
fy_r, fx_r, fz_r = gc('ground_force_r_vy'), gc('ground_force_r_vx'), gc('ground_force_r_vz')
fy_l, fx_l = gc('ground_force_l_vy'), gc('ground_force_l_vx')
px_r, pz_r = gc('ground_force_r_px'), gc('ground_force_r_pz')   # COP (metres; the file switches to a parked value off-plate)
def onsets(f, thr=20):
    on = f > thr; idx = np.where(np.diff(on.astype(int)) != 0)[0]; return [(tg[i+1], bool(on[i+1])) for i in idx]
ev = onsets(fy_r); HS1 = ev[0][0]; TO1 = ev[1][0]; HS2 = ev[2][0]
evl = onsets(fy_l); LHS = evl[0][0]; LTO = evl[1][0]
T = HS2 - HS1
# body weight: impulse over one cycle, adding back the part of the left stance that falls after HS2 (periodicity)
sel = (tg >= HS1) & (tg < HS2); tail = (tg >= HS2) & (tg < LTO)
dt = tg[1] - tg[0]
BW = (np.sum((fy_r + fy_l)[sel]) + np.sum(fy_l[tail])) * dt / T
mass = BW / 9.81
print(f'cycle {HS1:.4f}→{HS2:.4f} s  T={T:.3f} s  toe-off {(TO1-HS1)/T*100:.1f} %  left HS {(LHS-HS1)/T*100:.1f} %  left TO {(LTO-HS1)/T*100:.1f} %  BW={BW:.0f} N ({mass:.1f} kg)')

pct = np.linspace(0, 100, 101); tt = HS1 + pct/100*T
def rs(y, t=tg): return np.interp(tt, t, y)
grf = {'vy_r': rs(fy_r)/BW, 'vx_r': rs(fx_r)/BW, 'vz_r': rs(fz_r)/BW, 'vy_l': rs(fy_l)/BW, 'vx_l': rs(fx_l)/BW}

# ---------- markers ----------
L = open(U + '8dea1c53-motion_capture_walk.trc').read().splitlines()
names = [n for n in L[3].split('\t')[2:] if n]
M = np.array([[float(x) if x else np.nan for x in l.split('\t')] for l in L[5:] if l.strip()])
tm = M[:, 1]
def mk(n): i = names.index(n); return M[:, 2+3*i:5+3*i] / 1000.0
RA, LA, RP, LP = mk('R.ASIS'), mk('L.ASIS'), mk('R.PSIS'), mk('L.PSIS')
midA = (RA+LA)/2; midP = (RP+LP)/2
PW = np.linalg.norm(RA-LA, axis=1); PD = np.linalg.norm(midA-midP, axis=1)
# pelvis frame: x anterior (midP→midA, horizontal), z right (LA→RA), y up
xax = midA - midP; xax[:, 1] = 0; xax /= np.linalg.norm(xax, axis=1)[:, None]
zax = RA - LA; zax[:, 1] = 0; zax /= np.linalg.norm(zax, axis=1)[:, None]
yax = np.cross(zax, xax)
# Harrington et al. 2007 (mm): x = -0.24 PD - 9.9 ; y = -0.30 PW - 10.9 ; z = 0.33 PW + 7.3 (right)
hx = (-0.24*PD*1000 - 9.9)/1000; hy = (-0.30*PW*1000 - 10.9)/1000; hz = (0.33*PW*1000 + 7.3)/1000
HJC = midA + hx[:, None]*xax + hy[:, None]*yax + hz[:, None]*zax
KN, AN, HE, TO, MT5 = mk('R.Knee'), mk('R.Ankle'), mk('R.Heel'), mk('R.Toe'), mk('R.MT5')
# low-pass markers at 6 Hz
b, a = butter(2, 6/(100/2))
def lp(P): return np.column_stack([filtfilt(b, a, np.nan_to_num(P[:, k])) for k in range(3)])
HJC, KN, AN, HE, TO = map(lp, (HJC, KN, AN, HE, TO))
def segang(P, Q):  # angle of P→Q from the downward vertical, forward (+x) positive  → "forward lean" of a segment hanging from P
    d = Q - P; return np.degrees(np.arctan2(d[:, 0], -d[:, 1]))
th_thigh = segang(HJC, KN); th_shank = segang(KN, AN)
foot = TO - HE; th_foot = np.degrees(np.arctan2(foot[:, 1], foot[:, 0]))   # foot sole angle to the floor (+ toes up)
pelvis_tilt = np.degrees(np.arctan2(midA[:, 1]-midP[:, 1], np.linalg.norm((midA-midP)[:, [0, 2]], axis=1)))  # + ASIS above PSIS
hip = th_thigh                          # hip flexion ≈ thigh angle from vertical (pelvis tilt reported separately)
knee = th_thigh - th_shank              # knee flexion (+)
# ankle: angle between shank and foot; neutral when foot ⟂ shank
shank_from_floor = np.degrees(np.arctan2(-(AN-KN)[:, 1], -(AN-KN)[:, 0]))  # direction knee→ankle measured from +x axis... use dot product instead
s = AN - KN; f = TO - HE
ang = np.degrees(np.arctan2(s[:, 0]*f[:, 1]-s[:, 1]*f[:, 0], s[:, 0]*f[:, 0]+s[:, 1]*f[:, 1]))  # signed angle from shank(down) to foot(forward)
ankle = ang - 90.0                       # dorsiflexion (+) when foot rotates towards the shank
# the heel and toe markers sit at different heights on the shoe, so the marker 'sole' is tilted even when the foot is flat:
# take the marker sole angle during foot-flat (15–40 % of the cycle) as the zero reference
ff = (tm >= HS1 + 0.15*T) & (tm <= HS1 + 0.40*T); foot_off = float(np.median(th_foot[ff])); print(f'marker-sole offset during foot-flat {foot_off:.1f}°')
ankle = ankle - foot_off
jm = {'hip': rs(hip, tm), 'knee': rs(knee, tm), 'ankle': rs(ankle, tm), 'pelvis_tilt': rs(pelvis_tilt, tm)}
for k, v in jm.items(): print(f'{k:12s} min {v.min():7.1f} max {v.max():7.1f}')
speed = (HJC[-1, 0]-HJC[0, 0])/(tm[-1]-tm[0]); print(f'walking speed {speed:.2f} m/s, stride {speed*T:.2f} m')
# joint centres (sagittal, metres) and COP for the link-segment picture; x relative to hip at heel strike
jc = {k: {'x': rs(P[:, 0], tm).tolist(), 'y': rs(P[:, 1], tm).tolist()} for k, P in [('hip', HJC), ('knee', KN), ('ankle', AN), ('heel', HE), ('toe', TO)]}
cop = {'x': np.where(rs(fy_r) > 0.02*BW, rs(px_r), np.nan).tolist()}

# ---------- planar inverse dynamics (Winter segment parameters, right leg, sagittal plane) ----------
g = 9.81; Mb = mass
def deriv(P): return np.gradient(P, tm, axis=0)
def seg(Pp, Pd, mf, cf, rf):  # proximal, distal end; mass fraction; COM fraction from proximal; radius of gyration about COM (fraction of length)
    Lp = np.linalg.norm((Pd-Pp)[:, :2], axis=1); m = mf*Mb; com = Pp + cf*(Pd-Pp); I = m*(rf*Lp)**2
    th = np.unwrap(np.arctan2((Pd-Pp)[:, 1], (Pd-Pp)[:, 0])); om = np.gradient(th, tm); al = np.gradient(om, tm)
    acc = deriv(deriv(com)); return dict(m=m, com=com, I=I, acc=acc, om=om, al=al)
F_thigh = seg(HJC, KN, 0.100, 0.433, 0.323)
F_shank = seg(KN, AN, 0.0465, 0.433, 0.302)
F_foot = seg(AN, TO, 0.0145, 0.50, 0.475)       # Winter: foot COM 0.5 of malleolus→MT head; toe marker used as the distal end
# GRF on the mocap time base (lab frame = GRF frame; COP valid while loaded)
Fx = np.interp(tm, tg, fx_r); Fy = np.interp(tm, tg, fy_r); loaded = Fy > 0.02*BW
COPx = np.where(loaded, np.interp(tm, tg, px_r), AN[:, 0]); COPy = np.zeros_like(COPx)
cross = lambda r, F: r[:, 0]*F[:, 1] - r[:, 1]*F[:, 0]
def joint(S, Pj, Pdist_force, Fdist, Mdist):
    """Newton–Euler on segment S: unknown proximal joint force (on the segment) and moment at Pj given the distal force/moment acting on it."""
    Rj = np.column_stack([S['m']*S['acc'][:, 0] - Fdist[:, 0], S['m']*S['acc'][:, 1] + S['m']*g - Fdist[:, 1]])
    Mj = S['I']*S['al'] - cross(Pj[:, :2]-S['com'][:, :2], Rj) - cross(Pdist_force[:, :2]-S['com'][:, :2], Fdist) - Mdist
    return Rj, Mj
GRF2 = np.column_stack([Fx*loaded, Fy*loaded]); COP = np.column_stack([COPx, COPy])
Ra, Ma = joint(F_foot, AN, COP, GRF2, np.zeros(len(tm)))
Rk, Mk = joint(F_shank, KN, AN, -Ra, -Ma)
Rh, Mh = joint(F_thigh, HJC, KN, -Rk, -Mk)
# signs (z = subject's right, viewed from the right): plantarflexor +, knee extensor +, hip extensor +
mom = {'ank': -Ma/Mb, 'knee': Mk/Mb, 'hip': -Mh/Mb}
pwr = {'ank': Ma*(F_foot['om']-F_shank['om'])/Mb, 'knee': Mk*(F_shank['om']-F_thigh['om'])/Mb, 'hip': Mh*(F_thigh['om'] - 0)/Mb}  # pelvis ω ≈ 0 (tilt ±3°)
momN = {k: rs(v, tm) for k, v in mom.items()}; pwrN = {k: rs(v, tm) for k, v in pwr.items()}
for k in momN: print(f'moment {k:5s} {momN[k].min():6.2f}..{momN[k].max():5.2f} N·m/kg   power {pwrN[k].min():6.2f}..{pwrN[k].max():5.2f} W/kg')
# clear the swing-phase noise where tiny GRF leakage is absent anyway (keep as computed; swing moments are small inertial ones)

# ---------- EMG ----------
L = open(U + '1fbd938c-emg_walk_raw.anc').read().splitlines()
hi = [i for i, l in enumerate(L) if l.startswith('Name')][0]; an = [n for n in L[hi].split('\t')[1:] if n]
A = np.array([[float(x) for x in r.split('\t') if x != ''] for r in L[hi+3:] if r.strip()])
ta = A[:, 0]
# align the analog file to the processed GRF with the plate-1 vertical channel (cross-correlation)
f1 = np.abs(A[:, 1+an.index('F1Z')]); g1 = np.interp(ta, tg, fy_r)
lags = np.arange(-200, 201); cc = [np.sum(f1[max(0, l):len(f1)+min(0, l)] * g1[max(0, -l):len(g1)-max(0, l)]) for l in lags]
lag = lags[int(np.argmax(cc))] * (ta[1]-ta[0]); print(f'analog→GRF lag {lag*1000:.1f} ms')
ta_al = ta - lag
bh, ah = butter(2, [20/(2000/2), 450/(2000/2)], btype='band'); bl, al = butter(2, 6/(2000/2))
EMGN = {'SOL': 'Soleus', 'GAS': 'Gastrocnemius', 'TA': 'Tibialis anterior', 'MH': 'Medial hamstrings', 'BF': 'Biceps femoris', 'VL': 'Vastus lateralis', 'VM': 'Vastus medialis', 'RF': 'Rectus femoris', 'GMAX': 'Gluteus maximus', 'GMED': 'Gluteus medius'}
emg = {}
for k in EMGN:
    x = A[:, 1+an.index(k)]; x = x - np.mean(x); x = filtfilt(bh, ah, x); env = filtfilt(bl, al, np.abs(x))
    e = np.interp(tt, ta_al, env); e = np.clip(e, 0, None); emg[k] = (e/np.max(e)).round(3).tolist()

data = {
  'source': 'OpenSim Rajagopal example data: subject11, free-speed over-ground walking trial 03 (force plates 2000 Hz, 41 markers 100 Hz, 10 surface EMG channels 2000 Hz). Side analysed: right.',
  'credit': 'Experimental data distributed with the Rajagopal et al. (2016) full-body model (OpenSim, Apache 2.0); collected at the Stanford Neuromuscular Biomechanics Lab. Joint angles here are a planar marker-based reading made for teaching (Harrington 2007 hip centre; 6 Hz low-pass), not the OpenSim IK solution.',
  'T': round(float(T), 4), 'BW': round(float(BW), 1), 'mass': round(float(mass), 1), 'speed': round(float(speed), 2),
  'events': {'toe_off': round(float((TO1-HS1)/T*100), 1), 'opp_hs': round(float((LHS-HS1)/T*100), 1), 'opp_to': round(float((LTO-HS1)/T*100), 1)},
  'pct': pct.tolist(),
  'ang': {k: np.round(v, 2).tolist() for k, v in jm.items()},
  'grf': {k: np.round(v, 4).tolist() for k, v in grf.items()},
  'mom': {k: np.round(v, 3).tolist() for k, v in momN.items()}, 'pwr': {k: np.round(v, 3).tolist() for k, v in pwrN.items()},
  'id_note': 'Planar Newton–Euler inverse dynamics on the marker kinematics and measured GRF with Winter (2009) segment parameters (thigh 0.100 M, shank 0.0465 M, foot 0.0145 M); moments +: plantarflexor, knee extensor, hip extensor; power + = generation.',
  'jc': jc, 'cop': cop, 'emg': emg, 'emg_names': EMGN,
}
js = 'const GAIT=' + json.dumps(data, separators=(',', ':')) + ';\n'
open('../../gait_data.js', 'w').write(js); print('wrote gait_data.js', len(js)//1024, 'kB')
