export function fontImport() {
  // https://css-tricks.com/how-to-load-fonts-in-a-way-that-fights-fout-and-makes-lighthouse-happy/
  return `
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter&display=swap" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter&display=swap" media="print" onload="this.media='all'" />
<noscript> <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter&display=swap" /> </noscript>
`
}

const PRODUCTION = process.env.NODE_ENV === "production";
const BACKGROUND_IMAGE_URL = "https://media.istockphoto.com/vectors/football-soccer-balls-doodle-seamless-pattern-vector-illustration-vector-id1159961620?k=20&m=1159961620&s=170667a&w=0&h=dr5_STOycRIqxYA04a8WXaQR0eHosBKbmn0UqbqgShQ=";

export function html(body: string, script: string = "") {
  return `<!DOCTYPE html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Detecta figurinhas da copa do mundo" />
    <meta property="og:title" content="Detector de figurinhas da copa do mundo " />
    <meta property="og:description" content="Detectando figurinhas da copa do mundo usando Google Cloud Vision" />
    <meta property="og:image" content="" />
    <title>Detector de figurinhas</title>
    <link href="/styles/style.css" rel="stylesheet">
    // https://www.favicon-generator.org/
    <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png">
    <link rel="icon" type="image/png" sizes="192x192"  href="/android-icon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="msapplication-TileColor" content="#ffffff">
    <meta name="msapplication-TileImage" content="/ms-icon-144x144.png">
    <meta name="theme-color" content="#ffffff">
    <script type="text/javascript">
      ${script}
    </script>
    ${fontImport()}
    ${!PRODUCTION ? `<script src="https://cdn.tailwindcss.com"></script>` : ""}
    <style type="text/css">
      * {
        font-family: 'Inter', sans-serif;
      }
      #root {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
    </style>
  </head>
  <body>
    <div id="root" class="flex flex-col bg-neutral-900 text-white overflow-hidden text-base" style="background-image: url('${BACKGROUND_IMAGE_URL}');">
      ${body}
    </div>
  </body>
</html>`;
}