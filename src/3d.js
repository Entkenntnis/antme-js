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
    camera = new THREE.PerspectiveCamera(60, 1 /*aspect*/, 0.1, 10000);
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
    controls.maxPolarAngle = Math.PI/2;
    controls.maxDistance = 2000;
    controls.clamper = function(pos){
      if (pos.y < 0.5) {pos.y = 0.5;} // should add clamper to protect skybox
    };
    
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

  var vw = {
      ant0 : undefined
    , bug0 : undefined
    , hill0 : undefined
    , sugar0 : undefined
    , apple0 : undefined
    , gamefloor : undefined
    , skybox : undefined
    , antStore : undefined
    , hillStore : undefined
    , sugarStore : undefined
    , appleStore : undefined
    , bugStore : undefined
    , needRedraw : true
    , onExtLoad : function(){}
    
    , load : function(){
      
      var objectLoader = new THREE.ObjectLoader(manager);
      var textureLoader = new THREE.TextureLoader(manager);
      
      // floor
      var floorTexture = textureLoader.load( "assets/sand.jpg" );
      floorTexture.wrapS = THREE.RepeatWrapping;
      floorTexture.wrapT = THREE.RepeatWrapping;
      floorTexture.repeat.set(4, 4);
      var floorMat = new THREE.MeshBasicMaterial({color: 0x888888, side: THREE.DoubleSide, map:floorTexture});
      vw.gamefloor = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 1, 1),floorMat);
      vw.gamefloor.rotation.x = Math.PI / 2;
      scene.add(vw.gamefloor);
    
      // skybox
      var materialArray = [];
      var posfixs = ['xpos', 'xneg', 'ypos', 'yneg', 'zpos', 'zneg'];
      posfixs.forEach(function(val){
        materialArray.push(new THREE.MeshBasicMaterial({
          map:textureLoader.load('images/dawnmountain-' + val + '.png'),
          side:THREE.BackSide}));
      });
      var skyboxMaterial = new THREE.MeshFaceMaterial( materialArray );
      var skyboxGeom = new THREE.CubeGeometry( 5000, 5000, 5000, 1, 1, 1 );
      var skybox = new THREE.Mesh( skyboxGeom, skyboxMaterial );
      vw.skybox = skybox;
      scene.add( skybox );
      
      // light it up
      var ambient = new THREE.AmbientLight( 0x444444 );
      scene.add( ambient );
      var directionalLight = new THREE.DirectionalLight( 0xffeedd );
      directionalLight.position.set( 1, 2, 3 ).normalize();
      scene.add( directionalLight );
    
      // get models
      objectLoader.load("models/ant.json", function ( obj ) {
        obj.children[0].children.forEach(function(o){
          o.material.color.setHex(0x0d0d0d);
        });
        vw.ant0 = obj;
      });
      objectLoader.load("models/anthill.json", function ( obj ) {
        var earthTexture = textureLoader.load( "assets/earth.jpg" );
        var mat = new THREE.MeshPhongMaterial({color:0x999966});
        mat.map = earthTexture;
        obj.children[0].children[1].material = mat;
        obj.children[0].children[0].material.color.setHex(0x000000);
        obj.children[0].children[2].material.color.setHex(0xffffff);
        vw.hill0 = obj;
      });
      objectLoader.load("models/apple.json", function ( obj ) {
        obj.children[0].children[0].material.color.setHex(0x00cc00);
        obj.children[0].children[1].material.color.setHex(0x66aa00);
        obj.scale.set(2.6, 2.6, 2.6);
        vw.apple0 = obj;
      });
      objectLoader.load("models/bug.json", function ( obj ) {
        obj.children[0].children.forEach(function(o){
          o.material.color.setHex(0x000000);
          o.material.specular.setHex(0x00dddd);
        });
        vw.bug0 = obj;
      });
      objectLoader.load("models/sugar.json", function ( obj ) {
        obj.children[0].children[0].material.color.setHex(0xffffff);
        vw.sugar0 = obj;
      });
    }
    
    , onLoad : function(){
      // open stores
      vw.antStore = new UnitStore(vw.ant0);
      vw.hillStore = new UnitStore(vw.hill0);
      vw.appleStore = new UnitStore(vw.apple0);
      vw.bugStore = new UnitStore(vw.bug0);
      vw.sugarStore = new UnitStore(vw.sugar0);
    }
    
    , setAntBodyColor : function(ant, c){
      [/*10,*/ 7, 6].forEach(function(id){
        ant.children[0].children[id].material = new THREE.MeshPhongMaterial({color:c});
      });
    }
    
    , setHillFlagColor : function(hill, c){
      hill.children[0].children[2].material = new THREE.MeshPhongMaterial({color:c});
    }
    
    , setBugEyeColor : function(bug, color) {
      [6, 7].forEach(function(id){
        bug.children[0].children[id].material.color.setHex(color);
      });
    }
  }
  
  // export
  am._vw = vw;
  am.StarteSimulation = init;
})(AntMe);
