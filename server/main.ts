/// <reference lib="deno.ns" />
import { Effect, Context, Console, Schema, Layer, pipe, Data } from "effect";

import mongoose from "mongoose";
import { PostModel } from "./db/schema.ts";
import { getPostVoteAggregate } from "./db/utils.ts";
import { env } from "./utils/env.ts";

//---------- Setup ----------//
const DB_URL = env("DB_URL");

await mongoose.connect(DB_URL);

//---------- Run migrations ----------//
// NOTE: Uncomment & run this the first time you run this script
// import { migrateDb } from "./db/migrate.ts";
// await migrateDb();


//---------- Main ----------//
const post = await PostModel.findOne({ title: "Check this out" });
console.log("POST:", post);
if (post == null) throw new Error("Post not found");

console.log("META:", await getPostVoteAggregate(post._id));

//---------- Cleanup ----------//
mongoose.disconnect();

// import { createFederation, MemoryKvStore, Person } from "@fedify/fedify";
// import { DenoKvStore } from "@fedify/fedify/x/denokv";
// import { Router } from "effect/platform/HttpApiBuilder";

// const fed = createFederation<void>({
//     kv: new MemoryKvStore() // TODO: Replace with DenoKvStore
// });

// // Users endpoint
// fed.setActorDispatcher("/users/{identifier}", async (ctx, id) => {
//     if (id !== "me") return null;

//     return new Person({
//         id: ctx.getActorUri(id),
//         name: "Me",
//         summary: "This is me!",
//         preferredUsername: id,
//         url: new URL("/", ctx.url)
//     });
// })

// async function handleFederationNotFound(req: Request) {
//     console.log("URL:", new URL(req.url));
//     return new Response("🔍 Not found", { status: 404 });
// }

// async function handleFederationNotAcceptable(req: Request) {
//     return new Response("❌ Not acceptable", { status: 406 });
// }

// Deno.serve(req => fed.fetch(req, {
//     contextData: undefined,
//     onNotFound: handleFederationNotFound,
//     onNotAcceptable: handleFederationNotAcceptable
// })); // See [https://fedify.dev/manual/federation#tcontextdata]

// // Deno.serve(req => new Response("Hello world", { headers: { "Content-Type": "text/plain" } }));

// // const Person = Schema.Struct({
// //     name: Schema.optionalWith(Schema.NonEmptyString, { exact: true }),
// //     age: Schema.Int
// // });
// // type PersonType = Schema.Schema.Type<typeof Person>;

// // Schema.decodeSync(Person)({ age: 10, name: "" });

// // const AppRouter = HttpRouter.Default.use((router) =>
// //     Effect.gen(function*() {
// //         yield* router.mount("/users", yield* UsersRouter.router);
// //     })
// // ).pipe(Layer.provide(UserRoutes))
