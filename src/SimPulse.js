

// START OF simulation pulsing: start, stop, interval, end

(function (am, vw, Sim, Optionen) {
  "use strict";
  
  var SimPulse = {
      running : false
    , startTime : undefined
    , simulationFps : Optionen.TicksProSekunde
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
      SimPulse.startTime = Date.now();
      SimPulse.tick();
    }
    
    , tick:function(){
      if (SimPulse.cycles >= Optionen.Runden) {
        SimPulse.end();
        return;
      }
      var elapsedTime = Date.now() - SimPulse.startTime;
      var targetCycle = elapsedTime / 1000 * SimPulse.simulationFps;
      var skippedFrames = 0;
      while(SimPulse.cycles < targetCycle && skippedFrames < Optionen.MaximalÜbersprungeneFrames){
        Sim.update();
        var runState = Math.round(SimPulse.cycles / Optionen.Runden * 100);
        SimPulse.simStatus.innerHTML = "Fortschritt: " + runState + "%";
        SimPulse.cycles++;
        skippedFrames++;
        vw.needsRedraw = true;
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
  //delete am._sim;
  delete am._optionen;

})(AntMe, AntMe._vw, AntMe._sim, AntMe._optionen);
