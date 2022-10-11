import { DetectionResult } from "../../../imageProcessor";
import { BoundingBox, Point } from "../../../utils";
import { html } from "../../html";
import { htmlButton, htmlCountryFlag } from "../../components";
import { cssCardClass } from "../../utils";
import { resultPageScript } from "../../scripts/result";

function buildPolygon(vertices: Point[], color: string, customClass: string = "") {
  const polygonClasses = `stroke-${color} stroke-1 fill-transparent`;
  const cloneClasses = `fill-transparent ${customClass}`;
  const points = vertices.map((v) => `${v.x},${v.y}`).join(" ");
// We clone the polygon to make it easier to hover over it
  return `
<polygon class="${polygonClasses}" points="${points}"/>
${customClass.length > 0 ? `<polygon class="${cloneClasses}" points="${points}"/>` : ""}
`;
}

function detectionAreas(result: DetectionResult) {
  return `
    <div class="absolute top-0 left-0" id="canvas">
      <svg height="${result.textBox.height}" width="${result.imageBox.width}">
        ${result.uniqueCardsPolygons
          .map((polygon) => {
            return buildPolygon(polygon.vertices ?? [], polygon.color, cssCardClass(polygon.player));
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

function buildLegend(result: DetectionResult) {
  return `
  <div id="legend" class="w-full max-h-40 p-4 bg-zinc-800 flex flex-col align-center gap-y-2 overflow-x-hidden overflow-y-auto text-sm lg:text-base">
    <p class="font-bold">${result.players.length} cartas diferents detectadas:</p>
    <div class="flex flex-wrap gap-y-1">
      ${result.players
        .map((player) => {
          const polygon = result.uniqueCardsPolygons.find((poly) => poly.player.id === player.id) ?? { color: "gray" };
          return `<div class="lg:w-1/3 w-1/2 text-${polygon.color} flex items-center ${cssCardClass(player)}" style="border: 2px solid transparent">${htmlCountryFlag(player.country, "32x24")}${player.country}: ${player.name} - ${player.id}</div>`;
        })
        .join("")}
    </div>
  </div>
`;
}

function uploadedImage(url: string, imgBox: BoundingBox, textBox: BoundingBox) {
  return `<img
      alt="Imagem processada"
      id="img"
      style="width: ${imgBox.width}px; height: ${
    imgBox.height
  }px; object-position: 0px ${-textBox.y}px; object-fit: cover;"
      src="${url}"
    />`;
}


export function buildResultPageHtml(result: DetectionResult) {
  return html(`
  <div class="h-full flex flex-col items-center justify-between">
    <div id="result-content" class="h-full flex items-center justify-center">
      <div id="result-wrapper" class="relative overflow-hidden" style="width: ${
        result.imageBox.width
      }px; height: ${result.textBox.height}px">
        ${uploadedImage(result.url, result.imageBox, result.textBox)}
        ${detectionAreas(result)}
      </div>
    </div>
    ${buildLegend(result)}
  </div>
  <div id="back-btn" class="flex-1 w-full p-4 bg-zinc-800">
    <a href="/">
      ${htmlButton("Voltar")}
    </a>
  </div>
  `, resultPageScript(result));
}