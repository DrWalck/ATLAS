/* ATLAS videos — one line per problem.
   HOW TO ADD A VIDEO: paste the YouTube link between the two quote marks on that problem's line, then save (Commit changes).
   Example:   "dynamics/Impacts#direct": "https://youtu.be/AbCdEfGhIjK",   // Direct Central Impact
   A line with empty quotes "" shows no video button. Do not change the text to the left of the colon. */
window.ATLAS_VIDEOS = {

  /* ================= ENGINEERING DYNAMICS ================= */

  // Center of Mass & MOI · Dynamics Practice
  "dynamics/Center_of_Mass_Moment_of_Inertia#pendulum": "",      // Rod-and-Sphere Pendulum
  "dynamics/Center_of_Mass_Moment_of_Inertia#lbar": "",          // L-Shaped Bar
  "dynamics/Center_of_Mass_Moment_of_Inertia#plate": "",         // Plate with a Hole
  "dynamics/Center_of_Mass_Moment_of_Inertia#diskblock": "",     // Disk with a Bolted Block
  "dynamics/Center_of_Mass_Moment_of_Inertia#rimdisk": "",       // Disk Pivoted at Its Rim

  // Impacts · Dynamics Practice
  "dynamics/Impacts#direct": "",                                 // Direct Central Impact
  "dynamics/Impacts#bounce": "",                                 // Bouncing Ball
  "dynamics/Impacts#oblique": "",                                // Oblique Impact of Two Pucks
  "dynamics/Impacts#wall": "",                                   // Ball Hits a Wall
  "dynamics/Impacts#ballbar": "",                                // Ball Strikes a Pinned Bar
  "dynamics/Impacts#bullet": "",                                 // Bullet into a Hanging Bar
  "dynamics/Impacts#rodhit": "",                                 // Ball Strikes a Free Rod

  // Particle Kinematics: Cartesian · Dynamics Practice
  "dynamics/Particle_Kinematics_Cartesian#plane": "",            // Private Plane
  "dynamics/Particle_Kinematics_Cartesian#yoke": "",             // Scotch Yoke
  "dynamics/Particle_Kinematics_Cartesian#chute": "",            // Parachute
  "dynamics/Particle_Kinematics_Cartesian#gasgun": "",           // Gas Gun
  "dynamics/Particle_Kinematics_Cartesian#survey": "",           // Survey Plane Drop
  "dynamics/Particle_Kinematics_Cartesian#station": "",          // Subway Station
  "dynamics/Particle_Kinematics_Cartesian#vtgraph": "",          // Tram v–t Graph
  "dynamics/Particle_Kinematics_Cartesian#rampjump": "",         // Motorcycle Ramp Jump
  "dynamics/Particle_Kinematics_Cartesian#fieldgoal": "",        // Field Goal
  "dynamics/Particle_Kinematics_Cartesian#pulley": "",           // Table & Movable Pulley

  // Particle Kinematics: Normal–Tangential · Dynamics Practice
  "dynamics/Particle_Kinematics_Normal_Tangential#robot": "",    // Robot Arm
  "dynamics/Particle_Kinematics_Normal_Tangential#crank": "",    // Crank AB
  "dynamics/Particle_Kinematics_Normal_Tangential#circle": "",   // Circle Track
  "dynamics/Particle_Kinematics_Normal_Tangential#racetrack": "", // Race Track
  "dynamics/Particle_Kinematics_Normal_Tangential#moto": "",     // Motorcycle Track
  "dynamics/Particle_Kinematics_Normal_Tangential#centrifuge": "", // Lab Centrifuge

  // Particle Kinematics: Polar Coordinates · Dynamics Practice
  "dynamics/Particle_Kinematics_Polar#collar": "",               // Simple Collar
  "dynamics/Particle_Kinematics_Polar#arc": "",                  // Sliding Collar Arc
  "dynamics/Particle_Kinematics_Polar#cam": "",                  // Cam & Roller Follower
  "dynamics/Particle_Kinematics_Polar#spring": "",               // Bar with Spring
  "dynamics/Particle_Kinematics_Polar#boat": "",                 // Survey Boat Spiral
  "dynamics/Particle_Kinematics_Polar#ladder": "",               // Fire-Truck Ladder

  // Particle Kinetics: Impulse & Momentum · Dynamics Practice
  "dynamics/Particle_Kinetics_Impulse_Momentum#imp3d": "",       // Simple Impulse & Momentum
  "dynamics/Particle_Kinetics_Impulse_Momentum#plane": "",       // Airplane Takeoff Thrust
  "dynamics/Particle_Kinetics_Impulse_Momentum#crt": "",         // Cathode-Ray Tube
  "dynamics/Particle_Kinetics_Impulse_Momentum#fire": "",        // Fire Truck Water Jet
  "dynamics/Particle_Kinetics_Impulse_Momentum#train": "",       // Train Car Collision
  "dynamics/Particle_Kinetics_Impulse_Momentum#trainslope": "",  // Train Collision on a Slope
  "dynamics/Particle_Kinetics_Impulse_Momentum#coaster": "",     // Roller Coaster Brakes
  "dynamics/Particle_Kinetics_Impulse_Momentum#velodrome": "",   // Velodrome Sprint
  "dynamics/Particle_Kinetics_Impulse_Momentum#pendulumgust": "", // Pendulum Hit by a Gust
  "dynamics/Particle_Kinetics_Impulse_Momentum#shortforce": "",  // Force Acts for a Short Time
  "dynamics/Particle_Kinetics_Impulse_Momentum#radialimp": "",   // Radial Force Impulse
  "dynamics/Particle_Kinetics_Impulse_Momentum#tangimp": "",     // Tangential Force on a Collar
  "dynamics/Particle_Kinetics_Impulse_Momentum#puckhole": "",    // Puck on a Cord Through a Hole
  "dynamics/Particle_Kinetics_Impulse_Momentum#cometorbit": "",  // Spacecraft Perigee to Apogee

  // Particle Kinetics: Newton's 2nd Law · Dynamics Practice
  "dynamics/Particle_Kinetics_Newton#rocket": "",                // Model Rocket
  "dynamics/Particle_Kinetics_Newton#box": "",                   // Sliding Box with Friction
  "dynamics/Particle_Kinetics_Newton#payload": "",               // Space Shuttle Payload
  "dynamics/Particle_Kinetics_Newton#compare": "",               // Comparison: Newton vs. Impulse
  "dynamics/Particle_Kinetics_Newton#twoblocks": "",             // Two Blocks & Movable Pulley
  "dynamics/Particle_Kinetics_Newton#wedge": "",                 // Block on a Sliding Wedge
  "dynamics/Particle_Kinetics_Newton#maxspeed": "",              // Traction-Limited Car
  "dynamics/Particle_Kinetics_Newton#thruster": "",              // Satellite Thruster Burn
  "dynamics/Particle_Kinetics_Newton#pole": "",                  // Vertical Pole
  "dynamics/Particle_Kinetics_Newton#boat": "",                  // Boat in a Turn
  "dynamics/Particle_Kinetics_Newton#ramp": "",                  // Banked Off-Ramp
  "dynamics/Particle_Kinetics_Newton#bobtension": "",            // Pendulum Bob Tension
  "dynamics/Particle_Kinetics_Newton#banked": "",                // Banked Highway Curve
  "dynamics/Particle_Kinetics_Newton#smoothbar": "",             // Smooth Bar in a Horizontal Plane
  "dynamics/Particle_Kinetics_Newton#rotarm": "",                // Collar Released on a Rotating Arm
  "dynamics/Particle_Kinetics_Newton#trainer": "",               // Spatial Disorientation Trainer
  "dynamics/Particle_Kinetics_Newton#moon": "",                  // Moon's Orbit
  "dynamics/Particle_Kinetics_Newton#leo": "",                   // Satellite in Low Orbit

  // Particle Kinetics: Work & Energy · Dynamics Practice
  "dynamics/Particle_Kinetics_Work_Energy#collar1d": "",         // Collar & Spring: Max Speed
  "dynamics/Particle_Kinetics_Work_Energy#collar2d": "",         // Collar & Spring: 2-D
  "dynamics/Particle_Kinetics_Work_Energy#orbit": "",            // Satellite Orbit Transfer
  "dynamics/Particle_Kinetics_Work_Energy#ball": "",             // Released Ball
  "dynamics/Particle_Kinetics_Work_Energy#loop": "",             // Stunt Driver Loop
  "dynamics/Particle_Kinetics_Work_Energy#sun": "",              // Sun-Powered Car
  "dynamics/Particle_Kinetics_Work_Energy#push": "",             // Constant Transverse Push
  "dynamics/Particle_Kinetics_Work_Energy#central": "",          // Central Force
  "dynamics/Particle_Kinetics_Work_Energy#springcollar": "",     // Frictionless Collar & Spring
  "dynamics/Particle_Kinetics_Work_Energy#escape": "",           // Escape Velocity

  // Relative Motion: Particles · Dynamics Practice
  "dynamics/Relative_Motion_Particles#cars": "",                 // Intersection
  "dynamics/Relative_Motion_Particles#jet": "",                  // Carrier & Jet
  "dynamics/Relative_Motion_Particles#trains": "",               // Trains
  "dynamics/Relative_Motion_Particles#boats": "",                // Speedboats on Curves
  "dynamics/Relative_Motion_Particles#radar": "",                // Radar Tracking an Aircraft
  "dynamics/Relative_Motion_Particles#crane": "",                // Crane Boom and Trolley
  "dynamics/Relative_Motion_Particles#turntable_ball": "",       // Ball in a Turntable Groove
  "dynamics/Relative_Motion_Particles#ship_deck": "",            // Sailor on a Turning Ship

  // Rigid Body Kinematics · Dynamics Practice
  "dynamics/Rigid_Body_Kinematics#hook": "",                     // Gear & Hook
  "dynamics/Rigid_Body_Kinematics#slidebar": "",                 // Sliding Bar
  "dynamics/Rigid_Body_Kinematics#rack": "",                     // Linkage Driving a Rack
  "dynamics/Rigid_Body_Kinematics#fourbar": "",                  // Four-Bar Linkage
  "dynamics/Rigid_Body_Kinematics#flywheel": "",                 // Flywheel Linkage
  "dynamics/Rigid_Body_Kinematics#piston": "",                   // Linear Acceleration of a Piston
  "dynamics/Rigid_Body_Kinematics#diskroll": "",                 // Disk Rolling on a Curved Surface
  "dynamics/Rigid_Body_Kinematics#slidercrank": "",              // Slider-Crank with Law of Sines
  "dynamics/Rigid_Body_Kinematics#rollwheel": "",                // Rolling Wheel: Top and Contact Points
  "dynamics/Rigid_Body_Kinematics#geartrain": "",                // Compound Gear Train

  // Rigid Body Kinetics · Dynamics Practice
  "dynamics/Rigid_Body_Kinetics#armfixed": "",                   // Robotic Arm (Fixed Base)
  "dynamics/Rigid_Body_Kinetics#armmoving": "",                  // Robotic Arm (Moving Base)
  "dynamics/Rigid_Body_Kinetics#barcollar": "",                  // Bar & Collar in a Horizontal Plane
  "dynamics/Rigid_Body_Kinetics#twolink": "",                    // Two-Link Slender Bars
  "dynamics/Rigid_Body_Kinetics#linkage": "",                    // Linkage with an Added Axial Force
  "dynamics/Rigid_Body_Kinetics#vspring": "",                    // Two Bars with a Vertical Spring
  "dynamics/Rigid_Body_Kinetics#unkspring": "",                  // Unknown Spring Force
  "dynamics/Rigid_Body_Kinetics#club": "",                       // Force of a Club on a Ball
  "dynamics/Rigid_Body_Kinetics#threedisk": "",                  // Three Disks in Contact
  "dynamics/Rigid_Body_Kinetics#satellites": "",                 // Gravity Research Satellites
  "dynamics/Rigid_Body_Kinetics#satthruster": "",                // Satellite Side Thruster
  "dynamics/Rigid_Body_Kinetics#pulleymass": "",                 // Pulley, Hanging Mass & Spring

  // Rolling Bodies · Dynamics Practice
  "dynamics/Rolling_Bodies#incline": "",                         // Rolling Down an Incline
  "dynamics/Rolling_Bodies#race": "",                            // Rolling Race
  "dynamics/Rolling_Bodies#spool": "",                           // Spool Pulled by a String
  "dynamics/Rolling_Bodies#bowling": "",                         // Bowling Ball: Slip to Roll

  // Relative Motion: Rigid Bodies · Dynamics Practice
  "dynamics/Sliding_Contacts_Moving_Frames#slotarm": "",         // Collar on a Rotating Arm
  "dynamics/Sliding_Contacts_Moving_Frames#quickreturn": "",     // Pin in a Rotating Slot
  "dynamics/Sliding_Contacts_Moving_Frames#turntable": "",       // Walking on a Turntable

  /* ================= THERMODYNAMICS ================= */

  // Control Volumes: Open Systems · ATLAS Thermodynamics
  "thermo/Control_Volume_Energy_Analysis#air_massflow": "",      // Mass Flow Rate from a Volumetric Flow Rate
  "thermo/Control_Volume_Energy_Analysis#resistor_pipe": "",     // Air Heated by a Resistor in an Insulated Pipe
  "thermo/Control_Volume_Energy_Analysis#nozzle_air": "",        // Insulated Nozzle: Exit Temperature and Area
  "thermo/Control_Volume_Energy_Analysis#turbine_inlet": "",     // Steam Turbine: Find the Inlet Pressure
  "thermo/Control_Volume_Energy_Analysis#air_dh_cp": "",         // Air Compression: Δh with Variable vs Constant c_p
  "thermo/Control_Volume_Energy_Analysis#compressor_r134a": "",  // Water-Jacketed R-134a Compressor
  "thermo/Control_Volume_Energy_Analysis#mixing_air": "",        // Mixing Chamber: Outside Air Meets Return Air
  "thermo/Control_Volume_Energy_Analysis#condenser_river": "",   // Power-Plant Condenser Cooled by a River
  "thermo/Control_Volume_Energy_Analysis#solar_collector": "",   // Solar Collector: Gallons of Hot Water per Hour
  "thermo/Control_Volume_Energy_Analysis#throttle_hx": "",       // Throttling Valve + Evaporator with R-134a
  "thermo/Control_Volume_Energy_Analysis#ac_system": "",         // Residential Air Conditioner: Four Components
  "thermo/Control_Volume_Energy_Analysis#two_compressors": "",   // Two-Stage Compression with an Intercooler
  "thermo/Control_Volume_Energy_Analysis#rankine_otec": "",      // Simple Steam Power Plant: η_th and Condenser Cooling Water

  // Energy & the First Law (Closed Systems) · ATLAS Thermodynamics
  "thermo/Energy_and_the_First_Law#threeproc": "",               // Three Processes in Series
  "thermo/Energy_and_the_First_Law#condconv": "",                // Conduction & Convection Rates
  "thermo/Energy_and_the_First_Law#energytable": "",             // Closed-System Energy Table
  "thermo/Energy_and_the_First_Law#threecycle": "",              // Three-Process Cycle: Heat, Work & Energy
  "thermo/Energy_and_the_First_Law#fridgecop": "",               // Refrigeration Cycle from its COP

  // Getting Started: Systems, Properties & Pressure · ATLAS Thermodynamics
  "thermo/Getting_Started_Pressure_Units#pistonres": "",         // Piston, Resistor & Gage Pressure
  "thermo/Getting_Started_Pressure_Units#gagevac": "",           // Receiver Tank & Bourdon Gage
  "thermo/Getting_Started_Pressure_Units#buoy": "",              // Anchored Spherical Buoy

  // Properties of Pure Substances · ATLAS Thermodynamics
  "thermo/Properties_of_Pure_Substances#state_lookup": "",       // Four Water States on the T–v Diagram
  "thermo/Properties_of_Pure_Substances#phase_lookup": "",       // Water and R-134a: Mixture or Superheated?
  "thermo/Properties_of_Pure_Substances#quality_two_temps": "",  // Quality of a Mixture at Two Temperatures
  "thermo/Properties_of_Pure_Substances#rigid_tank_vapor": "",   // Rigid Tank of R-134a Heated to Saturated Vapor
  "thermo/Properties_of_Pure_Substances#four_processes": "",     // Four Processes of Water Vapor on p–V
  "thermo/Properties_of_Pure_Substances#isobaric_expansion": "", // Constant-Pressure Expansion of Wet Steam
  "thermo/Properties_of_Pure_Substances#rigid_tank_heat": "",    // Heat Transfer to R-134a in a Rigid Tank
  "thermo/Properties_of_Pure_Substances#piston_stops": "",       // Steam Cooled Against Stops: Two Processes
  "thermo/Properties_of_Pure_Substances#air_isobaric": "",       // Air Heated at Constant Pressure (Ideal Gas, k const)
  "thermo/Properties_of_Pure_Substances#resistor_tank": "",      // Electric Heating of Gas in an Insulated Tank
  "thermo/Properties_of_Pure_Substances#idealgasex": "",         // Three-Process Air Power Cycle (Table G-3E)

  // The Second Law · ATLAS Thermodynamics
  "thermo/Second_Law#power_check": "",                           // Power Cycle: Reversible, Irreversible or Impossible?
  "thermo/Second_Law#inventor_claim": "",                        // Is This Waste-Heat Generator Possible?
  "thermo/Second_Law#kelvin_corollary": "",                      // Ideal Rankine vs Ideal Brayton: Same Reservoirs, Same η
  "thermo/Second_Law#fridge_kitchen": "",                        // Kitchen Refrigerator: Power Input and Lowest Possible Interior Temperature
  "thermo/Second_Law#heatpump_min_work": "",                     // Heat Pump for a Building: Minimum Work from Three Sources
  "thermo/Second_Law#heatpump_EN": "",                           // Sizing a Heat Pump: γ_max vs Actual COP (English Units)
  "thermo/Second_Law#solar_plant": "",                           // Solar-Powered Plant: Revenue vs Thermal Efficiency
  "thermo/Second_Law#series_cycles": "",                         // Two Reversible Cycles in Series Producing Equal Work
  "thermo/Second_Law#series_equal_eta": "",                      // Series Engines: Intermediate Temperature for Equal Efficiencies vs Equal Work
  "thermo/Second_Law#clausius_check": "",                        // Clausius Inequality: Nature of a Power Cycle
  "thermo/Second_Law#fridge_clausius": "",                       // Refrigeration Cycle Data: Four Cases by the Clausius Inequality

  /* ================= FUNDAMENTALS OF BIOMECHANICS ================= */

  // Arthrokinematics Lab · ATLAS Biomechanics
  "biomech/arthro#anglconv": "",                                 // Included ↔ Anatomical Angle
  "biomech/arthro#rollarc": "",                                  // Roll Without Glide: How Far Does the Center Move?
  "biomech/arthro#flarc": "",                                    // Will It Roll Off? Roll Arc vs Plateau Length
  "biomech/arthro#coverage": "",                                 // Why the Hip Is Stable and the Shoulder Is Mobile: Socket Coverage
  "biomech/arthro#kneekin": "",                                  // Knee Extension Kinematics with Screw-Home
  "biomech/arthro#mobplan": "",                                  // Mobilization Plan as Numbers: Glide Needed for a Target Range

  // Movement Analysis Capstone · ATLAS Biomechanics
  "biomech/capstone#ljsens": "",                                 // Long Jump: Velocity or Angle?
  "biomech/capstone#sway": "",                                   // Limit of Stability: Strength vs the Base of Support
  "biomech/capstone#chair": "",                                  // Wheelchair Push: From Hand Force to Chair Speed
  "biomech/capstone#jumpfull": "",                               // Vertical Jump: Impulse–Momentum meets Work–Energy
  "biomech/capstone#glassfull": "",                              // Holding the Glass: Grip Force, Friction and the Tipping Moment
  "biomech/capstone#landstiff": "",                              // Soft vs Stiff Landing: Energy Absorbed by Muscle or by Structures
  "biomech/capstone#realankle": "",                              // One Real Stride: Ankle Moment from the Measured Ground Reaction Force

  // Anthropometry & Inverse Dynamics Lab · ATLAS Biomechanics
  "biomech/invdyn#segpar": "",                                   // Segment Parameters from Body Mass and Height
  "biomech/invdyn#com2": "",                                     // Whole-Body COM by the Segmental Method
  "biomech/invdyn#legmoi": "",                                   // Swing Leg: Straight vs Bent Knee
  "biomech/invdyn#ankstat": "",                                  // Quiet Standing on One Leg: Ankle Moment and Achilles Force
  "biomech/invdyn#ankdyn": "",                                   // Push-Off: Dynamic Ankle Inverse Dynamics
  "biomech/invdyn#kneesquat": "",                                // Deep Squat Hold: Knee Moment, Quadriceps Force and Tibiofemoral Load

  // Joint Kinetics Lab · ATLAS Biomechanics
  "biomech/kinetics#momarm": "",                                 // Torque and EMA at the Elbow Across the Range
  "biomech/kinetics#scale": "",                                  // What the Scale Reads While You Squat
  "biomech/kinetics#pfcomp": "",                                 // Patellofemoral Compression from Tendon Tension
  "biomech/kinetics#elbowfull": "",                              // Static Elbow: Biceps Force and Joint Reaction
  "biomech/kinetics#cmj": "",                                    // Countermovement Jump from a Force-Plate Record
  "biomech/kinetics#georgejim": "",                              // George vs Jim: Moment Arm, Muscle Velocity and Torque

  // MTC & Joint Stability Lab · ATLAS Biomechanics
  "biomech/mtc#torquework": "",                                  // Work of a Joint Torque: Which Action Was It?
  "biomech/mtc#seriesspring": "",                                // Tendon as a Series Spring: Fiber Shortening at Fixed MTC Length
  "biomech/mtc#fatigue": "",                                     // Capability vs Requirement: Time to Task Failure
  "biomech/mtc#twitch": "",                                      // Rate Coding: Twitch Summation into Tetanus
  "biomech/mtc#perturb": "",                                     // Static Stability: How Much Co-Contraction Keeps the Ligament Safe?
  "biomech/mtc#settling": "",                                    // Dynamic Stability: Stiffness, Damping and Settling Time
  "biomech/mtc#realtendon": "",                                  // Real Tendon, Real Fibers: Isometric Contraction of an OpenSim Muscle

  // Multi-Joint Movement Lab · ATLAS Biomechanics
  "biomech/multi#fkhand": "",                                    // Forward Kinematics: Where Is the Hand?
  "biomech/multi#vend": "",                                      // Endpoint Velocity and the 2 : 1 Rule
  "biomech/multi#coupling": "",                                  // Coupling Angle from Joint Increments
  "biomech/multi#reach": "",                                     // Reach Area of a Two-Link Arm
  "biomech/multi#kickpower": "",                                 // Kick: Knee Power and Where the Shank's Energy Comes From
  "biomech/multi#endforce": "",                                  // Endpoint Force from Joint Torques (Jacobian Transpose)

  // Skeletal Muscle Lab · ATLAS Biomechanics
  "biomech/muscle#fiberlen": "",                                 // Sarcomeres in Series: Fiber Length & Excursion
  "biomech/muscle#seriespar": "",                                // How Many Myofibrils? Series vs Parallel
  "biomech/muscle#flcurve": "",                                  // Force–Length: Active, Passive, Total
  "biomech/muscle#tendonforce": "",                              // Force at the Tendon of a Pennate Muscle
  "biomech/muscle#penvspar": "",                                 // Same Volume, Different Architecture: Pennate vs Parallel
  "biomech/muscle#hillfv": "",                                   // Hill's Force–Velocity Relation: Speed Under Load and Peak Power
  "biomech/muscle#realpcsa": "",                                 // A Real Muscle's Architecture from the OpenSim Model

  // Ligaments & Tendons Lab · ATLAS Biomechanics
  "biomech/tissue#stressstrain": "",                             // Stress, Strain and Modulus of a Tendon
  "biomech/tissue#stiffenergy": "",                              // Stiffness and Stored Energy from a Force–Elongation Test
  "biomech/tissue#springdamper": "",                             // Spring + Damper: Passive Force of a Stretched Tendon
  "biomech/tissue#achilles": "",                                 // Achilles Tendon at Push-Off: Stress, Strain, Energy and Safety Factor
  "biomech/tissue#hysteresis": "",                               // Hysteresis from Loading and Unloading Data
  "biomech/tissue#relaxcreep": "",                               // Calf Stretch vs Brace: Stress Relaxation and Creep

  // Jaw Motion & Reconstruction · ATLAS Biomechanics
  "biomech/tmj#openphase": "",                                   // Hinge Phase: Opening Angle from Interincisal Distance
  "biomech/tmj#condpath": "",                                    // Gliding Phase: Condylar Translation Along the Eminence
  "biomech/tmj#jawlever": "",                                    // The Mandible as a Lever: Bite Force and Joint Reaction
  "biomech/tmj#markerpose": "",                                  // Rigid-Body Pose from Splint Markers
  "biomech/tmj#voxel": "",                                       // How Imaging Resolution Limits a Joint-Center Estimate
  "biomech/tmj#stemfatigue": "",                                 // Condylar Stem: Bending Stress and Fatigue Safety Factor
  "biomech/tmj#pewear": "",                                      // Polyethylene Wear of the Fossa Component
  "biomech/tmj#reconplate": "",                                  // Reconstruction Plate Bridging a Mandibular Defect
  "biomech/tmj#icrtorque": "",                                   // Muscle Torque About the Condylar ICR from CAD Coordinates
};
