import { countries } from "../../data/countries";
import { BucketInfo } from "../imageProcessor";

const LINK_STYLE = "italic underline font-bold text-blue-400 hover:text-blue-700";

export function htmlLink(href: string, text: string, target = "_blank") {
  return `<a class="${LINK_STYLE}" href="${href}" target="${target}">${text}</a>`
}

export function htmlFileLink(file: BucketInfo["files"][0]) {
  return htmlLink(`/result/${file.hash}`, `Arquivo: ${file.hash.substring(0, 6)} - Cartas detectadas: ${file.detectedPlayers}`, "_self");
}

export function htmlCountryFlag(country: string, size: "16x12" | "32x24" | "64x48" | "120x90" | "256x192") {
  const countryMeta = countries.find((c) => c.name.toLowerCase() === country.toLowerCase());
  const countryCode = countryMeta.code.toLowerCase();
  const countryFlag = `https://www.flagcdn.com/${size}/${countryCode}.png`;

  return `<img alt="Bandeira ${country}" src="${countryFlag}" />`;
}

export function htmlImagePicker() {
  return `
<label for="image" class="backdrop-blur-3xl">
  <input id="image" class="hidden" type="file" name="image" capture="environment" accept="image/*" />
  <div class="flex border border-solid border-slate-500 cursor-pointer rounded">
    <span class="h-full py-2 px-4"><output for="image" name="picked">Escolha uma foto</output></span>
    <span class="h-full py-2 px-4 border border-solid border-slate-500 bg-slate-700 grey-200">Arquivos</span>
  </div>
</label>
`
}

export function htmlButton(text: string) {
  return `<button class="w-full font-bold py-2 px-4 rounded bg-blue-500 text-white hover:bg-blue-700" type="submit">${text}</button>`
}

const LOGO_WIDTH = 313;
const LOGO_HEIGTH = 262;

export function htmlLogo(factor = 1) {
  return `<img width="${LOGO_WIDTH * factor}" height="${LOGO_HEIGTH * factor}" src="/images/logo.webp" />`
}