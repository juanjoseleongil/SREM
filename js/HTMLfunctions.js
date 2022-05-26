import * as PARAM from "./RMCUEMFparams.js";
import * as LANG from "./languageContent.js";
import * as COMP from "./RMCUEMFcompute.js";

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

let secondPartInputs =
{
  inptChTimeFactor: [null, "oZeroToInf"],
  cstmBoostFr: [null, "cZeroToOne"],
  cCBinputTheta: [null, "cZeroToOne"],
  cCBinputPhi: [null, null]
};

let animParams =
{
  EFvec: null,
  MFvec: null,
  IM: null,
  ECh: null,
  IPvec: null,
  IVvec: null,
  chTimeFactor: null,
  boostBeta: null
};

export function getLang() { return document.documentElement.getAttribute("lang"); }

function numToFmtStr(num, decLength = PARAM.signiFigM1)
{ return num.toLocaleString( getLang(), { style: "decimal", minimumFractionDigits: decLength, maximumFractionDigits: decLength } ); }

export function LANGdecSep()
{ return LANG.language[getLang()]["decSep"]; }

function prefixToPower(prefixString)
{ return Math.pow(10, parseInt(prefixString)); }

function angFracsToUV(thetaFr, phiFr)
{
  return [COMP.tfCos(PARAM.tau * Number(phiFr)) * COMP.tfCos(PARAM.tau * Number(thetaFr)),
          COMP.tfCos(PARAM.tau * Number(phiFr)) * COMP.tfSin(PARAM.tau * Number(thetaFr)),
          COMP.tfSin(PARAM.tau * Number(phiFr))];
}

function tripletString(compArr)
{ return `(${expNot(compArr[0])}` + `${LANGdecSep()}` + `${expNot(compArr[1])}` + `${LANGdecSep()}` + `${expNot(compArr[2])})`; }

// Convert signed integer to superscript string
function sIntToSS(sInt)
{
  let out = "";
  let ssDigits = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
  let strSint = sInt.toString();
  let sIntLen = strSint.length;
  let splitSint = strSint.split("");
  if (splitSint[0] === "-") { out += "⁻"; splitSint.shift(); }
  for (const digit of splitSint) { out += ssDigits[parseInt(digit)]; }
  return out;
}

// Exponential notation: write x as " significand × baseᵉˣᵖᵒⁿᵉⁿᵗ "
export function expNot(x, base = 10, basestr = "10", aap = PARAM.signiFigM1)
{
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
  {
    content.push(`<option value = "${key}"> ${value} </option>`);
  }
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
  insertSelect(selectSpanID, [PARAM.prefixes, `sel${selectSpanID}`, hiddenOpt]);
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
    for (const [key, value] of Object.entries(secondPartInputs))
    { if (!!document.getElementById(key) && value[1] != null)
      { document.getElementById(key).setAttribute("placeholder", language[lan.value][value[1]]); }
    }

    //write the speed of light in vacuum according to the current language
    document.getElementById("speedOfLight").innerHTML = (299792458).toLocaleString(lan.value);
  });
}

export function populateParticles(presetPartID)
{
  let particles = PARAM.particles;
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
  let particles = PARAM.particles;
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

//2. This function also took a lot of time to put to work, but apparently it is not needed. FMSW
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
      inpt.value = ((maxv - minv) * Math.random() + minv).toPrecision(PARAM.signiFigM1 + 1);

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


//3. No way. This function is also not necessary or not working. I'm so done with this sh*t
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

//1. This function was so f*cking hard to put to work, but it seems it is not necessary. At least it was useful while debugging
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
  if (initInputs["EChUnits"][0] === "C") { EChC = 1.0 * ECh; EChe = ECh / PARAM.e; }
  else if (initInputs["EChUnits"][0] === "e") { EChC = PARAM.e * ECh; EChe = 1.0 * ECh; }
  let uix0 = Number(initInputs["x0"][0]), uiy0 = Number(initInputs["y0"][0]), uiz0 = Number(initInputs["z0"][0]);
  let isFraction = Number(initInputs["initSpeedFr"][0]), isInSIunits = PARAM.c * isFraction;
  let IVdir = angFracsToUV(initInputs["cIVinputTheta"][0], initInputs["cIVinputPhi"][0]);

  animParams["EFvec"] = EFdir.map(x => EF * x);
  animParams["MFvec"] = MFdir.map(x => MF * x);
  animParams["IM"] = IM;
  animParams["ECh"] = EChC;
  animParams["IPvec"] = [uix0, uiy0, uiz0];
  animParams["IVvec"] = IVdir.map(x => isInSIunits * x);

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

  typeOfField(animParams["EFvec"], animParams["MFvec"]);
}

async function typeOfField(Efvec, Mfvec)
{
  let redEF = COMP.reduceField(Efvec, "electricType"), redMF = COMP.reduceField(Mfvec, "magneticType");
  //console.log("Efvec: " + Efvec);
  //console.log("redEF: " + redEF);
  //console.log("Mfvec: " + Mfvec);
  //console.log("redMF: " + redMF);
  let bp = COMP.boostParameters(redEF, redMF);
  let fType = bp[0], betaVec = bp[1];
  let betaNorm = COMP.norm3Vec(betaVec), betaDir = COMP.scalTim3Vec(1 / betaNorm, betaVec);

  for (var fieldType of ["nullType", "electricType", "magneticType", "collinearType"])
  {
    if (fieldType === fType) { document.getElementById(fieldType).style.display = "block"; }
    else { document.getElementById(fieldType).style.display = "none"; }
  }

  if (fType != "nullType")
  {
    if (betaNorm < PARAM.TOL)
    {
      for (var elem of ["yesBoost", "LaTeXb", "propFrameBoostRap", "LaTeXc", "propFrameBoostSpeed"])
      { document.getElementById(elem).style.display = "none"; }
      document.getElementById("neglBoost").style.display = "block";
    }
    else if (betaNorm > PARAM.TOL)
    {
      for (var elem of ["yesBoost", "LaTeXb", "propFrameBoostRap", "LaTeXc", "propFrameBoostSpeed"])
      { document.getElementById(elem).style.display = "inline"; }
      document.getElementById("propFrameBoostRap").innerHTML = expNot(betaNorm);
      document.getElementById("propFrameBoostSpeed").innerHTML = expNot(PARAM.c * betaNorm) + " m/s, <br>" + tripletString(betaDir);
      document.getElementById("neglBoost").style.display = "none";
    }
    document.getElementById("EcB").style.display = "none";
  }
  else if (fType === "nullType")
  {
    for (var elem of ["neglBoost", "yesBoost", "LaTeXb", "propFrameBoostRap", "LaTeXc", "propFrameBoostSpeed"])
    { document.getElementById(elem).style.display = "none"; }
    document.getElementById("EcB").style.display = "inline";
  }

}

async function collectRemainderAnimParams()
{
  for (var [key, val] of Object.entries(secondPartInputs)) //store values in second part dictionary
  { val[0] = document.getElementById(key).value; }

  let boostFraction = Number(secondPartInputs["cstmBoostFr"][0]), boostInSIunits = PARAM.c * boostFraction;
  let boostDir = angFracsToUV(secondPartInputs["cCBinputTheta"][0], secondPartInputs["cCBinputPhi"][0]);

  animParams["chTimeFactor"] = Number(secondPartInputs["inptChTimeFactor"][0]);
  animParams["boostBeta"] = [boostInSIunits, boostDir]; //boostDir.map(x => boostInSIunits * x);
}

async function checkFinalInputs()
{
  let checker = true;
  for (var key of Object.keys(secondPartInputs))
  { checker *= document.getElementById(key).checkValidity(); }
  if ( Boolean(checker) )
  {
    alert(LANG.language[getLang()]["gfiAlert"]);
    animBtn.disabled = false;
    goAheadAndAnimate();
  }
  else if ( !Boolean(checker) )
  {
    alert(LANG.language[getLang()]["bfiAlert"]);
    animBtn.disabled = true;
    await new Promise(r => setTimeout(r, 5000)); //wait five seconds
    animBtn.disabled = false;
  }
}


export function animButton(btnID)
{
  let animBtn = document.getElementById(btnID);
  animBtn.onclick = function() { checkFinalInputs(); }
}


async function goAheadAndAndAnimate()
{
}

/*
let animParams =
{
  EFvec = null,
  MFvec = null,
  IM = null,
  ECh = null,
  IPvec = null,
  IVvec = null,
  chTimeFactor = null,
  boostBeta = null
}
*/
