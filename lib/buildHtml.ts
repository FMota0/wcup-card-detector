import { BucketInfo, DetectionResult, DetectedCard, UploadedImage } from "./imageProcessor";
import { BoundingBox, Point } from "./utils";
import { countries } from "../data/countries";

function fontImport() {
  // https://css-tricks.com/how-to-load-fonts-in-a-way-that-fights-fout-and-makes-lighthouse-happy/
  return `
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter&display=swap" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter&display=swap" media="print" onload="this.media='all'" />
<noscript> <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter&display=swap" /> </noscript>
`
}

function html(body: string, script: string = "") {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Detector de cartas da copa</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="text/javascript">
      ${script}
    </script>
    ${fontImport()}
    <style type="text/css">
      * {
        font-family: 'Inter', sans-serif;
      }
    </style>
  </head>
  <body>
    <div id="root" class="v-screen h-screen bg-neutral-900 text-white overflow-hidden">
      ${body}
    </div>
  </body>
</html>`;
}

function uploadedImage(url: string, imgBox: BoundingBox, textBox: BoundingBox) {
  return `<img
      style="width: ${imgBox.width}px; height: ${
    imgBox.height
  }px; object-position: 0px ${-textBox.y}px; object-fit: cover;"
      src="${url}"
    />`;
}

function buildPolygon(vertices: Point[], color: string, customClass: string = "") {
  const polygonClasses = `stroke-${color} stroke-2 fill-transparent`;
  const cloneClasses = `fill-transparent ${customClass}`;
  const points = vertices.map((v) => `${v.x},${v.y}`).join(" ");
// We clone the polygon to make it easier to hover over it
  return `
<polygon class="${polygonClasses}" points="${points}"/>
${customClass.length > 0 ? `<polygon class="${cloneClasses}" points="${points}"/>` : ""}
`;
}

function buildCardClass(card: DetectedCard) {
  return `${card.id.toLowerCase()}`;
}

function detectionAreas(result: DetectionResult) {
  return `
    <div class="absolute top-0 left-0" id="canvas">
      <svg height="${result.textBox.height}" width="${result.imageBox.width}">
        ${result.uniqueCardsPolygons
          .map((polygon) => {
            return buildPolygon(polygon.vertices ?? [], polygon.color, buildCardClass(polygon.player));
          })
          .join("")}
        ${result.repeatedCardsPolygons.map((polygon) => {
          return buildPolygon(polygon.vertices ?? [], "gray-900");
        }).join("")}
        ${buildPolygon(result.textVertices, "red-900")}
      </svg>
    </div>
`;
}

function buildCountryFlag(country: string, factor: number = 1) {
  const countryMeta = countries.find((c) => c.name.toLowerCase() === country.toLowerCase());
  const countryCode = countryMeta.code.toLowerCase();
  const countryFlag = `https://www.flagcdn.com/w320/${countryCode}.png`;
  return `<img src="${countryFlag}" style="width: ${factor * 20}px; height: ${factor * 14}px" />`;
}

function buildLegend(result: DetectionResult) {
  return `
  <div class="w-full p-4 bg-zinc-800 flex flex-col align-center gap-y-2">
    <strong><p>Jogadores detectados:</p></strong>
    <div class="flex flex-wrap gap-y-1">
      ${result.players
        .map((player) => {
          const polygon = result.uniqueCardsPolygons.find((poly) => poly.player.id === player.id) ?? { color: "gray" };
          return `<div class="w-1/3 text-${polygon.color} flex items-center ${buildCardClass(player)}" style="border: 2px solid transparent">${buildCountryFlag(player.country)}${player.country}: ${player.name} - ${player.id}</div>`;
        })
        .join("")}
    </div>
    <a href="/">
      <div class="font-bold py-2 px-4 rounded bg-blue-500 text-center hover:bg-blue-700">
        Voltar
      </div>
    </a>
  </div>
`;
}

function buildResultPageHoverScript(result: DetectionResult) {
  const classes = result.players.map((player) => buildCardClass(player));
  return `
function addOnMouseOverBehaviour(className) {
  const elements = document.getElementsByClassName(className);
  function activate() {
    for (let j = 0; j < elements.length; j++) {
      elements[j].style.border = "2px solid green";
      elements[j].style.stroke = "green";
      elements[j].style.strokeWidth = "4px";
    }
  }
  function deactivate() {
    for (let j = 0; j < elements.length; j++) {
      elements[j].style.border = "2px solid transparent";
      elements[j].style.stroke = "none";
      elements[j].style.strokeWidth = "none";
    }
  }
  function toggle() {
    if (elements[0].style.border === "2px solid green") {
      deactivate();
    } else {
      activate();
    }
  }
  for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener("mouseover", activate);
    elements[i].addEventListener("mouseout", deactivate);
    elements[i].addEventListener("click", toggle);
  }
}
function addOnMouseOverBehaviourToAllClasses(classes) {
  for (let i = 0; i < classes.length; i++) {
    addOnMouseOverBehaviour(classes[i]);
  }
}
window.onload = function() {
  addOnMouseOverBehaviourToAllClasses(${JSON.stringify(classes)});
}
`;
}

export function buildResultPageHtml(result: DetectionResult) {
  return html(`<div class="h-full flex flex-col items-center justify-between">
    <div class="h-full flex items-center">
      <div class="overflow-hidden relative" style="width: ${
        result.imageBox.width
      }px; height: ${result.textBox.height}px">
        ${uploadedImage(result.url, result.imageBox, result.textBox)}
        ${detectionAreas(result)}
      </div>
    </div>
    ${buildLegend(result)}
  </div>
  `, buildResultPageHoverScript(result));
}

function filePicker() {
  return `
<label for="image">
  <input id="image" class="hidden" type="file" name="image" capture="environment" accept="image/*" />
  <div class="flex border border-solid border-slate-500 cursor-pointer rounded">
    <span class="h-full py-2 px-4"><output for="image" name="picked">Escolha uma foto</output></span>
    <span class="h-full py-2 px-4 border border-solid border-slate-500 bg-slate-700 grey-200">Arquivos</span>
  </div>
</label>
`
}

const LINK_STYLE = "italic underline font-bold text-blue-400 hover:text-blue-700";

function fileLink(file: BucketInfo["files"][0]) {
  return `<a class="${LINK_STYLE}" href="/result/${file.hash}">Arquivo: ${file.hash.substring(0, 6)} - Cartas Detectadas ${file.detectedPlayers}</a>`
}

function buildHomePageUploadList(bucketInfo: BucketInfo) {
  return `
<div class="flex flex-col items-center gap-y-3">
  <p><strong>Número de imagens processadas: ${bucketInfo.amount}</strong></p>
  <div class="flex flex-col items-center gap-y-1">
    <p>Exemplos:</p>
    ${bucketInfo.files.map(fileLink).join("")}
  </div>
</div>
`
}

function buildHomePageFooter(bucketInfo: BucketInfo) {
  return `
<div class="w-full p-4 bg-zinc-800 flex flex-col align-center gap-y-2">
  ${buildHomePageUploadList(bucketInfo)}
  <div>
    <p>Esta ferramenta foi desenvolvida para ajudar a detectar os jogadores de um jogo de cartas. Para isso, basta tirar uma foto do jogo e carregar aqui.</p>
    <p>Para obter melhores resultados, é importante que a foto esteja o mais próxima possível da mesa, com boa iluminação e que o jogo esteja bem visível.</p>
    <p>Esta ferramenta é open source e pode ser encontrada em <a class="${LINK_STYLE}" href="https://github.com/FMota0/wcup-card-detector">Github</a>.</p>
  </div>
</div>
`
}

export function buildHomePageHtml(bucketInfo: BucketInfo) {
  return html(`
  <div
    class="h-full flex flex-col items-center gap-y-2"
  >
    <div class="h-64 flex items-center gap-x-2">
      <div class="text-4xl">Detector de cartas da copa</div>
      ${buildCountryFlag("Brazil", 3)}
    </div>
    <form
      id="upload-form"
      method="post"
      enctype="multipart/form-data"
      action="/process"
      class="h-full flex flex-col items-center justify-center gap-y-1"
      oninput="picked.value=image.value.split('\\\\').pop().length ? image.value.split('\\\\').pop() : 'Escolha uma foto'"
    >
      ${filePicker()}
      <button class="w-full font-bold py-2 px-4 rounded bg-blue-500 text-white hover:bg-blue-700" type="submit">Upload</button>
    </form>
    ${buildHomePageFooter(bucketInfo)}
  <div>
`);
}
