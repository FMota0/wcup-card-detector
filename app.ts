import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";

import {
  uploadImage,
  processImage,
  getUploadedImageFromHash,
  getBucketInfo,
} from "./lib/imageProcessor";
import { buildHomePageHtml, buildResultPageHtml } from "./lib/buildHtml";

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
app.use(cors());
app.use(multerMid.single("file"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/process", async (req, res, next) => {
  try {
    const { isJson } = req.query;
    const file = req.file;
    if (!file) {
      return res.status(400).send("No file uploaded.");
    }
    const image = await uploadImage(file);
    const result = await processImage(image);
    if (isJson) {
      res.json(result);
    } else {
      res.redirect(`/result/${image.hash}`);
    }
  } catch (e) {
    console.log(e);
    next(e);
  }
});

app.get("/", async (req, res, next) => {
  const bucketInfo = await getBucketInfo();
  res.send(buildHomePageHtml(bucketInfo));
});

app.get("/result/:hash", async (req, res, next) => {
  const { hash } = req.params;
  const image = getUploadedImageFromHash(hash);
  const result = await processImage(image);
  res.send(buildResultPageHtml(result));
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
