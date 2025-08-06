/// <reference lib="deno.ns" />
import { Console, Context, Data, Effect, Layer, pipe, Schema } from "effect";
import { migrateDb } from "./db/migrate.ts";
import cookieParser from "cookie-parser";

import mongoose from "mongoose";
import { PostModel } from "./db/schema.ts";
import { getPostVoteAggregate } from "./db/utils.ts";
import { env } from "./utils/env.ts";
import { getServeHandlers } from "./fed/fed.ts";

import { integrateFederation } from "@fedify/express";
import { createFederation, MemoryKvStore } from "@fedify/fedify";

import express from "express";
import cors from "cors";
import router from "./api.ts";
import process from "node:process";

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

// await migrateDb()

//---------- Main ----------//
// const post = await PostModel.findOne({ title: "Check this out" });
// console.log("POST:", post);
// if (post == null) throw new Error("Post not found");

// console.log("META:", await getPostVoteAggregate(post._id));

// main.ts
import express from "express";
import cors from "cors";
import router from "./api.ts";

const app = express();

app.use(cors({
  origin: ["http://localhost:8000", "https://susnet.co.za"],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use("/api", router);

app.set("trust proxy", true);
// app.use(integrateFederation(fed, (req) => "context data goes here")); // TODO

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

//---------- Fedify setup ----------//
// const { fed, handlers } = getServeHandler();
// Deno.serve(req => fed.fetch(req, handlers));

// const Person = Schema.Struct({
//     name: Schema.optionalWith(Schema.NonEmptyString, { exact: true }),
//     age: Schema.Int
// });
// type PersonType = Schema.Schema.Type<typeof Person>;

// Schema.decodeSync(Person)({ age: 10, name: "" });

// const AppRouter = HttpRouter.Default.use((router) =>
//     Effect.gen(function*() {
//         yield* router.mount("/users", yield* UsersRouter.router);
//     })
// ).pipe(Layer.provide(UserRoutes))

//---------- Cleanup ----------//
Deno.addSignalListener("SIGINT", () => {
  console.log("\n\x1b[91m💀 Terminating\x1b[0m");
  mongoose.disconnect();
  Deno.exit(0);
});
