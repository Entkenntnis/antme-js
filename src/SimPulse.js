

// START OF simulation pulsing: start, stop, interval, end

(function (am, vw, Sim, Optionen) {
  "use strict";
  
  var SimPulse = {
      running : false
    , startTime : undefined
    , simulationFps : Optionen.TicksProSekunde
    , simStatus : undefined
    
    , init:function(){
      // call this to start simulation
      SimPulse.simStatus = document.createElement("DIV");
      document.getElementById("hud").appendChild(SimPulse.simStatus);
      
      SimPulse.needsRedraw = true;
      SimPulse.running = true;
      SimPulse.fpsInterval = 1000.0 / SimPulse.simulationFps;
      Sim.cycles = 0;
      Sim.init();
      SimPulse.startTime = Date.now();
      SimPulse.tick();
    }
    
    , tick:function(){
      if (Sim.cycles >= Optionen.Runden) {
        SimPulse.end();
        return;
      }
      var elapsedTime = Date.now() - SimPulse.startTime;
      var targetCycle = elapsedTime / 1000 * SimPulse.simulationFps;
      var skippedFrames = 0;
      while(Sim.cycles < targetCycle && skippedFrames < Optionen.MaximalÜbersprungeneFrames){
        Sim.update();
        var runState = Math.round(Sim.cycles / Optionen.Runden * 100);
        SimPulse.simStatus.innerHTML = "Fortschritt: " + runState + "%";
        Sim.cycles++;
        skippedFrames++;
        vw.needsRedraw = true;
      }
      if (skippedFrames >= Optionen.MaximalÜbersprungeneFrames) {
        SimPulse.startTime = Date.now() - (Sim.cycles / SimPulse.simulationFps * 1000);
      }
      if (SimPulse.running) {
        setTimeout(SimPulse.tick,2);
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
  delete am._sim;
  delete am._optionen;

})(AntMe, AntMe._vw, AntMe._sim, AntMe._optionen);
