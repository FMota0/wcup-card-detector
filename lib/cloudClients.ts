import { Storage } from "@google-cloud/storage";
import { ImageAnnotatorClient } from "@google-cloud/vision";

const keyFilename = process.env.KEY_PATH;

export const storage = new Storage({
  keyFilename,
});

export const visionClient = new ImageAnnotatorClient({
  keyFilename,
});
