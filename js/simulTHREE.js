///THREE.JS ANIMATION
import {expNot} from "./HTMLfunctions.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

var camera, scene, renderer, geometry, material, mesh;
// Boolean for start and restart
var initAnim = true;
var runAnim = false;
var isPlay = false;
var i = 0; //index counter
var qPts = 1;
var cnv, startButton, sbID, resetButton, rbID;
let ta, xa, ya, za;

var controls;

var xyzAxes;
var sound, listener, audioLoader;

var renderScene, bloomPass, bloomComposer;

export function simulanimate(canv, startBtn, resetBtn, qP, txyzAr)
{
  cnv = canv, sbID = startBtn, rbID = resetBtn;
  qPts = qP;
  ta = txyzAr[0], xa = txyzAr[1], ya = txyzAr[2], za = txyzAr[3];
  init();
  render();
}

function init()
{
  startButton = document.getElementById(sbID);
  resetButton = document.getElementById(rbID);
  resetButton.hidden = false;
  startButton.hidden = false;

 // Start Button
  startButton.onclick = function StartAnimation()
  {
    if (initAnim)
    {
      initAnim = false;
      runAnim = true;
      i = 0;
      sound.play();
    }
    // Start and Pause
    if (runAnim)
    {
      startButton.innerHTML = 'Pause';
      runAnim = false;
      isPlay = true;
      animate();
      sound.play();
    }
    else if (!runAnim)
    {
      runAnim = true;
      isPlay = false;
      //sound.pause();
    }
    resetButton.hidden = true;
  }
 // Reset Button
   resetButton.onclick = function ResetParameters()
   {
     // Set StartButton to Start
     startButton.innerHTML = 'Start';
     startButton.hidden = false;
     resetButton.hidden = true;
     // Boolean for Stop Animation
     initAnim = true;
     runAnim = false;
     i = 0;
     isPlay = false;
     cameraPos(camera); //initial camera position
     render();
   }

  ////////

  const canvas = document.getElementById(cnv);
  const minDim = Math.min( window.innerWidth, window.innerHeight );
  canvas.width = minDim, canvas.height = minDim;
  renderer = new THREE.WebGLRenderer({canvas, preserveDrawingBuffer : false, antialias: true}); //
  renderer.autoClearColor = false;

  //create a camera (define the frustum)
  const fov = 75; // 75/360 = 5/24 of a revolution
  const aspect = 1;
  const near = 0.125;
  const far = 4;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  cameraPos(camera); //camera position

  //make a scene
  scene = new THREE.Scene();

  //set background color
  scene.background = new THREE.Color(window.getComputedStyle(document.body, null).getPropertyValue("background-color"));
  
  //controls = new OrbitControls(camera, renderer.domElement);
  
  xyzAxes = new THREE.AxesHelper();
  xyzAxes.position.x = xa[0], xyzAxes.position.y = ya[0], xyzAxes.position.z = za[0];
  scene.add( xyzAxes );

  //ilumination
  {
    const ilumColour = 0xFFFFFF;
    const intensity = 15 / 16;
    const light1 = new THREE.DirectionalLight(ilumColour, intensity);
    light1.position.set(0, 0, 0);
    scene.add(light1);
    const light2 = new THREE.DirectionalLight(ilumColour, intensity);
    light2.position.set(1, 1, 1);
    scene.add(light2);
  }

  // create an AudioListener and add it to the camera
  listener = new THREE.AudioListener();
  camera.add( listener );

  // create the PositionalAudio object (passing in the listener)
  sound = new THREE.PositionalAudio( listener );

  // load a sound and set it as the PositionalAudio object's buffer
  audioLoader = new THREE.AudioLoader();
  audioLoader.load( "sounds/destination.mp3", function( buffer )
  {
    sound.setBuffer( buffer );
    sound.setRefDistance( 20 );
    sound.hasPlaybackControl = true;
    //sound.play();
  });

  //create a sphere geometry
  const radius = (1/2**16) * (window.innerWidth + window.innerHeight);
  const res1 = 16;
  const res2 = 16;
  geometry = new THREE.SphereGeometry(radius, res1, res2);

  //create a basic material and set its color
  material = new THREE.MeshPhongMaterial({color : 0x44aa88});

  //create a mesh
  mesh = new THREE.Mesh(geometry, material);

  //add the mesh to the scene
  scene.add(mesh);
  
  // finally add the sound to the mesh
  mesh.add(sound);

  mesh.position.x = xa[0];
  mesh.position.y = ya[0];
  mesh.position.z = za[0];

  ////////
  //bloom renderer
renderScene = new RenderPass(scene, camera);
bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
bloomPass.threshold = 0;
bloomPass.strength = 2; //intensity of glow
bloomPass.radius = 0;
bloomComposer = new EffectComposer(renderer);
bloomComposer.setSize(window.innerWidth, window.innerHeight);
bloomComposer.renderToScreen = true;
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);
  ////////
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

function cameraPos(cam)
{ //initial camera position
  cam.position.x = 5/4;
  cam.position.y = 5/4;
  cam.position.z = 5/4;
  cam.lookAt(0, 0, 0);
}

function animate()
{
  //console.log(runAnim);
  if (!isPlay || i >= qPts - 1)
  {
    if (!isPlay) {startButton.innerHTML = 'Resume';}
    if (i >= qPts - 1)
    {
      startButton.hidden = true;
      resetButton.hidden = false;
    }
    sound.stop();
    return;
  }
  requestAnimationFrame(animate);
  i += 1;
  render();
  bloomComposer.render();
}


function render()
{
  if (resizeRendererToDisplaySize(renderer))
  {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  mesh.position.x = xa[i];
  mesh.position.y = ya[i];
  mesh.position.z = za[i];
  document.getElementById("tim").innerHTML = expNot(ta[i]) + " s";
  renderer.render(scene, camera);
}


function resizeRendererToDisplaySize(renderer) //solve pixelation
{
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width != width || canvas.height != height;
  if (needResize)
  {
    renderer.setSize(width, height, false);
    bloomComposer.setSize(window.innerWidth, window.innerHeight);
  }
  return needResize;
}
