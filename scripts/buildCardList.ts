import fs from "fs";
import path from "path";

const TEXT_CARD_LIST = path.join(__dirname, "../data/cards.txt");
const TS_CARD_LIST = path.join(__dirname, "../data/cards.ts");

const textCardList = fs.readFileSync(TEXT_CARD_LIST, "utf8");

const cardDescriptions = textCardList.split("\n");

const tsCardList = `export interface Card {
  id: string;
  name: string;
  country: string;
};

export const cards: Card[] = [${cardDescriptions
  .map((cardDescription) => {
    // cardDescription is in the format of "id name - country", name can contain '-'
    const sections = cardDescription.split("-");
    const rest = sections.slice(0, sections.length - 1).join("-");
    const words = rest.split(" ");
    return `
{
   id: '${words[0].trim()}',
   name: '${words.slice(1, words.length).join(" ").trim()}',
   country: '${sections[sections.length - 1].trim()}',
}`;
  })
  .join(",")}
];`;

fs.writeFileSync(TS_CARD_LIST, tsCardList);
