"use strict";

// encapsulate our project
(function(vw, Optionen, global, am){


// protected helper functions

  function toViewPos(pos, height){
    if (height == undefined)
      height = 0;
    return new THREE.Vector3(
      pos.x-Sim.playground.getWidth()/2.0,
      height,
      pos.y-Sim.playground.getHeight()/2.0);
  }
  
  function dist(a, b){
    return Math.sqrt(Math.pow(a.x-b.x,2) + Math.pow(a.y-b.y,2));
  }











    // PLAYER
  function Player(_id, _KI){
    var id = _id;
    var KI = _KI;
    var points = 0;
    
    this.getId = function(){
      return id;
    }
    
    this.getKI = function(){
      return KI;
    }
    
    this.getPoints = function(){
      return points;
    }
    
    this.addPoints = function(amount){
      points = Math.max(0, points + amount);
    }
  }
  
  
    // PLAYGROUND
  function Playground(_width, _height){
    var width = _width;
    var height = _height;
    
    vw.gamefloor.geometry = new THREE.PlaneGeometry(width, height, 1, 1);
    vw.gamefloor.geometry.verticesNeedUpdate = true;
    
    this.getWidth = function(){
      return width;
    }
    
    this.getHeight = function(){
      return height;
    }
    
    this.randomPos = function(){
      return {
        x:Math.random()*width,
        y:Math.random()*height};
    }
    
    this.isInBound = function(pos, margin){
      if (margin == undefined)
        margin = 0;
      if (pos.x < margin || pos.y < margin)
          return false;
      if (width - pos.x < margin || height - pos.y < margin)
        return false;
      return true;
    }
    
    this.getHillPos = function(){
      var pos;
      var limit = 100;
      while(limit > 0) {
        pos = this.randomPos();
        if (!this.isInBound(pos, Optionen.HügelRandAbstand)){
          continue;
        }
        var isGood = true;
        for(var i = 0; i < Sim.hills.length; i++) {
          if (dist(Sim.hills[i].getPos(), pos) < Optionen.HügelAbstand) {
            isGood = false;
          }
        }
        if (!isGood) continue;
        return pos;
      }
      return pos;
    }
    
    this.getGoodyPos = function(){
      var pos;
      var limit = 100;
      while (limit > 0) {
        pos = this.randomPos();
        if (!this.isInBound(pos,20))
          continue;
        var toNear = false;
        var atLeastNear = false;
        for(var i = 0; i < Sim.hills.length; i++) {
          var distance = dist(Sim.hills[i].getPos(), pos);
          if (distance < Optionen.NahrungMindestEntfernung) {
            toNear = true;
          }
          if (distance < Optionen.NahrungMaximalEntfernung) {
            atLeastNear = true;
          }
        }
        if (toNear) continue;
        if (!atLeastNear) continue;
        toNear = false;
        var checkDist = function(obj){
          var distance = dist(obj.getPos(), pos);
          if (distance < Optionen.NahrungAbstand) {
            toNear = true;
          }
        };
        Sim.sugars.forEach(checkDist);
        if (toNear) continue;
        return pos;
      }
      return pos;
    }
    
    // spawning
    var timeToNextSugar = Optionen.ZuckerWartezeit;
    this.update = function(){
      var maximalSugars = (Sim.playerCount() + 1) * Optionen.ZuckerProSpieler;
      if (timeToNextSugar-- <= 0 && Sim.sugars.length < maximalSugars) {
        timeToNextSugar = Optionen.ZuckerWartezeit;
        Sim.sugars.push(new Sugar(this.getGoodyPos()));
      }
    }
  }


    // HILL
  function Hill(_pos, _playerid) {
    Hill.counter = Hill.counter || 1;
    var pos = _pos;
    var playerid = _playerid;
    var key = Hill.counter++;
    vw.setHillFlagColor(vw.hillStore.get(key), Optionen.SpielerFarben[playerid]);
    updateGO();
    
    function updateGO(){
      vw.hillStore.get(key).position.copy(toViewPos(pos));
    }
    
    this.getPos = function(){
      return pos;
    }
    
    this.getPlayerid = function(){
      return playerid;
    }
    
    var timeToNextAnt = Optionen.AmeiseWartezeit;
    this.update = function(){
      var ownAnts = 0;
      Sim.ants.forEach(function(ant){
        if (ant.getPlayerid() == playerid)
          ownAnts++;
      });
      if (timeToNextAnt-- <= 0 && ownAnts < Optionen.AmeisenMaximum) {
        timeToNextAnt = Optionen.AmeiseWartezeit;
        var antPos = {x:pos.x,y:pos.y};
        var angle = Math.random()*Math.PI*2;
        var radius = Optionen.HügelRadius + (Math.random()*10 - 5);
        antPos.x += Math.cos(angle)*radius;
        antPos.y += Math.sin(angle)*radius;
        Sim.ants.push(new Ant(antPos, playerid));
      }
    }
  }
  
  
    // SUGAR
  function Sugar(_pos){
    Sugar.counter = Sugar.counter || 1;
    var pos = _pos;
    var key = Sugar.counter++;
    var amount = Optionen.ZuckerGröße;
    updateGO();
    
    function updateGO(){
      var GO = vw.sugarStore.get(key);
      GO.position.copy(toViewPos(pos));
      var linScale = amount / Optionen.ZuckerGröße * Optionen.ZuckerVergrößerung;
      var scale = Math.max(Math.pow(linScale, 1/3.0), 0.000001);
      GO.scale.set(scale, scale, scale);
    }
    
    this.getAmount = function(){
      return amount;
    }
    
    this.getPos = function(){
      return pos;
    }
    
    this.unload1Sugar = function(){
      if (amount > 0) {
        amount--;
        return true;
      } else {
        return false;
      }
      updateGO();
    }
  }
  
    // ANT
  function Ant(_pos, _playerid){
    Ant.counter = Ant.counter || 1;
    var speed = Optionen.AmeiseGeschwindigkeit;
    var rotationSpeed = Optionen.AmeiseDrehgeschwindigkeit;
    var pos = _pos;
    var playerid = _playerid;
    var key = playerid + ":" + Ant.counter++;
    var heading = Math.floor(Math.random()*360);
    var load = 0;
    var jobs = [];
    var insertionPoint = 0;
    vw.setAntBodyColor(vw.antStore.get(key), Optionen.SpielerFarben[playerid]);
    updateGO();
    
    function updateGO(){
      vw.antStore.get(key).position.copy(toViewPos(pos));
      vw.antStore.get(key).rotation.y = -heading / 180 * Math.PI + Math.PI;
      if (load > 0) {
        var sugar = vw.sugarBoxStore.get(key);
        sugar.position.copy(toViewPos(pos, 5.5));
      } else if (vw.sugarBoxStore.has(key)) {
        vw.sugarBoxStore.remove(key);
      }
    }
    
    this.getPos = function(){
      return pos;
    }
    
    this.getPlayerid = function(){
      return playerid;
    }
    
    this.getJobs = function(){
      return jobs;
    }
    
    this.setPos = function(newpos){
      pos.x = newpos.x;
      pos.y = newpos.y;
      updateGO();
    }
    
    this.turn = function(degree){
      heading += Math.round(degree);
      heading %= 360;
      updateGO();
    }
    
    this.addJob = function(job){
      jobs.splice(insertionPoint, 0, job);
    }
    
    this.update = function(){
      insertionPoint = jobs.length;
      if (jobs.length > 0) {
        var curJob = jobs[jobs.length - 1];
        var finished = curJob.callback.bind(this)();
        if (finished) {
          var index = jobs.indexOf(curJob);
          jobs.splice(index, 1);
        }
      } else {
        API.callUserFunc(this, "Wartet");
      }
    }
    
    function actionMoveSteps(_steps){
      var steps = _steps;
      return [function(){
        var toMove = 0;
        var finished = false;
        if (steps < speed) {
          finished = true;
          toMove = steps;
        } else {
          toMove = speed;
          steps -= speed;
        }
        var oldx = pos.x;
        var oldy = pos.y;
        var newx = pos.x + toMove*Math.cos(heading/180*Math.PI);
        var newy = pos.y + toMove*Math.sin(heading/180*Math.PI);
        var newpos = {x:newx,y:newy};
        if (Sim.playground.isInBound(newpos, 2)){
          this.setPos(newpos);
        } else {
          finished = true;
          global.RestSchritte = steps;
          API.callUserFunc(this, "RandErreicht");
          global.RestSchritte = undefined;
        }
        return finished;
      },
      function(){
        return {type:"GO", value:steps};
      }];
    }
    
    function actionTurn(_degree){
      var degree = _degree;
      return [function(){
        var toTurn = 0;
        var finished = false;
        if (Math.abs(degree) < rotationSpeed) {
          finished = true;
          toTurn = degree;
        } else {
          toTurn = rotationSpeed * Math.sign(degree);
          degree -= rotationSpeed * Math.sign(degree);
        }
        this.turn(toTurn);
        return finished;
      },
      function(){
        return {type:"TURN", value:degree};
      }];
    }
    
    this.addGoJob = function(steps){
      var funcs = actionMoveSteps(steps);
      this.addJob(new Job("action", undefined, funcs[0], funcs[1]));
    }
    
    this.addTurnJob = function(degree){
      var funcs = actionTurn(degree);
      this.addJob(new Job("action", undefined, funcs[0], funcs[1]));
    }
  }
  
  
  // JOB
  function Job(type, parent, callback, info){
    this.type = type;
    this.parent = parent;
    this.callback = callback;
    this.info = info;
  }
  
  
// ALL MANAGER
  var Sim = {
      playground : undefined
    , players : []
    , hills : []
    , sugars : []
    , ants : []
    
    , playerCount:function(){
      return Sim.players.length;
    }
    
    , init:function(){
      
      var area = (1 + (API.ants.length * Optionen.SpielfeldVerhältnis)) * Optionen.SpielfeldGrundGröße;
      var width = Math.round(Math.sqrt(area * Optionen.SpielfeldVerhältnis));
      var height = Math.round(Math.sqrt(area / Optionen.SpielfeldVerhältnis));
      Sim.playground = new Playground(width, height);
    
      for(var i = 0; i < API.ants.length; i++) {
        Sim.players.push(new Player(i, API.ants[i]));
        Sim.hills.push(new Hill(Sim.playground.getHillPos(), i));
      }
    }
    
    , update:function(){
    
      Sim.ants.forEach(function(ant){
        ant.update();
      });
      
      Sim.hills.forEach(function(hill){
        hill.update();
      });
      
      Sim.playground.update();
    }
  }
  
  
  // OUTER WRAPPER, well, not that beautiful

  var API = {
      ants : []
    
    , staticPlayerId : undefined
    , curAnt : undefined
    , objStore : []
    , keyStore : []
    , objCounter : 0
    
    , callUserFunc:function(ant, func, arg){
      func = Sim.players[ant.getPlayerid()].getKI()[func];
      if (arg == undefined)
        arg = [];
      if (func == undefined)
        return;
      API.staticPlayerId = ant.getPlayerid();
      API.curAnt = ant;
      func.bind(API.pushObj(ant))(API.pushObj(arg));
      API.staticPlayerId = undefined;
      API.keyStore = [];
    }
    
    , pushObj:function(obj){
      var index = API.objStore.indexOf(obj);
      if (index >= 0)
        return API.registerKey(index);
      var id = API.objCounter++;
      API.objStore.push(obj);
      return API.registerKey(id);
    }
    
    , getObj:function(id){
      return API.objStore[API.keyStore[id]];
    }
    
    , registerKey(index){
      var key = Math.random + "";
      API.keyStore[key] = index;
      return key;
    }
  }  

  am.LadeAmeise = function(ant){
    // verify ants here
    if (API.ants.length < Optionen.MaximaleSpieler){
      API.ants.push(ant);
    }
  }
  
  global.GeheSchritte = function(number){
    if (API.staticPlayerId == undefined)
      return;
    if (typeof number !== "number")
      return;
    API.curAnt.addGoJob(number);
  }
  
  global.DreheWinkel = function(degree){
    if (API.staticPlayerId == undefined)
      return;
    if (typeof degree !== "number")
      return;
    API.curAnt.addTurnJob(degree);
  }
  
  global.Zufallszahl = function(a, b){
    if (b == undefined) {
      return Math.floor(Math.random()*a);
    } else {
      return Math.floor(Math.random()*(b-a))+a;
    }
  }











  // export chain
  am._sim = Sim;


})(AntMe._vw, AntMe._optionen, window, AntMe);
