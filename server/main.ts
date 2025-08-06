/// <reference lib="deno.ns" />
import { Effect, Context, Console, Schema, Layer, pipe, Data } from "effect";
import { migrateDb } from "./db/migrate.ts";


import mongoose from "mongoose";
import { PostModel } from "./db/schema.ts";
import { getPostVoteAggregate } from "./db/utils.ts";
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

await mongoose.connect(DB_URL);

// Fedify
const fed = createFederation<void>({ kv: new MemoryKvStore() }); // TODO: Replace with DenoKvStore
// const handlers = getServeHandlers(fed);
// Deno.serve(req => fed.fetch(req, handlers));


//---------- Main ----------//

const app = express();
// const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/susnet';

app.use(cors());
app.use(express.json());
app.use('/api', router);

app.set("trust proxy", true);
// app.use(integrateFederation(fed, (req) => "context data goes here")); // TODO

app.listen(PORT, () => { console.log(`🚀 Server is running at http://localhost:${PORT}`); });

// mongoose.connect(MONGO_URI)
//   .then(() => {
//     console.log('✅ Connected to MongoDB');
//   })
//   .catch((err) => {
//     console.error('❌ Failed to connect to MongoDB:', err);
//     process.exit(1);
//   });




//---------- Cleanup ----------//
Deno.addSignalListener("SIGINT", () => {
    console.log("\n\x1b[91m💀 Terminating\x1b[0m")
    mongoose.disconnect();
    Deno.exit(0);
});