import { storage, visionClient } from "./cloudClients";
import { compareStrings, genRandomId } from "./utils";
import { cards } from "../data/cards";

const STORAGE_BASE_URL = "https://storage.googleapis.com";

function getBucketName() {
  return process.env.BUCKET_NAME ?? "my-bucket";
}

function getBucket() {
  return storage.bucket(getBucketName());
}

export async function uploadImage(file: Express.Multer.File): Promise<{
  file: string;
  url: string;
}> {
  const bucket = getBucket();
  const newFileName = `${genRandomId()}.${file.originalname.split(".").pop()}`;
  const destFile = bucket.file(newFileName);
  await destFile.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
  });
  // Make file public so that it can be accessed by the frontend
  await destFile.makePublic();
  return {
    file: newFileName,
    url: `${STORAGE_BASE_URL}/${getBucketName()}/${newFileName}`,
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

export type UploadedImage = Awaited<ReturnType<typeof uploadImage>>;

export async function processImage(image: UploadedImage) {
  const [result] = await visionClient.textDetection(image.url);
  const fullText = result?.fullTextAnnotation?.text ?? "";
  const players = playersFromText(fullText);
  return {
    url: image.url,
    players,
    width: result.fullTextAnnotation?.pages?.[0].width,
    height: result.fullTextAnnotation?.pages?.[0].height,
    points: result.textAnnotations?.[0]?.boundingPoly,
    allPolygons: (result.textAnnotations ?? [])
      .filter((t) => {
        const desc = t.description;
        if (!desc) {
          return false;
        }
        return players.some((p) => {
          return p.name.toLowerCase().includes(desc.toLowerCase());
        });
      })
      .map((t) => t.boundingPoly),
    __cloudVisionResult: result,
  };
}

export type DetectionResult = Awaited<ReturnType<typeof processImage>>;
