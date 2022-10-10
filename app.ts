import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import morgan from "morgan";

import {
  uploadImage,
  processImage,
  getUploadedImageFromHash,
  getBucketInfo,
} from "./lib/imageProcessor";
import { buildHomePageHtml, buildResultPageHtml } from "./lib/buildHtml";
import { downscaleAndAdjust } from "./lib/utils";

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

const inMemoryCache: { [key: string]: {
  html: string,
  ttl: number,
} } = {};

app.disable("x-powered-by");
app.use(compression());
app.use(cors());
app.use(multerMid.single("image"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

function addCacheHeaders(res: express.Response) {
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Cache-Control", "public, max-age=3600");
  }
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
      res.json(downscaleAndAdjust(result));
    } else {
      res.redirect(`/result/${image.hash}?w=${w}`);
    }
  } catch (e) {
    console.log(e);
    next(e);
  }
});

const CACHE_TTL = 1000 * 60 * 60; // 1 hour

app.get("/", async (req, res, next) => {
  if (req.path in inMemoryCache && inMemoryCache[req.path].ttl > Date.now()) {
    addCacheHeaders(res);
    return res.send(inMemoryCache[req.path].html);
  }
  const bucketInfo = await getBucketInfo();
  const html = buildHomePageHtml(bucketInfo);
  inMemoryCache[req.path] = {
    html,
    ttl: Date.now() + CACHE_TTL,
  };
  res.send(html);
});

app.get("/result/:hash", async (req, res, next) => {
  if (req.path in inMemoryCache && inMemoryCache[req.path].ttl > Date.now()) {
    addCacheHeaders(res);
    res.send(inMemoryCache[req.path].html);
    return;
  }
  const { hash } = req.params;
  const { w } = req.query;
  const image = getUploadedImageFromHash(hash);
  const result = downscaleAndAdjust(await processImage(image), parseInt((w as string) ?? "400"));
  addCacheHeaders(res);
  const html = buildResultPageHtml(result);
  inMemoryCache[req.path] = {
    html,
    ttl: Date.now() + CACHE_TTL,
  };
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
