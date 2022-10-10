import crypto from "crypto";
import sharp from "sharp";
import { storage, visionClient } from "./cloudClients";
import {
  compareStrings,
  convexHull,
  generateRandomColor,
  boundingBox,
} from "./utils";
import { Card, cards } from "../data/cards";

const IMAGE_PREFIX = "img_";
const TEXT_PREFIX = "txt_";
const META_PREFIX = "meta_";
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
    amount: files.filter((file) => file.name.startsWith(IMAGE_PREFIX)).length,
    files: files.filter((file) => file.name.startsWith(META_PREFIX)).map((file) => {
      const [_, detectedPlayers, hash] = file.name.split("_");
      return {
        detectedPlayers: parseInt(detectedPlayers),
        ...getUploadedImageFromHash(hash),
      };
    }).filter((file) => file.detectedPlayers > 0).slice(0, 10),
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
  const newFileName = `${IMAGE_PREFIX}${fileHash}`;
  const destFile = bucket.file(newFileName);

  const [exists] = await destFile.exists();

  if (!exists) {
    const processedBuffer = await sharp(file.buffer).rotate().jpeg({ quality: 70 }).toBuffer();
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
    file: `${IMAGE_PREFIX}${hash}`,
    url: `${STORAGE_BASE_URL}/${getBucketName()}/${IMAGE_PREFIX}${hash}`,
    hash,
  };
}

const DETECTION_THRESHOLD_FRONT = 0.78;
const DETECTION_THRESHOLD_BACK = 0.92;
export interface DetectedCard extends Card {
  face: "front" | "back";
}

export const playersFromText = (text: string) => {
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

export async function uploadMetadata(
  hash: string,
  metadata: { detectedPlayers: number; }
) {
  const bucket = getBucket();
  const newFileName = `${META_PREFIX}${metadata.detectedPlayers}_${hash}`;
  const destFile = bucket.file(newFileName);

  await destFile.save(JSON.stringify(metadata), {
    metadata: {
      contentType: "application/json",
    },
  });
}

async function detectTextFromImage(image: UploadedImage) {
  const bucket = getBucket();
  const file = bucket.file(`${TEXT_PREFIX}${image.hash}.json`);
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
  const { uniqueCards, repeatedCards } = playersFromText(fullText);
  const players = [...uniqueCards, ...repeatedCards];
  const textAnnotations = result?.textAnnotations ?? [];
  const uniqueCardsPolygons = uniqueCards.map((player) => {
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

  const repeatedCardsPolygons = (result.textAnnotations ?? [])
    .filter((t) => {
      const desc = t.description;
      if (!desc) {
        return false;
      }
      return repeatedCards.some((p) => {
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
    uniqueCardsPolygons,
    players,
    textVertices,
    textBox,
    imageBox: {
      x: 0,
      y: 0,
      width,
      height,
    },
    repeatedCardsPolygons,
    __vision: result,
  };

  await uploadMetadata(image.hash, {
    detectedPlayers: players.length,
  });

  return processedResult;
}

export type DetectionResult = Awaited<ReturnType<typeof processImage>>;
