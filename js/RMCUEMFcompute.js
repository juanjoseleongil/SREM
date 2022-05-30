import * as PARAM from "./RMCUEMFparams.js";

// MATHEMATICAL FUNCTIONS
export function tfCos(x) {return (1.0 + 1.0 * Math.cos(x) / 1.0 - 1.0); }
export function tfSin(x) {return (1.0 + 1.0 * Math.sin(x) / 1.0 - 1.0); }
export function tfAngs(u3vec)
{
  let x = u3vec[0], y = u3vec[1], z = u3vec[2], theta = 1, phi = Math.atan2(z, Math.sqrt(x**2 + y**2));
  if (x >= 0 && y >= 0) { theta = Math.atan2(y, x); } //first quadrant
  else if (x < 0 && y >= 0) { theta = PARAM.tau / 2 - Math.atan2(y, Math.abs(x)); } //second quadrant
  if (x < 0 && y < 0) { theta = PARAM.tau / 2 + Math.atan2(Math.abs(y), Math.abs(x)); } //third quadrant
  if (x >= 0 && y < 0) { theta = PARAM.tau - Math.atan2(Math.abs(y), x); } //fourth quadrant
  return [theta, phi];
}

function vec3BinOp(vecA, op, vecB)
{
  let output = [0.0, 0.0, 0.0], factor;
  if      (op === "+") { factor =  1.0; }
  else if (op === "-") { factor = -1.0; }
  for (var i = 0; i < 3; i++) { output[i] = vecA[i] + factor * vecB[i]; }
  return output;
}

export function scalTim3Vec(scal, vec)
{
  return [scal * vec[0], scal * vec[1], scal * vec[2]];
}

function dot(vecA, vecB)
{ return vecA[0] * vecB[0] + vecA[1] * vecB[1] + vecA[2] * vecB[2]; }

export function norm3Vec(vec)
{ return Math.sqrt(dot(vec, vec)); }

function cross(vecA, vecB)
{
  return [vecA[1] * vecB[2] - vecA[2] * vecB[1],
          vecA[2] * vecB[0] - vecA[0] * vecB[2],
          vecA[0] * vecB[1] - vecA[1] * vecB[0]];
}


function matrixDotVector(M, v) //returns ARRAY
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


function LorentzTransform4vec(β, fourVector)
{
  let γ = γofβ(β), β1 = β[0], β2 = β[1], β3 = β[2];
  let βsq = dot(β, β);
  let Λ = [[γ,       -γ * β1,                       -γ * β2,                       -γ * β3                      ],
           [-γ * β1, 1.0 + (γ - 1.0) * β1**2 / βsq, (γ - 1.0) * β1 * β2 / βsq,     (γ - 1.0) * β1 * β3 / βsq    ],
           [-γ * β2, (γ - 1.0) * β2 * β1 / βsq,     1.0 + (γ - 1.0) * β2**2 / βsq, (γ - 1.0) * β2 * β3 / βsq    ],
           [-γ * β3, (γ - 1.0) * β3 * β1 / βsq,     (γ - 1.0) * β3 * β2 / βsq,     1.0 + (γ - 1.0) * β3**2 / βsq]];

  return matrixDotVector(Λ, fourVector);
}


function LorentzTransfEBfields(γ, β, E, B, field)
{
  let outField, crossProd, dotProd, firstTerm, secondTerm, βsq = dot(β, β);
  if (field === "E")
  {
    crossProd = cross(B, β), dotProd = dot(β, E);
    firstTerm = scalTim3Vec( γ, vec3BinOp(E, "-", crossProd) );
    secondTerm = scalTim3Vec( (γ - 1.0) * dotProd / βsq, β );
    outField = vec3BinOp(firstTerm, "-", secondTerm);
  }
  else if (field === "B")
  {
    crossProd = cross(E, β), dotProd = dot(β, B);
    firstTerm = scalTim3Vec( γ, vec3BinOp(B, "+", crossProd) );
    secondTerm = scalTim3Vec( (γ - 1.0) * dotProd / βsq, β );
    outField = vec3BinOp(firstTerm, "-", secondTerm);
  }
  return outField;
}


function reduceCharge(q)
{ return εf * q; }


export function reduceField(field, type)
{
  let Fred;
  if (type === "electricType") { Fred = scalTim3Vec(PARAM.coεf, field); }
  else if (type === "magneticType") { Fred = scalTim3Vec(PARAM.ooμc, field); }
  return Fred;
}


function computeInvariants(E, B)
{
  return [-dot(E, E) + dot(B, B), dot(E, B)];
}


export function boostParameters(E, B)
{
  let Esq = dot(E, E), Bsq = dot(B, B), EXB = cross(E, B);
  let En = Math.sqrt(Esq), Bn = Math.sqrt(Bsq);
  let Is, Ip, Is2, Ip2, invariants, β, γ, Ep, Bp;

  invariants = computeInvariants(E, B);
  Is = invariants[0], Ip = invariants[1], invariants = null;
  Is2 = Math.pow(Is, 2), Ip2 = Math.pow(Ip, 2);

  console.log("Is: " + Is); //REMOVE BEFORE SENDING CODE
  console.log("Ip: " + Ip); //REMOVE BEFORE SENDING CODE

  let output; //final output

  if (Math.abs(Ip) <= PARAM.TOL) //null pseudoscalar invariant
  {
    if (Math.abs(Is) <= PARAM.TOL) //null-like case
    {
      output = ["nullType", [0.0, 0.0, 0.0], 1.0, E, B];
    }
    else if (Is <= -PARAM.TOL) //electric-like case
    {
      β = scalTim3Vec( 1.0 / Esq, EXB );
      γ = En / Math.sqrt( -Is );
      Ep = scalTim3Vec( Math.sqrt( -Is ) / En , E );
      Bp = [0.0, 0.0, 0.0];
      output = ["electricType", β, γ, Ep, Bp];
    }
    else if (Is > PARAM.TOL) //magnetic-like case
    {
      β = scalTim3Vec( 1.0 / Bsq, EXB );
      γ = Bn / Math.sqrt( Is );
      Ep = [0.0, 0.0, 0.0];
      Bp = scalTim3Vec( Math.sqrt( Is ) / Bn , B );
      output = ["magneticType", β, γ, Ep, Bp];
    }
  }
  else if (Math.abs(Ip) > PARAM.TOL) //pseudoscalar invariant different from zero
  {
    β = scalTim3Vec( ( Esq + Bsq - Math.sqrt( Is2 + 4.0 * Ip2 ) ) / ( 2.0 * ( Math.pow(En * Bn, 2) - Ip2 ) ) , EXB );
    γ = Math.sqrt(2.0) * Math.sqrt( ( Math.pow( Is2 + 4.0 * Ip2 , -0.5) * ( Math.pow(En * Bn, 2) - Ip2 ) ) / ( Esq + Bsq - Math.sqrt( Is2 + 4.0 * Ip2 ) ) );
    Ep = LorentzTransfEBfields(γ, β, E, B, "E");
    Bp = LorentzTransfEBfields(γ, β, E, B, "B");
    output = ["collinearType", β, γ, Ep, Bp];
  }

  return output;
}


function rescaleFields(qred, m, Ered, Bred, u0, type)
{
  let rescE = [Ered[0], Ered[1], Ered[2]];
  let rescB = [Bred[0], Bred[1], Bred[2]];

  if (type === "nullType" || type == "collinearType")
  {
    rescE = scalTim3Vec( qred / (m * PARAM.c**2), rescE );
    rescB = scalTim3Vec( qred / (m * PARAM.c**2), rescB );
  }
  else if (type === "electricType")
  {
    rescE = scalTim3Vec( qred / (m * PARAM.c**2), rescE );
  }
  else if (type === "magneticType")
  {
    let γ = γofβ( scalTim3Vec(PARAM.ooc, u0) );
    rescB = scalTim3Vec( qred / (γ * m * PARAM.c**2), rescB );
  }

  return [rescE, rescB];
}


// SYSTEM EVOLUTION
function generatePosition(q, m, Efield, Bfield, x0, u0, numPts, charTimeFactor)
{
  //SYSTEM PARAMETERS
  const qred = reduceCharge(q);
  const Ered = reduceField(Efield, "electricType"), Bred = reduceField(Bfield, "magneticType");
  var bp = boostParameters(Ered, Bred);
  const type = bp[0], β = bp[1], γ = bp[2], Ep = bp[3], Bp = bp[4]; bp = null;
  const βn = norm3Vec(β);

  console.log("The electromagnetic field is of " + type + " type"); //DELETE BEFORE SENDING CODE

  //POSITION AS SOLUTION TO THE EQUATIONS OF MOTION
  let properFrame4pos;
  if (type === "nullType")
  { properFrame4pos = nullType(qred, m, Ered, Bred, x0, u0, numPts, charTimeFactor); }
  else if (type === "electricType")
  { properFrame4pos = electricType(qred, m, Ered, Bred, x0, u0, numPts, charTimeFactor); }
  else if (type === "magneticType")
  { properFrame4pos = magneticType(qred, m, Ered, Bred, x0, u0, numPts, charTimeFactor); }
  else if (type === "collinearType")
  { properFrame4pos = collinearType(qred, m, Ered, Bred, x0, u0, numPts, charTimeFactor); }

  // LAB FRAME POSITION 4-VECTOR COMPONENTS
  let labTime = Array.from( {length : numPts}, (v, i) => 0 );
  let labPosx = Array.from( {length : numPts}, (v, i) => 0 );
  let labPosy = Array.from( {length : numPts}, (v, i) => 0 );
  let labPosz = Array.from( {length : numPts}, (v, i) => 0 );
  let tempLabPos4vec = Array.from( {length : 4}, (v, i) => 0 );

  if (βn <= PARAM.TOL)
  {
    console.log("The lab frame is already a proper frame, so no Lorentz Boost is necessary");
    labTime = properFrame4pos[0];
    labPosx = properFrame4pos[1];
    labPosy = properFrame4pos[2];
    labPosz = properFrame4pos[3];
  }
  else if (βn > PARAM.TOL)
  {
    console.log("A Lorentz Boost with β = " + β + " is going to be performed");
    for (var i = 0; i < numPts; i++)
    {
      let propT = properFrame4pos[0][i], propX = properFrame4pos[1][i], propY = properFrame4pos[2][i], propZ = properFrame4pos[3][i];
      tempLabPos4vec = LorentzTransform4vec(scalTim3Vec(-1, β), [propT, propX, propY, propZ]);
      labTime[i] = tempLabPos4vec[0];
      labPosx[i] = tempLabPos4vec[1];
      labPosy[i] = tempLabPos4vec[2];
      labPosz[i] = tempLabPos4vec[3];
    }
  }

  let labFrame4pos = [labTime, labPosx, labPosy, labPosz];
  console.log("t:" + labFrame4pos[0]);
  console.log("x:" + labFrame4pos[1]);
  console.log("y:" + labFrame4pos[2]);
  console.log("z:" + labFrame4pos[3]);

  return labFrame4pos;
}


function nullType(qred, m, Ered, Bred, x0, u0, numPts, charTimeFactor)
{
  var rescF = rescaleFields(qred, m, Ered, Bred, u0, "nullType");
  const E = rescF[0], B = rescF[1]; rescF = null;
  const En = norm3Vec(E), Bn = norm3Vec(B), u0n = norm3Vec(u0);

  //gamma factor related to the initial velocity
  const γ0 = γofβ( scalTim3Vec(PARAM.ooc, u0) );

  //field vector norm (in this case normE = normB) and unit direction
  const normF = 0.5 * (En + Bn), unitF = scalTim3Vec(1 / En, E);

  //rescaled initial velocity
  const v0 = scalTim3Vec(PARAM.ooc, u0);
  const normv0 = PARAM.ooc * u0n, unitv0 = scalTim3Vec(1 / u0n, u0);

  //electric and magnetic field unit vectors
  const unitE = scalTim3Vec(1 / En, E), unitB = scalTim3Vec(1 / Bn, B);

  //Rotation to align the cross product unitE × unitM with the x_3 axis
  let crossProd = cross(unitE, unitB);

  //components of the unit direction vector
  let ncp = norm3Vec(crossProd), d1 = crossProd[0] / ncp, d2 = crossProd[1] / ncp, d3 = crossProd[2] / ncp;

  //direct rotation matrix
  let rot3 = [[1.0 - d1**2 / (1.0 + d3), - d1 * d2 / (1.0 + d3),   -d1                               ],
              [-d1 * d2 / (1.0 + d3),    1.0 - d2**2 / (1.0 + d3), -d2                               ],
              [d1,                       d2,                       1.0 - (d1**2 + d2**2) / (1.0 + d3)]];

  //inverse rotation matrix
  let tor3 = [[1.0 - d1**2 / (1.0 + d3), - d1 * d2 / (1.0 + d3),   d1                                ],
              [-d1 * d2 / (1.0 + d3),    1.0 - d2**2 / (1.0 + d3), d2                                ],
              [-d1,                      -d2,                      1.0 - (d1**2 + d2**2) / (1.0 + d3)]];

  //execute the first rotation
  let rot3E = matrixDotVector(rot3, unitE);
  let rot3B = matrixDotVector(rot3, unitB);
  let rot3unitv0 = matrixDotVector(rot3, unitv0);


  //Rotation to align the unit vector rot3E with the x_1 axis

  //direct rotation matrix
  let rot1 = [[1.0 - (rot3E[1]**2 + rot3E[2]**2) / (1.0 + rot3E[0]), rot3E[1], rot3E[2]],
              [-rot3E[1], 1.0 - rot3E[1]**2 / (1.0 + rot3E[0]), -rot3E[1] * rot3E[2] / (1.0 + rot3E[0])],
              [-rot3E[2], -rot3E[1] * rot3E[2] / (1.0 + rot3E[0]), 1.0 - rot3E[2]**2 / (1.0 + rot3E[0])]];

  //inverse rotation matrix
  let tor1 = [[1.0 - (rot3E[1]**2 + rot3E[2]**2) / (1.0 + rot3E[0]), -rot3E[1], -rot3E[2]],
              [rot3E[1], 1.0 - rot3E[1]**2 / (1.0 + rot3E[0]), -rot3E[1] * rot3E[2] / (1.0 + rot3E[0])],
              [rot3E[2], -rot3E[1] * rot3E[2] / (1.0 + rot3E[0]), 1.0 - rot3E[2]**2 / (1.0 + rot3E[0])]];

  //execute the second rotation
  //let rotE = matrixDotVector(rot1, rot3E); //this should be equal to [1, 0, 0]
  //let rotB = matrixDotVector(rot1, rot3B); //this should be equal to [0, 1, 0]
  let rotunitv0 = matrixDotVector(rot1, rot3unitv0);

  //function to undo the full rotation
  function undoRot(vec)
  { return matrixDotVector(tor3, matrixDotVector(tor1, vec)); }

  //normalized initial rotated velocity
  let v10 = normv0 * rotunitv0[0], v20 = normv0 * rotunitv0[1], v30 = normv0 * rotunitv0[2];

  //constant terms appearing in the next definitions
  let const0 = v10 * (3.0 * (1.0 - v30) - v10**2) / ( Math.sqrt( 2.0 * (1.0 - v30) - v10**2 )**3 );
  let const1 = 3.0 * normF * (1.0 - v30)**2 / ( γ0 * Math.sqrt( 2.0 * (1.0 - v30) - v10**2 )**3 );
  let tsnoc0 = -const0 / const1;
  let tsnoc1 = 1.0 / const1;

  //Adimensional scaling of time
  function T(t)
  { return const0 + const1 * t; }

  //characteristic time
  function charT(N)
  { return tsnoc0 + tsnoc1 * N; }
  const maxTime = charT(charTimeFactor);
  const timeStep = maxTime / numPts;


  //cubic roots related to the circular expressions on the solution
  function rp(T)
  { return Math.cbrt( 1.0 + 2.0 * T * Math.sqrt(1.0 + T**2) + 2.0 * T**2 ); }

  function rm(T)
  { return Math.cbrt( 1.0 - 2.0 * T * Math.sqrt(1.0 + T**2) + 2.0 * T**2 ); }


  //algebraic combinations of circular functions

  //one over (one minus cosine)
  function ooomc(T)
  { return 0.5 + 2.0 * T**2 / ( (1.0 + rp(T) + rm(T))**2 ); }

  //value at t = 0
  let ooomc0 = ooomc( T(0.0) );

  //sine over (one minus cosine)
  function soomc(T)
  { return 2.0 * T / (1.0 + rp(T) + rm(T)); }

  //value at t = 0
  let soomc0 = soomc( T(0.0) );

  //algebraic combination of circular functions in x3(t)
  function algComb(T)
  { return T / (1.0 + rp(T) + rm(T)) - 4.0 * T**3 / ( 3.0 * (1.0 + rp(T) + rm(T))**3 ); }

  //value at t = 0
  let algComb0 = algComb( T(0.0) );


  //time evolution of position

  //constants appearing on the solution
  let const1x1 = γ0 * PARAM.c * (2.0 * (1.0 - v30) - v10**2 ) / ( normF * (1.0 - v30) );
  let const0x1 = -const1x1 * ooomc0;

  let const1x2 = γ0 * PARAM.c * v20 * Math.sqrt( 2.0 * (1.0 - v30) - v10**2 ) / ( normF * (1.0 - v30) );
  let const0x2 = -const1x2 * soomc0;

  let const1x3 = -γ0 * PARAM.c * Math.sqrt( 2.0 * (1.0 - v30) - v10**2 ) / normF;
  let const0x3 = -const1x3 * algComb0;
  let consttx3 = PARAM.c * (1.0 - v30**2 - v10**2) / ( 2.0 * (1.0 - v30) - v10**2 );


  //Time evolution function: returns position array
  function xNull(t)
  {
    let x1mx10 = const0x1 + const1x1 * ooomc( T(t) );
    let x2mx20 = const0x2 + const1x2 * soomc( T(t) );
    let x3mx30 = const0x3 + consttx3 * t + const1x3 * algComb( T(t) );
    let vecDynSln = undoRot([x1mx10, x2mx20, x3mx30]);
    return vec3BinOp( x0, "+", vecDynSln );
  }

  //COMPUTATION: PROPER FRAME POSITION 4-VECTOR
  return properFrameComputation(numPts, timeStep, xNull);
}


function electricType(qred, m, Ered, Bred, x0, u0, numPts, charTimeFactor)
{
  var rescF = rescaleFields(qred, m, Ered, Bred, u0, "electricType");
  const F = rescF[0]; rescF = null;

  //gamma factor related to the initial velocity
  const γ0 = γofβ( scalTim3Vec(PARAM.ooc, u0) );

  //focal vector norm and unit direction
  const normF = norm3Vec(F), unitF = scalTim3Vec(1 / normF, F);

  //rescaled initial velocity
  const U0 = scalTim3Vec( γ0 * PARAM.ooc, u0 );

  const charTime = 1.0 / normF; //characteristic time
  const maxTime = charTimeFactor * charTime;
  const timeStep = maxTime / numPts;

  //constant quantities appearing on the time evolution function
  const FdotU0 = dot(F, U0);
  const perProjU0overF = vec3BinOp( U0, "-", scalTim3Vec( FdotU0 / (normF**2), F ) );
  const sqrt1PlusU0sqrd = Math.sqrt( 1.0 + dot(U0, U0) );

  //Time evolution function: returns position array
  function xE(t)
  {
    let U0PlusFt = vec3BinOp( U0, "+", scalTim3Vec(t, F) );
    let sqrt1PlusU0PlusFtsqrd = Math.sqrt( 1.0 + dot(U0PlusFt, U0PlusFt) );

    let parallF = PARAM.c * (sqrt1PlusU0PlusFtsqrd - sqrt1PlusU0sqrd) / (normF**2);
    let perpenF = PARAM.c * Math.log( (normF * sqrt1PlusU0PlusFtsqrd + dot(F, U0PlusFt)) / (normF * sqrt1PlusU0sqrd + FdotU0) ) / normF;

    let parallTerm = scalTim3Vec(parallF, F);
    let perpenTerm = scalTim3Vec(perpenF, perProjU0overF);

    let dynamicTerm = vec3BinOp(parallTerm, "+", perpenTerm);

    return vec3BinOp(x0, "+", dynamicTerm);
  }

  //COMPUTATION: PROPER FRAME POSITION 4-VECTOR
  return properFrameComputation(numPts, timeStep, xE);
}


function magneticType(qred, m, Ered, Bred, x0, u0, numPts, charTimeFactor)
{
  var rescF = rescaleFields(qred, m, Ered, Bred, u0, "magneticType");
  const Ω = rescF[1]; rescF = null;

  //gamma factor related to the initial velocity
  const γ0 = γofβ( scalTim3Vec(PARAM.ooc, u0) );

  //angular frequency vector norm and unit direction
  const normΩ = norm3Vec(Ω), unitΩ = scalTim3Vec(1 / normΩ, Ω);

  const charTime = PARAM.tau / normΩ; //characteristic time
  const maxTime = charTimeFactor * charTime;
  const timeStep = maxTime / numPts;

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
  const Cos1 = tfCos( secAngle1 );
  const Cos3 = tfCos( secAngle3 );

  //sines of $\vartheta_1$ and $\vartheta_3$
  const Sin1 = tfSin( secAngle1 );
  const Sin3 = tfSin( secAngle3 );

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
            linCombCosAndSin = cosMat[l][k] * tfSin(normΩ * t) + sinMat[l][k] * (1.0 - tfCos(normΩ * t));
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
        timeDependentTerm += timeDependentMatrix[i][j] * u0[j];
      }

      x[i] += x0[i] + timeDependentTerm;
    }

    return x;
  }

  //COMPUTATION: PROPER FRAME POSITION 4-VECTOR
  return properFrameComputation(numPts, timeStep, xM);
}


function collinearType(qred, m, Ered, Bred, x0, u0, numPts, charTimeFactor)
{
  var rescF = rescaleFields(qred, m, Ered, Bred, u0, "collinearType");
  const E = rescF[0], B = rescF[1]; rescF = null;

  //gamma factor related to the initial velocity
  const γ0 = γofβ( scalTim3Vec(PARAM.ooc, u0) );

  //electric and magnetic field vector norms and unit directions
  const normE = norm3Vec(E), normB = norm3Vec(B), unitE = scalTim3Vec(1 / En, E), unitB = scalTim3Vec(1 / Bn, B);
  const snormE = 1.0 * normE, snormB = normB * Math.sign( dot(unitE, unitB) ); //new B norm: older norm times sign of new unit direction

  //rescaled initial velocity
  const v0 = scalTim3Vec(PARAM.ooc, u0);
  const normv0 = norm3Vec(v0), unitv0 = scalTim3Vec(1 / normv0, v0);


  //Rotation to align the unit vector unitE with the x_1 axis

  //direct rotation matrix
  let rot1 = [[1.0 - (unitE[1]**2 + unitE[2]**2) / (1.0 + unitE[0]), unitE[1], unitE[2]],
              [-unitE[1], 1.0 - unitE[1]**2 / (1.0 + unitE[0]), -unitE[1] * unitE[2] / (1.0 + unitE[0])],
              [-unitE[2], -unitE[1] * unitE[2] / (1.0 + unitE[0]), 1.0 - unitE[2]**2 / (1.0 + unitE[0])]];

  //inverse rotation matrix
  let tor1 = [[1.0 - (unitE[1]**2 + unitE[2]**2) / (1.0 + unitE[0]), -unitE[1], -unitE[2]],
              [unitE[1], 1.0 - unitE[1]**2 / (1.0 + unitE[0]), -unitE[1] * unitE[2] / (1.0 + unitE[0])],
              [unitE[2], -unitE[1] * unitE[2] / (1.0 + unitE[0]), 1.0 - unitE[2]**2 / (1.0 + unitE[0])]];

  //function to undo the rotation
  function undoRot(vec)
  { return matrixDotVector(tor1, vec); }


  //execute the rotation

  //initial velocity unit vector
  let rotunitv0 = matrixDotVector(rot1, unitv0);

  //normalized initial rotated velocity
  let v01 = normv0 * rotunitv0[0], v02 = normv0 * rotunitv0[1], v03 = normv0 * rotunitv0[2];

  //characteristic time
  function charT(N)
  { return (γ0 / snormE) * ( normv0 * (Math.cosh(snormE * PARAM.tau * N / snormB) - 1.0) + Math.sinh(snormE * PARAM.tau * N / snormB) ); }
  const maxTime = charT(charTimeFactor);
  const timeStep = maxTime / numPts;

  //constant terms involved in the time evolution routine
  let γ0v0 = γ0 * normv0;

  //time evolution of position

  function γ0v0PlusEt(t)
  { return γ0v0 + snormE * t; }

  function sqrtTime(t)
  { return Math.sqrt( γ0v0PlusEt(t)**2 + γ0**2 * (1.0 - normv0**2) ); }

  function timeArg(t)
  {
    let logArg = ( sqrtTime(t) + γ0v0PlusEt(t) ) / ( γ0 + γ0v0 );
    return snormB * Math.log( logArg ) / snormE;
  }

  //compute the rectangular components of position, then undo the rotation, and finally add the initial position
  function xEparM(t)
  {
    let x1mx10 = (sqrtTime(t) - γ0) / snormE;
    let x2mx20 = γ0 * ( v03 * ( tfCos( timeArg(t) ) - 1.0 ) + v02 * tfSin( timeArg(t) ) ) / snormB;
    let x3mx30 = γ0 * (-v02 * ( tfCos( timeArg(t) ) - 1.0 ) + v03 * tfSin( timeArg(t) ) ) / snormB;
    let vecDynSln = undoRot([x1mx10, x2mx20, x3mx30]);
    return vec3BinOp( x0, "+", vecDynSln );
  }

  //COMPUTATION: PROPER FRAME POSITION 4-VECTOR
  return properFrameComputation(numPts, timeStep, xEparM);
}


function properFrameComputation(numPts, timeStep, x)
{
  let tempPropPos;
  let propTime = Array.from( {length : numPts}, (v, i) => 0 );
  let propPosx = Array.from( {length : numPts}, (v, i) => 0 );
  let propPosy = Array.from( {length : numPts}, (v, i) => 0 );
  let propPosz = Array.from( {length : numPts}, (v, i) => 0 );

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
