import { DetectionResult } from "./imageProcessor";

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

function detectionAreas(result: DetectionResult) {
  return `
  <div style="position: absolute; top: 0; left: 0" id="canvas">
      <svg height="${result.height}" width="${result.width}">
        ${result.allPolygons.map((polygon) => {
          return `<polygon points="${(polygon?.vertices ?? [])
            .map((v) => `${v.x},${v.y}`)
            .join(
              " "
            )}" style="fill:transparent;stroke:blue;stroke-width:3" />`;
        })}
        <polygon
          points="${(result.points?.vertices ?? [])
            .map((v) => `${v.x},${v.y}`)
            .join(" ")}"
          style="fill: none; stroke: red; stroke-width: 3"
        />
      </svg>
    </div>
`;
}

export function buildResultPageHtml(result: DetectionResult) {
  return html(`
${uploadedImage(result.url)}
${detectionAreas(result)}
`);
}

export function buildHomePageHtml() {
  return html(`
<form
  id="upload-form"
  method="post"
  enctype="multipart/form-data"
  action="/process"
>
  <input type="file" name="file" />
  <button type="submit">Upload</button>
</form>
`);
}
