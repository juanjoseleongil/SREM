# Special Relativity and Electromagnetism
Web simulation regarding Special Relativity and Electromagnetism, simulating the motion of a charged and massive particle on a constant and uniform electromagnetic field. Project built using basic HTML and CSS. Code written in JavaScript, with the aid of three.js and p5.js.

Check it out: https://juanjoseleongil.github.io/SREM

# To-do list:
1. Complete multi-language support
2. Complete fully integrated default, light and dark modes
3. Output rendered scenes to GIF or video file
4. Make the animations compatible with accessibility tools (i.e. relate the motion and visual outputs to sounds)
5. Fix numerical computation overflows producing infs and NaNs
6. Three.js: animation with both trail and orbit controls
7. Remember the language choice between pages ("simulation" and "background physics").
7.1. Idea: initialize a null variable (e.g. "pageLang") in "RMCUEMFparams.js" to store the language. 
7.2. Import the variable in both "HTMLfunctions.js" and "bgp/bgpExecutionSetup.js".
7.3. If "pageLang" is null and no selection has been made yet, keep default language chosen at the beginning by the browser
7.4. Language selector: normal behaviour, store its value also in "pageLang"
7.5. If "pageLang" is not null, document.documentElement.setAttribute("lang", pageLang)
