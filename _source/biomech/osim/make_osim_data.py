#!/usr/bin/env python3
"""Build biomech/osim_data.js from the parsed Rajagopal model (raj2023.json) and converted meshes (meshes.json).

Everything is pre-transformed into ATLAS world coordinates (meters, ISB axes, anatomical position):
  world = body_origin(default pose) + local + OFF
OFF places the model so the knee and ankle centers coincide with the ATLAS figure's joint centers.
"""
import json, math
OFF = [0.062, 0.966, 0.0]
raj = json.load(open('raj2023.json'))
meshes = json.load(open('meshes.json'))

BODY = {'r_patella': 'patella_r', 'l_patella': 'patella_l', 'r_talus': 'talus_r', 'l_talus': 'talus_l', 'r_foot': 'calcn_r', 'l_foot': 'calcn_l',
        'r_bofoot': 'toes_r', 'l_bofoot': 'toes_l', 'hat_skull': 'torso', 'hat_jaw': 'torso', 'spine_cerv': 'torso', 'spine_thor': 'torso', 'spine_lumb': 'torso',
        'ribs': 'torso', 'sternum': 'torso', 'scapula_r': 'torso', 'scapula_l': 'torso', 'clavicle_r': 'torso', 'clavicle_l': 'torso',
        'humerus_rv': 'humerus_r', 'humerus_lv': 'humerus_l', 'radius_rv': 'radius_r', 'radius_lv': 'radius_l', 'ulna_rv': 'ulna_r', 'ulna_lv': 'ulna_l',
        'carpals_r': 'hand_r', 'carpals_l': 'hand_l', 'hand_r': 'hand_r', 'hand_l': 'hand_l'}
def body_of_mesh(name):
    if name in BODY: return BODY[name]
    for b, info in raj['bodies'].items():
        if (name + '.vtp') in info['mesh']: return b
    raise KeyError(name)

def W(body, loc):
    o = raj['bodies'][body]['pos']
    return [round(o[i] + loc[i] + OFF[i], 4) for i in range(3)]

# the ATLAS arm hangs a little further from the trunk than the OpenSim model's: shift the arm bodies so the real bones sit under the
# procedural arm muscles and skin (shoulder, elbow and wrist centers matched to the ATLAS landmarks)
SHIFT = {'humerus_r': [0.016, 0.011, 0.02], 'ulna_r': [0.012, 0.007, 0.05], 'radius_r': [0.012, 0.007, 0.05], 'hand_r': [0.038, -0.009, 0.035]}
for k in list(SHIFT): SHIFT[k.replace('_r', '_l')] = [SHIFT[k][0], SHIFT[k][1], -SHIFT[k][2]]
out_meshes = {}
for name, m in meshes.items():
    body = body_of_mesh(name); sh = SHIFT.get(body, [0, 0, 0])
    v = m['v']; wv = []
    for i in range(0, len(v), 3):
        p = W(body, v[i:i+3]); wv += [round(p[0]+sh[0], 4), round(p[1]+sh[1], 4), round(p[2]+sh[2], 4)]
    out_meshes[name] = {'v': wv, 'f': m['f']}

# ATLAS muscle id → Rajagopal muscle names (right side); display names for heads/compartments
MAP = {
  'ilps': ['iliacus', 'psoas'], 'gmax': ['glmax1', 'glmax2', 'glmax3'], 'gmed': ['glmed1', 'glmed2', 'glmed3'],
  'gmin': ['glmin1', 'glmin2', 'glmin3'], 'pir': ['piri'], 'tfl': ['tfl'], 'sart': ['sart'], 'rf': ['recfem'],
  'vl': ['vaslat'], 'vm': ['vasmed'], 'vi': ['vasint'], 'al': ['addlong'], 'ab': ['addbrev'],
  'am': ['addmagProx', 'addmagMid', 'addmagDist', 'addmagIsch'], 'grac': ['grac'], 'bf': ['bflh', 'bfsh'],
  'st': ['semiten'], 'sm': ['semimem'], 'ta_': ['tibant'], 'edl': ['edl'], 'ehl': ['ehl'], 'fl': ['perlong'],
  'fb': ['perbrev'], 'gas': ['gasmed', 'gaslat'], 'sol': ['soleus'], 'tp': ['tibpost'], 'fhl': ['fhl'], 'fdl': ['fdl'],
}
LABEL = {'iliacus': 'iliacus', 'psoas': 'psoas major', 'glmax1': 'superior fibers', 'glmax2': 'middle fibers', 'glmax3': 'inferior fibers',
  'glmed1': 'anterior fibers', 'glmed2': 'middle fibers', 'glmed3': 'posterior fibers', 'glmin1': 'anterior fibers', 'glmin2': 'middle fibers', 'glmin3': 'posterior fibers',
  'addmagProx': 'proximal part', 'addmagMid': 'middle part', 'addmagDist': 'distal part', 'addmagIsch': 'ischiocondylar (hamstring) part',
  'bflh': 'long head', 'bfsh': 'short head', 'gasmed': 'medial head', 'gaslat': 'lateral head'}
NAMES = {'ilps':'Iliopsoas','gmax':'Gluteus maximus','gmed':'Gluteus medius','gmin':'Gluteus minimus','pir':'Piriformis','tfl':'Tensor fasciae latae','sart':'Sartorius','rf':'Rectus femoris','vl':'Vastus lateralis','vm':'Vastus medialis','vi':'Vastus intermedius','al':'Adductor longus','ab':'Adductor brevis','am':'Adductor magnus','grac':'Gracilis','bf':'Biceps femoris','st':'Semitendinosus','sm':'Semimembranosus','ta_':'Tibialis anterior','edl':'Extensor digitorum longus','ehl':'Extensor hallucis longus','fl':'Fibularis longus','fb':'Fibularis brevis','gas':'Gastrocnemius','sol':'Soleus','tp':'Tibialis posterior','fhl':'Flexor hallucis longus','fdl':'Flexor digitorum longus'}
byname = {m['name']: m for m in raj['muscles']}
out_mus = {}
for aid, names in MAP.items():
    lst = []
    for n in names:
        m = byname[n + '_r']
        pts = [W(p['body'], p['local']) for p in m['pts']]
        lst.append({'name': n, 'n': NAMES[aid] + (' (' + LABEL[n] + ')' if n in LABEL else ''), 'label': LABEL.get(n, ''), 'Fmax': round(m['Fmax'], 1), 'lopt': round(m['lopt'], 4),
                    'lslack': round(m['lslack'], 4), 'alpha': round(m['alpha'], 4), 'vmax': m['vmax'], 'pts': pts,
                    'bodies': [p['body'] for p in m['pts']]})
    out_mus[aid] = lst

# joint centers in ATLAS coordinates (right side)
J = {k: W('ground', raj['joints'][k]['pos']) for k in ['hip_r', 'walker_knee_r', 'ankle_r', 'subtalar_r', 'mtp_r', 'back', 'patellofemoral_r']}
data = {'model': 'Rajagopal–Lai–Uhlrich 2023 (OpenSim); lower-limb musculoskeletal model, 1.70 m / 75 kg reference',
        'credit': 'Bone geometry and muscle paths/parameters from the OpenSim model of Rajagopal A, Dembia CL, DeMers MS, Delp DD, Hicks JL, Delp SL (2016) IEEE TBME 63:2068–2079, as updated by Lai AKM, Arnold AS, Wakeling JM (2017) Ann Biomed Eng 45:2762–2774 and Uhlrich SD, Jackson RW, Seth A, Kolesar JA, Delp SL (2022) Sci Rep 12:9842. OpenSim is distributed under the Apache License 2.0.',
        'off': OFF, 'joints': J, 'meshes': out_meshes, 'muscles': out_mus}
js = 'const OSIM=' + json.dumps(data, separators=(',', ':')) + ';\n'
open('../osim_data.js', 'w').write(js)
print('wrote ../osim_data.js', len(js) // 1024, 'kB;', len(out_meshes), 'meshes,', sum(len(v) for v in out_mus.values()), 'muscle paths')
print('joints', J)
