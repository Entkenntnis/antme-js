"use strict";

// encapsulate our project
(function(vw, SimOpts, global, am){
  
  
  // FINALLY THE real deal
    
    // PLAYER
  function Player(id, ant){
    this.id = id;
    this.ant = ant;
    this.points = 0;
  }

    // HILL
  function Hill(pos, playerid){
    this.pos = pos;
    this.playerid = playerid;
    this.key = playerid;
    var hill = vw.hillStore.get(this.key);
    vw.setHillFlagColor(hill, SimOpts.playerColors[playerid]);
    this.updatePos();
  }

  Hill.prototype.updatePos = function(){
    vw.hillStore.get(this.key).position.copy(Sim.toViewPosition(this.pos));
  }

    // ANT
  var antIndexCounter = 0;
  function Ant(pos, playerid){
    this.playerid = playerid
    this.pos = pos
    this.id = antIndexCounter++;
    this.key = playerid + ':' + this.id
    this.energy = this.Antenergy;
    this.destination = undefined;//{x:1000,y:1000};
    this.distance = 0;
    this.rotation = 0;
    this.destinationObj = undefined;
    this.bearing = 0;
    this.Antenergy = SimOpts.AntEnergy[0];
    this.viewRange = SimOpts.AntViewRange[0];
    this.rotationSpeed = SimOpts.AntRotationSpeed[0];
    this.maxLoad = SimOpts.AntLoad[0];
    this.lap = 0;
    this.tired = false;
    this.maxSpeed = SimOpts.AntSpeed[0];
    this.speed = this.maxSpeed;
    this.heading = Math.random()*360;
    var ant = vw.antStore.get(this.key);
    vw.setAntBodyColor(ant, SimOpts.playerColors[this.playerid]);
    this.updatePos();
  }

  Ant.prototype.updatePos = function(){
    vw.antStore.get(this.key).position.copy(Sim.toViewPosition(this.pos));
    vw.antStore.get(this.key).rotation.y = -this.heading / 180 * Math.PI + Math.PI;
    if (this.bearing > 0) {
      var sugar = vw.sugarBoxStore.get(this.key);
      sugar.position.copy(vw.antStore.get(this.key).position);
      sugar.position.y = 3;
    } else if (vw.sugarBoxStore.has(this.key)) {
      vw.sugarBoxStore.remove(this.key);
    }
  }

    // SUGAR
  var sugarIndexCounter = 0;
  function Sugar(pos){
    this.amount = SimOpts.SugarAmount;
    this.pos = pos;
    this.key = sugarIndexCounter++;
    this.updatePos();
    this.updateScale();
  }

  Sugar.prototype.updatePos = function(){
    vw.sugarStore.get(this.key).position.copy(Sim.toViewPosition(this.pos));
  }

  Sugar.prototype.updateScale = function(){
    var scale = this.amount / SimOpts.Sugar1Scale;
    scale = Math.max(Math.pow(scale, 1/3.0), 0.000001);
    vw.sugarStore.get(this.key).scale.set(scale, scale, scale);
  }

    // APPLE
  var appleIndexCounter = 0;
  function Apple(pos){
    this.pos = pos;
    this.key = appleIndexCounter++;
    this.carries = [];
    this.updatePos();
  }

  Apple.prototype.updatePos = function(){
    vw.appleStore.get(this.key).position.copy(Sim.toViewPosition(this.pos));
  }

    // BUG
  var bugIndexCounter = 0;
  function Bug(pos){
    this.pos = pos;
    this.key = bugIndexCounter++;
    this.energy = SimOpts.BugEnergy;
    this.rotation = 0;
    this.distance = 0;
    this.energy = SimOpts.BugEnergy;
    this.heading = Math.round(Math.random()*360.0);
    this.fighting = false;
    this.moving = false;
    this.delay = 0;
    this.updatePos();
  }

  Bug.prototype.updatePos = function(){
    vw.bugStore.get(this.key).position.copy(Sim.toViewPosition(this.pos));
    vw.bugStore.get(this.key).rotation.y = -this.heading / 180 * Math.PI + Math.PI;
  }


  // here everything comes together

  var Sim = {
      players : []
    , playerCount : undefined
    , playgroundWidth : undefined
    , playgroundHeight : undefined  
    , nextAnt : undefined
    , nextSugar : undefined
    , nextApple : undefined
    , nextBug : undefined
    , ants : []
    , sugars : []
    , apples : []
    , hills : []
    , bugs : []
    , spawnAnt(playerid){
      var pos = Sim.hills[playerid].pos;
      var degree = Math.random()*Math.PI*2;
      var xc = pos.x + Math.sin(degree)*SimOpts.AntHillRadius*1.2;
      var yc = pos.y + Math.cos(degree)*SimOpts.AntHillRadius*1.2;
      Sim.ants.push(new Ant({x:xc,y:yc}, playerid));
    }
    
    , toViewPosition(pos){
      return new THREE.Vector3(pos.x-Sim.playgroundWidth/2.0, 0, pos.y-Sim.playgroundHeight/2.0);
    }
    
    , randomPos(){
      return {
        x:Math.random()*Sim.playgroundWidth,
        y:Math.random()*Sim.playgroundHeight};
    }
    
    , getHillPos:function(){
      var pos;
      var limit = 100;
      while(limit > 0) {
        pos = Sim.randomPos();
        if (pos.x < 50 || pos.y < 50)
          continue;
        if (Sim.playgroundWidth - pos.x < 50 || Sim.playgroundHeight - pos.y < 50)
          continue;
        var isGood = true;
        for(var i = 0; i < Sim.hills.length; i++) {
          var distance = Sim.getDistanceSq(Sim.hills[i].pos, pos);
          if (distance < 300*300) {
            isGood = false;
          }
        }
        if (!isGood) continue;
        return pos;
      }
      return pos;
    }
    
    , getGoodyPos:function(){
      var pos;
      var limit = 100;
      while (limit > 0) {
        pos = Sim.randomPos();
        if (!Sim.isInBound(pos,50))
          continue;
        var toNear = false;
        var atLeastNear = false;
        for(var i = 0; i < Sim.hills.length; i++) {
          var distance = Sim.getDistanceSq(Sim.hills[i].pos,pos);
          if (distance < 300*300) {
            toNear = true;
          }
          if (distance < 1500*1500) {
            atLeastNear = true;
          }
        }
        if (toNear) continue;
        if (!atLeastNear) continue;
        toNear = false;
        var checkDist = function(obj){
          var distance = Sim.getDistanceSq(obj.pos, pos);
          if (distance < 150 * 150) {
            toNear = true;
          }
        };
        Sim.apples.forEach(checkDist);
        Sim.sugars.forEach(checkDist);
        if (toNear) continue;
        return pos;
      }
      return pos;
    }
    
    , getDistanceSq:function(a,b){
      return Math.pow(a.x-b.x,2) + Math.pow(a.y-b.y,2);
    }
    
    , isInBound:function(pos, margin){
      if (margin == undefined)
        margin = 0;
      if (pos.x < margin || pos.y < margin)
          return false;
      if (Sim.playgroundWidth - pos.x < margin || Sim.playgroundHeight - pos.y < margin)
        return false;
      return true;
    }
    
    , rotateObj:function(obj, speed){
      if (obj.rotation < speed) {
        obj.heading += obj.rotation;
        obj.rotation = 0;
        obj.updatePos();
      } else {
        var diff = speed * Math.sign(obj.rotation);
        obj.heading += diff;
        obj.rotation -= diff;
      }
      obj.updatePos();
    }
    
    , moveObj:function(obj, speed){
      var toMove;
      if (obj.distance < speed) {
        toMove = obj.distance;
        obj.distance = 0;
      } else {
        obj.distance -= speed;
        toMove = speed;
      }
      var oldx = obj.pos.x;
      var oldy = obj.pos.y;
      obj.pos.x += toMove*Math.cos(obj.heading/180*Math.PI);
      obj.pos.y += toMove*Math.sin(obj.heading/180*Math.PI);
      if (!Sim.isInBound(obj.pos, 4)){
        obj.pos.x=oldx;obj.pos.y=oldy;
        obj.rotation = 100 + Math.random()*80;
        if ("moving" in obj)
          obj.moving = true;
      }
      if ("lap" in obj)
        obj.lap += toMove;
      obj.updatePos();
    }
    
    , moveBug:function(bug){
      if (!bug.fighting) {
        if (bug.moving) {
          if (bug.rotation != 0) {
            Sim.rotateObj(bug, SimOpts.BugRotationSpeed);
            return;
          }
          else if (bug.distance != 0) {
            Sim.moveObj(bug, SimOpts.BugSpeed);
            return;
          } else {
            bug.moving = false;
            bug.delay = 10;
          }
        } else {
          if (bug.delay-- <= 0) {
            if (Sim.objsNear(bug.pos, 4, Sim.ants).length > 0) {
              bug.fighting = true;
            } else {
              bug.moving = true;
              bug.rotation = Math.round(Math.random()*180-90);
              bug.distance = 100;
            }
          }
        }            
      }
    }
    
    , objsNear(pos, range, arr){
      var result = [];
      arr.forEach(function(obj){
        var dis = Sim.getDistanceSq(pos, obj.pos);
        if (dis <= range*range) {
          result.push(obj);
        }
      });
      return result;
    }
    
    , headTo(obj, des){
      var dis = Math.sqrt(Sim.getDistanceSq(des, obj.pos));
      var dx = des.x - obj.pos.x;
      var angle = obj.heading;
      if (des.y < obj.pos.y) {
        angle = (360-Math.acos(dx/dis)/Math.PI*180.0)%360;
      } else {
        angle = (Math.acos(dx/dis)/Math.PI*180.0)%360;
      }
      obj.rotation = angle - (obj.heading%360);
      if (obj.rotation > 180) {
        obj.rotation -= 360;
      }
      if (obj.rotation < -180) {
        obj.rotation += 360;
      }
      obj.distance = Math.min(50, dis);
    }
    
    
    
    , init:function(){ //# Phase 1 (Initialisierung)
      
      //# Rahmenparameter für die Simulation wird ermittelt (Siehe Einstellunge)
      Sim.playerCount = antMe.ants.length;
      Sim.nextAnt = SimOpts.AntRespawnDelay;
      Sim.nextSugar = SimOpts.SugarRespawnDelay;
      Sim.nextApple = SimOpts.AppleRespawnDelay;
      Sim.nextBug = SimOpts.BugRespawnDelay;
      
      //# Spielfeldgröße wird ermittelt (Abhängig von Spielerzahl)
      var area = (1 + (Sim.playerCount * SimOpts.PlayGroundSizePlayerMultiplier)) * SimOpts.PlayGroundBaseSize;
      Sim.playgroundWidth = Math.round(Math.sqrt(area * SimOpts.PlayGroundAspect));
      Sim.playgroundHeight = Math.round(Math.sqrt(area / SimOpts.PlayGroundAspect));
    
      vw.gamefloor.geometry = new THREE.PlaneGeometry(Sim.playgroundWidth, Sim.playgroundHeight, 1, 1);
      vw.gamefloor.geometry.verticesNeedUpdate = true;
    
      //# Für jeden Spieleer wird die Position des Ameisenhügels per Zufall bestimmt
      for(var i = 0; i < antMe.ants.length; i++){
        Sim.players.push(new Player(i, antMe.ants[i]));
        Sim.hills.push(new Hill(Sim.getHillPos(), i));
      }
      
    }
    
    , update:function(){ //# Phase 2 (Rundenberechnung)
      //# Verarbeitung der Nahrungsmittel
      
        //## Leere Zuckerhügel wegräumen: Bedingung ist hier,
        //   dass die Menge des Zuckers 0 ist
        
        // cool stackoverflower
        Array.prototype.removeIf = function(callback) {
            var i = this.length;
            while (i--) {
                if (callback(this[i], i)) {
                    this.splice(i, 1);
                }
            }
        };
        Sim.sugars.removeIf(function(obj){
          if (obj.amount <= 0) {
            vw.sugarStore.remove(obj.key);
            return true;
          } else {
            return false;
          }
        });
        
        //## Neue Zuckerhügel erzeugen: Es wird geprüft, ob die Gesamtzahl der
        //   Zuckerberge groß genug ist(?) und die Respawn-Wartezeit abgewartet
        //   wurde. Wird ein neuer Berg erstellt, wird die Position per Zufall
        //   bestimmt und seine Menge wird durch den Standardwert der
        //   Einstellungen bestimmt
        if (Sim.nextSugar-- <= 0 && Sim.sugars.length < Sim.playerCount+2){
          Sim.nextSugar = SimOpts.SugarRespawnDelay;
          Sim.sugars.push(new Sugar(Sim.getGoodyPos()));
        }
        
        //## Neue Äpfel erzeugen ...
        if (Sim.nextApple-- <= 0 && Sim.apples.length < Sim.playerCount*2 + 1){
          Sim.nextApple = SimOpts.AppleRespawnDelay;
          Sim.apples.push(new Apple(Sim.getGoodyPos()));
        }
    
      //# Wanzenbewegung
      
        //## Falls eine Wanze im Kampf verwickelt: Angriffspunkte auf beteiligte
        //   Gegner verteilen. Betroffene Ameisen erhalten einen Aufruf auf
        //   WirdAngegriffen(Wanze)
        Sim.bugs.forEach(function(bug){
          if (bug.fighting) {
            var bugAttackedAnts = Sim.objsNear(bug.pos, 4, Sim.ants);
            if (bugAttackedAnts.length == 0) {
              bug.fighting = false;
            } else {
              bugAttackedAnts.forEach(function(ant){
                ant.energy -= SimOpts.BugAttack / bugAttackedAnts.length;
              });
            }
          }
        });
        // CALL: WirdAngegriffen(Wanze)
        
        
        //## Kein Kampf: Wanzen bewegen sich zufällig auf dem Spielfeld
        Sim.bugs.forEach(Sim.moveBug);
        
      //# Ameisen (Berechnung hier nicht Teamweise, sondern pro Ameise, wie sie kommen
      Sim.ants.forEach(function(ant){
        
        //## Ermitteln der ganzen UmgebungsInformationen (wie AnzahlAmeisenInSichtweise)
        global.AktuelleLast = ant.bearing;
        // CALL setParameter
        
        //## Ameisenbewegung
        if (ant.destination != undefined && ant.rotation == 0 && ant.distance == 0) {
          ant.destination = ant.destinationObj.pos;
          Sim.headTo(ant, ant.destination);
        }
        if (ant.rotation != 0) {
          Sim.rotateObj(ant, ant.rotationSpeed); // Restdrehung
        } else if (ant.distance != 0) {
          Sim.moveObj(ant, ant.speed); // Restwinkel
        }
        
        //## Prüfung der zurücgelegten Strecke
          
          //### Ameisen verhugern, wenn die maximale Reichweite überschritten wurde.
          //    Es wird IstGestorben aufgerufen
          if (ant.lap > SimOpts.AntRange) {
            ant.energy = 0;
          } else if (ant.lap > SimOpts.AntRange * 1/3.0) {
            ant.tired = true;
          }
          
          //### WirdMüde wird aufgerufen, wenn ein Drittel der Reichweite erreich wurde.
          // CALL: WirdMüde
          
        //## Sichtungen
        var bugs = Sim.objsNear(ant.pos, ant.viewRange, Sim.bugs);
        if (bugs.length > 0) {
          for(var i = 0; i < bugs.length; i++) {
            if (ant.destinationObj != undefined && ant.destinationObj.key == bugs[i].key) {
              continue;
            }
            antMe.callUserFunc(ant, "SiehtWanze", bugs[i]);
            break;
          }
        }
        var ants = Sim.objsNear(ant.pos, ant.viewRange, Sim.ants);
        var enemy = ant.destinationObj;
        var friend = ant.destinationObj;
        for(var i = 0; i < ants.length; i++) {
          if (enemy != false) {
            if (enemy != undefined && enemy.key == ants[i].key) {
            } else {
              antMe.callUserFunc(ant, "SiehtFeind", ants[i]);
              enemy = false;
            }
          }
          if (friend != false){
            if (friend != undefined && friend.key == ants[i].key){}else{
              antMe.callUserFunc(ant, "SiehtFreund", ants[i]);
              friend = false;
            }
          }
        }
        
           // CALL: lalal
       
        //## Kampfabwicklung
          //Ameisen kämpfen nicht!
          
        // kampf kann noch etwas warten
        
        
        //## Zielprüfung (Ameise prüft, ob sie das angestrebte Ziel erreich hat)
          if (ant.destination != undefined) {
            var distance = Math.sqrt(Sim.getDistanceSq(ant.pos, ant.destinationObj.pos));
            if (distance < 2) {
              // angekommen
              var dest = ant.destinationObj;
              ant.destination = undefined;
              ant.destinationObj = undefined;
              if (dest instanceof Hill) {
                ant.tired = false;
                ant.energy = ant.AntEnergy;
                Sim.players[ant.playerid].points += ant.bearing;
                ant.bearing = 0;
                ant.heading += 180;
              } else if (dest instanceof Sugar && dest.amount > 0) {
                antMe.callUserFunc(ant, "ZuckerErreicht", dest);
              } else if (dest instanceof Apple) {
                antMe.callUserFunc(ant, "ObstErreicht", dest);
                
              }
            }
            
          }
          
        //## Sichtungen
        var sugar = Sim.objsNear(ant.pos, ant.viewRange, Sim.sugars);
        if (sugar.length > 0 && ant.destination == undefined) {
          antMe.callUserFunc(ant, "SiehtZucker", sugar[0])
        }
        
        var apple = Sim.objsNear(ant.pos, ant.viewRange, Sim.apples);
        if (apple.length > 0 && ant.destination == undefined){
          antMe.callUserFunc(ant, "SiehtObst", apple[0]);
        }
          
          
        //## Untätigkeit
        if (ant.destination == undefined && ant.distance == 0 && ant.rotation == 0) {
          antMe.callUserFunc(ant, "Wartet");
        }
        
      });
      
        
        
      //# Tote Ameisen werden vom Spielfeld entfernt
      Sim.ants.removeIf(function(ant){
        if (ant.energy <= 0) {
          vw.antStore.remove(ant.key);
          if (vw.sugarBoxStore.has(ant.key)) {
            vw.sugarBoxStore.remove(ant.key);
          }
          return true;
        } else
          return false;
      });  
        
        
      //# Entferne Apfel wenn nahe genug am Bau
      Sim.apples.removeIf(function(apple){
        if (apple.carries.length > 0) {
          var pid = apple.carries[0].playerid;
          var hillpos = Sim.hills[pid].pos;
          var distance = Math.sqrt(Sim.getDistanceSq(hillpos, apple.pos));
          if (distance < SimOpts.AntHillRadius) {
            Sim.players[pid].points += 125;
            vw.appleStore.remove(apple.key);
            apple.carries.forEach(function(c){
              c.load = 0;
              c.destination = undefined;
            });
            return true;
          }
        }
        return false;
      });
        
      //# Bewege Apfel/Ameisen Cluster
      Sim.apples.forEach(function(apple){
        if (apple.carries.length > 0) {
          var sumx = 0, sumy = 0;
          apple.carries.forEach(function(c){
            sumx += c.pos.x;
            sumy += c.pos.y;
          });
          sumx /= apple.carries.length;
          sumy /= apple.carries.length;
          var adx = sumx - apple.pos.x;
          var ady = sumy - apple.pos.y;
          var length = Math.sqrt(Sim.getDistanceSq({x:sumx,y:sumy}, apple.pos));
          
          var maxSpeed = apple.carries[0].maxSpeed / 2;
          if (apple.carries.length < 6) {
            maxSpeed = maxSpeed / 6 * apple.carries.length;
          }
          var scale = 1;
          if (length > maxSpeed) {
            scale = maxSpeed/length;
          }        
                    
          apple.pos.x += adx*scale;
          apple.pos.y += ady*scale;
          sumx = apple.pos.x;
          sumy = apple.pos.y;
          apple.updatePos();
          apple.carries.forEach(function(c){
            var dx = c.pos.x - sumx;
            var dy = c.pos.y - sumy;
            var length = Math.sqrt(Sim.getDistanceSq({x:sumx,y:sumy},c.pos));
            if (length > 6) {
              var scale = 6/length;
              c.pos.x = sumx + dx*scale;
              c.pos.y = sumy + dy*scale;
              c.rotation = 0;
              c.distance = 0;
              c.updatePos();
            }
          });
        }
      });
        
        
        
        
        
        
        //---------------------------
    
      if (Sim.nextAnt-- <= 0) {
        Sim.nextAnt = SimOpts.AntRespawnDelay;
        for(var i = 0; i < Sim.playerCount; i++) {
          //if (Sim.ants.length == 0)
            Sim.spawnAnt(i);
        }
      }
      if (Sim.nextBug-- <= 0 && Sim.bugs.length < Sim.playerCount+1) {
        Sim.nextBug = SimOpts.BugRespawnDelay;
        Sim.bugs.push(new Bug(Sim.getHillPos()));
      }
    }
  }

  var antMe = {
      ants : []
    , staticPlayerId : undefined
    , curAnt : undefined
    , objStore : []
    , objCounter : 0
    , addAnt:function(ant){
      antMe.ants.push(ant);
    }
    
    , callUserFunc:function(ant, func, arg){
      func = Sim.players[ant.playerid].ant[func];
      if (arg == undefined)
        arg = [];
      if (func == undefined)
        return;
      antMe.staticPlayerId = ant.playerid;
      antMe.curAnt = ant;
      func.bind(antMe.pushObj(ant))(antMe.pushObj(arg));
      antMe.staticPlayerId = undefined
    }
    
    , pushObj:function(obj){
      var index = antMe.objStore.indexOf(obj);
      if (index >= 0)
        return index;
      var id = antMe.objCounter++;
      antMe.objStore.push(obj);
      return id;
    }
    
    , getObj:function(id){
      return antMe.objStore[id];
    }
  }
    
  am.AmeiseLaden = antMe.addAnt;
  
  // user wrapper
  global.GeheGeradeaus = function(distance){
    if (antMe.staticPlayerId == undefined)
      return;
    if (distance == undefined)
      distance = 100000;
    antMe.curAnt.distance = distance;
  };
  
  global.GeheZuZiel = function(pos){
    if (antMe.staticPlayerId == undefined)
      return;
    var obj = antMe.getObj(pos);
    if (!("pos" in obj))
      return;
    antMe.curAnt.destination = obj.pos;
    antMe.curAnt.destinationObj = obj;
    antMe.curAnt.distance = 0;
    antMe.curAnt.rotation = 0;
  }
  
  global.Nimm = function(obj){
    if (antMe.staticPlayerId == undefined)
      return;
      
    var ant = antMe.curAnt;
    var goody = antMe.getObj(obj);
    if (goody instanceof Sugar) {
      var sugar = goody;
      var hassugar = false;
      while(sugar.amount > 0 && ant.bearing < ant.maxLoad) {
        sugar.amount--;
        ant.bearing++;
        hassugar = true;
      }
      sugar.updateScale();
      return hassugar;
    } else if (goody instanceof Apple){
      var apple = goody;
      if (apple.carries.indexOf(ant) >= 0 ||
          (apple.carries.length > 0 && ant.playerid != apple.carries[0].playerid))
        return false;
      apple.carries.push(ant);
      console.log(apple.carries.length);
      ant.load = ant.maxLoad;
      return true;
    }
  } 
  
  global.GeheZuBau = function(){
    if (antMe.staticPlayerId == undefined)
      return;
    var ant = antMe.curAnt;
    ant.destination = Sim.hills[ant.playerid].pos;
    ant.destinationObj = Sim.hills[ant.playerid];
    antMe.curAnt.distance = 0;
    antMe.curAnt.rotation = 0;
  }
  
  global.BrauchtNochTräger = function(obst){
    if (antMe.staticPlayerId == undefined)
      return;
    var ant = antMe.curAnt;
    obst = antMe.getObj(obst);
    if (!(obst instanceof Apple))
      return;
    if (obst.carries.length == 0)
      return true;
    else if (obst.carries.length < 6 && ant.playerid == obst.carries[0].playerid)
      return true;
      
    return false;
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  // export
  am._sim = Sim;

})(AntMe._vw, AntMe._simOpts, window, AntMe);
