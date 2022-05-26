import * as FN from "./HTMLfunctions.js";
import unitDirectionSketch from "./sketch.js";
import { language, langs } from "./languageContent.js";

//language selector insertion and setup
FN.languageSelector();

//speed of light in the correct locale format
document.getElementById("speedOfLight").innerHTML = (299792458).toLocaleString(FN.getLang());

//ELECTRIC FIELD: INSERT PREFIX SELECTION OBJECT, CONFIGURE PSEUDORANDOM BUTTON, AND INSERT THE UNIT DIRECTION SKETCH
FN.insertPrefSelect("EFMpref");
FN.pRndButton("EFMprBtn", "EFM", "selEFMpref", 0, 10);
new unitDirectionSketch("cEF");

//MAGNETIC FIELD: INSERT PREFIX SELECTION OBJECT, CONFIGURE PSEUDORANDOM BUTTON, AND INSERT THE UNIT DIRECTION SKETCH
FN.insertPrefSelect("MFMpref");
FN.pRndButton("MFMprBtn", "MFM", "selMFMpref", 0, 10);
new unitDirectionSketch("cMF");

//INERTIAL MASS: INSER PREFIX SELECTION OBJECT AND CONFIGURE PSEUDORANDOM BUTTON
FN.insertPrefSelect("IMpref");
FN.pRndButton("IMprBtn", "IM", "selIMpref", 0, 10);

//ELECTRIC CHARGE: INSER PREFIX SELECTION OBJECT AND CONFIGURE PSEUDORANDOM BUTTON
FN.insertPrefSelect("EChpref");
FN.pRndButton("EChprBtn", "ECH", "selEChpref", -10, 10);

//PRESET (DEFAULT) PARTICLES: CREATE THE SELECTION OBJECT AND ACTIVATE THE SELECTION ACTION TO FILL MASS AND CHARGE INPUTS
FN.populateParticles("loadPresetPart");
FN.presetParticle("loadPresetPart", "IM", "IMpref", "ECH", "EChpref", "EChU");

//INITIAL VELOCITY: CONFIGURE PSEUDORANDOM BUTTON AND INSERT THE UNIT DIRECTION SKETCH
FN.pRndButton("IVprBtn", "initSpeedFr", null, 0, 1);
new unitDirectionSketch("cIV");

//SAVE BUTTON
FN.saveButton("svBtn");

//LANGUAGE SETTING; RUN AFTER ALL THE ELEMENTS OF THE FIRST PART LOAD
let langsList = Object.keys(langs), lan = document.getElementById("langSwitch");
let userLang = window.navigator.language.slice(0, 2);
if ( langsList.includes(userLang) )
{
  lan.value = userLang;
  FN.waitForElm("cIVinputPhi").then( async function() { lan.dispatchEvent (new Event("change")); } );
}

//ADD / HIDE BOOST RAPIDITY SKETCH IF "ANIMATION CUSTOM FRAME" CHECKBOX IS CHECKED / UNCHECKED
FN.pRndButton("CBprBtn", "cstmBoostFr", null, 0, 1); //PSEUDORANDOM RAPIDITY BUTTON
const waitBoostSketch = await FN.waitForElm("cCB"); //WAIT UNTIL SKETCH CONTAINER LOADS

let cstmBoostCB = document.getElementById("includeCstmFrame");
let cstmBoostDIV = document.getElementById("cstmBoostDIV");
let isThereAlreadyTheBoostSketch = false;

cstmBoostCB.addEventListener( "change", () =>
{
  if (cstmBoostCB.checked)
  {
    if (window.matchMedia("(orientation: landscape)").matches) { document.getElementById("animFeatDiv").style.width = "46.875%"; }
    cstmBoostDIV.style.display = "block"; //show canvas
    if (!isThereAlreadyTheBoostSketch)
    {
      new unitDirectionSketch("cCB");
      isThereAlreadyTheBoostSketch = true;
    } //add sketch
  }
  else if (!cstmBoostCB.checked)
  {
    document.getElementById("animFeatDiv").style.width = "auto";
    //document.getElementById("cCB").innerHTML = ""; //remove sketch
    cstmBoostDIV.style.display = "none"; //hide canvas
  }
} );
