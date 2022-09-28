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
