"use strict";

// File 2: exports SimOpts with static parameters

// TONS OF options to tune

(function(am){
  
  var SimOpts = {
      PlayGroundAspect : 4.0/3.0
    , PlayGroundBaseSize: 550000
    , PlayGroundSizePlayerMultiplier : 1
    , AntHillRadius : 32
    , BattleRange : 5
    , SimulationCycles : 5000
    , playerColors : [0xff0000, 0x00ff00, 0x0000ff, 0x00ffff]
    , SugarAmount : 1000
    , Sugar1Scale : 5000
    , AppleRespawnDelay : 25
    , SugarRespawnDelay : 25
    , AntRespawnDelay : 15
    , BugRespawnDelay : 15
    , BugEnergy : 1000
    , BugAttack : 50
    , BugRotationSpeed : 3
    , BugSpeed : 3
    , BugRadius : 4
    , BugRegenerationValue : 1
    , BugRegenerationDelay : 5
    , AntEnergy : {"-1":50,"0":100,"1":175,"2":250}
    , AntRotationSpeed : {"-1":6,"0":8,"1":12,"2":16}
    , AntSpeed : {"-1":3,"0":4,"1":5,"2":6}
    , AntViewRange : {"-1":45,"0":300,"1":75,"2":90}
    , AntLoad : {"-1":4, "0":5, "1":7, "2":10}
    , AntRange : 3000
  }
  
  //export
  am._simOpts = SimOpts
})(AntMe);
