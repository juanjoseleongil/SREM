import * as LANG from "../js/languageContent.js";

function getLang() { return document.documentElement.getAttribute("lang"); }

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

function languageSelector()
{
  insertLangSelect("langSpan");
  let language = LANG.language, langs = Object.keys(LANG.langs);
  let lan = document.getElementById("langSpan").querySelector("#langSwitch");

  //change language of elements when a selection is made
  lan.addEventListener( "change", function()
  {
    if (lan.value === "") { return; }
    document.documentElement.setAttribute("lang", lan.value);

    for (const elem of ["liSimul", "lipbts", "liCode"])
    {
      for (const item of document.querySelectorAll(`.${elem}`))
      {
        item.innerHTML = language[lan.value][elem];
      }
    }

    for (const lang0 of langs)
    {
      if (lang0 === lan.value)
      {
        for (var sp of document.getElementsByClassName(lang0))
        {sp.style.display = "block";}
      }
      else if (lang0 != lan.value)
      {
        for (var sp of document.getElementsByClassName(lang0))
        {sp.style.display = "none";}
      }
    }
  });
}

languageSelector();
