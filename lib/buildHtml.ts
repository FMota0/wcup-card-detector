import { BucketInfo, DetectionResult } from "./imageProcessor";

function html(body: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Detector de cartas da copa</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div style="max-width: 800px" class="flex flex-col items-center justify-center">
      ${body}
    </div>
  </body>
</html>`;
}

function uploadedImage(
  url: string,
  width: number,
  height: number,
  result: DetectionResult
) {
  return `<img
      style="width: ${width}px; height: ${height}px; object-position: ${
    -result.boundingBox.x / result.downscaleFactor
  }px ${-result.boundingBox.y / result.downscaleFactor}px; object-fit: cover"
      src="${url}"
    />`;
}

function buildPolygon(
  vertices: any,
  color: string,
  downscaleFactor: number,
  result: DetectionResult
) {
  return `<polygon points="${vertices
    .map(
      (v) =>
        `${(v.x - result.boundingBox.x) / downscaleFactor},${
          (v.y - result.boundingBox.y) / downscaleFactor
        }`
    )
    .join(" ")}" style="fill:transparent;stroke:${color};stroke-width:3" />`;
}

function detectionAreas(result: DetectionResult) {
  return `
  <div style="position: absolute; top: 0; left: 0" id="canvas">
      <svg height="${
        result.boundingBox.height / result.downscaleFactor
      }" width="${result.boundingBox.width / result.downscaleFactor}">
        ${result.playersPolygons.map((polygon) => {
          return buildPolygon(
            polygon.vertices ?? [],
            polygon.color,
            result.downscaleFactor,
            result
          );
        })}
        ${buildPolygon(
          result.points?.vertices ?? [],
          "red",
          result.downscaleFactor,
          result
        )}
      </svg>
    </div>
`;
}

function buildLegend(result: DetectionResult) {
  return `
  <div class="w-full p-1" style="background-color: #eeeeee">
    Jogadores detectados:
    <ul>
      ${result.playersPolygons
        .map((polygon) => {
          return `<li style="color: ${polygon.color}">* ${polygon.player.name}</li>`;
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
  <div style="position: relative; width: ${
    result.boundingBox.width / result.downscaleFactor
  }px; height: ${result.boundingBox.height / result.downscaleFactor}px">
    ${uploadedImage(
      result.url,
      result.boundingBox.width / result.downscaleFactor,
      result.boundingBox.height / result.downscaleFactor,
      result
    )}
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
