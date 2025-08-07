import { Activity, ActorDispatcher, CollectionDispatcher, createFederation, Federation, Follow, Group, InProcessMessageQueue, MemoryKvStore, Note, Person, PUBLIC_COLLECTION } from "@fedify/fedify";
import { integrateFederation } from "@fedify/express";
import { DenoKvStore } from "@fedify/fedify/x/denokv";
import { handler, Router } from "effect/platform/HttpApiBuilder";
import { ActorModel, ActorType, PostModel } from "../db/schema.ts";

// See [https://fedify.dev/manual/federation#tcontextdata]
function getServeHandlers(fed: Federation<void>) {

    //---------- Endpoints ----------//

    //--- Generic actors (uniform for users & groups) ---//
    fed.setActorDispatcher("/users/{identifier}", async (ctx, id) => {
        if (id == "me") {
            return new Person({
                id: ctx.getActorUri(id),
                name: "Me",  // Display name
                summary: "This is me!",  // Bio
                preferredUsername: id,  // Bare handle
                url: new URL("/", ctx.url),
            });
        }
        console.log("LOOKING FOR ACTOR:", id);
        const actor = await ActorModel.findOne({ name: id });
        console.log("ACTOR:", actor);
        if (actor == null) return null;

        return new (actor.type === ActorType.user ? Person : Group)({
            id: ctx.getActorUri(id),
            name: actor.name,
            summary: actor.description ?? "",
            preferredUsername: actor.name,
            url: new URL("/", ctx.url),
            inbox: ctx.getInboxUri(id)
        });
    });

    //--- Posts ---//
    fed.setObjectDispatcher(Note, "/posts/{postId}", async (ctx, { postId }) => {
        const post = await PostModel.findOne({ postId });
        console.log("POST:", post);
        if (post == null) return null;

        return new Note({
            id: ctx.getObjectUri(Note, { postId }),
            content: post?.content ?? "",
            name: post?.title ?? "",
            attachments: post.attachments?.map(a => new URL(a.url)) ?? []
        });
    });

    //--- Inbox ---//
    fed
        .setInboxListeners("/users/{identifier}/inbox", "/inbox")
        .on(Follow, async (ctx, follow) => {
            const { id, actorId, objectId } = follow;
            if (![id, actorId, objectId].every(x => (x != null))) return;

            const parsed = ctx.parseUri(follow.objectId);
            if (parsed?.type !== "actor") return;

            const followee = ActorModel.findOne({ name: parsed.identifier });
            if (followee == null) return;

            const follower = await follow.getActor(ctx);
            console.log("FOLLOWER:", follower);
        });


    //---------- Return ----------//
    return {
        fed,
        handlers: {
            contextData: new URL('http://locahost:8000/fed/'),
            onNotFound: (req: Request) => {
                console.log("URL:", new URL(req.url));
                return new Response("🔍 Not found", { status: 404 });
            },
            onNotAcceptable: (req: Request) => {
                return new Response("❌ Not acceptable", { status: 406 });
            }
        }
    };
}

export function getFed() {
    const federation = createFederation<void>({
        kv: new MemoryKvStore(),
        queue: new InProcessMessageQueue(),
        allowPrivateAddress: true,
    });

    const { fed, handlers } = getServeHandlers(federation)
    return integrateFederation(
        fed,
        (_req) => {
            console.log(_req)
            return handlers.contextData
        }
    )
}