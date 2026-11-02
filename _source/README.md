# ATLAS source files

`biomech/` holds the editable sources for the Biomechanics course: 3-D body renderer (body3d.js: lathe/tube/capsule builders, painter renderer, picking),
Posable figure beside the simulations (figure.js: rigs the anatomy model by skinning each vertex to a body segment; fig_hooks.js: maps each page's tab state to a pose + highlighted muscles),
Anatomy Explorer (anatomy_model.js holds the data and builder, anatomy.js the explorer UI: original procedural skin/muscle/bone/joint model — MUSCLES, BONES, JOINTS data arrays hold every structure's geometry and text; add a muscle by appending an entry), Frames & Joints Lab (frames_lab.js),
Skeletal Muscle Lab (muscle_lab.js: structure zoom, sarcomere/F–L, cross-bridge, series/parallel, architecture, Hill F–V, drills),
Arthrokinematics Lab (arthro_lab.js: roll/glide/spin, convex–concave rule, knee open/closed chain + screw-home, included vs anatomical angle, mobilization planner, drills),
Anthropometry & Inverse Dynamics Lab (invdyn_lab.js: Dempster/Winter segment table, whole-body COM, parallel axis, link-segment inverse dynamics with presets, drills),
Capstone (capstone_lab.js: four-step framework & hierarchical-model builder, inverted U, balance, jump/landing, cycling, glass, wheelchair, gait viewer, cross-course final review),
MTC & Joint Stability Lab (mtc_lab.js: Hill 3-element rig, MTC roles, recruitment/rate coding, RFD & fatigue, perturbed joint, popping sarcomeres),
Multi-Joint Movement Lab (multi_lab.js: two-link patterns, FK/IK & reach area, angle–angle/coupling/polar, energy transfer & biarticular, sequencing, chain stiffness),
Ligaments & Tendons Lab (tissue_lab.js: stress–strain builder, creep/relaxation, hysteresis, spring+damper, knee ligament tests, healing),
Joint Kinetics Lab (kinetics_lab.js: elbow torque/EMA, vector resolution, strength curves, patellofemoral load, GRF force plate, load types),
the problem engine (bioprob.js) and the problem banks (muscle_problems.js, arthro_problems.js, invdyn_problems.js, kinetics_problems.js, tissue_problems.js, multi_problems.js, mtc_problems.js, capstone_problems.js), the XP layer (game.js) and the course home (bhome.html).
To add a problem, append an entry to PROBLEMS in muscle_problems.js following the existing ones (ES 305 format: Known → Find → Schematic → Assumptions → Analysis → Comments → References).
Rebuild with `python3 biomech/build_biomech.py` from a folder that contains `shared_css.css` and `fixsubs.js` next to `biomech/`
(it writes `../atlas/biomech/`). The Dynamics and Thermodynamics pages carry their problem banks, schematics and MATLAB
exercises inline, so each built page is itself the source of record for its content.

© Dr. Christine Walck. All rights reserved; see LICENSE when added.
