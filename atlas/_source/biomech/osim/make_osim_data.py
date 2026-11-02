#!/usr/bin/env python3
"""Build biomech/osim_data.js from the parsed Rajagopal model (raj2023.json) and converted meshes (meshes.json).

Everything is pre-transformed into ATLAS world coordinates (metres, ISB axes, anatomical position):
  world = body_origin(default pose) + local + OFF
OFF places the model so the knee and ankle centres coincide with the ATLAS figure's joint centres.
"""
import json, math
OFF = [0.062, 0.966, 0.0]
raj = json.load(open('raj2023.json'))
meshes = json.load(open('meshes.json'))

def body_of_mesh(name):
    for b, info in raj['bodies'].items():
        if (name + '.vtp') in info['mesh']: return b
    raise KeyError(name)

def W(body, loc):
    o = raj['bodies'][body]['pos']
    return [round(o[i] + loc[i] + OFF[i], 4) for i in range(3)]

out_meshes = {}
for name, m in meshes.items():
    body = body_of_mesh(name)
    v = m['v']; wv = []
    for i in range(0, len(v), 3):
        wv += W(body, v[i:i+3])
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
LABEL = {'iliacus': 'iliacus', 'psoas': 'psoas major', 'glmax1': 'superior fibres', 'glmax2': 'middle fibres', 'glmax3': 'inferior fibres',
  'glmed1': 'anterior fibres', 'glmed2': 'middle fibres', 'glmed3': 'posterior fibres', 'glmin1': 'anterior fibres', 'glmin2': 'middle fibres', 'glmin3': 'posterior fibres',
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

# joint centres in ATLAS coordinates (right side)
J = {k: W('ground', raj['joints'][k]['pos']) for k in ['hip_r', 'walker_knee_r', 'ankle_r', 'subtalar_r', 'mtp_r', 'back', 'patellofemoral_r']}
data = {'model': 'Rajagopal–Lai–Uhlrich 2023 (OpenSim); lower-limb musculoskeletal model, 1.70 m / 75 kg reference',
        'credit': 'Bone geometry and muscle paths/parameters from the OpenSim model of Rajagopal A, Dembia CL, DeMers MS, Delp DD, Hicks JL, Delp SL (2016) IEEE TBME 63:2068–2079, as updated by Lai AKM, Arnold AS, Wakeling JM (2017) Ann Biomed Eng 45:2762–2774 and Uhlrich SD, Jackson RW, Seth A, Kolesar JA, Delp SL (2022) Sci Rep 12:9842. OpenSim is distributed under the Apache License 2.0.',
        'off': OFF, 'joints': J, 'meshes': out_meshes, 'muscles': out_mus}
js = 'const OSIM=' + json.dumps(data, separators=(',', ':')) + ';\n'
open('../osim_data.js', 'w').write(js)
print('wrote ../osim_data.js', len(js) // 1024, 'kB;', len(out_meshes), 'meshes,', sum(len(v) for v in out_mus.values()), 'muscle paths')
print('joints', J)
