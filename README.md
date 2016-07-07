Now the code is distributed into separate files.

The folder src/ contains all the code:
- 3d.js takes care of rendering
- SimOpts.js contains settings
- SimPulse.js is the timing manager for a simulation
- Sim.js is finally the simulation code

js/ contains open source libraries, I am using THREE.js for general 3d rendering, OrbitControls to control the camera, TweenJS to create animations and THREE/Stats.js.

orbit.js has been modifiered to allow clamping of position values.

images/ contains the skybox sides. assets/ contains texture files. Theses images are from the web. 

The models in models/ are converted from AntMe and exist in THREE.js json format.

The technical description of the simulation can be found in wiki.pdf
