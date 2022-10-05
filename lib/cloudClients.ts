import { Storage } from "@google-cloud/storage";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import path from "path";

const keyFilename =
  process.env.NODE_ENV === "production"
    ? "/etc/secrets/secrets.json"
    : path.join(__dirname, "../secrets.json");

export const storage = new Storage({
  keyFilename,
});

export const visionClient = new ImageAnnotatorClient({
  keyFilename,
});
