

// encapsulate our project
(function (vw, Optionen, global, am) {
  "use strict";

// protected helper functions

  function toViewPos(pos, height) {
    if (height === undefined) {
      height = 0;
    }
    return new THREE.Vector3(
      pos.x - Sim.playground.getWidth() / 2.0,
      height,
      pos.y - Sim.playground.getHeight() / 2.0);
  }
  
  function dist(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
  
  function closest(pos, objs, range) {
    var best = Infinity;
    var bestobj = undefined;
    objs.forEach(function(obj) {
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
  
  function getDir(pos, des) {
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
  
  function getRotation(heading,  angle) {
    var rotation = angle - (heading%360);
    if (rotation > 180) {
      rotation -= 360;
    }
    if (rotation < -180) {
      rotation += 360;
    }
    return rotation;
  }
  
  function moveDir(pos, heading, dist) {
    return {
      x:pos.x + dist*Math.cos(heading/180*Math.PI),
      y:pos.y + dist*Math.sin(heading/180*Math.PI)
    };
  }
  
  function removeIf(arr, f) {
    var i = arr.length;
    while (i--) {
        if (f(arr[i], i)) {
            arr.splice(i, 1);
        }
    }
  }
  
  var SUGAR = "Sugar";
  var HILL = "Hill";
  var APPLE = "Apple";
  var POSITION = "Postion";

    // PLAYER
  function Player(_id, _KI) {
    var id = _id;
    var KI = _KI;
    var points = 0;
    
    var para = document.createElement("DIV");
    var nameE =document.createElement("DIV");
    nameE.innerHTML = KI.Name;
    nameE.style.minWidth = "180px";
    para.appendChild(nameE);
    para.style.display = "flex";
    para.style.fontWeight = "bold";
    var hex = Optionen.SpielerFarben[id];
    var hexS = hex.toString(16);
    while (hexS.length < 6)
      hexS = "0" + hexS;
    para.style.color = "#" + hexS;
    var pointsE = document.createElement("DIV");
    pointsE.id = "player" + id;
    pointsE.style.marginLeft = "10px";
    para.appendChild(pointsE);
    var details = document.createElement("DIV");
    details.style.fontWeight = "normal";
    details.style.color = "black";
    details.style.marginLeft = "20px";
    para.appendChild(details);
    document.getElementById("hud").appendChild(para);
    
    var collectedSugar = 0;
    var ants = 0;
    var collectedApples = 0;
    var deadants = 0;
    updateDetails();
    
    function updateDetails(){
      details.innerHTML = "(Ameisen: " + ants + " / Tote: " + deadants + 
        " / Zucker: " + collectedSugar + " / Äpfel: " + collectedApples + ")";
    }
    
    this.addSugar = function(amount) {
      collectedSugar += amount;
      updateDetails();
    }
    
    this.addApple = function() {
      collectedApples++;
      updateDetails();
    }
    
    this.addAnt = function(){
      ants++;
      updateDetails();
    }
    
    this.subAnt = function(){
      ants--;
      deadants++;
      updateDetails();
    }
    
    this.getId = function() {
      return id;
    }
    
    this.getKI = function() {
      return KI;
    }
    
    this.getPoints = function() {
      return points;
    }
    
    this.addPoints = function(amount) {
      points = Math.max(0, points + amount);
      pointsE.innerHTML = points + " Punkte";
    }
    
    this.addPoints(0);
  }
  
  
    // PLAYGROUND
  function Playground(_width, _height) {
    var width = _width;
    var height = _height;
    
    vw.gamefloor.geometry = new THREE.PlaneGeometry(width, height, 1, 1);
    vw.gamefloor.geometry.verticesNeedUpdate = true;
    vw.setControlsBounds(width/2, height/2);
    
    this.getWidth = function() {
      return width;
    }
    
    this.getHeight = function() {
      return height;
    }
    
    this.randomPos = function() {
      return {
        x:Math.random()*width,
        y:Math.random()*height};
    }
    
    this.isInBound = function(pos, margin) {
      if (margin == undefined)
        margin = 0;
      if (pos.x < margin || pos.y < margin)
          return false;
      if (width - pos.x < margin || height - pos.y < margin)
        return false;
      return true;
    }
    
    this.getHillPos = function() {
      var topW = width - Optionen.EckenAbstand*2;
      var leftH = height - Optionen.EckenAbstand * 2;     
      var pos = {};
      var limit = 100;
      while(limit-- > 0) {
        pos.x = Math.random()*(topW+leftH);
        pos.y = Math.random()*Optionen.HügelStreifenBreite * 2;
        if (pos.x < topW) {
          if (pos.y >= Optionen.HügelStreifenBreite) {
            pos.y += (height - Optionen.HügelStreifenBreite*2 - Optionen.HügelRandAbstand*2);
          } 
          pos.x += Optionen.EckenAbstand;
          pos.y += Optionen.HügelRandAbstand;
        } else {
          var t = pos.y;
          pos.y = pos.x - topW;
          pos.x = t;
          if (pos.x >= Optionen.HügelStreifenBreite) {
            pos.x += (width - Optionen.HügelStreifenBreite * 2 - Optionen.HügelRandAbstand * 2);
          }
          pos.x += Optionen.HügelRandAbstand;
          pos.y += Optionen.EckenAbstand;
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
    
    this.getGoodyPos = function() {
      var pos = {};
      var limit = 500;
      while (limit-- > 0) {
        var sumx = 0;
        var sumy = 0;
        Sim.hills.forEach(function (h) {
          sumx += h.getPos().x;
          sumy += h.getPos().y;
        })
        sumx /= Sim.hills.length;
        sumy /= Sim.hills.length;
        var wplus = Math.abs(sumx - width / 2);
        var hplus = Math.abs(sumy - height / 2);
        var wper = Math.random() * 2 - 1;
        var hper = Math.random() * 2 - 1;
        wper = Math.pow(Math.abs(wper), Optionen.NahrungsZentrierung) * Math.sign(wper);
        hper = Math.pow(Math.abs(hper), Optionen.NahrungsZentrierung) * Math.sign(hper);
        pos.x = (width + wplus) * wper + sumx;
        pos.y = (height + hplus) * hper + sumy;
        
        if (!this.isInBound(pos, 10))
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
        var checkDist = function(obj) {
          var distance = dist(obj.getPos(), pos);
          if (distance < Optionen.NahrungAbstand) {
            toNear = true;
          }
        };
        Sim.sugars.forEach(checkDist);
        Sim.apples.forEach(checkDist);
        if (toNear) continue;
        return pos;
      }
      return this.randomPos();
    }
    
    // spawning
    var timeToNextSugar = Optionen.ZuckerWartezeit;
    var timeToNextApple = Optionen.ApfelWartezeit;
    var timeToNextBug = Optionen.WanzenWartezeit;
    this.update = function() {
      var maximalSugars = (Sim.playerCount() + 1) * Optionen.ZuckerProSpieler;
      if (timeToNextSugar-- <= 0 && Sim.sugars.length < maximalSugars) {
        timeToNextSugar = Optionen.ZuckerWartezeit;
        Sim.sugars.push(new Sugar(this.getGoodyPos()));
      }
      var maximalApples = (Sim.playerCount() + 1) * Optionen.ÄpfelProSpieler;
      if (timeToNextApple-- <= 0 && Sim.apples.length < maximalApples) {
        timeToNextApple = Optionen.ApfelWartezeit;
        Sim.apples.push(new Apple(this.getGoodyPos()));
      }
      var maximalBugs = (Sim.playerCount() + 1) * Optionen.WanzenProSpieler;
      if (timeToNextBug-- <= 0 && Sim.bugs.length < maximalBugs) {
        timeToNextBug = Optionen.WanzenWartezeit;
        Sim.bugs.push(new Bug(this.randomPos()));
      }
      
      removeIf(Sim.sugars, function(sugar){
        if (sugar.getAmount() <= 0) {
          return true;
        }
        return false;
      })
      
      removeIf(Sim.apples, function(apple){
        var id = apple.getPid();
        if (id !== undefined) {
          var d = dist(apple.getPos(), Sim.hills[id].getPos());
          if (d < 10) {
            apple.reachHome(id);
            return true;
          }
        }
        return false;
      });
      
      removeIf(Sim.ants, function(ant) {
        if (ant.getLap() > ant.getMaxDistance() || ant.getEnergy() <= 0) {
          ant.die();
          return true;
        }
        return false;
      })
    }
  }


    // HILL
  function Hill(_pos, _playerid) {
    Hill.counter = Hill.counter || 1;
    var pos = _pos;
    var playerid = _playerid;
    var key = Hill.counter++;
    var energy = Optionen.AnfangsEnergie;
    vw.setHillFlagColor(vw.hillStore.get(key), Optionen.SpielerFarben[playerid]);
    updateGO();
    
    function updateGO() {
      vw.hillStore.get(key).position.copy(toViewPos(pos));
    }
    
    this.getPos = function() {
      return pos;
    }
    
    this.getPlayerid = function() {
      return playerid;
    }
    
    this.getEnergy = function() {
      return energy;
    }
    
    this.addEnergy = function(val) {
      energy += val;
    }
    
    var timeToNextAnt = Optionen.AmeiseWartezeit;
    this.update = function() {
      var ownAnts = 0;
      Sim.ants.forEach(function(ant) {
        if (ant.getPlayerid() == playerid)
          ownAnts++;
      });
      if (timeToNextAnt-- <= 0 && ownAnts < Optionen.AmeisenMaximum
            && energy >= Optionen.EnergieFürAmeise) {
        timeToNextAnt = Optionen.AmeiseWartezeit;
        energy -= Optionen.EnergieFürAmeise;
        var antPos = {x:pos.x,y:pos.y};
        var angle = Math.random()*Math.PI*2;
        var radius = Optionen.HügelRadius + (Math.random()*10 - 5);
        antPos.x += Math.cos(angle)*radius;
        antPos.y += Math.sin(angle)*radius;
        var newAnt = new Ant(antPos, playerid)
        Sim.ants.push(newAnt);
        Sim.players[playerid].addAnt();
        API.setAnt(newAnt);
        API.callUserFunc("IstGeboren");
        API.close();
      }
    }
  }
  
  
    // SUGAR
  function Sugar(_pos) {
    Sugar.counter = Sugar.counter || 1;
    var pos = _pos;
    var key = Sugar.counter++;
    var amount = Optionen.ZuckerGröße;
    updateGO();
    
    function updateGO() {
      var GO = vw.sugarStore.get(key);
      GO.position.copy(toViewPos(pos));
      var linScale = amount / Optionen.ZuckerGröße * Optionen.ZuckerVergrößerung;
      var scale = Math.max(Math.pow(linScale, 1/2), 0.000001);
      GO.scale.set(scale, scale, scale);
    }
    
    this.getAmount = function() {
      return amount;
    }
    
    this.getPos = function() {
      return pos;
    }
    
    this.unload1Sugar = function() {
      if (amount > 0) {
        amount--;
        updateGO();
        return true;
      } else {
        if (vw.sugarStore.has(key))
          vw.sugarStore.remove(key);
        return false;
      }
    }
  }
  
    // APPLE
  function Apple(_pos) {
    Apple.counter = Apple.counter || 1;
    var pos = _pos;
    var key = Apple.counter++;
    this.ants = [];
    this.dx = 0;
    this.dy = 0;
    this.heading = 0;
    var moving = false;
    var pid = undefined;
    updateGO();
    
    function updateGO() {
      var GO = vw.appleStore.get(key);
      var height = moving?5:0;
      GO.position.copy(toViewPos(pos, height));
    }
    
    this.getPos = function() {
      return pos;
    }
    
    this.addAnt = function(ant) {
      if (this.needHelp(ant)) {
        this.ants.push(ant);
      }
    }
    
    this.getPid = function() {
      return pid;
    }
    
    this.needHelp = function(ant) {
      if (pid === undefined) {
        return true;
      } else if (ant.getPlayerid() === pid && this.ants.length < Optionen.MaximumAmeisenFürApfel) {
        return true;
      }
      return false;
    }
    
    this.reachHome = function(id) {
      vw.appleStore.remove(key);
      Sim.players[id].addPoints(Optionen.PunkteProApfel);
      Sim.hills[id].addEnergy(Optionen.EnergieProApfel);
      Sim.players[id].addApple();
    }
    
    this.update = function() {
      if (pid !== undefined) {
        this.heading = getDir(this.getPos(), Sim.hills[pid].getPos());
        // Geschwindigkeit zwischen 0.2 und 1
        var speed = 0.2 + 0.8 * (this.ants.length / Optionen.MaximumAmeisenFürApfel);
        this.dx =  speed*Math.cos(this.heading/180*Math.PI);
        this.dy = speed*Math.sin(this.heading/180*Math.PI);
        pos.x += this.dx;
        pos.y += this.dy;
        updateGO();
        return;
      }
      // remove inactive ants
      removeIf(this.ants, function(ant){
        if (Sim.ants.indexOf(ant) < 0)
          return true;
        var jobs = ant.getJobs();
        if (jobs !== undefined) {
          var curJob = jobs[jobs.length - 1];
          if (curJob.type == "APPLE")
            return false;
        }
        return true;
      });
      // check parties
      var stats = {};
      var parties = [];
      this.ants.forEach(function(ant){
        var id = ant.getPlayerid();
        if (id in stats) {
          stats[id].push(ant);
        } else {
          stats[id] = [ant];
          parties.push(id);
        }
      });
      var vals = parties.map(function(e){
        return {id:e, len:stats[e].length};
      });
      var bestid = undefined;
      var bestlen = -1;
      vals.forEach(function(e){
        if (bestlen == e.len)
          bestlen = -1;
        else if (bestlen < e.len) {
          bestlen = e.len
          bestid = e.id;
        }
      });
      if (bestlen >= Optionen.AmeisenFürApfel) {
        var toKeep = [];
        this.ants.forEach(function(a){
          if (a.getPlayerid() == bestid) {
            toKeep.push(a);
          }
        });
        this.ants = toKeep;
        moving = true;
        pid = bestid;
      } else {
        moving = false;
        pid = undefined;
      }
    }
  }
  
    // BUG
  function Bug(_pos) {
    Bug.Counter = Bug.Counter || 1;
    var key = Bug.Counter++;
    var heading = Math.floor(Math.random()*360);
    var pos = _pos;
    var togo = 0;
    var torotate = 0;
    var towait = 0;
    updateGO();
    
    function updateGO() {
      vw.bugStore.get(key).position.copy(toViewPos(pos));
      vw.bugStore.get(key).rotation.y = -heading / 180 * Math.PI + Math.PI;
    }
    
    this.update = function() {
      var ant = closest(pos, Sim.ants, Optionen.WanzenKampfweite);
      if (ant !== undefined) {
        ant.subEnergy(Optionen.WanzenAngriff, this);
      }
      if (torotate != 0) {
        heading += Math.sign(torotate) * Optionen.WanzeDrehgeschwindigkeit;
        torotate -= Math.sign(torotate);
      } else if (togo > 0) {
        var newpos = moveDir(pos, heading, Optionen.WanzeGeschwindigkeit);
        if (!Sim.playground.isInBound(newpos, 10)) {
          torotate = Math.round(180 / Optionen.WanzeDrehgeschwindigkeit);
          togo = 0;
        } else {
          pos = newpos;
        }
        togo--;
      } else if (towait != 0){
        towait--;
      } else {
        towait = 30;
        torotate = Math.floor(Math.random()*40-20);
        togo = 60;
        var destHill = closest(pos, Sim.hills, Optionen.WanzenHügelAbstand);
        if (destHill !== undefined) {
          var angle = getDir(pos, destHill.getPos()) + 180;
          torotate = Math.round(getRotation(heading, angle)/Optionen.WanzeDrehgeschwindigkeit);
        } else {
          ant = closest(pos, Sim.ants, Optionen.WanzeSichtweite);
          if (ant!= undefined) {
            var dir = getDir(pos, ant.getPos());
            var rot = getRotation(heading, dir);
            torotate = Math.round(rot/Optionen.WanzeDrehgeschwindigkeit);
          }
        }
        
      }
      updateGO();
    }
  }
  
    // ANT
  function Ant(_pos, _playerid) {
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
    var maxDistance = Optionen.AmeisenReichweite;
    var lap = 0;
    var maxEnergy = Optionen.AmeisenEnergie;
    var energy = maxEnergy;
    vw.setAntBodyColor(vw.antStore.get(key), Optionen.SpielerFarben[playerid]);
    updateGO();
    
    function updateGO() {
      vw.antStore.get(key).position.copy(toViewPos(pos));
      vw.antStore.get(key).rotation.y = -heading / 180 * Math.PI + Math.PI;
      if (load > 0) {
        var sugar = vw.sugarBoxStore.get(key);
        sugar.position.copy(toViewPos(pos, 5.5));
      } else if (vw.sugarBoxStore.has(key)) {
        vw.sugarBoxStore.remove(key);
      }
    }
    
    this.getPos = function() {
      return pos;
    }
    
    this.getPlayerid = function() {
      return playerid;
    }
    
    this.getJobs = function() {
      return jobs;
    }
    
    this.getRange = function() {
      return range;
    }
    
    this.getLoad = function() {
      return load;
    }
    
    this.getHeading = function() {
      return heading;
    }
    
    this.getMaxLoad = function() {
      return maxLoad;
    }
    
    this.getKey = function() {
      return key;
    }
    
    this.getMaxSpeed = function() {
      return speed;
    }
    
    this.getMaxDistance = function() {
      return maxDistance;
    }
    
    this.getLap = function() {
      return lap;
    }
    
    this.getEnergy = function() {
      return energy;
    }
    
    this.subEnergy = function(val, obj) {
      energy -= val;
      API.setAnt(this);
      API.callUserFunc("WirdAngegriffen", [obj]);
      API.close();
    }
    
    this.getMaxEnergy = function() {
      return maxEnergy;
    }
    
    this.die = function() {
      API.setAnt(this);
      API.callUserFunc("IstGestorben");
      API.close();
      vw.antStore.remove(key);
      if (vw.sugarBoxStore.has(key))
        vw.sugarBoxStore.remove(key);
      Sim.players[playerid].subAnt();
    }
    
    this.setPos = function(newpos) {
      lap += dist(pos, newpos);
      pos.x = newpos.x;
      pos.y = newpos.y;
      updateGO();
    }
    
    this.turn = function(degree) {
      heading += Math.round(degree);
      heading %= 360;
      while (heading < 0)
        heading += 360;
      heading = Math.round(heading);
      updateGO();
    }
    
    this.addJob = function(job) {
      jobs.splice(insertionPoint, 0, job);
    }
    
    this.stop = function() {
      jobs = [];
      insertionPoint = 0;
    }
    
    this.getDestination = function() {
      var destination = undefined;
      var jobs = API.curAnt.getJobs();
      if (jobs.length > 0) {
        var index = jobs.length - 1;
        var curCmd = jobs[index];
        while(index > 0 && curCmd.type != "DEST") {
          curCmd = jobs[--index];
        }
        if (curCmd.type == "DEST") {
          if (curCmd.value.constructor.name == "Sugar") {
            destination = SUGAR;
          } else if (curCmd.value.constructor.name == "Hill") {
            destination = HILL;
          } else if (curCmd.value.constructor.name == "Apple") {
            destination = APPLE;
          } else if (curCmd.value.constructor.name == "Position") {
            destination = POSITION;
          }
        }
      }
      return destination;
    }
    
    function reachedHome() {
      Sim.players[playerid].addPoints(load*Optionen.PunkteProZucker);
      Sim.hills[playerid].addEnergy(load*Optionen.EnergieProZucker);
      Sim.players[playerid].addSugar(load);
      load = 0;
      lap = 0;
      energy = maxEnergy;
    }
    
    this.addGoJob = function(_steps) {
      var steps = _steps;
      var cb = function() {
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
        var newpos = moveDir(pos, heading, toMove);
        if (Sim.playground.isInBound(newpos, 2)) {
          this.setPos(newpos);
        } else {
          finished = true;
          API.callUserFunc("RandErreicht", [steps]);
        }
        return finished;
      };
      this.addJob(new Job("GO", steps, cb));
    }
    
    this.addGoStraightJob = function() {
      var cb = function () {
        var newpos = moveDir(pos, heading, speed);
        if (Sim.playground.isInBound(newpos, 2)) {
          this.setPos(newpos);
        } else {
          API.callUserFunc("RandErreicht", [0]);
          return true;
        }
        return false;
      }
      this.addJob(new Job("GOSTRAIGHT", undefined, cb));
    }
    
    this.addTurnJob = function(_degree) {
      var degree = _degree;
      var cb = function() {
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
      };
      this.addJob(new Job("TURN", degree, cb));
    }
    
    this.addTakeJob = function(sugar) {
      var cb = function() {
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
      };
      this.addJob(new Job("TAKE", sugar, cb));
    }
    
    this.addDropJob = function() {
      var cb = function() {
        load = 0;
        updateGO();
        return true;
      };
      this.addJob(new Job("DROP", undefined, cb));
    }
    
    this.addWaitJob = function(_rounds) {
      var rounds = _rounds;
      var cb = function() {
        if (rounds-- > 0) {
          return false;
        } else {
          return true;
        }
      };
      this.addJob(new Job("WAIT", rounds, cb));
    }
    
    this.addTurnToJob = function(_angle) {
      var angle = _angle;
      var cb = function() {
        var rotation = getRotation(heading, angle);
        if (rotation != 0)
          this.addTurnJob(rotation);
        return true;
      };
      this.addJob(new Job("TURNTO", angle, cb));
    }
    
    this.addAppleJob = function(_apple) {
      var apple = _apple;
      var setup = false;
      var cb = function() {
        var index = Sim.apples.indexOf(apple);
        if (index < 0) {
          return true;
        }
        if (!setup) {
          setup = true;
          apple.addAnt(this);
          return false;
        }
        if (apple.ants.indexOf(this) < 0) {
          this.stop();
          return true;
        }
        heading = apple.heading;
        this.setPos({x:pos.x + apple.dx, y:pos.y + apple.dy});
        return false;
      };
      this.addJob(new Job("APPLE", apple, cb));
    }
    
    this.addCustomJob = function(_f) {
      var f = _f;
      var cb = function() {
        var ret = f();
        if (ret !== undefined)
          return ret;
        return true;
      };
      this.addJob(new Job("CUSTOM", f, cb));
    }
    
    var gotoHelper = function(obj, snap, f) {
      var cb = function() {
        var des = obj.getPos();
        var d = dist(pos, des);
        if (d < snap) {
          f.bind(this)();
          return true;
        } else {
          var angle = getDir(pos, des);
          var rotation = getRotation(heading, angle);
          var v = Optionen.ZufallRichtungsVerschiebung;
          rotation += Math.floor(Math.random()*v*2-v);
          if (rotation != 0)
            this.addTurnJob(rotation);
          this.addGoJob(Math.min(50, d));
          return false;
        }
      };
      jobs.splice(0, insertionPoint);
      insertionPoint = 0;
      this.addJob(new Job("DEST", obj, cb));
    }.bind(this);
    
    this.goToSugar = function(sugar, parent) {
      gotoHelper(sugar, 1, function() {
        API.callUserFunc("ZuckerErreicht", [sugar]);
      });
    }
    
    this.goToApple = function(apple, parent) {
      gotoHelper(apple, 10, function() {
        API.callUserFunc("ApfelErreicht", [apple]);
      })
    }
    
    this.goToPos = function(pos, parent) {
      gotoHelper(pos, 1, function () {
        API.callUserFunc("PositionErreicht");
      });
    }
    
    this.goToHome = function(parent) {
      var hill = Sim.hills[playerid];
      gotoHelper(hill, 10, function() {
        reachedHome();
        API.callUserFunc("BauErreicht", [hill]);
      });
    }
    
    this.update = function() {
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
      if (this.getDestination() === undefined) {
        var sugar = closest(pos, Sim.sugars, range);
        if (sugar != undefined) {
          API.callUserFunc("SiehtZucker", [sugar]);
        }
      }
      
      if (this.getDestination() === undefined) {
        var apple = closest(pos, Sim.apples, range);
        if (apple != undefined) {
          API.callUserFunc("SiehtApfel", [apple]);
        }
      }
      
      if(this.getJobs().length == 0) {
        API.callUserFunc("Wartet");
      }
      
      API.callUserFunc("Tick");
      API.close();
    }
  }
  
  
  // JOB
  function Job(type, value, cb) {
    this.type = type;
    this.value = value;
    this.callback = cb;
  }
  
  
  
// ALL MANAGER
  var Simulation = function() {
    this.cycles = 0;
    this.playground = undefined
    this.players = []
    this.hills = []
    this.sugars = []
    this.ants = []
    this.apples = []
    this.bugs = []
    this.memories = {}
    
    this.playerCount=function() {
      return Sim.players.length;
    }
    
    this.init=function() {
      
      var area = (1 + (API.ants.length * Optionen.SpielfeldVerhältnis)) * Optionen.SpielfeldGrundGröße;
      var width = Math.round(Math.sqrt(area * Optionen.SpielfeldVerhältnis));
      var height = Math.round(Math.sqrt(area / Optionen.SpielfeldVerhältnis));
      Sim.playground = new Playground(width, height);
    
      for(var i = 0; i < API.ants.length; i++) {
        Sim.players.push(new Player(i, API.ants[i]));
        Sim.hills.push(new Hill(Sim.playground.getHillPos(), i));
      }
    }
    
    this.update=function() {
      Sim.apples.forEach(function(apple){
        apple.update();
      })
      
      Sim.bugs.forEach(function(bug) {
        bug.update();
      })
      
      Sim.ants.forEach(function(ant) {
        ant.update();
      });
      
      Sim.hills.forEach(function(hill) {
        hill.update();
      });
      
      Sim.playground.update();
    }
  }
  
  var Sim = new Simulation();
  
  
  // OUTER WRAPPER, well, not that beautiful

  var APIWrapper = function() {
    this.ants = []
    
    this.staticPlayerId = undefined;
    this.curAnt = undefined;
    this.callId = 0;
    this.ctxt = "";
    
    this.setAnt = function(ant) {
      API.curAnt = ant;
      API.staticPlayerId = ant.getPlayerid();
      this.callId++;
    }
    
    this.close = function() {
      API.curAnt = undefined;
      API.staticPlayerId = undefined;
      API.ctxt = undefined;
    }
    
    this.callUserFunc = function(name, arg) {
      var func = Sim.players[API.curAnt.getPlayerid()].getKI()[name];
      if (arg == undefined)
        arg = [];
      if (func == undefined)
        return;
      if (API.staticPlayerId === undefined)
        return;
      API.ctxt = "Ameise." + name + " = " + func;
      func.apply(API.pushObj(API.curAnt), arg.map(function (obj) {
        if (typeof obj == "object")
          return API.pushObj(obj);
        return obj;
      }));
    }
    
    this.pushObj=function(obj) {
      return new SimObject(obj);
    }
    
    this.getObj=function(simObj) {
      return simObj.get(Sim);
    }
    
    this.antProp = function(name, f) {
      Object.defineProperty(global, name, {
        get: function() {
          if (API.staticPlayerId === undefined) {
            console.warn("Die Eigenschaft '" + name + "' kann nur innerhalb einer Ameise aufgerufen werden.");
            return;
          }
          return f();
        },
        set: function(name) { }
      });
    };
    
    this.addFunc = function(name, f) {
      global[name] = function() {
        if (API.staticPlayerId === undefined) {
          console.warn("Die Funktion '" + name + "()' kann nur innerhalb einer Ameise aufgerufen werden.");
          return;
        }
        var args = []
        for(var i = 0; i < arguments.length; i++) {
          var e = arguments[i];
          if (typeof e == "object" && e.constructor.name == "SimObject") {
            args.push(e.get(Sim));
          }
          args.push(e);
        }
        return f.apply(undefined, args);
      }
    }
    
    this.message = function(text) {
      var details = "";
      if (API.ctxt !== undefined && API.staticPlayerId !== undefined) {
        details = "\nVolk: " + Sim.players[API.staticPlayerId].getKI().Name + "\nAufruf: " + API.ctxt;
      }
      console.warn(text + details);
      throw "Simulationsfehler";
    }
  }
  
  // Position
  function Position(_pos) {
    var pos = _pos;
    this.getPos = function() {
      return pos;
    }
  }
  
  // SimObject
  function SimObject(_obj) {
    var roundId = API.callId;
    var obj = _obj;
    
    this.get = function(key) {
      if (key === Sim && API.callId == roundId) {
        return obj;
      }
      API.message("Objekt ist abgelaufen und kann nicht mehr verwendet werden.")
      return;
    }
  }
  
  var API = new APIWrapper();

  am.LadeAmeise = function(ant) {
    // verify ants here
    if (API.ants.length < Optionen.MaximaleSpieler) {
      API.ants.push(ant);
    }
  }
  
  global.ZUCKER = SUGAR;
  global.BAU = HILL;
  global.APFEL = APPLE;
  global.POSITION = POSITION;
  
  API.antProp('Ziel', ()=>{
    return API.curAnt.getDestination();
  });
  API.antProp('Untätig', ()=>{return API.curAnt.getJobs().length == 0;});
  API.antProp('ZuckerLast', ()=>{return API.curAnt.getLoad();});
  API.antProp('Blickrichtung', ()=>{return API.curAnt.getHeading();});
  API.antProp('Sichtweite', ()=>{return API.curAnt.getRange();});
  API.antProp('MaximaleLast', ()=>{return API.curAnt.getMaxLoad();});
  API.antProp('MaximaleGeschwindigkeit', ()=>{return API.curAnt.getMaxSpeed();});
  API.antProp('Reichweite', ()=>{return API.curAnt.getMaxDistance();});
  API.antProp('ZurückgelegteStrecke', ()=>{return API.curAnt.getLap();});
  API.antProp('Energie', ()=>{return API.curAnt.getEnergy();});
  API.antProp('MaximaleEnergie', ()=>{return API.curAnt.getMaxEnergy();});
  API.antProp('Bau', ()=>{return API.pushObj(Sim.hills[API.curAnt.getPlayerid()]);});
  API.antProp('GetragenerApfel', ()=>{
    var jobs = API.curAnt.getJobs();
    if (jobs.length > 0) {
      var curJob = jobs[jobs.length - 1];
      if (curJob.type == "APPLE") {
        return API.pushObj(curJob.value);
      }
    }
    return undefined;
  });
  API.antProp('Position', ()=>{
    return new Position(API.curAnt.getPos());
  });
  
  API.addFunc("Gehe", (schritte)=>{
    if (typeof schritte !== "number" || schritte < 0) {
      API.message("Die Funktion 'Gehe(schritte)' erwartet als Argument eine positive Zahl.");
      return;
    }
    schritte = Math.round(schritte);
    if (schritte > 0)
      API.curAnt.addGoJob(schritte);
  })
  
  API.addFunc("GeheGeradeaus", ()=>{
    API.curAnt.addGoStraightJob();
  });
  
  API.addFunc("Stopp", ()=>{
    API.curAnt.addCustomJob(()=>{
      API.curAnt.stop();
    })
  });
  
  API.addFunc("Drehe", (winkel) => {
    if (typeof winkel !== "number") {
      API.message("Die Funktion 'Drehe(winkel)' erwartet als Argument eine Zahl.");
      return;
    }
    winkel = Math.round(winkel);
    if (winkel != 0) {
      API.curAnt.addTurnJob(winkel);
    }
  });
  
  API.addFunc("DreheZuRichtung", (richtung) => {
    if (typeof richtung !== "number") {
      API.message("Die Funktion 'DreheZuRichtung(richtung)' erwartet als Argument eine Zahl.");
      return;
    }
    var richtung = Math.round(richtung) % 360;
    while (richtung < 0)
      richtung += 360;
    API.curAnt.addTurnToJob(richtung);
  });
  
  API.addFunc("GeheZuBau", () => {
    API.curAnt.goToHome();
  })
  
  API.addFunc("Zufallszahl", (a, b) => {
    if (b === undefined) {
      if (typeof a !== "number" || a < 0) {
        API.message("Die Funktion 'Zufallszahl(max)' erwartet als Argument eine positive Zahl.");
        return;
      }
      return Math.floor(Math.random() * a);
    } else {
      if (typeof a !== "number" || typeof b!== "number") {
        API.message("Die Funktion 'Zufallszahl(min, max)' erwartet als Argument Zahlen.");
        return;
      }
      if (a >= b) {
        API.message("Die Funktion 'Zufallszahl(min, max)' erwartet, dass min < max ist.");
        return;
      }
      return Math.floor(Math.random() * (b - a) + a);
    }
  })
  
  API.addFunc("Stehe", (runden) => {
    if (typeof runden !== "number" || runden < 0) {
      API.message("Die Funktion 'Stehe(runden)' erwartet als Argument eine positive Zahl.");
      return;
    }
    runden = Math.round(runden);
    if (runden > 0)
      API.curAnt.addWaitJob(runden);
  });
  
  API.addFunc("GeheZuZiel", (ziel) => {
    var obj = ziel;
    if (obj.constructor.name == "Sugar")
      API.curAnt.goToSugar(obj);
    if (obj.constructor.name == "Hill")
      API.curAnt.goToHome();
    if (obj.constructor.name == "Apple")
      API.curAnt.goToApple(obj);
    if (ziel.constructor.name == "Position")
      API.curAnt.goToPos(obj);
  });
  
  global.Nimm = function(obj) {
    if (API.staticPlayerId == undefined)
      return;
    var obj = API.getObj(obj);
    if (obj.constructor.name == "Sugar")
      API.curAnt.addTakeJob(obj);
  }
  
  global.DreheWegVon = function(obj) {
    if (API.staticPlayerId == undefined)
      return;
    if (obj.constructor.name != "Position")
      obj = API.getObj(obj);
    var angle = (getDir(API.curAnt.getPos(), obj.getPos()) + 180) % 360;
    API.curAnt.addTurnToJob(angle);
  }
  
  global.RiecheNachZucker = function() {
    if (API.staticPlayerId == undefined)
      return;
    var sugar = closest(API.curAnt.getPos(), Sim.sugars, API.curAnt.getRange());
    if (sugar)
      return API.pushObj(sugar);
    else
      return undefined;
  }
  
  global.RiecheNachApfel = function() {
    if (API.staticPlayerId == undefined)
      return;
    var apple = closest(API.curAnt.getPos(), Sim.apples, API.curAnt.getRange());
    if (apple)
      return API.pushObj(apple);
    else
      return undefined;
  }
  
  global.RiecheNachWanze = function() {
    if (API.staticPlayerId == undefined)
      return;
    var bug = closest(API.curAnt.getPos(), Sim.bugs, API.curAnt.getRange());
    if (bug)
      return API.pushObj(bug);
    else
      return undefined;
  }

  global.BestimmeEntfernung = function(a, b) {
    if (API.staticPlayerId == undefined)
      return;
    if (a.constructor.name != "Position")
      a = API.getObj(a);
    if (b.constructor.name != "Position")
      b = API.getObj(b);
    if (a === undefined || b === undefined)
      return;
    return dist(a.getPos(), b.getPos());
  }
  
  global.BestimmeWinkel = function(a, b) {
    if (API.staticPlayerId == undefined)
      return;
    if (a.constructor.name != "Position")
      a = API.getObj(a);
    if (b.constructor.name != "Position")
      b = API.getObj(b);
    if (a === undefined || b === undefined)
      return;
    return getDir(a.getPos(), b.getPos());    
  }
  
  global.BestimmePosition = function(obj) {
    if (API.staticPlayerId == undefined)
      return;
    obj = API.getObj(obj);
    if (obj === undefined || !("getPos" in obj))
      return undefined;
    return new Position(obj.getPos());
  }
  
  global.LasseZuckerFallen = function() {
    if (API.staticPlayerId == undefined)
      return;
    API.curAnt.addDropJob();
  }
  
  global.FühreAus = function(f) {
    if (API.staticPlayerId == undefined)
      return;
    API.curAnt.addCustomJob(f);
  }
  
  global.BringeApfelZuBau = function(obj) {
    if (API.staticPlayerId == undefined)
      return;
    var apple = API.getObj(obj);
    API.curAnt.addAppleJob(apple);
    API.curAnt.goToHome();
  }
  
  global.BrauchtNochTräger = function(obj) {
    if (API.staticPlayerId == undefined)
      return;
    var apple = API.getObj(obj);
    return apple.needHelp(API.curAnt);
  }
  
  global.Merke = function(key, val) {
    if (API.staticPlayerId == undefined)
      return;
    var akey = API.curAnt.getKey();
    if (!(akey in Sim.memories)) {
      Sim.memories[akey] = {};
    }
    Sim.memories[akey][key] = val;
  }
  
  global.HatErinnerung = function(key) {
    if (API.staticPlayerId == undefined)
      return;
    var akey = API.curAnt.getKey();
    if (akey in Sim.memories) {
      return key in Sim.memories[akey];
    }
    return false;
  }
  
  global.Erinnere = function(key) {
    if (API.staticPlayerId == undefined)
      return;
    var akey = API.curAnt.getKey();
    if (akey in Sim.memories) {
      return Sim.memories[akey][key];
    }
    return undefined;
  }
  
  global.Vergesse = function(key) {
    if (API.staticPlayerId == undefined)
      return;
    var akey = API.curAnt.getKey();
    if (akey in Sim.memories && key in Sim.memories[akey]) {
      delete Sim.memories[akey][key];
    }    
  }

  // vor debugging purposes
  global.Sim = Sim;
  global.Vw = vw;



  // export chain
  am._sim = Sim;


})(AntMe._vw, AntMe._optionen, window, AntMe);
