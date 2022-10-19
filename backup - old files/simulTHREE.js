///THREE.JS ANIMATION
import * as THREE from "https://unpkg.com/three/build/three.module.js";

var camera, scene, renderer, geometry, material, mesh;
// Boolean for start and restart
var initAnim = true;
var runAnim = false;
var isPlay = false;
var theta = 0;
var startButton, resetButton;

export function simulanimate()
{
  init();
  render();
}

function init()
{
  // Buttons startButton and resetButton
  startButton = document.getElementById( "lfStartBtn" );
  resetButton = document.getElementById( "lfResetBtn" );

 // Start Button
  startButton.onclick = function StartAnimation()
  {
    if (initAnim)
    {
      initAnim = false;
      runAnim = true;
      theta = 0;
    }
    // Start and Pause
    if (runAnim)
    {
      startButton.innerHTML = 'Pause';
      runAnim = false;
      isPlay = true;
      animate();
    }
    else if (!runAnim)
    {
      startButton.innerHTML = 'Restart';
      runAnim = true;
      isPlay = false;
    }
  }
 // Reset Button
   resetButton.onclick = function ResetParameters()
   {
     // Set StartButton to Start
     startButton.innerHTML = 'Start';
     // Boolean for Stop Animation
     initAnim = true;
     runAnim = false;
     theta = 0;
     isPlay = false;
     render();
   }

  ////////

  const canvas = document.querySelector("#c");
  renderer = new THREE.WebGLRenderer({canvas, preserveDrawingBuffer : false});

  //create a camera (define the frustum)
  const fov = 75; // 75/360 = 5/24 of a revolution
  const aspect = 1;
  const near = 0.1;
  const far = 5;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  //put camera back from the origin
  camera.position.z = 2;

  //make a scene
  scene = new THREE.Scene();

  //ilumination
  {
    const ilumColour = 0xFFFFFF;
    const intensity = 1;
    const light1 = new THREE.DirectionalLight(ilumColour, intensity);
    light1.position.set(1, 1, 1);
    scene.add(light1);
    const light2 = new THREE.DirectionalLight(ilumColour, intensity);
    light2.position.set(-1, -1, -1);
    scene.add(light2);
  }

  //create a sphere geometry
  const radius = 0.125;
  const res1 = 8;
  const res2 = 8;
  geometry = new THREE.SphereGeometry(radius, res1, res2);

  //create a basic material and set its color
  material = new THREE.MeshPhongMaterial({color : "white"});

  //create a mesh
  mesh = new THREE.Mesh(geometry, material);

  //add the mesh to the scene
  scene.add(mesh);

  mesh.position.x = 0;
  mesh.position.y = 0;
  mesh.position.z = 0;

  ////////

  renderer.setSize(0.75*window.innerWidth, 0.75*window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

function animate(delta)
{
  //console.log(runAnim);
  if (!isPlay || theta > 2.0 * Math.PI)
  {
    startButton.innerHTML = 'Start';
    //startButton.disabled = true;
    return;
  }
  requestAnimationFrame(animate);
  theta += 0.01;
  console.log(theta);
  render();
}


function render()
{
  if (resizeRendererToDisplaySize(renderer))
  {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  mesh.position.z = 0.5 * Math.cos(2.0 * Math.PI * theta);
  mesh.position.x = 0.5 * Math.sin(2.0 * Math.PI * theta);
  mesh.position.y = 0.5 * ( Math.cos(8.0 * Math.PI * theta) + Math.sin(8.0 * Math.PI * theta) );
  renderer.render(scene, camera);
}

//check size issue for scene rendering
function resizeRendererToDisplaySize(renderer)
{
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize)
  {
    renderer.setSize(width, height, false);
  }
  return needResize;
}
