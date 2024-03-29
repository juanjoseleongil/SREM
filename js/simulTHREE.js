import {TOL, ptsPerCharTime, qVec} from "./RMCUEMFparams.js";
import {numPts, unitE, unitB, normEred, normBred} from "./RMCUEMFcompute.js";
import {expNot} from "./HTMLfunctions.js";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GPUStatsPanel } from "three/examples/jsm/utils/GPUStatsPanel.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

//VARIABLES
var parentDiv, canvas, startButton, resetButton, frameTitle, timeSpan;
var camera, scene, renderer, controls, xyzAxes, trailCamera;
var partRadius, partWidthSeg, partHeightSeg, partGeom, partMate, partMesh;
var trailPoints, trailSpline, trailGeom, trailMate, trailMesh;
var cyliGeom, coneGeom, elecFieldArr, magnFieldArr;
var qVec3, vecSize, locVx, locVy, locVz, countItem;
var animRunning;
var i, step, animPace;
var ta, xa, ya, za, orig;
var sound, listener, audioLoader;
var clock, renderTime, renderDelta;
var stats, statsPanels, guiPanel;
var ptclClr, traiClr, elecClr, magnClr, resDefC;
var soundsLocation = "./sounds", soundsList = ['Classical.wav', 'Constellation.m4a', 'Destination.mp3', 'ElevatorBossa.ogg', 'Waves.m4a']; //['Alarm.m4a', 'Classical.wav', 'Constellation.m4a', 'Destination.mp3', 'ElevatorBossa.ogg', 'NoiseBrownian.ogg', 'NoisePink.ogg', 'NoiseWhite.ogg', 'Sawtooth440Hz.ogg', 'Sine440Hz.ogg', 'Square440Hz.ogg', 'Square440HzNoAlias.ogg', 'Waves.m4a'];
var soundPPRbtn, soundSbtn, props;
const unicodePlayPause = "\u23EF", unicodePlay = "\u25B6", unicodePause = "\u23F8", unicodeStop = "\u23F9";

export function simulanimate(parDiv, canv, txyzAr, sOrigin)
{
  //INITIAL VALUES
  parentDiv = null, canvas = null, startButton = null, resetButton = null, frameTitle = null, timeSpan = null;
  camera = null, scene = null, renderer = null, controls = null, xyzAxes = null, trailCamera = null;
  partRadius = null, partWidthSeg = null, partHeightSeg = null, partGeom = null, partMate = null, partMesh = null;
  trailPoints = null, trailSpline = null, trailGeom = null, trailMate = null, trailMesh = null;
  cyliGeom = null, coneGeom = null, elecFieldArr = new THREE.Group(), magnFieldArr = new THREE.Group();
  qVec3 = Math.pow(qVec, 3), vecSize = null, locVx = null, locVy = null, locVz = null, countItem = null;
  animRunning = false;
  i = 0, step = 1, animPace = ptsPerCharTime / 8.0;
  ta = null, xa = null, ya = null, za = null, orig = null;
  sound = null, listener = null, audioLoader = null;
  clock = new THREE.Clock(), renderTime = 0, renderDelta = 0;
  stats = null, statsPanels = null, guiPanel = null;
  ptclClr = null, traiClr = null, elecClr = null, magnClr = null, resDefC = null;
  soundPPRbtn = null, soundSbtn = null;
  props = {Start: playPauseResumeAnim,
           Reset: resetAnim,
           particleClr: "#ffffff",
           trailClr: "#00ffff",
           electricClr: "#ff00ff",
           magneticClr: "#ffff00",
           resDefCol: resetDefaultColors,
           followParticle: false,
           showPerformance: false,
           enableControls: true,
           soundSource: `${soundsLocation}/${soundsList[Math.floor(soundsList.length * Math.random())]}`,
           soundPlayPauseResume: function() { if (!sound.isPlaying) {playSound()} else {pauseSound()} },
           soundStop: stopSound};

  //DOM ELEMENTS
  parentDiv = document.getElementById(parDiv);
  canvas = document.getElementById(canv);

  frameTitle = document.createElement("h3");
  timeSpan = document.createElement("span");

  parentDiv.appendChild(frameTitle);
  parentDiv.appendChild(timeSpan);

  ta = txyzAr[0], xa = txyzAr[1], ya = txyzAr[2], za = txyzAr[3];
  orig = sOrigin;
  init();
  render();
}

function init()
{
  {//SET UP ELEMENTS
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth * window.devicePixelRatio, canvas.clientHeight * window.devicePixelRatio, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
  }

  {//CAMERA
    const fov = (5.0 / 24.0) * 360.0, aspect = 1.0, near = 1.0 / 8.0, far = 4.0;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    trailCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    setInitCamsPos(); //set cameras' initial position
  }

  scene = new THREE.Scene(); //MAKE A SCENE
  scene.background = new THREE.Color(window.getComputedStyle(document.body, null).getPropertyValue("background-color")); //SET BACKGROUND COLOR

  {//TEXT DOM ELEMENTS INSIDE CANVAS
    frameTitle.innerHTML = "Laboratory frame";
    frameTitle.style.cssText += "position: absolute; margin-top: 0%; margin-left: 12.5%; z-index: 1;";
    timeSpan.style.cssText += "position: absolute; margin-top: 6.125%; margin-left: 12.5%; z-index: 1;";
  }

  {//ORBIT CONTROLS
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 1.0 / 8.0;
  }
  
  {//XYZ AXES
    xyzAxes = new THREE.AxesHelper();
    xyzAxes.position.set(orig[0], orig[1], orig[2]);
    scene.add(xyzAxes);
  }

  {//XY, YZ AND ZX PLANES
    const longside = 2.0, shortside = 1.0 / 128.0;
    const xygeo = new THREE.BoxGeometry(longside, longside, shortside);
    const yzgeo = new THREE.BoxGeometry(shortside, longside, longside);
    const zxgeo = new THREE.BoxGeometry(longside, shortside, longside);
    const planesMat = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide });
    planesMat.transparent = true, planesMat.opacity = 1.0 / 16.0;
    const xyplane = new THREE.Mesh(xygeo, planesMat);
    const yzplane = new THREE.Mesh(yzgeo, planesMat);
    const zxplane = new THREE.Mesh(zxgeo, planesMat);
    for (var ob of [xyplane, yzplane, zxplane]) { ob.position.set(orig[0], orig[1], orig[2]); scene.add(ob); }
  }

  {//ILLUMINATION
    const colour = 0xFFFFFF, intensity = 7.0 / 8.0, dist = 10;
    const lightPos = [[orig[0], orig[1] + dist, orig[2]], [orig[0], orig[1] - dist, orig[2]]];
    for (var pos of lightPos) { createAndPosLight(colour, intensity, pos); }
  }

  {//SOUND SETUP
    listener = new THREE.AudioListener(); //create an AudioListener
    camera.add(listener); //add the AudioListener to the main camera
    sound = new THREE.PositionalAudio(listener); //create the positional audio object (passing in the listener)
    audioLoader = new THREE.AudioLoader(); //create an audio loader
    audioLoader.load(props.soundSource, onLoadCallback); //load a sound and set it as the PositionalAudio object's buffer
  }

  {//PARTICLE SETUP
    partRadius = 1 / 32.0, partWidthSeg = 32, partHeightSeg = 32;
    partGeom = new THREE.SphereGeometry(partRadius, partWidthSeg, partHeightSeg); //create a sphere geometry
    partMate = new THREE.MeshPhongMaterial({color : new THREE.Color(props.particleClr)}); //create a basic material and set its color
    partMesh = new THREE.Mesh(partGeom, partMate); //create a mesh for the particle
    partMate.needsUpdate = true; //required if color is updated
    scene.add(partMesh); //add the particle mesh to the scene
    partMesh.add(sound); //add the sound to the particle mesh
    partMesh.add(trailCamera); //add the trail camera to the particle mesh
    setParticlePos(0); //particle's initial position
  }
  
  {//TRAIL SETUP
    trailPoints = [];
    for (var ipt = 0; ipt < numPts; ipt++) { trailPoints.push( new THREE.Vector3(xa[ipt], ya[ipt], za[ipt]) ); }
    trailSpline = new THREE.CatmullRomCurve3(trailPoints);

    trailGeom = new THREE.TubeGeometry(trailSpline, numPts, 0.125 * partRadius);
    trailMate = new THREE.MeshPhongMaterial( { color: props.trailClr, wireframe: false } );
    trailMate.transparent = true, trailMate.opacity = 1.0 / 2.0;
    trailMesh = new THREE.Mesh(trailGeom, trailMate);
    scene.add(trailMesh);
  }  

  {//VECTOR FIELDS
    const maxF = Math.max(normEred, normBred);
    const Er = normEred / maxF, Br = normBred / maxF;
    vecSize = 1.0 / qVec;
  
    cyliGeom = new THREE.CylinderGeometry(vecSize / 32.0, vecSize / 32.0, 0.5 * vecSize); //arrow body
    coneGeom = new THREE.ConeGeometry(vecSize / 16.0, 0.5 * vecSize); //arrow head
    cyliGeom.translate(0, 0.25 * vecSize, 0); coneGeom.translate(0, 0.75 * vecSize, 0); //correct placement
    cyliGeom.rotateX( Math.PI / 2 ); coneGeom.rotateX( Math.PI / 2 ); //correct orientation

    if (!isNaN(Er) && isFinite(Er) && Er > TOL) { createVecFieldMesh(elecFieldArr, unitE, Er, props.electricClr); }
    if (!isNaN(Br) && isFinite(Br) && Br > TOL) { createVecFieldMesh(magnFieldArr, unitB, Br, props.magneticClr); }
  }

  {//STATS
    stats = new Stats(); //stats panel including FPS, MS, MB
    stats.addPanel( new GPUStatsPanel( renderer.getContext() ) ); //include GPU stats panel
    parentDiv.appendChild(stats.domElement);
    stats.domElement.setAttribute("style", "position: absolute; z-index: 1;");
    statsPanels = stats.domElement.children;
    for (var panel of statsPanels)
    {
      panel.setAttribute("style", "display: none; top: 0%; left: 0%;"); //initially, don't show any panel, but set their locations
      panel.addEventListener("click", function (event) { event.stopPropagation(); }, true); //remove function that cycles between panels and hides the other ones
    }
  }

  {//GUI PANEL
    guiPanel = new GUI( { autoPlace: true } );
    parentDiv.appendChild(guiPanel.domElement);
    guiPanel.domElement.style.cssText = "position: relative; width: 25%; margin-left: 75%; margin-top: 0%; z-index: 1;";
    const folder1 = guiPanel.addFolder("Animation status");
    const folder2 = guiPanel.addFolder("Colors");
    const folder3 = guiPanel.addFolder("Sound");
    folder2.close(); folder3.close();
    
    startButton = folder1.add(props, "Start").name(unicodePlayPause).listen();
    resetButton = folder1.add(props, "Reset").name(unicodeStop).listen();

    folder1.add(props, "followParticle")
      .name("Follow particle")
      .listen()
      .onChange( function()
        {
          if (props.followParticle) {trailCamera.add(listener); camera.remove(listener); controls.enabled = false; }
          else if (!props.followParticle) {trailCamera.remove(listener); camera.add(listener); controls.enabled = true; }
        } );

    folder1.add(props, "enableControls").name("Orbit controls").listen().onChange( function(bool) {controls.enabled = bool;} );

    folder1.add(props, "showPerformance")
      .name("Performance monitor")
      .listen()
      .onChange( function()
        {
          if (props.showPerformance) {for (var panel of statsPanels) {panel.style.display = "block"};}
          else if (!props.showPerformance) {for (var panel of statsPanels) {panel.style.display = "none"};}
        } );

    ptclClr = folder2.addColor(props, "particleClr").name("Particle").listen();
    traiClr = folder2.addColor(props, "trailClr").name("Trail").listen();
    elecClr = folder2.addColor(props, "electricClr").name("Electric field").listen();
    magnClr = folder2.addColor(props, "magneticClr").name("Magnetic field").listen();
    resDefC = folder2.add(props, "resDefCol").name("Reset default colors").listen();
    
    ptclClr.onChange( function() { partMesh.material.color.set(props.particleClr); } );
    traiClr.onChange( function() { trailMesh.material.color.set(props.trailClr); } );
    elecClr.onChange( function() { for (var obj of elecFieldArr.children) { console.log(obj); obj.material.color.set(props.electricClr); }; } );
    magnClr.onChange( function() { for (var obj of magnFieldArr.children) { console.log(obj); obj.material.color.set(props.magneticClr); }; } );

    folder3.add(props, "soundSource", soundsList)
      .name("Source")
      .listen()
      .onChange( async function(opt)
        {
          props.soundSource = `${soundsLocation}/${opt}`;
          await audioLoader.load(props.soundSource, onLoadCallback);
        } );
    soundPPRbtn = folder3.add(props, "soundPlayPauseResume").name(unicodePlayPause).listen();
    soundSbtn = folder3.add(props, "soundStop").name(unicodeStop).listen();
  }
}

//ADDITIONAL FUNCTIONS
/*
async function getDirFileNames(dirLocation, namesList)
{//adapted from "abalter/listdir.js" (https://gist.github.com/abalter/b5357657311349e06bc5b32222f37030), to work with vanilla JS, no jQuery
  function parseDirectoryListing(text)
  {
    namesList = text
      .match(/href="([\w]+)\.\w{2,}/g) //pull out the hrefs
      .map((x) => x.replace('href="', '')); //clean up
    console.log("From inside: ", namesList);
  }

  await fetch(dirLocation)
    .then( (response) => { if (response.ok) {return response.text();}
                          else {throw new Error(response.status);} } )
    .then( (data) => parseDirectoryListing(data) )
    .catch( (err) => console.error(err) );
}
*/

function createAndPosLight(colour, intensity, pos)
{
  const light = new THREE.DirectionalLight(colour, intensity);
  light.position.set(pos[0], pos[1], pos[2]); //light.castShadow = true;
  scene.add(light);
}


function createVecFieldMesh(arrow, unit, relSize, col)
{
  var dummy = new THREE.Object3D();
  dummy.scale.set(1, 1, relSize); //sets the scale for the length of the arrow
  var cyliMesh = new THREE.InstancedMesh(cyliGeom, new THREE.MeshPhongMaterial(), qVec3);
  var coneMesh = new THREE.InstancedMesh(coneGeom, new THREE.MeshPhongMaterial(), qVec3);
  countItem = 0;

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
        dummy.lookAt(locVx + 10 * vecSize * unit[0], locVy + 10 * vecSize * unit[1], locVz + 10 * vecSize * unit[2]);
        dummy.updateMatrix();

        for (var obj of [cyliMesh, coneMesh])
        {
          obj.setMatrixAt(countItem, dummy.matrix);
          obj.setColorAt(countItem, new THREE.Color(col));
        }
        countItem += 1;
      }
    }
  }
  arrow.add(coneMesh); arrow.add(cyliMesh); arrow.needsUpdate = true; scene.add(arrow);
}


function playPauseResumeAnim()
{//⏵⏸ ⏯︎
  if (!animRunning)
  {
    animRunning = true; animate();
    startButton.name(unicodePause);
    playSound();
  }
  else if (animRunning)
  {
    animRunning = false;
    startButton.name(unicodePlay);
    pauseSound();
  }
}


function resetAnim()
{//⏹
  animRunning = false; startButton.domElement.style.display = "block";
  startButton.name(unicodePlayPause);
  stopSound(); props.enableControls = true;
  i = 0, renderTime = 0, setInitCamsPos();
  setParticlePos(0);
}


function playSound() { if (!sound.isPlaying) { sound.play(); soundPPRbtn.name(unicodePause); } }

function pauseSound() { if (sound.isPlaying) { sound.pause(); soundPPRbtn.name(unicodePlay); } }

function stopSound() { if (sound != null) { sound.stop(); soundPPRbtn.name(unicodePlayPause); } }


function setParticlePos(index)
{
  partMesh.position.set(xa[index], ya[index], za[index]);

  var timeText;
  if (i === 0) {timeText = "t = " + "0 s";} else {timeText = "t = " + expNot(ta[index]) + " s";}
  timeSpan.innerHTML = timeText;
}


function setInitCamsPos()
{ //initial cameras position
  camera.position.set(xa[0] + 5.0 / 4.0, ya[0] + 5.0 / 4.0, za[0] + 5.0 / 4.0);
  camera.lookAt(xa[0], ya[0], za[0]);
  trailCamera.position.set(xa[0] - 2 * partRadius, ya[0] - 2 * partRadius, za[0] - 2 * partRadius);
  trailCamera.lookAt(xa[0], ya[0], za[0]);
}


function resetDefaultColors()
{
  this.particleClr = "#ffffff"; this.trailClr = "#00ffff"; 
  this.electricClr = "#ff00ff"; this.magneticClr = "#ffff00";
  partMesh.material.color.set("#ffffff"); trailMesh.material.color.set("#00ffff");
  for (var obj of elecFieldArr.children) { obj.material.color.set("#ff00ff"); };
  for (var obj of magnFieldArr.children) { obj.material.color.set("#ffff00"); };
}


function onLoadCallback(buffer)
{
  sound.setBuffer(buffer); sound.setRefDistance(1);
  sound.hasPlaybackControl = true; sound.setLoop(true);
}


function animate()
{
  renderDelta = clock.getDelta();
  if (!animRunning || i >= numPts - 1 || renderTime >= numPts - 1)
  {
    step = 0;
    if (i >= numPts - 1 || renderTime >= numPts - 1)
    { startButton.domElement.style.display = "none"; }
  }
  else
  {
    step = 1; setParticlePos(i);
    trailCamera.position.set(xa[i] - 2 * partRadius, ya[i] - 2 * partRadius, za[i] - 2 * partRadius);
    trailCamera.lookAt(xa[i], ya[i], za[i]);
  }

  renderTime += animPace * step * renderDelta;
  i = parseInt(Math.round(renderTime));
  requestAnimationFrame(animate);
  render();
  controls.update(); stats.update();
}


function resizeRendererToDisplaySize(renderer)
{
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width  = canvas.clientWidth  * pixelRatio | 0;
  const height = canvas.clientHeight * pixelRatio | 0;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize)
  {
    renderer.setSize(width, height, false);
  }
  return needResize;
}


function render()
{
  if (resizeRendererToDisplaySize(renderer))
  {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, props.followParticle === true ? trailCamera : camera);
}
