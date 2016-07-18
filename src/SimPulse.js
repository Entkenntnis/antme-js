"use strict";

// START OF simulation pulsing: start, stop, interval, end

(function(am, vw, Sim, Optionen){

  var SimPulse = {
      running : false
    , nextTickTime : undefined
    , simulationFps : 60.0
    , fpsInterval : undefined
    , needsRedraw : false
    , cycles : 0
    , simStatus : undefined
    
    , init:function(){
      // call this to start simulation
      SimPulse.simStatus = document.createElement("DIV");
      document.getElementById("hud").appendChild(SimPulse.simStatus);
      
      SimPulse.needsRedraw = true;
      SimPulse.running = true;
      SimPulse.fpsInterval = 1000.0 / SimPulse.simulationFps;
      SimPulse.cycles = 0;
      Sim.init();
      SimPulse.nextTickTime = Date.now() + SimPulse.simulationFps;
      SimPulse.tick();
    }
    
    , tick:function(){
      if (SimPulse.cycles >= Optionen.Runden) {
        SimPulse.end();
        return;
      }
      Sim.update();
      var runState = Math.round(SimPulse.cycles / Optionen.Runden * 100);
      SimPulse.simStatus.innerHTML = "Fortschritt: " + runState + "%";
      SimPulse.cycles++;
      vw.needsRedraw = true;
      if (SimPulse.running) {
        // make sure we are really running the right fps
        var curTime = Date.now();
        var diff = SimPulse.nextTickTime - curTime;
        var interval = SimPulse.fpsInterval + diff;
        if (interval < 0) interval = 0;
        SimPulse.nextTickTime = curTime + SimPulse.fpsInterval;
        setTimeout(SimPulse.tick,interval);
      }
    }
    
    , end:function(){
      SimPulse.running = false;
      SimPulse.simStatus.innerHTML = "beendet";
    }
  }
  
  vw.onExtLoad = SimPulse.init;
  
  
  // FINAL PLACE TO SEAL
  delete am._vw;
  //delete am._sim;
  delete am._optionen;

})(AntMe, AntMe._vw, AntMe._sim, AntMe._optionen);
