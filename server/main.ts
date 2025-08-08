/// <reference lib="deno.ns" />

import { migrateDb } from "./db/migrate.ts";
import mongoose from "mongoose";
import { env } from "./utils/env.ts";

import { integrateFederation } from "@fedify/express";

import cors from "cors";
import express from "express";
import router from "./api.ts";
import fed from "./fed/fed.ts";

//---------- Setup ----------//
// DB
const DB_URL = env("DB_URL");
const PORT = env("PORT", 3000);
const FE_DIR = "./frontend/dist"

mongoose.connect(DB_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  });

// migrateDb();

//---------- Main ----------//
const app = express();

app.set("trust proxy", true);
app.use(cors({
  origin: ["http://localhost:8000", "https://susnet.co.za"],
  credentials: true,
}));

// Handle fedify
app.use(integrateFederation(fed, () => undefined))

// app.use((req, res, next) => {
//   console.log("FEDIFY REQUEST");
//   // if (req.path.startsWith('/api') && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) { return next(); } // Skip

//   integrateFederation(fed, (rq) => {
//     const domain = env("DOMAIN", "localhost:3000")
//     const url = new URL(rq.originalUrl, `${domain.startsWith('localhost') ? 'http' : 'https'}://${domain}`);
//     console.log("URL:", url);
//     return url;
//   })(req, res, next);
// });

// Parse body
app.use(express.urlencoded({ extended: true , limit: '1gb'}));
app.use(express.json({limit: '1gb'}));

// app.use('', injectFedContext, otherRoutes);

// Handle API
app.use("/api", router);

// Handle frontend
app.use(express.static(FE_DIR));
app.all("/{*any}", (req, res, next) => {
  if (req.baseUrl.includes('/fed') || req.baseUrl.includes('/api')) {
    next()
  }
  res.sendFile("index.html", { root: FE_DIR });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

//---------- Cleanup ----------//
Deno.addSignalListener("SIGINT", () => {
  console.log("\n\x1b[91m💀 Terminating\x1b[0m");
  mongoose.disconnect();
  Deno.exit(0);
});
