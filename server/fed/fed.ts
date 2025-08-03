import { Activity, ActorDispatcher, CollectionDispatcher, createFederation, Federation, Follow, Group, MemoryKvStore, Note, Person, PUBLIC_COLLECTION } from "@fedify/fedify";
import { DenoKvStore } from "@fedify/fedify/x/denokv";
import { Router } from "effect/platform/HttpApiBuilder";
import { ActorModel, ActorType, PostModel } from "../db/schema.ts";
import { getActorsFollowedBy } from "../db/utils.ts";

// See [https://fedify.dev/manual/federation#tcontextdata]
export function getServeHandler() {
    const fed = createFederation<void>({ kv: new MemoryKvStore() }); // TODO: Replace with DenoKvStore

    //---------- Endpoints ----------//

    //--- Generic actors (uniform for users & groups) ---//
    fed.setActorDispatcher("/users/{identifier}", async (ctx, id) => {
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
            contextData: undefined, // TODO
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