"use strict";

// File 1: exports _vw into AntMe, which is the interface to all graphic objects
//         and the init function to start everything

var AntMe = {};

(function(am){

  // project-wide variables
  var scene, camera, renderer, stats, controls, manager;

  function init(){
    // our stage
    scene = new THREE.Scene();
    
    // the floor lies in the xz-plane, don't worry about aspect here, will be done on resize 
    camera = new THREE.PerspectiveCamera(60, 1 /*aspect*/, 0.1, 20000);
    camera.position.set(0, 600, 1700);
    
    // the worker in the shadow
    renderer = new THREE.WebGLRenderer();
    document.body.appendChild(renderer.domElement);
    
    // showing nice fps
    stats = new Stats();
    stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats.dom );
    
    // make it movable
    controls = new THREE.OrbitControls(camera);
    controls.maxPolarAngle = Math.PI/2 - 0.1;
    controls.maxDistance = 3000;
    controls.minDistance = 100;
    
    // handle loading
    manager = new THREE.LoadingManager();
    
    // making it awesome fullwindow
    window.addEventListener('resize', resize, false);
    resize();
    
    vw.load();
    
    manager.onLoad = function(){
      vw.onLoad();
      vw.onExtLoad();
      animate()
    };
  }

  function resize() {
    var w = document.documentElement.clientWidth;
    var h = document.documentElement.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
  }

  function animate(e){
    if (vw.needsRedraw){
      stats.begin();
      renderer.render(scene, camera);
      vw.needRedraw = false;
      stats.end();
    }
    requestAnimationFrame(animate);
  }


  // THIS IS a 3d object manager
  function UnitStore(proto){
    var store = {};
    var ready = [];
    var prefix = 'unitstorekey:';
    
    this.has = function(id){
      return (prefix + id) in store;
    }
    this.get = function(id){
      if (this.has(id))
        return store[prefix + id];
      else {
        if (ready.length > 0) {
          var next = ready[0];
          next.visible = true;
          ready.splice(0, 1);
          store[prefix + id] = next;
          return next;
        } else {
          var newUnit = proto.clone();
          scene.add(newUnit);
          store[prefix+id] = newUnit;
          return newUnit;
        }
      }
    }
    this.remove = function(id){
      var obj = store[prefix + id];
      obj.visible = false;
      delete store[prefix + id];
      ready.push(obj);
    }
  }



  // START OF 3d view related stuff

  var ViewController = function(){
    this.ant0 = undefined
    this.bug0 = undefined
    this.hill0 = undefined
    this.sugar0 = undefined
    this.apple0 = undefined
    this.sugarBox0 = undefined
    this.marker0 = undefined
    this.gamefloor = undefined
    this.skybox = undefined
    this.antStore = undefined
    this.hillStore = undefined
    this.sugarStore = undefined
    this.appleStore = undefined
    this.bugStore = undefined
    this.sugarBoxStore = undefined
    this.markerStore = undefined
    this.needRedraw = true
    this.onExtLoad = function(){}
    
    this.load = function(){
      
      var objectLoader = new THREE.ObjectLoader(manager);
      var textureLoader = new THREE.TextureLoader(manager);
      
      // floor
      var floorTexture = textureLoader.load( "assets/sand.jpg" );
      floorTexture.wrapS = THREE.RepeatWrapping;
      floorTexture.wrapT = THREE.RepeatWrapping;
      floorTexture.repeat.set(4, 4);
      var floorMat = new THREE.MeshPhongMaterial({color: 0x888888, side: THREE.DoubleSide, map:floorTexture, specular:0x333300});
      this.gamefloor = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 1, 1),floorMat);
      this.gamefloor.rotation.x = Math.PI / 2;
      scene.add(this.gamefloor);
    
      // skybox
      var materialArray = [];
      var posfixs = ['xpos', 'xneg', 'ypos', 'yneg', 'zpos', 'zneg'];
      posfixs.forEach(function(val){
        materialArray.push(new THREE.MeshBasicMaterial({
          map:textureLoader.load('images/dawnmountain-' + val + '.png'),
          side:THREE.BackSide}));
      });
      var skyboxMaterial = new THREE.MeshFaceMaterial( materialArray );
      var skyboxGeom = new THREE.CubeGeometry( 8000, 8000, 8000, 1, 1, 1 );
      var skybox = new THREE.Mesh( skyboxGeom, skyboxMaterial );
      this.skybox = skybox;
      scene.add( skybox );
      
      // light it up
      var ambient = new THREE.AmbientLight( 0x444444 );
      scene.add( ambient );
      var directionalLight = new THREE.DirectionalLight( 0xffeedd );
      directionalLight.position.set( 2, 2, 2 ).normalize();
      scene.add( directionalLight );
    
      // get models
      objectLoader.load("models/ant.json", function ( obj ) {
        obj.children[0].children.forEach(function(o){
          o.material = new THREE.MeshLambertMaterial({color:0x000000});
        });
        /*var face = textureLoader.load("assets/face.jpg");
        obj.children[0].children[10].material = new THREE.MeshLambertMaterial({
          color:0xffffff
          , map:face
        });
        obj.children[0].children[10].rotation.set(-Math.PI/2, -Math.PI/2, 0);
        obj.children[0].children[10].position.set(2.4, -0.63, 1.68);*/
        obj.scale.set(1.6,1.6,1.6);
        this.ant0 = obj;
      }.bind(this));
      objectLoader.load("models/anthill.json", function ( obj ) {
        var earthTexture = textureLoader.load( "assets/earth.jpg" );
        var mat = new THREE.MeshPhongMaterial({color:0x999966});
        mat.map = earthTexture;
        obj.children[0].children[1].material = mat;
        obj.children[0].children[0].material.color.setHex(0x000000);
        obj.children[0].children[2].material.color.setHex(0xffffff);
        this.hill0 = obj;
      }.bind(this));
      objectLoader.load("models/apple.json", function ( obj ) {
        obj.children[0].children[0].material.color.setHex(0x00cc00);
        obj.children[0].children[1].material.color.setHex(0x66aa00);
        obj.scale.set(2, 2, 2);
        this.apple0 = obj;
      }.bind(this));
      objectLoader.load("models/bug.json", function ( obj ) {
        obj.children[0].children.forEach(function(o){
          o.material.color.setHex(0x000000);
          o.material.specular.setHex(0x00dddd);
        });
        this.bug0 = obj;
      }.bind(this));
      objectLoader.load("models/sugar.json", function ( obj ) {
        obj.children[0].children[0].material.color.setHex(0xffffff);
        this.sugar0 = obj;
      }.bind(this));
      
      // sugar box
      var sugarBoxGeo = new THREE.BoxGeometry( 1, 1, 1);
      this.sugarBox0 = new THREE.Mesh( sugarBoxGeo, new THREE.MeshPhongMaterial({color:0xffffff}) );
      this.sugarBox0.scale.set(2,2,2);
      
      // marker-sphere
      var geometry1 = new THREE.SphereGeometry(40,32,24);
      var material1 = new THREE.MeshLambertMaterial({color: 0x00ff00, transparent: true, opacity: 0.2});
      var sphere1 = new THREE.Mesh(geometry1, material1);
      this.marker0 = sphere1;

      // debugging circle
      var radius   = 100,
      segments = 64,
      material = new THREE.LineBasicMaterial( { color: 0x0000ff } ),
      geometry = new THREE.CircleGeometry( radius, segments );

        // Remove center vertex
      geometry.vertices.shift();

      var line = new THREE.Line(geometry, material);
      line.rotation.x = Math.PI/2;
      line.position.y = 0.5;
      //scene.add( line );
    }
    
    this.onLoad = function(){
      // open stores
      this.antStore = new UnitStore(this.ant0);
      this.hillStore = new UnitStore(this.hill0);
      this.appleStore = new UnitStore(this.apple0);
      this.bugStore = new UnitStore(this.bug0);
      this.sugarStore = new UnitStore(this.sugar0);
      this.sugarBoxStore = new UnitStore(this.sugarBox0);
      this.markerStore = new UnitStore(this.marker0);
    }
    
    this.setAntBodyColor = function(ant, c){
      [/*10,*/ 7, 6].forEach(function(id){
        ant.children[0].children[id].material = new THREE.MeshPhongMaterial({color:c});
      });
    }
    
    this.setHillFlagColor = function(hill, c){
      hill.children[0].children[2].material = new THREE.MeshPhongMaterial({color:c});
    }
    
    this.setBugEyeColor = function(bug, color) {
      [6, 7].forEach(function(id){
        bug.children[0].children[id].material.color.setHex(color);
      });
    }
    
    this.setControlsBounds = function(x, y){
      controls.maxX = x,
      controls.maxZ = y;
    }
  };
  
  var vw = new ViewController();
  
  // export
  am._vw = vw;
  am.StarteSimulation = init;
})(AntMe);
