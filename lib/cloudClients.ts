import { Storage } from "@google-cloud/storage";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import path from "path";

const keyFilename = path.join(__dirname, "../config/storage.json");

export const storage = new Storage({
  keyFilename,
});

export const visionClient = new ImageAnnotatorClient({
  keyFilename,
});
