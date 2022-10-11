import { BucketInfo } from "../../imageProcessor";
import { htmlButton, htmlCountryFlag, htmlFileLink, htmlImagePicker, htmlLink } from "../components";
import { html } from "../html";

function buildHomePageUploadList(bucketInfo: BucketInfo) {
  return `
<div class="flex flex-col items-center gap-y-3">
  <p><strong>Número de imagens processadas: ${bucketInfo.amount}</strong></p>
  <div class="flex flex-col items-center gap-y-1">
    <p>Exemplos:</p>
    ${bucketInfo.files.map(htmlFileLink).join("")}
  </div>
</div>
`
}

const REPO_URL = "https://github.com/FMota0/wcup-card-detector";

function buildHomePageFooter(bucketInfo: BucketInfo) {
  return `
<div class="w-full p-4 bg-zinc-800 flex flex-col align-center gap-y-2">
  ${buildHomePageUploadList(bucketInfo)}
  <div class="flex flex-col items-center text-sm lg:text-base">
    <p>Esta ferramenta foi desenvolvida para detectar jogadores em figurinhas da copa do mundo 2022. Para isso, basta tirar uma foto contendo uma figurinha e carregar aqui.</p>
    <p>Para obter melhores resultados, é importante que a foto esteja o mais próxima possível da mesa, com boa iluminação e que a figurinha esteja bem visível.</p>
    <p>Esta ferramenta é open source e pode ser encontrada em ${htmlLink(REPO_URL, "Github")}.</p>
  </div>
</div>
`
}


export function buildHomePageHtml(bucketInfo: BucketInfo) {
  return html(`
  <div
    class="h-full flex flex-col items-center"
  >
    <div class="h-64 flex items-center gap-x-2 pb-4">
      <div class="text-4xl">Detector</div>
      ${htmlCountryFlag("Brazil", "64x48")}
    </div>
    <form
      id="upload-form"
      method="post"
      enctype="multipart/form-data"
      action="/process"
      class="h-full flex flex-col items-center justify-center gap-y-1 pb-4"
      oninput="picked.value=image.value.split('\\\\').pop().length ? image.value.split('\\\\').pop() : 'Escolha uma foto'"
    >
      ${htmlImagePicker()}
      ${htmlButton("Detectar")}
    </form>
    ${buildHomePageFooter(bucketInfo)}
  <div>
`, 
`
  window.onload = () => {
    const params = new URLSearchParams(window.location.search.substring(1));
    const error = params.get("error");
    if (error) {
      alert(error);
    }
  };
`);
}
