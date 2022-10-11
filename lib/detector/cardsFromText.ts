import { compareStrings } from "../utils";
import { Card, cards } from "../../data/cards";

const DETECTION_THRESHOLD_FRONT = 0.78;
const DETECTION_THRESHOLD_BACK = 0.92;
export interface DetectedCard extends Card {
  face: "front" | "back";
}

export function cardsFromText(text: string) {
  const words = text.split("\n");
  const detectedCards: DetectedCard[] = [];

  for (const word of words) {
    let biggest = 0,
      biggestCard: Card | null = null, face: "front" | "back" | null = null;
    for (const card of cards) {
      const similarityFront = compareStrings(word, card.name);
      const similarityBack = compareStrings(word, card.id);
      const similarity = Math.max(similarityFront, similarityBack);
      if (similarity > biggest && (similarityFront > DETECTION_THRESHOLD_FRONT || similarityBack > DETECTION_THRESHOLD_BACK)) {
        biggest = similarity;
        biggestCard = card;
        face = similarityFront > DETECTION_THRESHOLD_FRONT ? "front" : "back";
      }
    }      
    if (biggestCard && face) {
      detectedCards.push({
        ...biggestCard,
        face,
      });
    }
  }

  const uniqueCards: DetectedCard[] = [];
  const repeatedCards: DetectedCard[] = [];
  const counter = {};
  for (const card of detectedCards) {
    counter[card.id] = (counter[card.id] ?? 0) + 1;
  }
  for (const [key, value] of Object.entries(counter)) {
    const card = detectedCards.find((card) => card.id === key);
    if (card) {
      if (value === 1) {
        uniqueCards.push(card);
      } else {
        repeatedCards.push(card);
      }
    }
  }

  return {
    uniqueCards,
    repeatedCards,
  };
};