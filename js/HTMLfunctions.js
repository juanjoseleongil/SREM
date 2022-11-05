import {τ, sqrt2, c, e, TOL, signiFigM1, prefixes, particles, ptsPerCharTime} from "./RMCUEMFparams.js";
import * as LANG from "./languageContent.js";
import * as COMP from "./RMCUEMFcompute.js";
import unitDirectionSketch from "./sketch.js";
import * as SIM from "./simulTHREE.js";

// USER INPUT PLACEHOLDERS
let initInputs =
{
  EFM: [null, "cZeroToInf"],
  MFM: [null, "cZeroToInf"],
  cEFinputTheta: [null, "cZeroToOne"],
  cEFinputPhi: [null, null],
  cMFinputTheta: [null, "cZeroToOne"],
  cMFinputPhi: [null, null],
  selEFMpref: [null, null],
  selMFMpref: [null, null],
  selIMpref: [null, null],
  selEChpref: [null, null],
  EChUnits: [null, null],
  IM: [null, "oZeroToInf"],
  ECH: [null, "minfToInf"],
  x0: [null, "minfToInf"],
  y0: [null, "minfToInf"],
  z0: [null, "minfToInf"],
  initSpeedFr: [null, "cZeroToOne"],
  cIVinputTheta: [null, "cZeroToOne"],
  cIVinputPhi: [null, null]
};

let cstmBoostInputs =
{
  cstmBoostFr: [null, "cZeroToOne"],
  cCBinputTheta: [null, "cZeroToOne"],
  cCBinputPhi: [null, null]
};

export function getLang() { return document.documentElement.getAttribute("lang"); }

function numToFmtStr(num, decLength = signiFigM1)
{ return num.toLocaleString( getLang(), { style: "decimal", minimumFractionDigits: decLength, maximumFractionDigits: decLength } ); }

export function LANGdecSep() { return LANG.language[getLang()]["decSep"]; }

function prefixToPower(prefixString) { return Math.pow(10, parseInt(prefixString)); }

function angFracsToUV(thetaFr, phiFr)
{
  return [COMP.tfCos(τ * Number(phiFr)) * COMP.tfCos(τ * Number(thetaFr)),
          COMP.tfCos(τ * Number(phiFr)) * COMP.tfSin(τ * Number(thetaFr)),
          COMP.tfSin(τ * Number(phiFr))];
}

function UVtoAngFracs(UV) { return COMP.tfAngs(UV).map( ang => ang / τ); }

export function tripletString(compArr)
{ return `(${expNot(compArr[0])}` + `${LANGdecSep()}` + `${expNot(compArr[1])}` + `${LANGdecSep()}` + `${expNot(compArr[2])})`; }

function sIntToSS(sInt)
{// Convert signed integer to superscript string
  let out = "";
  let ssDigits = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
  let strSint = sInt.toString();
  let sIntLen = strSint.length;
  let splitSint = strSint.split("");
  if (splitSint[0] === "-") { out += "⁻"; splitSint.shift(); }
  for (const digit of splitSint) { out += ssDigits[parseInt(digit)]; }
  return out;
}

export function expNot(x, base = 10, basestr = "10", aap = signiFigM1)
{// Exponential notation: write x as " significand × baseᵉˣᵖᵒⁿᵉⁿᵗ "
  if ( !isFinite(x) || isNaN(x) ) { return x; }
  let X = Number(x), out = "";
  if (X < 0.0) { out += "-"; X *= -1.0; }
  if (Math.abs(X) == 0.0) { return numToFmtStr(0); }
  let logbx = Math.log(X) / Math.log(base);
  let exponent = Math.floor( logbx );
  if (exponent > -3 && exponent < 3) { return numToFmtStr(x, aap - exponent); }
  let significand = base**(logbx - exponent);
  let fs =  numToFmtStr(significand, aap);
  out += `${fs} × ${basestr}${sIntToSS(exponent)}`;
  return out;
}

function createObjectSelect(options, innerID, hiddenOpt)
{
  let content = [`<select id = "${innerID}" required>`];
  if (hiddenOpt != null) { content.push(hiddenOpt); }
  for (const [key, value] of Object.entries(options))
  { content.push(`<option value = "${key}"> ${value} </option>`); }
  content.push('</select>');
  let template = document.createElement("template");
  template.innerHTML = content.join("\n");
  return template;
}

function insertSelect(selectSpanID, objectArgs)
{
  let container = document.getElementById(selectSpanID);
  let selectObj = createObjectSelect(objectArgs[0], objectArgs[1], objectArgs[2]);
  let selectClone = selectObj.content.cloneNode(true);
  container.appendChild(selectClone);
}

function insertLangSelect()
{
  let hiddenOpt = '<option value = "" disabled selected class = "selLang">Select language</option>';
  insertSelect("langSpan", [LANG.langs, "langSwitch", hiddenOpt]);
}

export function insertPrefSelect(selectSpanID)
{
  let hiddenOpt = '<option value = "" disabled selected hidden class = "SIPref">Prefix</option>';
  insertSelect(selectSpanID, [prefixes, `sel${selectSpanID}`, hiddenOpt]);
}

export function languageSelector()
{
  insertLangSelect("langSpan");
  let language = LANG.language, siteContent = [], langs = Object.keys(LANG.langs);
  let lan = document.getElementById("langSpan").querySelector("#langSwitch");

  for (const lang0 of Object.entries(language[langs[0]]))
  { siteContent.push(lang0[0]); }

  //change language of elements when a selection is made
  lan.addEventListener( "change", function()
  {
    if (lan.value === "") { return; }
    document.documentElement.setAttribute("lang", lan.value);
    for (const elem of siteContent)
    {
      for (const item of document.querySelectorAll(`.${elem}`))
      {
        item.innerHTML = language[lan.value][elem];
      }
    }

    //change initial input placeholders according to language
    for (const [key, value] of Object.entries(initInputs))
    { if (!!document.getElementById(key) && value[1] != null)
      {document.getElementById(key).setAttribute("placeholder", language[lan.value][value[1]]); }
    }

    //change second part input placeholders according to language
    for (const [key, value] of Object.entries(cstmBoostInputs))
    { if (!!document.getElementById(key) && value[1] != null)
      { document.getElementById(key).setAttribute("placeholder", language[lan.value][value[1]]); }
    }

    //write the speed of light in vacuum according to the current language
    document.getElementById("speedOfLight").innerHTML = (299792458).toLocaleString(lan.value);
  });
}

export function populateParticles(presetPartID)
{
  let particleOpt = document.getElementById(presetPartID).querySelector("#presetPart");
  let options = [];
  for (const [key, value] of Object.entries(particles))
  {
    options.push(`<option value = "${key}" class = "${key}"> ${value[0]} </option>`);
  }
  particleOpt.innerHTML += options.join("\n");
}

export function presetParticle(presetPartID, inptMass, inptMassPref, inptCh, inptChPref, inptChU)
{
  let particleOpt = document.getElementById(presetPartID).querySelector("#presetPart");
  let mass = document.getElementById(inptMass);
  let massPref = document.getElementById(inptMassPref).querySelector(`#sel${inptMassPref}`);
  let ch = document.getElementById(inptCh);
  let chPref = document.getElementById(inptChPref).querySelector(`#sel${inptChPref}`);
  let chU = document.getElementById(inptChU).querySelector("#EChUnits");

  particleOpt.addEventListener( "change", function()
  {
    if (particleOpt.value === "none")
    {
      mass.value = "";
      massPref.selectedIndex = 0;
      ch.value = "";
      chPref.selectedIndex = 0;
      chU.selectedIndex = 0;
    }
    else
    {
      mass.value = particles[`${particleOpt.value}`][1][0];
      massPref.value = particles[`${particleOpt.value}`][1][1];
      ch.value = particles[`${particleOpt.value}`][2][0];
      chPref.value = particles[`${particleOpt.value}`][2][1];
      chU.value = particles[`${particleOpt.value}`][2][2];
    }
  }, false );
}

//2. This function also took a lot of time to put to work, but apparently it is not needed.
//function applyProgInput(inpt)
//{ //to recognize as user input when it is filled by the pr button. Adapted from StackOverflow
//  let descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(inpt), "value");
//  Object.defineProperty(inpt, "value",
//  {
//    set: function(t) { return descriptor.set.apply(this, arguments); },
//    get: function() { return descriptor.get.apply(this); },
//    configurable: true
//  });
//}

export function pRndButton(prBtnID, inputID, prefID, minv, maxv)
{
  let prBtn = document.getElementById(prBtnID);
  let inpt = document.getElementById(inputID);
  let prefx, items;
  //applyProgInput(inpt);
  prBtn.onclick = function()
    {
      inpt.value = ((maxv - minv) * Math.random() + minv).toPrecision(signiFigM1 + 1);

      if (prefID != null)
      {
        prefx = document.getElementById(`${prefID}`);
        items = prefx.getElementsByTagName("option");
        prefx.selectedIndex = Math.floor( (items.length - 1) * Math.random() + 1);
      }

      if (inputID === "ECH")
      {
        let units = document.getElementById("EChU").querySelector("#EChUnits");
        units.selectedIndex = Math.floor(2.0 * Math.random());
      }
    }
}


//3. No way. This function is also not necessary or not working.
export function waitForElm(selector)
{ //wait for elements to load; taken from stackOverflow
  return new Promise(resolve =>
  {
    if (document.getElementById(selector)) { return resolve(document.getElementById(selector)); }
    const observer = new MutationObserver(mutations =>
    {
      if (document.getElementById(selector))
      {
        resolve(document.getElementById(selector));
        observer.disconnect();
      }
    });
    observer.observe( document.body, { childList: true, subtree: true } );
  });
}

//1. This function was hard to put to work, but it seems it is not necessary. At least it was useful while debugging
//export async function waitinitInputs()
//{
//  let waiter;
//  for (var [key, val] of Object.entries(initInputs))
//  {
//    waiter = await waitForElm(key);
//    console.log(`element ${key} is ready`);
//  }
//}

async function checkinitInputs()
{
  let checker = true;
  for (var key of Object.keys(initInputs))
  { checker *= document.getElementById(key).checkValidity(); }
  if ( Boolean(checker) )
  {
    alert(LANG.language[getLang()]["giAlert"]);
    svBtn.disabled = false;
    continueAfterGoodInput();
  }
  else if ( !Boolean(checker) )
  {
    alert(LANG.language[getLang()]["biAlert"]);
    svBtn.disabled = true;
    await new Promise(r => setTimeout(r, 5000)); //wait five seconds
    svBtn.disabled = false;
  }
}

export function saveButton(btnID)
{
  let svBtn = document.getElementById(btnID);
  svBtn.onclick = function() { checkinitInputs(); }
}

export async function continueAfterGoodInput()
{
  document.getElementById("secondPartDiv").style.display = "block";

  //store values in initial dictionary
  for (var [key, val] of Object.entries(initInputs))
  { val[0] = document.getElementById(key).value; }

  let EF = Number(initInputs["EFM"][0]) * prefixToPower(initInputs["selEFMpref"][0]);
  let MF = Number(initInputs["MFM"][0]) * prefixToPower(initInputs["selMFMpref"][0]);
  let EFdir = angFracsToUV(initInputs["cEFinputTheta"][0], initInputs["cEFinputPhi"][0]);
  let MFdir = angFracsToUV(initInputs["cMFinputTheta"][0], initInputs["cMFinputPhi"][0]);
  let IM = Number(initInputs["IM"][0]) * prefixToPower(initInputs["selIMpref"][0]) / 1000.0; //grams to kilograms
  let ECh = Number(initInputs["ECH"][0]) * prefixToPower(initInputs["selEChpref"][0]), EChC, EChe;
  if (initInputs["EChUnits"][0] === "C") { EChC = 1.0 * ECh; EChe = ECh / e; }
  else if (initInputs["EChUnits"][0] === "e") { EChC = e * ECh; EChe = 1.0 * ECh; }
  let uix0 = Number(initInputs["x0"][0]), uiy0 = Number(initInputs["y0"][0]), uiz0 = Number(initInputs["z0"][0]);
  let isFraction = Number(initInputs["initSpeedFr"][0]), isInSIunits = c * isFraction;
  let IVdir = angFracsToUV(initInputs["cIVinputTheta"][0], initInputs["cIVinputPhi"][0]);

  COMP.setInputs(EFdir, MFdir, EF, MF, [uix0, uiy0, uiz0], IVdir, isFraction, IM, EChC);

  document.getElementById("uiEFM").innerHTML = expNot(EF);
  document.getElementById("uiMFM").innerHTML = expNot(MF);
  document.getElementById("uiEFdir").innerHTML = tripletString(EFdir);
  document.getElementById("uiMFdir").innerHTML = tripletString(MFdir);
  document.getElementById("uiIM").innerHTML = expNot(IM);
  document.getElementById("uiEChC").innerHTML = expNot(EChC);
  document.getElementById("uiEChe").innerHTML = expNot(EChe);
  document.getElementById("uiInitPos").innerHTML = tripletString([uix0, uiy0, uiz0]);
  document.getElementById("isFract").innerHTML = expNot(isFraction);
  document.getElementById("isInMetPerSec").innerHTML = expNot(isInSIunits);
  document.getElementById("uiIVdir").innerHTML = tripletString(IVdir);

  checkTypeOfField();
}

async function checkTypeOfField()
{
  COMP.boostToProperFrame();
  let angFracBeta = UVtoAngFracs(COMP.unitβprop);

  for (var fieldType of ["nullType", "electricType", "magneticType", "collinearType"])
  {
    if (fieldType === COMP.typeOfField) { document.getElementById(fieldType).style.display = "block"; }
    else { document.getElementById(fieldType).style.display = "none"; }
  }

  if (COMP.typeOfField != "nullType")
  {
    if (COMP.normβprop <= TOL)
    {
      for (var elem of ["yesBoost", "LaTeXb", "propFrameBoostRap", "LaTeXc", "propFrameBoostSpeed"])
      { document.getElementById(elem).style.display = "none"; }
      document.getElementById("neglBoost").style.display = "block";
      document.getElementById("includeSpecFrame").disabled = true;
    }
    else if (COMP.normβprop > TOL)
    {
      for (var elem of ["yesBoost", "LaTeXb", "propFrameBoostRap", "LaTeXc", "propFrameBoostSpeed"])
      { document.getElementById(elem).style.display = "inline"; }
      document.getElementById("propFrameBoostRap").innerHTML = expNot(COMP.normβprop);
      document.getElementById("propFrameBoostSpeed").innerHTML = expNot(c * COMP.normβprop) + " m/s, <br>" + tripletString(COMP.unitβprop) + " → " + `(${expNot(angFracBeta[0])}` + `${LANGdecSep()}` + `${expNot(angFracBeta[1])}).`;
      document.getElementById("neglBoost").style.display = "none";
      document.getElementById("includeSpecFrame").disabled = false;
    }
    document.getElementById("EcB").style.display = "none";
  }
  else if (COMP.typeOfField === "nullType")
  {
    for (var elem of ["neglBoost", "yesBoost", "LaTeXb", "propFrameBoostRap", "LaTeXc", "propFrameBoostSpeed"])
    { document.getElementById(elem).style.display = "none"; }
    document.getElementById("EcB").style.display = "inline";
    document.getElementById("includeSpecFrame").disabled = false;
  }

}

export async function setupCustomBoost()
{
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
}

async function collectRemainderAnimParams()
{
  COMP.setTimeAndPts( Number( document.getElementById("inptChTimeFactor").value ) ); //set input characteristic time value

  if ( document.getElementById("includeCstmFrame").checked )
  {
    for (var [key, val] of Object.entries(cstmBoostInputs)) //store values in second part dictionary
    { val[0] = document.getElementById(key).value; }

    let boostFraction = Number(cstmBoostInputs["cstmBoostFr"][0]), boostInSIunits = c * boostFraction;
    let boostDir = angFracsToUV(cstmBoostInputs["cCBinputTheta"][0], cstmBoostInputs["cCBinputPhi"][0]);
  }
}


async function checkFinalInputs()
{
  let checker = true;
  
  if ( document.getElementById("includeCstmFrame").checked )
  {
    for (var key of Object.keys(cstmBoostInputs))
    { checker *= document.getElementById(key).checkValidity(); }
  }
  else if ( !document.getElementById("includeCstmFrame").checked )
  { checker *= document.getElementById("inptChTimeFactor").checkValidity(); }
  
  if ( Boolean(checker) )
  {
    alert(LANG.language[getLang()]["gfiAlert"]);
    animBtn.disabled = false;
    produceMotion();
  }
  else if ( !Boolean(checker) )
  {
    alert(LANG.language[getLang()]["bfiAlert"]);
    animBtn.disabled = true;
    await new Promise(r => setTimeout(r, 5000)); //wait five seconds
    animBtn.disabled = false;
  }
}

function scalePosition(path4vec, scaleDim)
{
  let posx0 = path4vec[0], posx1 = path4vec[1], posx2 = path4vec[2], posx3 = path4vec[3];
  //spatial bounds
  const minx1 = Math.min(...posx1), maxx1 = Math.max(...posx1);
  const l1 = maxx1 - minx1;
  const minx2 = Math.min(...posx2), maxx2 = Math.max(...posx2);
  const l2 = maxx2 - minx2;
  const minx3 = Math.min(...posx3), maxx3 = Math.max(...posx3);
  const l3 = maxx3 - minx3;

  const lmax = Math.max(l1, l2, l3);

  let outx1, outx2, outx3, scaledOrigin;

  if (!isNaN(lmax) && isFinite(lmax) && lmax > TOL)
  {
    outx1 = posx1.map(x => scaleDim * (x - minx1) / lmax);
    outx2 = posx2.map(y => scaleDim * (y - minx2) / lmax);
    outx3 = posx3.map(z => scaleDim * (z - minx3) / lmax);
    scaledOrigin = [scaleDim * (0 - minx1) / lmax, scaleDim * (0 - minx2) / lmax, scaleDim * (0 - minx3) / lmax];
  }
  else
  {
    outx1 = posx1, outx2 = posx2, outx3 = posx3;
    scaledOrigin = [0, 0, 0];
  }

  return [[posx0, outx1, outx2, outx3], scaledOrigin];
}

async function produceMotion()
{
  let labPath = COMP.generatePosition();

  if ( !labPath[0].every(isFinite) || !labPath[1].every(isFinite) || !labPath[2].every(isFinite) || !labPath[3].every(isFinite) )
  {
    alert("Some values of the numerical computation evaluate to either 'NaN' (not a number), or ±∞. This could be due to some floating point operations exceding the machine tolerance, Number.EPSILON = " + Number.EPSILON);
    return;
  } else
  {
    let sLabPathAndOrigin = scalePosition(labPath, 1);
    let sLabPath = sLabPathAndOrigin[0], sOrigin = sLabPathAndOrigin[1];
    SIM.simulanimate("c", "lfStartBtn", "lfResetBtn", sLabPath, sOrigin);
  }
}

export function animButton(btnID)
{
  let animBtn = document.getElementById(btnID);
  let animDiv = document.getElementById("animationDiv");
  animBtn.onclick = function()
  {
    if (animDiv.style.display === "none") { animDiv.style.display = "block"; }
    collectRemainderAnimParams();
    checkFinalInputs();
  }
}
