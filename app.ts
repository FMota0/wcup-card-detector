import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import morgan from "morgan";
import path from "path";

import {
  uploadImage,
  processImage,
  getUploadedImageFromHash,
  getBucketInfo,
  DetectionResult,
} from "./lib/imageProcessor";
import { buildFakeResultPageHtml, buildHomePageHtml, buildResultPageHtml } from "./lib/buildHtml";
import { downscaleAndAdjust } from "./lib/utils";
import * as cache from "./lib/cache";

dotenv.config({ path: __dirname + "/.env.local" });

const app = express();
const port = process.env.PORT || 3001;

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

const multerMid = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMIT,
  },
});

app.disable("x-powered-by");
app.use(compression());
app.use(cors());
app.use(multerMid.single("image"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

const CACHE_DURATION = 60 * 60;
function withCacheHeaders(duration: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method === "GET" && process.env.NODE_ENV === "production") {
      res.set("Cache-Control", `public, max-age=${duration}`);
    }
    next();
  };
}

app.post("/process", async (req, res, next) => {
  try {
    const { isJson, w } = req.query;
    const file = req.file;
    if (!file) {
      return res.status(400).send("No file uploaded.");
    }
    const image = await uploadImage(file);
    const result = await processImage(image);
    if (isJson) {
      res.json(downscaleAndAdjust(result, 400, 400));
    } else {
      res.redirect(`/result/${image.hash}`);
    }
  } catch (e) {
    console.log(e);
    next(e);
  }
});

app.get("/", withCacheHeaders(CACHE_DURATION), async (req, res, next) => {
  const inCacheHtml = cache.get(req.path);
  if (inCacheHtml) {
    return res.send(inCacheHtml);
  }
  const bucketInfo = await getBucketInfo();
  const html = buildHomePageHtml(bucketInfo);
  cache.set(req.path, html);
  res.send(html);
});

async function cachedProcessImage(hash: string) {
  const inCache = cache.get<DetectionResult>(hash);
  if (inCache) {
    return inCache;
  }
  const result = await processImage(getUploadedImageFromHash(hash));
  cache.set(hash, result);
  return result;
}

app.get("/result/:hash/:w/:h", withCacheHeaders(CACHE_DURATION), async (req, res, next) => {
  const inCacheHtml = cache.get(req.path);
  if (inCacheHtml) {
    return res.send(inCacheHtml);
  }
  const { hash, w, h } = req.params;
  const processed = await cachedProcessImage(hash);
  const result = downscaleAndAdjust(processed, parseInt(w), parseInt(h));
  const html = buildResultPageHtml(result);
  res.send(html);
});

app.get("/result/:hash", withCacheHeaders(CACHE_DURATION), async (req, res, next) => {
  const inCacheHtml = cache.get(req.path);
  if (inCacheHtml) {
    return res.send(inCacheHtml);
  }
  const { hash } = req.params;
  const html = buildFakeResultPageHtml(hash);
  cache.set(req.path, html);
  res.send(html);
});

async function run() {
  try {
    app.listen(port, () =>
      console.log(`Example app listening on port ${port}!`)
    );
  } finally {
  }
}

run();
