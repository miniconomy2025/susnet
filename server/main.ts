/// <reference lib="deno.ns" />

import mongoose from "mongoose";
import { env } from "./utils/env.ts";

import { createFederation, MemoryKvStore } from "@fedify/fedify";
import cookieParser from "cookie-parser";

import cors from "cors";
import express from "express";
import router from "./api.ts";

//---------- Setup ----------//
// DB
const DB_URL = env("DB_URL");
const PORT = env("PORT", 3000);

mongoose.connect(DB_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  });

// Fedify
const fed = createFederation<void>({ kv: new MemoryKvStore() }); // TODO: Replace with DenoKvStore
// const handlers = getServeHandlers(fed);
// Deno.serve(req => fed.fetch(req, handlers));

//---------- Main ----------//

const app = express();
// const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/susnet';

app.use(cors({
  origin: ["http://localhost:8000", "https://susnet.co.za"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/api", router);

app.set("trust proxy", true);
// app.use(integrateFederation(fed, (req) => "context data goes here")); // TODO

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

//---------- Cleanup ----------//
Deno.addSignalListener("SIGINT", () => {
  console.log("\n\x1b[91m💀 Terminating\x1b[0m");
  mongoose.disconnect();
  Deno.exit(0);
});
