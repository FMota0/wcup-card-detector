import { BucketInfo, DetectionResult } from "./imageProcessor";
import { BoundingBox } from "./utils";

function html(body: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Detector de cartas da copa</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div class="flex flex-col items-center justify-center">
      <div class="max-w-5xl">
        ${body}
      </div>
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

function buildPolygon(vertices: any, color: string) {
  return `<polygon class="stroke-${color} stroke-2 fill-transparent" points="${vertices
    .map((v) => `${v.x},${v.y}`)
    .join(" ")}"/>`;
}

function detectionAreas(result: DetectionResult) {
  return `
    <div class="absolute top-0 left-0" id="canvas">
      <svg height="${result.textBox.height}" width="${result.imageBox.width}">
        ${result.playersPolygons
          .map((polygon) => {
            return buildPolygon(polygon.vertices ?? [], polygon.color);
          })
          .join("")}
        ${buildPolygon(result.textVertices, "red-900")}
      </svg>
    </div>
`;
}

function buildLegend(result: DetectionResult) {
  return `
  <div class="w-full p-1 bg-gray-300">
    Jogadores detectados:
    <ul class="list-disc">
      ${result.playersPolygons
        .map((polygon) => {
          return `<li class="text-${polygon.color}">${polygon.player.name}</li>`;
        })
        .join("")}
    </ul>
    <span class="p-2">
      <a href="/">Voltar</a>
    </span>
  </div>
`;
}

export function buildResultPageHtml(result: DetectionResult) {
  return html(`
  <div class="flex flex-col items-center">
    <div class="overflow-hidden relative" style="width: ${
      result.imageBox.width
    }px; height: ${result.textBox.height}px">
      ${uploadedImage(result.url, result.imageBox, result.textBox)}
      ${detectionAreas(result)}
    </div>
  </div>
  ${buildLegend(result)}
`);
}

export function buildHomePageHtml(bucketInfo: BucketInfo) {
  return html(`
  <div
    class="flex flex-col items-center justify-center"
  >
    <form
      id="upload-form"
      method="post"
      enctype="multipart/form-data"
      action="/process"
      class="flex flex-col items-center justify-center"
    >
      <input type="file" name="file" capture="environment" accept="image/*"/>
      <button type="submit">Upload</button>
    </form>
    <div>
      Número de imagens: ${bucketInfo.amount}
    </div>
  <div>
`);
}
