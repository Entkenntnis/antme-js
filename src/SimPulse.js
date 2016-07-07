
// START OF simulation pulsing: start, stop, interval, end

var SimPulse = {
    running : false
  , nextTickTime : undefined
  , simulationFps : 15.0
  , fpsInterval : undefined
  , needsRedraw : false
  , cycles : 0
  
  , init:function(){
    // call this to start simulation
    SimPulse.needsRedraw = true;
    SimPulse.running = true;
    SimPulse.fpsInterval = 1000.0 / SimPulse.simulationFps;
    SimPulse.cycles = 0;
    Sim.init();
    SimPulse.nextTickTime = Date.now() + SimPulse.simulationFps;
    SimPulse.tick();
  }
  
  , tick:function(){
    if (SimPulse.cycles >= SimOpts.SimulationCycles) {
      end();
      return;
    }
    Sim.update();
    SimPulse.cycles++;
    SimPulse.needsRedraw = true;
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
  }
}
