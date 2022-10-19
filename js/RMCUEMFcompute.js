import {τ, sqrt2, c, e, εf, μc, ooc, coεf, ooμc, TOL, signiFigM1, revFracStep, ptsPerCharTime, prefixes, particles} from "./RMCUEMFparams.js";
import * as FN from "./HTMLfunctions.js";

// INITIAL VARIABLES
export var unitE = [0.0, 0.0, 0.0], unitB = [0.0, 0.0, 0.0], normE = 1.0, normB = 1.0; //input fields, in SI units
export var x0 = [0.0, 0.0, 0.0], unitu0 = [0.0, 0.0, 0.0], normu0oc = 1.0, normu0 = 1.0; //initial position and velocity
export var γ0 = 1.0, m = 1.0, q = 1.0 //initial gamma factor, mass and electric charge
export var normEred = 1.0, normBred = 1.0; //reduced field magnitudes (in s⁻¹ m⁻¹ C)
export var qred = 1.0; //reduced electric charge
export var typeOfField = "", γprop = 1.0, unitβprop = [0.0, 0.0, 0.0], normβprop = 0.0; //field parameters depending on relativistic invariants
export var unitEprop = [0.0, 0.0, 0.0], unitBprop = [0.0, 0.0, 0.0], normEprop = 1.0, normBprop = 1.0; //for proper frame computation
export var x0prop = [0.0, 0.0, 0.0], unitu0prop = [0.0, 0.0, 0.0], normu0ocprop = 1.0, normu0prop = 1.0, γ0prop = 1.0;
export var unitEres = [0.0, 0.0, 0.0], unitBres = [0.0, 0.0, 0.0], normEres = 1.0, normBres = 1.0; //rescaled proper frame fields
export var charTimeFactor = 1.0, numPts = 1.0; //animation parameters
export var boostDone = false, rescaleDone = false;

export var charTime = 1.0, maxTime = 1.0, timeStep = 1.0;
export function setTimeStep() { timeStep = maxTime / numPts; }

export function setInputs(inptUnitE, inptUnitB, inptNormE, inptNormB, inptx0, inptUnitu0, inptNormu0oc, inptm, inptq)
{
  unitE = inptUnitE, unitB = inptUnitB, normE = inptNormE, normB = inptNormB;
  x0 = inptx0, unitu0 = inptUnitu0, normu0oc = inptNormu0oc;
  γ0 = 1.0 / Math.sqrt(1.0 - Math.pow(normu0oc, 2)); //gamma factor related to the initial velocity
  normu0 = c * normu0oc;
  m = inptm, q = inptq;
  reduceChargeAndFields();

  console.log("particle mass: " + FN.expNot(m) + " kg, \tcharge: " + FN.expNot(q) + " C");
  console.log("\nInitial position: " + FN.tripletString(x0) + " m");
  console.log("Initial velocity: " + FN.expNot(normu0) + " s⁻¹ m, \tβ = " + FN.expNot(normu0oc) + ", \tunit direction " + FN.tripletString(unitu0));
  console.log("Relativistic γ factor: " + FN.expNot(γ0));
  console.log("\nElectric field: " + FN.expNot(normE) + " m⁻¹ V, \tunit direction " + FN.tripletString(unitE));
  console.log("Magnetic field: " + FN.expNot(normB) + " T, \tunit direction " + FN.tripletString(unitB));
}

export function setTimeAndPts(inptCharTimeFactor)
{
  charTimeFactor = inptCharTimeFactor;
  numPts = charTimeFactor * ptsPerCharTime;
}

function reduceChargeAndFields() { qred = εf * q, normEred = coεf * normE, normBred = ooμc * normB; }

function rescaleFields()
{
  normEres = ( Math.abs(qred) / (m * c**2) ) * normEprop, normBres = ( Math.abs(qred) / (m * c**2) ) * normBprop;
  unitEres = unitEprop.map(x => Math.sign(q) * x), unitBres = unitBprop.map(x => Math.sign(q) * x);
  if (typeOfField === "magneticType") { normBres /= γ0prop; }
}

// MATHEMATICAL FUNCTIONS
export function tfCos(x) {return Math.cos(x); } //(1.0 + 1.0 * Math.cos(x) / 1.0 - 1.0); }
export function tfSin(x) {return Math.sin(x); } //(1.0 + 1.0 * Math.sin(x) / 1.0 - 1.0); }

export function tfAngs(u3vec)
{ //input: unit 3vec. output: spherical angles theta and phi
  let x = u3vec[0], y = u3vec[1], z = u3vec[2], theta = 1, phi = Math.atan2(z, Math.sqrt(x**2 + y**2));
  if (x >= 0 && y >= 0) { theta = Math.atan2(y, x); } //first quadrant
  else if (x < 0 && y >= 0) { theta = τ / 2 - Math.atan2(y, Math.abs(x)); } //second quadrant
  else if (x < 0 && y < 0) { theta = τ / 2 + Math.atan2(Math.abs(y), Math.abs(x)); } //third quadrant
  else if (x >= 0 && y < 0) { theta = τ - Math.atan2(Math.abs(y), x); } //fourth quadrant
  return [theta, phi];
}


function vecBinOp(vecA, op, vecB)
{ //vector binary operation (addition, subtraction)
  let output = [0.0, 0.0, 0.0], factor;
  if      (op === "+") { factor =  1.0; }
  else if (op === "-") { factor = -1.0; }
  for (var i = 0; i < 3; i++) { output[i] = vecA[i] + factor * vecB[i]; }
  return output;
}


export function scalMultVec(scal, vec)
{
  return [scal * vec[0], scal * vec[1], scal * vec[2]];
}


function dot(vecA, vecB)
{ return vecA[0] * vecB[0] + vecA[1] * vecB[1] + vecA[2] * vecB[2]; }


export function norm3Vec(vec)
{ return Math.hypot(vec[0], vec[1], vec[2]); }


function cross(vecA, vecB)
{
  return [vecA[1] * vecB[2] - vecA[2] * vecB[1],
          vecA[2] * vecB[0] - vecA[0] * vecB[2],
          vecA[0] * vecB[1] - vecA[1] * vecB[0]];
}


function matrixDotVector(M, v)
{
  let rows = M.length, cols = M[0].length;
  let out = Array.from( {length : rows}, (v, i) => 0 );
  for (var i = 0; i < rows; i++)
  {
    for (var j = 0; j < cols; j++)
    {
      out[i] += M[i][j] * v[j];
    }
  }
  return out;
}


function γofβ(β)
{ return 1.0 / Math.sqrt( 1.0 - dot(β, β) ); }


function LorentzTransf4vec(unitβ, normβ, γ, fourVector)
{
  let uβ1 = unitβ[0], uβ2 = unitβ[1], uβ3 = unitβ[2];
  let β1 = normβ * uβ1, β2 = normβ * uβ2, β3 = normβ * uβ3;
  let Λ = [[γ,       -γ * β1,                  -γ * β2,                  -γ * β3                  ],
           [-γ * β1, 1.0 + (γ - 1.0) * uβ1**2, (γ - 1.0) * uβ1 * uβ2,    (γ - 1.0) * uβ1 * uβ3    ],
           [-γ * β2, (γ - 1.0) * uβ2 * uβ1,    1.0 + (γ - 1.0) * uβ2**2, (γ - 1.0) * uβ2 * uβ3    ],
           [-γ * β3, (γ - 1.0) * uβ3 * uβ1,    (γ - 1.0) * uβ3 * uβ2,    1.0 + (γ - 1.0) * uβ3**2]];
  return matrixDotVector(Λ, fourVector);
}


function LorentzTransfEBfields(γ, β, E, B, field)
{ //Lorentz transformation on (reduced) fields. Hopefully this function won't be needed
  let outField, crossProd, dotProd, firstTerm, secondTerm, uβ = scalMultVec(1 / norm3Vec(β), β);
  if (field === "E")
  {
    crossProd = cross(B, β), dotProd = dot(uβ, E);
    firstTerm = scalMultVec( γ, vecBinOp(E, "-", crossProd) );
    secondTerm = scalMultVec( (γ - 1.0) * dotProd, uβ );
    outField = vecBinOp(firstTerm, "-", secondTerm);
  }
  else if (field === "B")
  {
    crossProd = cross(E, β), dotProd = dot(uβ, B);
    firstTerm = scalMultVec( γ, vecBinOp(B, "+", crossProd) );
    secondTerm = scalMultVec( (γ - 1.0) * dotProd, uβ );
    outField = vecBinOp(firstTerm, "-", secondTerm);
  }
  return outField;
}


export function boostToProperFrame()
{ // boost reduced fields, initial position and initial velocity to proper frame according to relativistic invariants
  let dotProdU = dot(unitE, unitB), crossProdU = cross(unitE, unitB);
  console.log("unit cross vector prod norm:" + FN.tripletString(crossProdU))
  let normCrossProdU = Math.hypot(crossProdU[0], crossProdU[1], crossProdU[2]);
  console.log("unit cross vector prod uvec:" + FN.expNot(normCrossProdU));
  let unitCrossProdU;
  if (!isNaN(normCrossProdU) && isFinite(normCrossProdU) && normCrossProdU > TOL) {console.log("unit vector can be normalized"); unitCrossProdU = crossProdU.map(x => x / normCrossProdU);}
  let En = normEred, Bn = normBred, Esq = Math.pow(normEred, 2), Bsq = Math.pow(normBred, 2);
  let Is = -Esq + Bsq, Ip = En * Bn * dotProdU;
  let Is2 = Math.pow(Is, 2), Ip2 = Math.pow(Ip, 2);
  let EoB = 1.0, BoE = 1.0;
  console.log("En: " + FN.expNot(En));
  console.log("Bn: " + FN.expNot(Bn));
  if (!isNaN(Bn) && isFinite(Bn) && Bn > TOL) {console.log("Bn can be denominator"); EoB = En / Bn; console.log("EoB = " + FN.expNot(EoB));}
  if (!isNaN(En) && isFinite(En) && En > TOL) {console.log("En can be denominator"); BoE = Bn / En; console.log("BoE = " + FN.expNot(BoE));}

  //initialization of unit vectors and norms on the proper frame
  unitEprop = [...unitE], normEprop = 1.0 * normEred; //electric field
  unitBprop = [...unitB], normBprop = 1.0 * normBred; //magnetic field
  if (!isNaN(normCrossProdU) && isFinite(normCrossProdU) && normCrossProdU > TOL) {console.log("unit beta vector can be assigned"); unitβprop = [...unitCrossProdU];} else {console.log("error with beta unit vector");} //β unit direction

  if ( Math.abs(dotProdU) <= TOL || En <= TOL || Bn <= TOL ) //null pseudoscalar invariant
  {
    if (En - Bn > TOL) //electric-like case
    {
      typeOfField = "electricType";
      if (Bn > 0.0)
      {
        γprop = En / Math.sqrt( -Is );
        normβprop = BoE * Math.sqrt( 1.0 - Math.pow(dotProdU, 2) );
        normEprop = Math.sqrt( -Is ), normBprop = 0.0;
      }
      else {} //the lab field is already electric-like, no Lorentz Boost needed
    }
    else if (Bn - En > TOL) //magnetic-like case
    {
      typeOfField = "magneticType";
      if (En > 0.0)
      {
        γprop = Bn / Math.sqrt( Is );
        normβprop = EoB * Math.sqrt( 1.0 - Math.pow(dotProdU, 2) );
        normEprop = 0.0, normBprop = Math.sqrt( Is );
      }
      else {} //the lab field is already magnetic-like, no Lorentz Boost needed
    }
    else {typeOfField = "nullType";} //else if ( fabs(En - Bn) <= TOL ) //null-like case
  }
  else // if ( Math.abs(dotProdU) > TOL && En > TOL && Bn > TOL ) //pseudoscalar invariant different from zero
  {
    typeOfField = "collinearType";
    let fIs = -EoB + BoE, fIp = dotProdU //fractional scalar and pseudoscalar
    let fIs2 = Math.pow(fIs, 2), fIp2 = Math.pow(fIp, 2);
    let s = Math.sqrt( fIs2 + 4.0 * fIp2 );
    γprop = sqrt2 * Math.sqrt(1.0 - fIp2) / Math.sqrt( s * (EoB + BoE - s) );
    normβprop = (EoB + BoE - s) / (2 * Math.sqrt(1.0 - fIp2));
    normEprop = Math.sqrt( En * Bn * ( s - fIs ) / 2.0 ), normBprop = Math.sqrt( En * Bn * ( s + fIs ) / 2.0 );
    unitEprop = unitE.map( x => x * (sqrt2 / Math.sqrt(s) ) * ( EoB * Math.sqrt(1.0 - fIp2) / Math.sqrt( s - fIs - 2.0 * EoB * fIp2 ) ) );
    unitEprop = vecBinOp( unitB.map(x => fIp * x), "-", unitE );
    unitEprop = unitEprop.map( x => x * (sqrt2 / Math.sqrt(s) ) * ( BoE / Math.sqrt( s - fIs + 2.0 * BoE * fIp2 ) ) );
    unitBprop = unitB.map( x => x * (sqrt2 / Math.sqrt(s) ) * ( BoE * Math.sqrt(1.0 - fIp2) / Math.sqrt( s + fIs - 2.0 * BoE * fIp2 ) ) );
    unitBprop = vecBinOp( unitE.map(x => fIp * x), "-", unitB );
    unitBprop = unitBprop.map( x => x * (sqrt2 / Math.sqrt(s) ) * ( EoB / Math.sqrt( s + fIs + 2.0 * EoB * fIp2 ) ) );
  }
    
  //boost initial position and velocity
  let lbx0 = LorentzTransf4vec(unitβprop, normβprop, γprop, [0.0, x0[0], x0[1], x0[2]]);
  let lbu0 = LorentzTransf4vec(unitβprop, normβprop, γprop, [γ0 * c, γ0 * normu0 * unitu0[0], γ0 * normu0 * unitu0[1], γ0 * normu0 * unitu0[2]]);
  x0prop = lbx0.slice(1);
  γ0prop = γprop * γ0 * ( 1.0 - normβprop * normu0oc * dot( unitβprop, unitu0 ) );
  let u0prop = lbu0.slice(1).map(x => x / γ0prop);
  normu0prop = Math.hypot(u0prop[0], u0prop[1], u0prop[2]);
  unitu0prop = u0prop.map(x => x / normu0prop), normu0ocprop = normu0prop / c;

  console.log("\nProper boost parameters:");
  console.log("Invariants: Scalar: " + FN.expNot(Is) + "\t Pseudoscalar: " + FN.expNot(Ip));
  console.log("Type of field: " + typeOfField );
  console.log("γ: " + FN.expNot(γprop));
  console.log("β: norm " + FN.expNot(normβprop) + ", direction " + FN.tripletString(unitβprop));
  console.log("E: norm " + FN.expNot(normEprop) + " s⁻¹ m⁻¹ C, direction " + FN.tripletString(unitEprop));
  console.log("B: norm " + FN.expNot(normBprop) + " s⁻¹ m⁻¹ C, direction " + FN.tripletString(unitBprop));
  console.log("u0: norm " + FN.expNot(normu0prop) + " s⁻¹ m, direction " + FN.tripletString(unitu0prop));
}

function nullType()
{
  let normF = 1.0 * normEres; //field vector norm (in this case normE = normB)
  let normv0 = 1.0 * normu0ocprop, unitv0 = [...unitu0prop] //rescaled initial velocity

  //Rotation to align the cross product unitE × unitB with the x_3 axis
  let crossProd = cross(unitEres, unitBres);
  let ncp = Math.hypot(crossProd[0], crossProd[1], crossProd[2]);
  console.log("cross product: " + FN.tripletString(crossProd));

  //components of the unit direction vector
  let d1 = crossProd[0] / ncp, d2 = crossProd[1] / ncp, d3 = crossProd[2] / ncp;

  //direct ("rot") and inverse ("tor") rotation matrices
  let rot3, tor3;
  if ( Math.abs(1 + d3) > TOL )
  {
  rot3 = [[1.0 - d1**2 / (1.0 + d3), - d1 * d2 / (1.0 + d3),   -d1                               ],
              [-d1 * d2 / (1.0 + d3),    1.0 - d2**2 / (1.0 + d3), -d2                               ],
              [d1,                       d2,                       1.0 - (d1**2 + d2**2) / (1.0 + d3)]];
  tor3 = [[1.0 - d1**2 / (1.0 + d3), - d1 * d2 / (1.0 + d3),   d1                                ],
              [-d1 * d2 / (1.0 + d3),    1.0 - d2**2 / (1.0 + d3), d2                                ],
              [-d1,                      -d2,                      1.0 - (d1**2 + d2**2) / (1.0 + d3)]];
  } else
  {
    rot3 = [[-1.0, 0.0, 0.0], [0.0, -1.0, 0.0], [0.0, 0.0, -1.0]];
    tor3 = [[-1.0, 0.0, 0.0], [0.0, -1.0, 0.0], [0.0, 0.0, -1.0]];
  }


  //execute the first rotation
  let rot3E = matrixDotVector(rot3, unitE);
  let rot3B = matrixDotVector(rot3, unitB);
  let rot3unitv0 = matrixDotVector(rot3, unitv0);
  console.log("rot3E: " + FN.expNot(rot3E));
  console.log("rot3B: " + FN.expNot(rot3B));


  //Rotation to align the unit vector rot3E with the x_1 axis
  //direct ("rot") and inverse ("tor") rotation matrices
  let rot1, tor1;
  if ( Math.abs(1 + rot3E[0]) > TOL )
  {
  rot1 = [[1.0 - (rot3E[1]**2 + rot3E[2]**2) / (1.0 + rot3E[0]), rot3E[1], rot3E[2]],
              [-rot3E[1], 1.0 - rot3E[1]**2 / (1.0 + rot3E[0]), -rot3E[1] * rot3E[2] / (1.0 + rot3E[0])],
              [-rot3E[2], -rot3E[1] * rot3E[2] / (1.0 + rot3E[0]), 1.0 - rot3E[2]**2 / (1.0 + rot3E[0])]];
  tor1 = [[1.0 - (rot3E[1]**2 + rot3E[2]**2) / (1.0 + rot3E[0]), -rot3E[1], -rot3E[2]],
              [rot3E[1], 1.0 - rot3E[1]**2 / (1.0 + rot3E[0]), -rot3E[1] * rot3E[2] / (1.0 + rot3E[0])],
              [rot3E[2], -rot3E[1] * rot3E[2] / (1.0 + rot3E[0]), 1.0 - rot3E[2]**2 / (1.0 + rot3E[0])]];
  } else
  {
    rot1 = [[-1.0, 0.0, 0.0], [0.0, -1.0, 0.0], [0.0, 0.0, -1.0]];
    tor1 = [[-1.0, 0.0, 0.0], [0.0, -1.0, 0.0], [0.0, 0.0, -1.0]];
  }

  //execute the second rotation
  let rotE = matrixDotVector(rot1, rot3E); //this should be equal to [1, 0, 0]
  let rotB = matrixDotVector(rot1, rot3B); //this should be equal to [0, 1, 0]
  let rotunitv0 = matrixDotVector(rot1, rot3unitv0);

  //function to undo the full rotation
  function undoRot(vec) { return matrixDotVector(tor3, matrixDotVector(tor1, vec)); }

  //normalized initial rotated velocity
  let v10 = normv0 * rotunitv0[0], v20 = normv0 * rotunitv0[1], v30 = normv0 * rotunitv0[2];

  //constant terms appearing in the next definitions
  let const0 = v10 * (3.0 * (1.0 - v30) - v10**2) / ( Math.sqrt( 2.0 * (1.0 - v30) - v10**2 )**3 );
  let const1 = 3.0 * normF * (1.0 - v30)**2 / ( γ0prop * Math.sqrt( 2.0 * (1.0 - v30) - v10**2 )**3 );
  let tsnoc0 = -const0 / const1;
  let tsnoc1 = 1.0 / const1;

  //Adimensional scaling of time
  function T(t) { return const0 + const1 * t; }

  //characteristic time
  function charT(N) { return tsnoc0 + tsnoc1 * N; }
  charTime = charT(1), maxTime = charT(charTimeFactor);
  setTimeStep();

  //cubic roots related to the circular expressions on the solution
  function rp(T) { return Math.cbrt( 1.0 + 2.0 * T * Math.sqrt(1.0 + T**2) + 2.0 * T**2 ); }

  function rm(T) { return Math.cbrt( 1.0 - 2.0 * T * Math.sqrt(1.0 + T**2) + 2.0 * T**2 ); }


  //algebraic combinations of circular functions
  //one over (one minus cosine)
  function ooomc(T) { return 0.5 + 2.0 * T**2 / ( (1.0 + rp(T) + rm(T))**2 ); }

  let ooomc0 = ooomc( T(0.0) ); //value at t = 0

  //sine over (one minus cosine)
  function soomc(T) { return 2.0 * T / (1.0 + rp(T) + rm(T)); }

  let soomc0 = soomc( T(0.0) ); //value at t = 0

  //algebraic combination of circular functions in x3(t)
  function algComb(T) { return T / (1.0 + rp(T) + rm(T)) - 4.0 * T**3 / ( 3.0 * (1.0 + rp(T) + rm(T))**3 ); }

  let algComb0 = algComb( T(0.0) ); //value at t = 0


  //time evolution of position
  //constants appearing on the solution
  let const1x1 = γ0prop * c * (2.0 * (1.0 - v30) - v10**2 ) / ( normF * (1.0 - v30) );
  let const0x1 = -const1x1 * ooomc0;

  let const1x2 = γ0prop * c * v20 * Math.sqrt( 2.0 * (1.0 - v30) - v10**2 ) / ( normF * (1.0 - v30) );
  let const0x2 = -const1x2 * soomc0;

  let const1x3 = -γ0prop * c * Math.sqrt( 2.0 * (1.0 - v30) - v10**2 ) / normF;
  let const0x3 = -const1x3 * algComb0;
  let consttx3 = c * (1.0 - v30**2 - v10**2) / ( 2.0 * (1.0 - v30) - v10**2 );


  //Time evolution function: returns position array
  function xNull(t)
  {
    let x1mx10 = const0x1 + const1x1 * ooomc( T(t) );
    let x2mx20 = const0x2 + const1x2 * soomc( T(t) );
    let x3mx30 = const0x3 + consttx3 * t + const1x3 * algComb( T(t) );
    let vecDynSln = undoRot([x1mx10, x2mx20, x3mx30]);
    return vecBinOp( x0prop, "+", vecDynSln );
  }

  return properFrameComputation(xNull); //COMPUTATION: PROPER FRAME POSITION 4-VECTOR
}


function electricType()
{
  let F = unitEres.map(x => normEres * x), normF = 1.0 * normEres, unitF = [...unitEres]; //focal vector norm and unit direction
  let U0 = unitu0.map(x => γ0prop * normu0oc * x); //rescaled initial velocity

  charTime = 1.0 / normF; //characteristic time
  maxTime = charTimeFactor * charTime;
  setTimeStep();

  //constant quantities appearing on the time evolution function
  let uFdotU0 = dot(unitF, U0);
  let perProjU0overF = vecBinOp(U0, "-", scalMultVec(uFdotU0, unitF));
  let sqrt1PlusU0sqrd = Math.sqrt( 1.0 + Math.pow(γ0prop * normu0oc, 2) );

  //Time evolution function: returns position array
  function xE(t)
  {
    let U0PlusFt = vecBinOp(U0, "+", scalMultVec(t,  F));
    let sqrt1PlusU0PlusFtsqrd = Math.sqrt( 1.0 + dot(U0PlusFt, U0PlusFt) );

    let parallF = c * (sqrt1PlusU0PlusFtsqrd - sqrt1PlusU0sqrd) / normF;
    let perpenF = c * Math.log( (normF * sqrt1PlusU0PlusFtsqrd + dot(F, U0PlusFt)) / (normF * (sqrt1PlusU0sqrd + uFdotU0) ) ) / normF;

    let parallTerm = scalMultVec(parallF, unitF);
    let perpenTerm = scalMultVec(perpenF, perProjU0overF);

    let dynamicTerm = vecBinOp(parallTerm, "+", perpenTerm);

    return vecBinOp(x0prop, "+", dynamicTerm);
  }
  return properFrameComputation(xE); //COMPUTATION: PROPER FRAME POSITION 4-VECTOR
}


function magneticType()
{
  let normΩ = 1.0 * normBres, unitΩ = [...unitBres]; //angular frequency vector norm and unit direction

  charTime = τ / normΩ; //characteristic time
  maxTime = charTimeFactor * charTime;
  setTimeStep();

  //main direction cosines
  const λ1 = unitΩ[0];
  const λ2 = unitΩ[1];
  const λ3 = unitΩ[2];

  //secondary direction cosines
  const λ23 = Math.sqrt(unitΩ[1]**2 + unitΩ[2]**2);
  const λ31 = Math.sqrt(unitΩ[2]**2 + unitΩ[0]**2);
  const λ12 = Math.sqrt(unitΩ[0]**2 + unitΩ[1]**2);

  //shorthand products
  const λ1λ2 = λ1 * λ2;
  const λ1λ3 = λ1 * λ3;
  const λ2λ3 = λ2 * λ3;

  //angular decomposition of the frequency vector, as a consecuence of the spectral structure of the operator $-\Omega \times$
  const secAngle1 = Math.atan2( unitΩ[2], unitΩ[0] * unitΩ[1] );
  const secAngle3 = Math.atan2( unitΩ[0], unitΩ[1] * unitΩ[2] );

  //cosines of $\vartheta_1$ and $\vartheta_3$
  const Cos1 = Math.cos( secAngle1 );
  const Cos3 = Math.cos( secAngle3 );

  //sines of $\vartheta_1$ and $\vartheta_3$
  const Sin1 = Math.sin( secAngle1 );
  const Sin3 = Math.sin( secAngle3 );

  //SOLUTION MATRICES
  //main direction cosines matrix
  const mainDirCosMat = [[λ1**2, λ1λ2, λ1λ3], [λ1λ2, λ2**2, λ2λ3], [λ1λ3, λ2λ3, λ3**2]];

  //diagonal solution matrix
  const diagMat = [[λ23, 0.0, 0.0], [0.0, λ31, 0.0], [0.0, 0.0, λ12]];

  //inner cosine matrix
  const cosMat = [[1.0, -Cos1, Cos1 * Cos3 - Sin1 * Sin3], [-Cos1, 1.0, -Cos3], [Cos1 * Cos3 - Sin1 * Sin3, -Cos3, 1.0]];

  //inner sine matrix
  const sinMat = [[0.0, Sin1, -Sin1 * Cos3 - Cos1 * Sin3], [-Sin1, 0.0, Sin3], [Sin1 * Cos3 + Cos1 * Sin3, -Sin3, 0.0]];

  //Time evolution function: returns position array
  function xM(t)
  {
    let x = Array.from( {length : 3}, (v, i) => 0 );
    let timeDependentMatrix = [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]];

    for (var i = 0; i < 3; i++)
    {
      for (var j = 0; j < 3; j++)
      {

        let circularMatrixxij = 0.0;
        let linCombCosAndSin = 0.0;
        for (var k = 0; k < 3; k++)
        {
          for (var l = 0; l < 3; l++)
          {
            linCombCosAndSin = cosMat[l][k] * Math.sin(normΩ * t) + sinMat[l][k] * (1.0 - Math.cos(normΩ * t));
            circularMatrixxij += diagMat[i][l] * linCombCosAndSin * diagMat[k][j];
          }
        }

        timeDependentMatrix[i][j] = mainDirCosMat[i][j] * t + (1.0 / normΩ) * circularMatrixxij;
      }
    }

    for (var i = 0; i < 3; i++)
    {
      let timeDependentTerm = 0.0;
      for (var j = 0; j < 3; j++)
      {
        timeDependentTerm += timeDependentMatrix[i][j] * normu0prop * unitu0prop[j];
      }

      x[i] += x0prop[i] + timeDependentTerm;
    }

    return x;
  }

  return properFrameComputation(xM); //COMPUTATION: PROPER FRAME POSITION 4-VECTOR
}


function collinearType()
{
  //electric and magnetic field vector norms and unit directions
  let snormE = 1.0 * normEres, snormB = normBres * Math.sign( dot(unitEres, unitBres) ); //new B norm: older norm times sign of dot product

  console.log("snormE: " + FN.expNot(snormE));
  console.log("snormB: " + FN.expNot(snormB));

  //rescaled initial velocity
  let normv0 = 1.0 * normu0ocprop, unitv0 = [...unitu0prop];

  //Rotation to align the unit vector unitE with the x_1 axis
  //direct (rot) and inverse (tor) rotation matrices
  let rot1, tor1;
  if ( Math.abs(1 + unitEres[0]) > TOL )
  {
    rot1 = [[1.0 - (unitEres[1]**2 + unitEres[2]**2) / (1.0 + unitEres[0]), unitEres[1], unitEres[2]],
            [-unitEres[1], 1.0 - unitEres[1]**2 / (1.0 + unitEres[0]), -unitEres[1] * unitEres[2] / (1.0 + unitEres[0])],
            [-unitEres[2], -unitEres[1] * unitEres[2] / (1.0 + unitEres[0]), 1.0 - unitEres[2]**2 / (1.0 + unitEres[0])]];
    tor1 = [[1.0 - (unitEres[1]**2 + unitEres[2]**2) / (1.0 + unitEres[0]), -unitEres[1], -unitEres[2]],
            [unitEres[1], 1.0 - unitEres[1]**2 / (1.0 + unitEres[0]), -unitEres[1] * unitEres[2] / (1.0 + unitEres[0])],
            [unitEres[2], -unitEres[1] * unitEres[2] / (1.0 + unitEres[0]), 1.0 - unitEres[2]**2 / (1.0 + unitEres[0])]];
  } else
  {
    rot1 = [[-1.0, 0.0, 0.0], [0.0, -1.0, 0.0], [0.0, 0.0, -1.0]];
    tor1 = [[-1.0, 0.0, 0.0], [0.0, -1.0, 0.0], [0.0, 0.0, -1.0]];
  }
  
  //function to undo the rotation
  function undoRot(vec) { return matrixDotVector(tor1, vec); }


  //execute the rotation
  //initial velocity unit vector
  let rotunitv0 = matrixDotVector(rot1, unitv0);

  //normalized initial rotated velocity
  let v01 = normv0 * rotunitv0[0], v02 = normv0 * rotunitv0[1], v03 = normv0 * rotunitv0[2];

  //characteristic time
  function charT(N)
  {
    let farg = snormE * τ * N / snormB;
    return Math.abs( (γ0prop / snormE) * ( v01 * (Math.cosh(farg) - 1.0) + Math.sinh(farg) ) ); //(γ0prop / snormE) * ( v01 * (Math.cosh(farg) - 1.0) + Math.sinh(farg) )
  }
  charTime = charT(1);
  maxTime = charT(charTimeFactor);
  setTimeStep();

  //constant terms involved in the time evolution routine
  let γ0v01 = γ0prop * v01;

  //time evolution of position

  function γ0v01PlusEt(t) { return γ0v01 + snormE * t; }

  function sqrtTime(t) { return Math.sqrt( γ0v01PlusEt(t)**2 + γ0prop**2 * (1.0 - v01**2) ); }

  function timeArg(t)
  {
    let logArg = ( sqrtTime(t) + γ0v01PlusEt(t) ) / ( γ0prop + γ0v01 );
    return snormB * Math.log( logArg ) / snormE;
  }

  //compute the rectangular components of position, then undo the rotation, and finally add the initial position
  function xEparM(t)
  {
    let x1mx10 = c * (sqrtTime(t) - γ0prop) / snormE;
    let x2mx20 = c * γ0prop * ( v03 * ( Math.cos( timeArg(t) ) - 1.0 ) + v02 * Math.sin( timeArg(t) ) ) / snormB;
    let x3mx30 = c * γ0prop * (-v02 * ( Math.cos( timeArg(t) ) - 1.0 ) + v03 * Math.sin( timeArg(t) ) ) / snormB;
    let vecDynSln = undoRot([x1mx10, x2mx20, x3mx30]);
    return vecBinOp( x0prop, "+", vecDynSln );
  }

  return properFrameComputation(xEparM); //COMPUTATION: PROPER FRAME POSITION 4-VECTOR
}


function properFrameComputation(x)
{
  let propTime = Array.from( {length : numPts}, (v, i) => 0 );
  let propPosx = Array.from( {length : numPts}, (v, i) => 0 );
  let propPosy = Array.from( {length : numPts}, (v, i) => 0 );
  let propPosz = Array.from( {length : numPts}, (v, i) => 0 );
  let tempPropPos;

  for (var i = 0; i < numPts; i++)
  {
    tempPropPos = x(i * timeStep);
    propTime[i] = i * timeStep;
    propPosx[i] = 1.0 * tempPropPos[0];
    propPosy[i] = 1.0 * tempPropPos[1];
    propPosz[i] = 1.0 * tempPropPos[2];
  }

  return [propTime, propPosx, propPosy, propPosz];
}


// SYSTEM EVOLUTION
export function generatePosition()
{
  boostToProperFrame(); //SET FIELDS ACCORDING TO SYSTEM INVARIANTS
  rescaleFields(); //RESCALE FIELDS DEPENDING ON "typeOfField" VARIABLE VALUE

  let properFrame4pos;
  //POSITION AS SOLUTION TO THE EQUATIONS OF MOTION
  if (typeOfField === "nullType") {properFrame4pos = nullType();}
  else if (typeOfField === "electricType") {properFrame4pos = electricType();}
  else if (typeOfField === "magneticType") {properFrame4pos = magneticType();}
  else if (typeOfField === "collinearType") {properFrame4pos = collinearType();}

  console.log("The characteristic time for the system is " + FN.expNot(charTime) + "s");
  console.log("Time step: " + FN.expNot(timeStep) + "s");

  //LAB FRAME POSITION 4-VECTOR COMPONENTS
  let labTime = Array.from( {length : numPts}, (v, i) => 0 );
  let labPosx = Array.from( {length : numPts}, (v, i) => 0 );
  let labPosy = Array.from( {length : numPts}, (v, i) => 0 );
  let labPosz = Array.from( {length : numPts}, (v, i) => 0 );
  let tempLabPos4vec = Array.from( {length : 4}, (v, i) => 0 );

  if (isFinite(normβprop) && !isNaN(normβprop) && normβprop > TOL)
  {
    console.log("A Lorentz Boost with |β| = " + FN.expNot(normβprop) + " and unit direction " + FN.tripletString(unitβprop.map(x => -x)) + " is going to be performed");
    for (var i = 0; i < numPts; i++)
    {
      let propT = properFrame4pos[0][i], propX = properFrame4pos[1][i], propY = properFrame4pos[2][i], propZ = properFrame4pos[3][i];
      tempLabPos4vec = LorentzTransf4vec( unitβprop.map(x => -x), normβprop, γprop, [c * propT, propX, propY, propZ] );
      labTime[i] = tempLabPos4vec[0] / c;
      labPosx[i] = tempLabPos4vec[1];
      labPosy[i] = tempLabPos4vec[2];
      labPosz[i] = tempLabPos4vec[3];
    }
  }
  else
  {
    console.log("The lab frame is already a proper frame or the boost parameters are problematic, so no Lorentz boost is performed");
    labTime = properFrame4pos[0];
    labPosx = properFrame4pos[1];
    labPosy = properFrame4pos[2];
    labPosz = properFrame4pos[3];
  }

  return [labTime, labPosx, labPosy, labPosz];
}

function saveToCSV(sLabPath)
{
    let csvCntnt = "data:text/csv;charset=utf-8," + "t,x,y,z\n";
    for (var i = 0; i < numPts; i++)
    { csvCntnt += sLabPath[0][i] + "," + sLabPath[1][i] + "," + sLabPath[2][i] + "," + sLabPath[3][i] + "\n"; }
    var encodedUri = encodeURI(csvCntnt);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mydataj.csv");
    document.body.appendChild(link); // Required for FF
    link.click(); // This will download the data file named "mydataj.csv".
}
