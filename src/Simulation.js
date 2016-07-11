"use strict";

// encapsulate our project
(function(vw, later_Optionen, global, am){


var Optionen = {
    MaximaleSpieler : 8
  , SpielfeldVerhältnis : 4.0/3.0
  , SpielfeldGrundGröße : 550000
  , HügelAbstand : 300
  , SpielerFarben : [0xff0000, 0x00ff00, 0x0000ff, 0x00ffff,
                     0xffff00, 0xff00ff, 0xffffff, 0x000000]
  , ZuckerGröße : 1000
  , ZuckerVergrößerung : 0.2
  , NahrungMindestEntfernung : 300
  , NahrungMaximalEntfernung : 1500
  , NahrungAbstand : 100
  , ZuckerWartezeit : 125
  , ZuckerProSpieler : 1.5
}



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
        if (!this.isInBound(pos, 50)){
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
    var playerid = playerid;
    var key = Hill.counter++;
    vw.setHillFlagColor(vw.hillStore.get(key), Optionen.SpielerFarben[_playerid]);
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
  
  
// ALL MANAGER
  var Sim = {
      playground : undefined
    , players : []
    , hills : []
    , sugars : []
    
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
      Sim.playground.update();
    }
  
  }
  
  
  // OUTER WRAPPER

  var API = {
        ants : []
      
      , addAnt:function(ant){
        if (API.ants.length < Optionen.MaximaleSpieler){
          API.ants.push(ant);
        }
      }
  }  

  am.LadeAmeise = API.addAnt;











  // export chain
  am._sim = Sim;


})(AntMe._vw, AntMe._simOpts, window, AntMe);
