import stringSimilarity from "string-similarity";
import { DetectionResult } from "./imageProcessor";

export const compareStrings = (x: string, y: string) => {
  return stringSimilarity.compareTwoStrings(x.toLowerCase(), y.toLowerCase());
};

export interface Point {
  x: number;
  y: number;
}

function cross(o: Point, a: Point, b: Point) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

export function convexHull(points: Point[]) {
  // https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain
  points.sort((a, b) => a.x - b.x);
  const lower: Point[] = [];
  for (const point of points) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
    ) {
      lower.pop();
    }
    lower.push(point);
  }
  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const point = points[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
    ) {
      upper.pop();
    }
    upper.push(point);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

export function boundingBox(points: any[]) {
  const xValues = points.map((p) => p.x);
  const yValues = points.map((p) => p.y);
  return {
    x: Math.min(...xValues),
    y: Math.min(...yValues),
    width: Math.max(...xValues) - Math.min(...xValues),
    height: Math.max(...yValues) - Math.min(...yValues),
  };
}

export type BoundingBox = ReturnType<typeof boundingBox>;

function getDownscaleFactor(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number
) {
  const WIDTH_EXTRA_SPACE = 50;
  const HEIGHT_EXTRA_SPACE = 220;
  const widthFactor = (maxWidth - WIDTH_EXTRA_SPACE) / imageWidth;
  const heightFactor = (maxHeight - HEIGHT_EXTRA_SPACE) / imageHeight;
  return Math.min(widthFactor, heightFactor);
}

export function downscaleAndAdjust(result: DetectionResult, resultWidth: number, resultHeight: number): DetectionResult {
  const downscaleFactor = getDownscaleFactor(
    result.textBox.width,
    result.textBox.height,
    resultWidth,
    resultHeight
  );

  const textBox = {
    x: result.textBox.x * downscaleFactor,
    y: result.textBox.y * downscaleFactor,
    width: result.textBox.width * downscaleFactor,
    height: result.textBox.height * downscaleFactor,
  };

  const imageBox = {
    x: result.imageBox.x * downscaleFactor,
    y: result.imageBox.y * downscaleFactor,
    width: result.imageBox.width * downscaleFactor,
    height: result.imageBox.height * downscaleFactor,
  };

  return {
    ...result,
    textBox,
    imageBox,
    uniqueCardsPolygons: result.uniqueCardsPolygons.map((p) => ({
      ...p,
      vertices: p.vertices.map((v) => ({
        x: v.x * downscaleFactor,
        y: v.y * downscaleFactor - textBox.y,
      })),
    })),
    textVertices: result.textVertices.map((v) => ({
      x: v.x * downscaleFactor,
      y: v.y * downscaleFactor - textBox.y,
    })),
    repeatedCardsPolygons: result.repeatedCardsPolygons.map((p) => ({
      ...p,
      vertices: p.vertices.map((v) => ({
        x: v.x * downscaleFactor,
        y: v.y * downscaleFactor - textBox.y,
      })),
    })),
  };
}

const TAILWIND_COLOR_TOKENS = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

const TAILWIND_COLOR_WEIGHTS = ["100", "200", "300", "400"];

export function generateRandomColor() {
  const color =
    TAILWIND_COLOR_TOKENS[
      Math.floor(Math.random() * TAILWIND_COLOR_TOKENS.length)
    ];
  const weight =
    TAILWIND_COLOR_WEIGHTS[
      Math.floor(Math.random() * TAILWIND_COLOR_WEIGHTS.length)
    ];
  return `${color}-${weight}`;
}
