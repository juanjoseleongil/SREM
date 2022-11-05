import {TOL, ptsPerCharTime, qVec} from "./RMCUEMFparams.js";
import {numPts, unitE, unitB, normEred, normBred} from "./RMCUEMFcompute.js";
import {expNot} from "./HTMLfunctions.js";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
//import Stats from "three/examples/jsm/libs/stats.module.js";
//import GPUStatsPanel from "three/examples/jsm/utils/GPUStatsPanel.js";
//import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

//VARIABLES
var cnv, cnvfactor = 15.0 / 16.0, startButton, sbID, resetButton, rbID;
var camera, scene, renderer, radius, partGeom, partMate, partMesh, controls, xyzAxes;
var cyliGeom, coneGeom, cyliMesh, coneMesh, arrow, fieldMate, efDummy = new THREE.Object3D(), bfDummy = new THREE.Object3D();
var qVec3 = Math.pow(qVec, 3), vecSize, locVx, locVy, locVz, countItem;
var animStarted, animRunning;
var i = 0, step = 1, animPace = ptsPerCharTime / 4.0;
var ta, xa, ya, za, orig;
var sound, listener, audioLoader, soundStartedAt = 0, soundPausedAt = 0;
var minWinDim = Math.min(window.innerWidth, window.innerHeight);
const clock = new THREE.Clock(); var renderTime, renderDelta;
//var panel, stats, gpuPanel;

export function simulanimate(canv, startBtnID, resetBtnID, txyzAr, sOrigin)
{
  cnv = canv, sbID = startBtnID, rbID = resetBtnID;
  ta = txyzAr[0], xa = txyzAr[1], ya = txyzAr[2], za = txyzAr[3];
  orig = sOrigin;
  init();
  render();
  startButton.click(); resetButton.click();
}

function init()
{
  //SET UP START (PLAY, PAUSE, RESUME) AND RESET BUTTONS
  startButton = document.getElementById(sbID);
  resetButton = document.getElementById(rbID);
  startButton.onclick = playPauseResumeAnim;
  resetButton.onclick = resetAnim;

  //SET UP ELEMENTS
  const canvas = document.getElementById(cnv);
  renderer = new THREE.WebGLRenderer({canvas});
  renderer.setSize(cnvfactor * minWinDim, cnvfactor * minWinDim);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  //CREATE A CAMERA
  const fov = (5.0 / 24.0) * 360.0, aspect = 1.0, near = 1.0 / 8.0, far = 4.0;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  setInitCamPos(camera); //set camera's initial position

  scene = new THREE.Scene(); //MAKE A SCENE
  scene.background = new THREE.Color(window.getComputedStyle(document.body, null).getPropertyValue("background-color")); //SET BACKGROUND COLOR

  controls = new OrbitControls(camera, renderer.domElement); //ORBIT CONTROLS
  controls.enableDamping = true;
  controls.dampingFactor = 1.0 / 8.0;
  
  //{//STATS
    //stats = new Stats();
    //document.body.appendChild(stats.dom);
    //gpuPanel = new GPUStatsPanel( renderer.getContext() );
    //stats.addPanel(gpuPanel);
    //stats.showPanel(0); stats.showPanel(1); stats.showPanel(2); \\stats.showPanel(3);
  //}
  
  {//XYZ AXES
    xyzAxes = new THREE.AxesHelper();
    xyzAxes.position.set(orig[0], orig[1], orig[2]);
    scene.add(xyzAxes);
  }

  {//XY, YZ AND ZX PLANES
    const longside = 2.0, shortside = 1.0 / 64.0;
    const xygeo = new THREE.BoxGeometry(longside, longside, shortside);
    const yzgeo = new THREE.BoxGeometry(shortside, longside, longside);
    const zxgeo = new THREE.BoxGeometry(longside, shortside, longside);
    const planesMat = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, });
    planesMat.transparent = true, planesMat.opacity = 1.0 / 16.0;
    const xyplane = new THREE.Mesh(xygeo, planesMat);
    const yzplane = new THREE.Mesh(yzgeo, planesMat);
    const zxplane = new THREE.Mesh(zxgeo, planesMat);
    for (var ob of [xyplane, yzplane, zxplane])
    { ob.position.set(orig[0], orig[1], orig[2]); }
    scene.add(xyplane);
    scene.add(yzplane);
    scene.add(zxplane);
  }

  {//ILLUMINATION
    const lightColour = 0xFFFFFF;
    const intensity = 15.0 / 16.0;
    const light1 = new THREE.DirectionalLight(lightColour, intensity);
    light1.position.set(orig[0] - 1, orig[1] - 1, orig[2] - 1);
    scene.add(light1);
    const light2 = new THREE.DirectionalLight(lightColour, intensity);
    light2.position.set(orig[0] + 1, orig[1] + 1, orig[2] + 1);
    scene.add(light2);
  }

  //// SOUND SETUP ////
  // create an AudioListener and add it to the camera
  listener = new THREE.AudioListener();
  camera.add(listener);

  // create the PositionalAudio object (passing in the listener)
  sound = new THREE.PositionalAudio(listener);

  // load a sound and set it as the PositionalAudio object's buffer
  audioLoader = new THREE.AudioLoader();
  audioLoader.load("sounds/destination.mp3", function(buffer)
  {
    sound.setBuffer( buffer );
    sound.setRefDistance( 20 );
    sound.hasPlaybackControl = true;
  });

  //// PARTICLE SETUP ////
  radius = (1.0 / 2.0**16) * (window.innerWidth + window.innerHeight);
  const res1 = 16, res2 = 16;
  partGeom = new THREE.SphereGeometry(radius, res1, res2); //create a sphere geometry
  partMate = new THREE.MeshPhongMaterial({color : new THREE.Color(document.getElementById("prtclClr").value)}); //create a basic material and set its color
  partMesh = new THREE.Mesh(partGeom, partMate); //create a mesh for the particle
  scene.add(partMesh); //add the particle mesh to the scene
  partMesh.add(sound); //add the sound to the particle mesh
  setParticlePos(0); //particle's initial position

    //// VECTOR FIELDS ////
  const maxF = Math.max(normEred, normBred);
  const Er = normEred / maxF;
  const Br = normBred / maxF;
  vecSize = 1.0 / qVec;
  
  cyliGeom = new THREE.CylinderGeometry(vecSize / 32.0, vecSize / 32.0, 0.5 * vecSize);
  coneGeom = new THREE.ConeGeometry(vecSize / 16.0, 0.5 * vecSize);
  cyliGeom.translate(0, 0.25 * vecSize, 0);
  coneGeom.translate(0, 0.75 * vecSize, 0);
  fieldMate = new THREE.MeshPhongMaterial();

  if (!isNaN(Er) && isFinite(Er) && Er > TOL)
  { createVecFieldMesh(efDummy, unitE, Er, new THREE.Color(document.getElementById("electricClr").value)); }

  if (!isNaN(Br) && isFinite(Br) && Br > TOL)
  { createVecFieldMesh(bfDummy, unitB, Br, new THREE.Color(document.getElementById("magneticClr").value)); }
  
  //// PANEL ////
  //panel = new GUI( { width: 0.25 * cnvfactor * minWinDim } );

}

function createVecFieldMesh(dummy, unit, relSize, col)
{
  cyliMesh = new THREE.InstancedMesh(cyliGeom, fieldMate, qVec3);
  coneMesh = new THREE.InstancedMesh(coneGeom, fieldMate, qVec3);
  arrow = new THREE.Group();
  arrow.add(coneMesh); arrow.add(cyliMesh);
  countItem = 0;
  
  dummy.scale.set(1, relSize, 1); //sets the scale for the length of the arrow

  for (var ix = 0; ix < qVec; ix++)
  {
    for (var iy = 0; iy < qVec; iy++)
    {
      for (var iz = 0; iz < qVec; iz++)
      {
        locVx = xa[0] - 1 + 2 * ix / (qVec - 1);
        locVy = ya[0] - 1 + 2 * iy / (qVec - 1);
        locVz = za[0] - 1 + 2 * iz / (qVec - 1);

        dummy.position.set(locVx, locVy, locVz);
        dummy.lookAt(locVx + 2 * vecSize * unit[0], locVy + 2 * vecSize * unit[1], locVz + 2 * vecSize * unit[2]);
        dummy.updateMatrix();

        for (var obj of [cyliMesh, coneMesh])
        {
          obj.setMatrixAt(countItem, dummy.matrix);
          obj.setColorAt(countItem, col);
        }
        countItem += 1;
      }
    }
  }

  scene.add(arrow);

  for (var obj of [coneMesh, cyliMesh])
  {
    obj.instanceMatrix.needsUpdate = true;
    obj.instanceColor.needsUpdate = true;
    scene.add(obj);
  }
}

function playPauseResumeAnim()
{
  if (!animStarted)
  {
    animStarted = true; soundPausedAt = 0.001 * Date.now();
  }

  if (!animRunning)
  {
    animRunning = true; animate();
    soundStartedAt = 0.001 * Date.now();
    startButton.innerHTML = "Pause";
    //if (!sound.isPlaying) { sound.play(soundStartedAt - soundPausedAt); }
  }
  else if (animRunning)
  {
    animRunning = false;
    startButton.innerHTML = "Resume";
    //soundPausedAt = 0.001 * Date.now(); if (sound.isPlaying) { sound.pause(); }
  }
}

function resetAnim()
{
  animStarted = false, animRunning = false;
  startButton.innerHTML = "Start"; startButton.disabled = false;
  if (sound.isPlaying) { sound.stop(); } //soundStartedAt = 0.001 * Date.now(); soundPausedAt = 0.001 * Date.now(), 
  i = 0, renderTime = 0, setInitCamPos(camera);
  setParticlePos(0);
}

function animate()
{
  renderDelta = clock.getDelta();
  if (!animRunning || i >= numPts - 1 || renderTime >= numPts - 1)
  {
    //if (animStarted && i < numPts - 1) { soundPausedAt = 0.001 * Date.now(); sound.pause(); }
    //else
    //{
    //  if (sound.isPlaying) { sound.stop(); }
    //  startButton.disabled = true;
    //}
    step = 0; 
  }
  else { step = 1; }
  renderTime += animPace * step * renderDelta;
  i = parseInt(Math.round(renderTime)); //i += step;
  requestAnimationFrame(animate);
  render();
  controls.update();
  //stats.update();
}

function setParticlePos(index)
{
  partMesh.position.set(xa[index], ya[index], za[index]);
  var timeText;
  if (i === 0) {timeText = "0 s";} else {timeText = expNot(ta[index]) + " s";}
  document.getElementById("tim").innerHTML = timeText;
}

function render()
{
  if (resizeRendererToDisplaySize(renderer))
  {
    camera.aspect = 1.0;
    camera.updateProjectionMatrix();
  }
  setParticlePos(i);
  renderer.render(scene, camera);
}


function resizeRendererToDisplaySize(renderer) //solve pixelation
{
  const canvas = renderer.domElement;
  const minDim = Math.min(canvas.clientWidth, canvas.clientHeight);
  const needResize = Math.min(canvas.width, canvas.height) != minDim;
  if (needResize)
  {
    renderer.setSize(cnvfactor * minDim, cnvfactor * minDim, false);
  }
  return needResize;
}

function setInitCamPos(cam)
{ //initial camera position
  cam.position.set(xa[0] + 5.0 / 4.0, ya[0] + 5.0 / 4.0, za[0] + 5.0 / 4.0);
  cam.lookAt(xa[0], ya[0], za[0]);
}
