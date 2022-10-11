import { DetectedCard } from "../detector/cardsFromText";

export function cssCardClass(card: DetectedCard) {
  return `${card.id.toLowerCase()}`;
}