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
  
  function closest(pos, objs, range){
    var best = Infinity;
    var bestobj = undefined;
    objs.forEach(function(obj){
      var d = dist(obj.getPos(), pos);
      if (d < best) {
        bestobj = obj;
        best = d;
      }
    });
    if (best < range) {
      return bestobj;
    }
    return undefined;
  }
  
  function getDir(pos, des){
    var d = dist(pos, des);
    var dx = des.x - pos.x;
    var angle = 0;
    if (des.y < pos.y) {
      angle = (360-Math.acos(dx/d)/Math.PI*180.0)%360;
    } else {
      angle = (Math.acos(dx/d)/Math.PI*180.0)%360;
    }
    return Math.round(angle);
  }
  
  function getRotation(heading,  angle){
    var rotation = angle - (heading%360);
    if (rotation > 180) {
      rotation -= 360;
    }
    if (rotation < -180) {
      rotation += 360;
    }
    return rotation;
  }
  
  var SUGAR = "Sugar";
  var HILL = "Hill";
  
  global.ZUCKER = SUGAR;
  global.HÜGEL = HILL;

  Object.defineProperty(global, 'Ziel', {
    get: function() {
      if (API.staticPlayerId === undefined)
        return undefined;
      var destination = undefined;
      var jobs = API.curAnt.getJobs();
      if (jobs.length > 0) {
        var index = jobs.length - 1;
        var curCmd = jobs[index];
        while(curCmd.type == "action" && curCmd.parent == undefined && index > 0) {
          curCmd = jobs[--index];
        }
        while(curCmd.type == "action" && curCmd.parent != undefined) {
          curCmd = curCmd.parent;
        }
        var info = curCmd.info();
        if (info.type == "DEST") {
          if (info.value.constructor.name == "Sugar") {
            destination = SUGAR;
          } else if (info.value.constructor.name == "Hill") {
            destination = HILL;
          }
        }
      }
      return destination;
    },
    set: function(name) { }
  });
  
  var antProp = function(name, f){
    Object.defineProperty(global, name, {
      get: function() {
        if (API.staticPlayerId === undefined)
          return undefined;
        return f();
      },
      set: function(name) { }
    });
  }
  
  antProp('Untätig', ()=>{return API.curAnt.getJobs().length == 0;});
  antProp('ZuckerLast', ()=>{return API.curAnt.getLoad();});
  antProp('Blickrichtung', ()=>{return API.curAnt.getHeading();});
  antProp('Sichtweite', ()=>{return API.curAnt.getRange();});
  antProp('MaximaleLast', ()=>{return API.curAnt.getMaxLoad();});





    // PLAYER
  function Player(_id, _KI){
    var id = _id;
    var KI = _KI;
    var points = 0;
    
    var para = document.createElement("DIV");
    para.innerHTML = KI.Name;
    para.style.display = "flex";
    para.style.fontWeight = "bold";
    var hex = Optionen.SpielerFarben[id];
    var hexS = hex.toString(16);
    while (hexS.length < 6)
      hexS = "0" + hexS;
    para.style.color = "#" + hexS;
    var pointsE = document.createElement("DIV");
    pointsE.id = "player" + id;
    pointsE.style.marginLeft = "50px";
    para.appendChild(pointsE);
    document.getElementById("hud").appendChild(para);
    
    
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
      pointsE.innerHTML = points + " Punkte";
    }
    
    this.addPoints(0);
  }
  
  
    // PLAYGROUND
  function Playground(_width, _height){
    var width = _width;
    var height = _height;
    
    vw.gamefloor.geometry = new THREE.PlaneGeometry(width, height, 1, 1);
    vw.gamefloor.geometry.verticesNeedUpdate = true;
    vw.setControlsBounds(width/2, height/2);
    
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
      
      var toRemove = [];
      Sim.sugars.forEach(function(s){
        if (s.getAmount() <= 0) {
          toRemove.push(s);
        }
      });
      toRemove.forEach(function(obj){
        var index = Sim.sugars.indexOf(obj);
        Sim.sugars.splice(index, 1);
      });
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
        var newAnt = new Ant(antPos, playerid)
        Sim.ants.push(newAnt);
        API.setAnt(newAnt);
        API.callUserFunc("IstGeboren");
        API.close();
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
        updateGO();
        return true;
      } else {
        return false;
      }
    }
  }
  
    // ANT
  function Ant(_pos, _playerid){
    Ant.counter = Ant.counter || 1;
    var speed = Optionen.AmeiseGeschwindigkeit;
    var rotationSpeed = Optionen.AmeiseDrehgeschwindigkeit;
    var range = Optionen.AmeiseSichtweite;
    var maxLoad = Optionen.AmeiseTragkraft;
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
    
    this.getRange = function(){
      return range;
    }
    
    this.getLoad = function(){
      return load;
    }
    
    this.getHeading = function(){
      return heading;
    }
    
    this.getMaxLoad = function(){
      return maxLoad;
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
    
    this.stop = function(){
      jobs = [];
    }
    
    function actionMoveSteps(_steps){
      var steps = _steps;
      return [function(){
        var toMove = 0;
        var finished = false;
        var curSpeed = speed;
        if (load > 0)
            curSpeed *= Optionen.ZuckerVerlangsamung;
        if (steps < curSpeed) {
          finished = true;
          toMove = steps;
        } else {
          toMove = curSpeed;
          steps -= curSpeed;
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
          API.callUserFunc("RandErreicht");
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
    
    function actionTurnTo(_angle){
      var angle = _angle;
      return [function(){
        var rotation = getRotation(heading, angle);
        if (rotation != 0)
          this.addTurnJob(rotation);
        return true;
      },
      function(){
        return {type:"TURNTO", value:angle};
      }];
    }
    
    function actionTake(sugar){
      return [function(){
        var d = dist(pos, sugar.getPos());
        if (d < 2) {
          while(load < maxLoad) {
            var t = sugar.unload1Sugar();
            if (t) {
              load++;
            } else {
              break;
            }
          }
        }
        updateGO();
        return true;
      }, function(){
        return {type:"TAKE",value:sugar};
      }];
    }
    
    function actionDrop(){
      return [function(){
        load = 0;
        updateGO();
        return true;
      }, function(){
        return {type:"DROP"};
      }];
    }
    
    function cmdReachPos(obj, range, callback, thisjob){
      return [function(){
        var des = obj.getPos();
        var d = dist(pos, des);
        if (d < range) {
          callback.bind(this)();
          return true;
        } else {
          var angle = getDir(pos, des);
          var rotation = getRotation(heading, angle) + Math.floor(Math.random()*30-15);
          if (rotation != 0)
            this.addTurnJob(rotation, thisjob);
          this.addGoJob(Math.min(50, d), thisjob);
          return false;
        }
      },function(){
        return {type:"DEST",value:obj};
      }];
    }
    
    this.addGoJob = function(steps, parent){
      var funcs = actionMoveSteps(steps);
      this.addJob(new Job("action", parent, funcs[0], funcs[1]));
    }
    
    this.addTurnJob = function(degree, parent){
      var funcs = actionTurn(degree);
      this.addJob(new Job("action", parent, funcs[0], funcs[1]));
    }
    
    this.addTakeJob = function(sugar, parent){
      var funcs = actionTake(sugar);
      this.addJob(new Job("action", parent, funcs[0], funcs[1]));
    }
    
    this.addDropJob = function(parent){
      var funcs = actionDrop();
      this.addJob(new Job("action", parent, funcs[0], funcs[1]));
    }
    
    this.addTurnToJob = function(angle, parent){
      var funcs = actionTurnTo(angle);
      this.addJob(new Job("action", parent, funcs[0], funcs[1]));
    }
    
    this.goToSugar = function(sugar, parent){
      var parent = new Job("command", parent);
      var funcs = cmdReachPos(sugar, 1, function(){
        API.callUserFunc("ZuckerErreicht", [sugar]);
      }, parent);
      parent.callback = funcs[0];
      parent.info = funcs[1];
      jobs.splice(0, insertionPoint);
      insertionPoint = 0;
      this.addJob(parent);
    }
    
    this.goToHome = function(parent){
      var parent = new Job("command", parent);
      var hill = Sim.hills[playerid];
      var funcs = cmdReachPos(hill, 10, function(){
        Sim.players[playerid].addPoints(load*Optionen.PunkteProZucker);
        load = 0;
        API.callUserFunc("BauErreicht", [hill]);
      }, parent);
      parent.callback = funcs[0];
      parent.info = funcs[1];
      jobs.splice(0, insertionPoint);
      insertionPoint = 0;
      this.addJob(parent);
    }
    
    this.update = function(){
      insertionPoint = jobs.length;
      API.setAnt(this);
      
      // jobs
      if (jobs.length > 0) {
        var curJob = jobs[jobs.length - 1];
        var finished = curJob.callback.bind(this)();
        if (finished) {
          var index = jobs.indexOf(curJob);
          if (index >= 0)
            jobs.splice(index, 1);
        }
      }
      
      // sights
      if (global.Ziel === undefined) {
        var sugar = closest(pos, Sim.sugars, range);
        if (sugar != undefined) {
          API.callUserFunc("SiehtZucker", [sugar]);
        }
      }
      
      if(global.Untätig) {
        API.callUserFunc("Wartet");
      }
      
      API.callUserFunc("Tick");
      API.close();
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
    
    , setAnt:function(ant){
      API.curAnt = ant;
      API.staticPlayerId = ant.getPlayerid();
    }
    
    , close:function(){
      API.curAnt = undefined;
      API.staticPlayerId = undefined;
      API.keyStore = [];
      API.objStore = [];
      API.objCounter = 0;
    }
    
    , callUserFunc:function(func, arg){
      func = Sim.players[API.curAnt.getPlayerid()].getKI()[func];
      if (arg == undefined)
        arg = [];
      if (func == undefined)
        return;
      if (API.staticPlayerId === undefined)
        return;
      func.apply(API.pushObj(API.curAnt), arg.map(API.pushObj));
    }
    
    , pushObj:function(obj){
      var id = API.objCounter++;
      API.objStore.push(obj);
      return API.registerKey(id);
    }
    
    , getObj:function(id){
      return API.objStore[API.keyStore[id]];
    }
    
    , registerKey(index){
      var key = Math.random() + "";
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
    if (number == undefined)
      number = 10000000;
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
  
  global.GeheZuZiel = function(ziel){
    if (API.staticPlayerId == undefined)
      return;
    var obj = API.getObj(ziel);
    if (obj.constructor.name == "Sugar")
      API.curAnt.goToSugar(obj);
  }
  
  global.GeheZuBau = function(){
    if (API.staticPlayerId == undefined)
      return;
    API.curAnt.goToHome();
  }
  
  global.Nimm = function(obj){
    if (API.staticPlayerId == undefined)
      return;
    var obj = API.getObj(obj);
    if (obj.constructor.name == "Sugar")
      API.curAnt.addTakeJob(obj);
  }
  
  global.DreheZu = function(angle){
    if (API.staticPlayerId == undefined)
      return;
    if (typeof angle !== "number")
      return;
    API.curAnt.addTurnToJob(angle);
  }
  
  global.Stop = function(){
    if (API.staticPlayerId == undefined)
      return;
    API.curAnt.stop();
  }
  
  global.RiecheNachZucker = function(){
    if (API.staticPlayerId == undefined)
      return;
    var sugar = closest(API.curAnt.getPos(), Sim.sugars, API.curAnt.getRange());
    if (sugar)
      return API.pushObj(sugar);
    else
      return undefined;
  }

  global.BestimmeEntfernung = function(a, b){
    if (API.staticPlayerId == undefined)
      return;
    return dist(API.getObj(a).getPos(), API.getObj(b).getPos());
  }
  
  global.BestimmeWinkel = function(a, b){
    if (API.staticPlayerId == undefined)
      return;
    return getDir(API.getObj(a).getPos(), API.getObj(b).getPos());    
  }
  
  global.LasseZuckerFallen = function(){
    if (API.staticPlayerId == undefined)
      return;
    API.curAnt.addDropJob();
  }





  // export chain
  am._sim = Sim;


})(AntMe._vw, AntMe._optionen, window, AntMe);
