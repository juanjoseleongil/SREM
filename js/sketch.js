import { tau, revFracStep, signiFigM1 } from "./RMCUEMFparams.js";
import { tfCos, tfSin } from "./RMCUEMFcompute.js";
import { language } from "./languageContent.js";
import { LANGdecSep, getLang, expNot } from "./HTMLfunctions.js";

export default class unitDirectionSketch
{
  constructor(divID)
  {
    let inconsolata;
    let parentDiv = document.getElementById(divID);
    let cW, cH, cD; //canvas width, height, depth
    let sliderTheta, sliderPhi, boxTheta, boxPhi, bts, bps, buttonPRnd; //sliders, input boxes, validity spans and button
    let theta = 0, phi = 0, x = 1, y = 0, z = 0; //placeholders
    let unitVecDiv; //div element to show cartesian unit vector
    let elemInputTheta, elemInputPhi; //DOM elements (placeholders)

    let sketch = function(sk)
    {
      sk.setup = function()
      {
        cW = parentDiv.offsetWidth, cH = parentDiv.offsetWidth, cD = parentDiv.offsetWidth;

        sk.createCanvas(cW, cH, sk.WEBGL);

        sk.camera(cW/2, -cH/2, cD/2);

        sk.textFont(inconsolata);
        sk.textSize(cW/8);
        sk.textAlign(sk.CENTER, sk.CENTER);

        sliderTheta = sk.createSlider(0, 0.999999999999999, 0, revFracStep);
        sliderTheta.attribute("id", `${divID}sliderTheta`);
        sliderTheta.addClass("sketchSliders");
        sliderTheta.position(cW/64, cH/32);
        sliderTheta.size(5*cW/8, 7*cH/256);
        sliderTheta.input( onSliderChange );

        sliderPhi = sk.createSlider(-1/4, 1/4, 0, 2*revFracStep);
        sliderPhi.attribute("id", `${divID}sliderPhi`);
        sliderPhi.addClass("sketchSliders");
        sliderPhi.position(cW/64, cH/8);
        sliderPhi.size(5*cW/8, 7*cH/256);
        sliderPhi.input( onSliderChange );

        boxTheta = sk.createElement("input", "").addClass("cstmInpt");
        boxTheta.attribute("id", `${divID}inputTheta`);
        boxTheta.attribute("type", "number");
        boxTheta.attribute("placeholder", `${language[getLang()]["cZeroToOne"]}`);
        boxTheta.attribute("min", "0.0");
        boxTheta.attribute("max", "0.999999999999999");
        boxTheta.attribute("step", "1.0e-15");
        boxTheta.attribute("required", "true");
        boxTheta.position(11*cW/16, cH/32);
        //boxTheta.size(7*cW/32, 3*cH/64);
        boxTheta.input( onInputChange );
        bts = sk.createElement("span").addClass("validity");
        bts.position(15*cW/16, cH/32);
        elemInputTheta = document.getElementById(boxTheta.attribute("id"));

        boxPhi = sk.createElement("input", "").addClass("cstmInpt");
        boxPhi.attribute("id", `${divID}inputPhi`);
        boxPhi.attribute("type", "number");
        boxPhi.attribute("placeholder", "[-¼, ¼]");
        boxPhi.attribute("min", "-0.25");
        boxPhi.attribute("max", "0.25");
        boxPhi.attribute("step", "1.0e-15");
        boxPhi.attribute("required", "true");
        boxPhi.position(11*cW/16, cH/8);
        //boxPhi.size(7*cW/32, 3*cH/64);
        boxPhi.input( onInputChange );
        bps = sk.createElement("span").addClass("validity");
        bps.position(15*cW/16, cH/8);
        elemInputPhi = document.getElementById(boxPhi.attribute("id"));

        buttonPRnd = sk.createButton(`${language[getLang()]["prBtn"]}`).addClass("prBtn");
        buttonPRnd.attribute("id", `${divID}prBtn`);
        buttonPRnd.position(cW/64, 3*cH/16);
        buttonPRnd.mousePressed(buttonPRndPressed);

        unitVecDiv = sk.createElement("div", "").id(`${divID}uVecDiv`);
        unitVecDiv.position(cW/16, 15*cH/16);
      }

      sk.draw = function()
      {
        sk.background( window.getComputedStyle(document.body, null).getPropertyValue("background-color") );
        sk.orbitControl();
        sk.scale(0.75);
        sk.noStroke();

        //x axis
        sk.push();
        sk.stroke("rgba(255, 0, 0, 0.5)");
        sk.strokeWeight(cW/32);
        sk.line(-cW/2, 0, 0, cW/2, 0, 0);
        sk.translate(cW/2, 0, 0);
        sk.fill("rgba(255, 0, 0, 0.5)"); sk.translate(cW/16, 0, 0); sk.text("x", 0, 0);
        sk.pop();

        //y axis. THIS AXIS WILL BE INVERTED
        sk.push();
        sk.stroke("rgba(0, 255, 0, 0.5)");
        sk.strokeWeight(cH/32);
        sk.line(0, -cH/2, 0, 0, cH/2, 0);
        sk.translate(0, -cH/2, 0); //WITHOUT INVERSION: (0, cH/2, 0)
        sk.fill("rgba(0, 255, 0, 0.5)"); sk.translate(0, -cH/16, 0); sk.text("y", 0, 0);
        sk.pop();

        //z axis
        sk.push();
        sk.stroke("rgba(0, 0, 255, 0.5)");
        sk.strokeWeight(cD/32);
        sk.line(0, 0, -cD/2, 0, 0, cD/2);
        sk.translate(0, 0, cD/2);
        sk.fill("rgba(0, 0, 255, 0.5)"); sk.translate(0, 0, cD/16); sk.text("z", 0, 0);
        sk.pop();

        //unit direction vector
        sk.rotateZ(-tau/4);
        sk.push();
        sk.rotate(tau * sliderTheta.value(), [0, 0, -1]);
        sk.rotate(tau * sliderPhi.value(), [1, 0, 0]);
        sk.fill(0, 0, 0);
        sk.beginShape();
          sk.translate(0, cH/4, 0);
          sk.cylinder(cW/64, cH/2);
          sk.translate(0, cH/4, 0);
          sk.cone(cW/16, 7*cH/64);
        sk.endShape();
        sk.pop();

        //unit sphere wire frame
        sk.push(); sk.beginShape();
          sk.rotateX(tau/4);
          sk.stroke(0); sk.strokeWeight(cW/1024);
          sk.fill(sk.color(255, 255, 255, 1));
          sk.sphere(cW/2, 16, 16);
        sk.endShape(); sk.pop();
      }

      sk.windowResized = function()
      { //refresh all sizes and positions
        cW = parentDiv.offsetWidth, cH = parentDiv.offsetWidth, cD = parentDiv.offsetWidth;

        sk.resizeCanvas(cW, cH);
        sk.camera(cW/2, -cH/2, cD/2);
        sk.scale(0.75);
        sk.textSize(cW/8);

        sliderTheta.position(cW/64, cH/32);
        sliderTheta.size(5*cW/8, 7*cH/256);

        sliderPhi.position(cW/64, cH/8);
        sliderPhi.size(5*cW/8, 7*cH/256);

        boxTheta.position(11*cW/16, cH/32);
        //boxTheta.size(7*cW/32, 3*cH/64);
        bts.position(15*cW/16, cH/32);

        boxPhi.position(11*cW/16, cH/8);
        //boxPhi.size(7*cW/32, 3*cH/64);
        bps.position(15*cW/16, cH/8);

        buttonPRnd.position(cW/64, 3*cH/16);
        unitVecDiv.position(cW/16, 15*cH/16);
      }

      sk.preload = function()
      { //preload text font
        inconsolata = sk.loadFont(
        "http://sapiens.udenar.edu.co/cdn/fonts/HelveticaNeue.otf"
        );
      }
    } //end sketch function

    function onInputChange()
    { //if the textboxs are changed, update the sliders
      if ( elemInputTheta.checkValidity() )
      { sliderTheta.value( boxTheta.value() ); }
      if ( elemInputPhi.checkValidity() )
      { sliderPhi.value( boxPhi.value() ); }
      updateUnitVec();
    }

    function onSliderChange()
    { //if the sliders are changed, update the textboxs
      let st = sliderTheta.value(), sp = sliderPhi.value();
      boxTheta.value( st.toPrecision(signiFigM1 + 1) );
      boxPhi.value( sp.toPrecision(signiFigM1 + 1) );
      updateUnitVec();
    }

    function buttonPRndPressed()
    {
      elemInputTheta.value = Math.random().toPrecision(signiFigM1 + 1);
      elemInputPhi.value = (0.5 * Math.random() - 0.25).toPrecision(signiFigM1 + 1);
      onInputChange();
    }

    function updateUnitVec()
    {
      if ( elemInputTheta.checkValidity() && elemInputPhi.checkValidity() )
      {
      theta = tau * boxTheta.value(), phi = tau * boxPhi.value();
      x = tfCos(phi) * tfCos(theta), y = tfCos(phi) * tfSin(theta), z = tfSin(phi);
      unitVecDiv.html(`(${expNot(x)}` + `${LANGdecSep()}` + `${expNot(y)}` + `${LANGdecSep()}` + `${expNot(z)})`, false);
      }
    }

    new p5(sketch, divID); //create the sketch on the div with id divID

  } //end constructor
} //end class
