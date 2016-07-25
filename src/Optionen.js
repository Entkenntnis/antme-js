// File 2: exports SimOpts with static parameters

// TONS OF options to tune

(function(am){
  "use strict";
  
 var Optionen = {
      MaximaleSpieler : 8
    , Runden : 7000
    , SpielfeldVerhältnis : 4.0/3.0
    , SpielfeldGrundGröße : 550000
    , HügelAbstand : 500
    , HügelRandAbstand : 200
    , HügelStreifenBreite : 100
    , EckenAbstand : 300
    , HügelRadius : 40
    , BauErreichtRadius : 10
    , SpielerFarben : [0xff0000, 0x00ff00, 0x0000ff, 0x00ffff,
                       0xffff00, 0xff00ff, 0xffffff, 0x000000]
    , ZuckerGröße : 250
    , ZuckerVergrößerung : 0.1
    , NahrungMindestEntfernung : 300
    , NahrungMaximalEntfernung : 50000
    , NahrungAbstand : 200
    , NahrungsZentrierung : 2
    , ZuckerWartezeit : 150
    , ZuckerProSpieler : 1.5
    , AmeiseWartezeit : 30
    , AmeisenMaximum : 100
    , AmeiseGeschwindigkeit : 4
    , AmeiseDrehgeschwindigkeit : 8
    , AmeiseSichtweite : 70
    , AmeiseTragkraft : 5
    , PunkteProZucker : 5
    , ZuckerVerlangsamung : 0.75
    , TicksProSekunde : 40
    , MaximalÜbersprungeneFrames : 10
    , ApfelWartezeit : 225
    , ÄpfelProSpieler : 1
    , AmeisenFürApfel : 4
    , MaximumAmeisenFürApfel : 20
    , ApfelMinGeschwindigkeit : 0.2
    , ApfelMaxGeschwindigkeit : 1.0
    , ApfelRadius : 10
    , PunkteProApfel : 1000
    , AnfangsEnergie : 4000
    , EnergieFürAmeise : 200
    , EnergieProApfel : 2000
    , EnergieProZucker : 10
    , AmeisenReichweite : 3000
    , WanzenProSpieler : 1
    , WanzenWartezeit : 300
    , AmeisenEnergie : 60
    , WanzenKampfweite : 12
    , WanzenAngriff : 10
    , WanzeDrehgeschwindigkeit : 3
    , WanzeGeschwindigkeit : 1
    , WanzeSichtweite : 30
    , WanzenHügelAbstand : 250
    , ZufallRichtungsVerschiebung : 11
    , EntwicklerModus : true
  }
 
  //export
  am._optionen = Optionen;
})(AntMe);
