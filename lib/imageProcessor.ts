import crypto from "crypto";
import sharp from "sharp";
import { storage, visionClient } from "./cloudClients";
import {
  compareStrings,
  convexHull,
  generateRandomColor,
  genRandomId,
  boundingBox,
} from "./utils";
import { cards } from "../data/cards";

const STORAGE_BASE_URL = "https://storage.googleapis.com";

function getBucketName() {
  return process.env.BUCKET_NAME ?? "my-bucket";
}

function getBucket() {
  return storage.bucket(getBucketName());
}

export async function getBucketInfo() {
  const bucket = getBucket();
  const [files] = await bucket.getFiles();
  return {
    amount: Math.floor(files.length / 2),
  };
}

export type BucketInfo = Awaited<ReturnType<typeof getBucketInfo>>;

const BUCKET_AMOUNT_LIMIT = 1000;

async function checkBucketLimit() {
  const bucketInfo = await getBucketInfo();

  if (bucketInfo.amount >= BUCKET_AMOUNT_LIMIT) {
    throw new Error("Bucket amount limit reached");
  }
}

export async function uploadImage(file: Express.Multer.File) {
  await checkBucketLimit();

  const bucket = getBucket();
  // hash the file buffer content to get a unique id
  const fileHash = crypto
    .createHash("sha256")
    .update(file.buffer)
    .digest("hex");
  const newFileName = `${fileHash}`;
  const destFile = bucket.file(newFileName);

  const [exists] = await destFile.exists();

  if (!exists) {
    const processedBuffer = await sharp(file.buffer).rotate().jpeg().toBuffer();
    await destFile.save(processedBuffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });
    // Make file public so that it can be accessed by the frontend
    await destFile.makePublic();
  }

  return {
    file: newFileName,
    url: `${STORAGE_BASE_URL}/${getBucketName()}/${newFileName}`,
    hash: fileHash,
  };
}

export type UploadedImage = Awaited<ReturnType<typeof uploadImage>>;

export function getUploadedImageFromHash(hash: string): UploadedImage {
  return {
    file: `${hash}`,
    url: `${STORAGE_BASE_URL}/${getBucketName()}/${hash}`,
    hash,
  };
}

const DETECTION_THRESHOLD = 0.9;
export const playersFromText = (text: string) => {
  const words = text.split("\n");
  const players = [];
  for (const word of words) {
    let biggest = 0,
      biggestCard = null;
    for (const card of cards) {
      const bestSimilarity = Math.max(
        compareStrings(word, card.name),
        compareStrings(word, card.id)
      );
      if (bestSimilarity > biggest) {
        biggest = bestSimilarity;
        biggestCard = card;
      }
    }
    if (biggest > DETECTION_THRESHOLD && biggestCard) {
      players.push(biggestCard);
    }
  }
  return players;
};

async function detectTextFromImage(image: UploadedImage) {
  const bucket = getBucket();
  const file = bucket.file(`${image.hash}.json`);
  const [exists] = await file.exists();
  if (exists) {
    const content = await file.download();
    return JSON.parse(content.toString());
  }
  const [result] = await visionClient.textDetection(image.url);
  await file.save(JSON.stringify(result));
  return result;
}

export async function processImage(image: UploadedImage) {
  await checkBucketLimit();
  const result = await detectTextFromImage(image);
  const fullText = result?.fullTextAnnotation?.text ?? "";
  const players = playersFromText(fullText);
  const textAnnotations = result?.textAnnotations ?? [];
  const playersPolygons = players.map((player) => {
    const allPolygonsText = textAnnotations.filter((t) => {
      const desc = t.description;
      if (!desc || desc.length === 0) {
        return false;
      }
      const splitName: string[] = player.name.split(/[\s-]/);
      return splitName.some(
        (name) => name.toLowerCase() === desc.toLowerCase()
      );
    });
    const allPolygons = allPolygonsText.flatMap(
      (t) => t.boundingPoly?.vertices ?? []
    );
    return {
      vertices: convexHull(allPolygons),
      color: generateRandomColor(),
      player,
    };
  });

  const allPolygons = (result.textAnnotations ?? [])
    .filter((t) => {
      const desc = t.description;
      if (!desc) {
        return false;
      }
      return players.some((p) => {
        return p.name.toLowerCase().includes(desc.toLowerCase());
      });
    })
    .map((t) => t.boundingPoly);
  const width = result.fullTextAnnotation?.pages?.[0].width;
  const height = result.fullTextAnnotation?.pages?.[0].height;
  const textVertices = (result.textAnnotations?.[0]?.boundingPoly.vertices ??
    []) as Array<{ x: number; y: number }>;
  const textBox = boundingBox(textVertices);

  const processedResult = {
    url: image.url,
    playersPolygons,
    players,
    textVertices,
    textBox,
    imageBox: {
      x: 0,
      y: 0,
      width,
      height,
    },
    allPolygons,
    __cloudVisionResult: result,
  };

  return processedResult;
}

export type DetectionResult = Awaited<ReturnType<typeof processImage>>;
