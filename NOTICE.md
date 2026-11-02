# ATLAS — third-party content notice

## OpenSim musculoskeletal model (Biomechanics course)

The Anatomy Explorer and the "On a real body" figure on the Biomechanics lab pages use bone geometry
(pelvis, sacrum, femur, tibia, fibula) and lower-limb muscle attachment paths and Hill-type muscle
parameters (maximum isometric force, optimal fibre length, tendon slack length, pennation angle) from
the OpenSim model `RajagopalLaiUhlrich2023.osim` and its `Geometry/*.vtp` files. The meshes were
converted to a compact JSON form and placed on the ATLAS figure; left-side femur and fibula meshes are
mirror images of the right-side files.

Please cite the model authors when using this material:

- Rajagopal A, Dembia CL, DeMers MS, Delp DD, Hicks JL, Delp SL. Full-body musculoskeletal model for
  muscle-driven simulation of human gait. *IEEE Trans Biomed Eng* 63(10):2068–2079, 2016.
- Lai AKM, Arnold AS, Wakeling JM. Why are antagonist muscles co-activated in my simulation? A
  musculoskeletal model for analysing human locomotor tasks. *Ann Biomed Eng* 45:2762–2774, 2017.
- Uhlrich SD, Jackson RW, Seth A, Kolesar JA, Delp SL. Muscle coordination retraining inspired by
  musculoskeletal simulations reduces knee contact force. *Sci Rep* 12:9842, 2022.
- Delp SL, Anderson FC, Arnold AS, Loan P, Habib A, John CT, Guendelman E, Thelen DG. OpenSim:
  open-source software to create and analyze dynamic simulations of movement. *IEEE Trans Biomed Eng*
  54(11):1940–1950, 2007.

OpenSim and its distributed models are licensed under the Apache License, Version 2.0
(http://www.apache.org/licenses/LICENSE-2.0). The model files are provided "AS IS" without warranty.
This notice is reproduced to satisfy the attribution requirement of that licence.

Conversion tools used: `_source/biomech/osim/parse_osim.py`, `vtp2json.py`, `make_osim_data.py`.

## Experimental walking data (Capstone lab, Gait viewer "Measured walk")

`biomech/gait_data.js` holds one time-normalised stride (joint angles, ground reaction forces, planar inverse-dynamics
moments and powers, and 10 surface-EMG envelopes) derived from the example experimental data distributed with the
Rajagopal et al. (2016) OpenSim model: `ExpData/grf_walk.mot`, `motion_capture_walk.trc` and `emg_walk_raw.anc`
(subject11, free-speed over-ground walking, collected at the Stanford Neuromuscular Biomechanics Laboratory). The
processing (Harrington 2007 hip-centre regression, 6 Hz low-pass filtering, Winter 2009 segment parameters,
Newton–Euler inverse dynamics) was done for ATLAS with `_source/biomech/osim/exp/make_gait_data.py` and is a planar
teaching reduction, not the OpenSim inverse-kinematics/inverse-dynamics solution. The data are redistributed under the
Apache License 2.0 terms of the OpenSim model distribution; cite Rajagopal et al. (2016) when using them.
