import { BucketInfo, DetectionResult } from "./imageProcessor";

function html(body: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Detector de cartas da copa</title>
  </head>
  <body>
    ${body}
  </body>
</html>`;
}

function uploadedImage(url: string) {
  return `<img
      style="position: absolute; top: 0; left: 0"
      src="${url}"
    />`;
}

function buildPolygon(vertices: any, color: string) {
  return `<polygon points="${vertices
    .map((v) => `${v.x},${v.y}`)
    .join(" ")}" style="fill:transparent;stroke:${color};stroke-width:3" />`;
}

function detectionAreas(result: DetectionResult) {
  return `
  <div style="position: absolute; top: 0; left: 0" id="canvas">
      <svg height="${result.height}" width="${result.width}">
        ${result.playersPolygons.map((polygon) => {
          return buildPolygon(polygon.vertices ?? [], polygon.color);
        })}
        ${buildPolygon(result.points?.vertices ?? [], "red")}
      </svg>
    </div>
`;
}

function buildLegend(result: DetectionResult) {
  return `
  <div style="position: absolute; top: 0; left: 0; background-color: #eeeeee">
    <ul>
      ${result.playersPolygons.map((polygon) => {
        return `<li style="color: ${polygon.color}">${polygon.player.name}</li>`;
      })}
    </ul>
    <a href="/">Voltar</a>
  </div>
`;
}

export function buildResultPageHtml(result: DetectionResult) {
  return html(`
${uploadedImage(result.url)}
${detectionAreas(result)}
${buildLegend(result)}
`);
}

export function buildHomePageHtml(bucketInfo: BucketInfo) {
  return html(`
<form
  id="upload-form"
  method="post"
  enctype="multipart/form-data"
  action="/process"
>
  <input type="file" name="file" capture="environment" accept="image/*"/>
  <button type="submit">Upload</button>
</form>
<div>
  Número de imagens: ${bucketInfo.amount}
</div>
`);
}
