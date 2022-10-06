import stringSimilarity from "string-similarity";

export const genRandomId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

export const compareStrings = (x: string, y: string) => {
  return stringSimilarity.compareTwoStrings(x.toLowerCase(), y.toLowerCase());
};

function cross(o: any, a: any, b: any) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

export function convexHull(points: any[]) {
  // https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain
  points.sort((a, b) => a.x - b.x);
  const lower = [];
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

export function generateRandomColor() {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
}
