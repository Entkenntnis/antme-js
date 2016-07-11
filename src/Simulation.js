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
    var id = id;
    var KI = KI;
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
    
    // spawner
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
    }
    
    this.addJob = function(job){
      jobs.splice(insertionPoint, 0, jobs);
    }
    
    this.update = function(){
      insertionPoint = jobs.length;
      if (jobs.length > 0) {
        var curJob = jobs[jobs.length - 1];
        var finished = curJob.callback();
        if (finished) {
          var index = jobs.indexOf(curJob);
          jobs.splice(index, 1);
        }
      } else {
        
      }
    }
  }
  
  
  // JOB
  function Job(callback){
    this.callback = callback;
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
      antMe.staticPlayerId = ant.getPlayerid();
      antMe.curAnt = ant;
      func.bind(antMe.pushObj(ant))(antMe.pushObj(arg));
      antMe.staticPlayerId = undefined;
      keyStore = [];
    }
    
    , pushObj:function(obj){
      var index = antMe.objStore.indexOf(obj);
      if (index >= 0)
        return registerKey(index);
      var id = antMe.objCounter++;
      antMe.objStore.push(obj);
      return registerKey(id);
    }
    
    , getObj:function(id){
      return antMe.objStore[keyStore[id]];
    }
    
    , registerKey(index){
      var key = Math.random + "";
      keyStore[key] = index;
      return key;
    }
  }  

  am.LadeAmeise = function(ant){
    // verify ants here
    if (API.ants.length < Optionen.MaximaleSpieler){
      API.ants.push(ant);
    }
  }
  
  global.GehSchritt = function(number){
    if (API.staticPlayerId == undefined)
      return;
      // TODO
  }











  // export chain
  am._sim = Sim;


})(AntMe._vw, AntMe._optionen, window, AntMe);
