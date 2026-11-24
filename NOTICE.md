# ATLAS (Advancing Transformative Learning and Applied engineering Systems) — third-party content notice

## OpenSim musculoskeletal model (Biomechanics course)

The Anatomy Explorer and the "On a real body" figure on the Biomechanics lab pages use bone geometry
(the complete skeleton: skull, mandible, vertebral column, ribs, sternum, clavicles, scapulae, humeri, radii, ulnae, carpals, hands, pelvis, sacrum, femora, patellae, tibiae, fibulae, tali, feet and toes) and lower-limb muscle attachment paths and Hill-type muscle
parameters (maximum isometric force, optimal fiber length, tendon slack length, pennation angle) from
the OpenSim model `RajagopalLaiUhlrich2023.osim` and the `Geometry/*.vtp` files shipped with OpenSim 4.6. The meshes were decimated (vertex clustering),
converted to a compact JSON form and placed on the ATLAS figure; where only one side ships, the other is a mirror image.

Please cite the model authors when using this material:

- Rajagopal A, Dembia CL, DeMers MS, Delp DD, Hicks JL, Delp SL. Full-body musculoskeletal model for
  muscle-driven simulation of human gait. *IEEE Trans Biomed Eng* 63(10):2068–2079, 2016.
- Lai AKM, Arnold AS, Wakeling JM. Why are antagonist muscles co-activated in my simulation? A
  musculoskeletal model for analyzing human locomotor tasks. *Ann Biomed Eng* 45:2762–2774, 2017.
- Uhlrich SD, Jackson RW, Seth A, Kolesar JA, Delp SL. Muscle coordination retraining inspired by
  musculoskeletal simulations reduces knee contact force. *Sci Rep* 12:9842, 2022.
- Delp SL, Anderson FC, Arnold AS, Loan P, Habib A, John CT, Guendelman E, Thelen DG. OpenSim:
  open-source software to create and analyze dynamic simulations of movement. *IEEE Trans Biomed Eng*
  54(11):1940–1950, 2007.

OpenSim and its distributed models are licensed under the Apache License, Version 2.0
(http://www.apache.org/licenses/LICENSE-2.0). The model files are provided "AS IS" without warranty.
This notice is reproduced to satisfy the attribution requirement of that license.

Conversion tools used: `_source/biomech/osim/parse_osim.py`, `vtp2json.py`, `make_osim_data.py`.

## Experimental walking data (Capstone lab, Gait viewer "Measured walk")

`biomech/gait_data.js` holds one time-normalized stride (joint angles, ground reaction forces, planar inverse-dynamics
moments and powers, and 10 surface-EMG envelopes) derived from the example experimental data distributed with the
Rajagopal et al. (2016) OpenSim model: `ExpData/grf_walk.mot`, `motion_capture_walk.trc` and `emg_walk_raw.anc`
(subject11, free-speed over-ground walking, collected at the Stanford Neuromuscular Biomechanics Laboratory). The
processing (Harrington 2007 hip-center regression, 6 Hz low-pass filtering, Winter 2009 segment parameters,
Newton–Euler inverse dynamics) was done for ATLAS with `_source/biomech/osim/exp/make_gait_data.py` and is a planar
teaching reduction, not the OpenSim inverse-kinematics/inverse-dynamics solution. The data are redistributed under the
Apache License 2.0 terms of the OpenSim model distribution; cite Rajagopal et al. (2016) when using them.

## Z-Anatomy 3-D atlas (Anatomy Explorer and Frames & Joints Lab body)

The muscle, tendon, bone, cartilage and ligament surfaces shown in `biomech/anatomy.html` and `biomech/frames.html` (file `biomech/zanatomy.bin`) are derived from the **Z-Anatomy** open-source 3-D atlas of human anatomy (https://github.com/Z-Anatomy and https://z-anatomy.com), itself built on the BodyParts3D dataset. Z-Anatomy is released under the **Creative Commons Attribution-ShareAlike 4.0 International** license (CC BY-SA 4.0). For ATLAS the skeletal and muscular systems were exported from the Z-Anatomy Blender template as glTF, decimated (vertex clustering with light smoothing on sheet muscles), re-expressed in ISB axes and packed into a compact binary; structure names are kept as published by Z-Anatomy. Under CC BY-SA 4.0 this derived mesh file is itself available under the same license; the ATLAS text, code and problem sets are separate works. Sutures, bursae, fasciae and tendon sheaths were omitted.
