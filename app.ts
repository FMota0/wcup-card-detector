import express from "express";
import multer from "multer";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import path from "path";

import {
  uploadImage,
  processImage,
  getBucketInfo,
  cachedProcessImage,
} from "./lib/imageProcessor";
import { downscaleAndAdjust } from "./lib/utils";
import * as cache from "./lib/cache";
import { buildResultPageHtml } from "./lib/html/pages/result/[hash]";
import { buildHomePageHtml } from "./lib/html/pages/home";

const app = express();
const port = process.env.PORT || 3001;

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

const multerMid = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMIT,
  },
});

const CACHE_DURATION = 60 * 60;

app.disable("x-powered-by");
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(compression());
app.use(cors());
app.use(express.static(path.join(__dirname, "public"), { maxAge: CACHE_DURATION * 1000  }));

function withCacheHeaders(duration: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method === "GET" && process.env.NODE_ENV === "production") {
      res.set("Cache-Control", `public, max-age=${duration}`);
    }
    next();
  };
}

app.post("/process", multerMid.single("image"), async (req, res, next) => {
  try {
    const { isJson } = req.query;
    const file = req.file;
    if (!file) {
      res.redirect('/?error=Nenhuma imagem foi selecionada');
      return;
    }
    const image = await uploadImage(file);
    const result = await processImage(image);
    if (isJson) {
      res.json(downscaleAndAdjust(result));
    } else {
      res.redirect(`/result/${image.hash}`);
    }

    cache.remove("/");
  } catch (e) {
    console.log(e);
    next(e);
  }
});

async function cachedResultPageToHash(hash: string) {
  const inCacheHtml = cache.get(`/result/${hash}`);
  if (inCacheHtml) {
    return inCacheHtml;
  }
  const result = await cachedProcessImage(hash);
  const html = buildResultPageHtml(downscaleAndAdjust(result));
  cache.set(`/result/${hash}`, html);
  return html;
}

app.get("/", withCacheHeaders(CACHE_DURATION), async (req, res, next) => {
  const inCacheHtml = cache.get(req.path);
  if (inCacheHtml) {
    return res.send(inCacheHtml);
  }
  const bucketInfo = await getBucketInfo();
  const html = buildHomePageHtml(bucketInfo);
  cache.set(req.path, html);
  res.send(html);

  // We trigger cache warming here, so that when the user clicks on a result page,
  // it's already in the cache.
  bucketInfo.files.forEach((file) => {
    cachedResultPageToHash(file.hash);
  });
});

app.get("/result/:hash", withCacheHeaders(CACHE_DURATION), async (req, res, next) => {
  const { hash } = req.params;
  const html = await cachedResultPageToHash(hash);
  res.send(html);
});

app.get("*", (req, res) => {
  res.redirect('/');
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
