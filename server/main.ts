/// <reference lib="deno.ns" />
import { migrateDb } from "./db/migrate.ts";
import mongoose from "mongoose";
import { env } from "./utils/env.ts";
import { getServeHandlers } from "./fed/fed.ts";

import { integrateFederation } from "@fedify/express";
import { createFederation, MemoryKvStore } from "@fedify/fedify";

import express from 'express';
import cors from 'cors';
import router from './api.ts';


//---------- Setup ----------//
// DB
const DB_URL = env("DB_URL");
const PORT = env("PORT", 3000);
const FE_DIR = "./frontend/dist";

await mongoose.connect(DB_URL);

// migrateDb();

// Fedify
const fed = createFederation<null>({ kv: new MemoryKvStore() }); // TODO: Replace with DenoKvStore

//---------- Main ----------//
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(FE_DIR));

app.set("trust proxy", true);
// app.use(integrateFederation(fed, (req) => fed.fetch(req, { contextData: null })));

app.use('/api', router);

app.listen(PORT, () => { console.log(`🚀 Server is running at http://localhost:${PORT}`); });


//---------- Cleanup ----------//
Deno.addSignalListener("SIGINT", () => {
    console.log("\n\x1b[91m💀 Terminating\x1b[0m")
    mongoose.disconnect();
    Deno.exit(0);
});