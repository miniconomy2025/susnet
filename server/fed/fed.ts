import { Context, createFederation, Federation, Follow, Group, MemoryKvStore, Note, Person } from "@fedify/fedify";
import { DenoKvStore } from "@fedify/fedify/x/denokv";
import { ActorModel, ActorType, PostModel } from "../db/schema.ts";
import { NextFunction } from "express";


export interface FederatedRequest extends Request {
    fedCtx: any;
}

//---------- Context injector ----------//
// Inject fedify context on the ActivityPub requests
// export function injectFedContext(req: FederatedRequest, res: Response, next: NextFunction) {
//   try {
//     const domain = process.env.DOMAIN || 'localhost:8000';
//     const protocol = domain.includes('localhost') ? 'http' : 'https';
//     const baseUrl = `${protocol}://${domain}`;
    
//     req.fedCtx = fed.createContext(new URL(req.originalUrl, baseUrl), { request: req, response: res });
//     next();

//   } catch (error) { console.error('Failed creating fed context:', error); next(); }
// }

//---------- Setup federation instance ----------//



const fed = createFederation({ kv: new MemoryKvStore() }); // TODO: Replace with DenoKvStore

//---------- Endpoint setup ----------//
// See [https://fedify.dev/manual/federation#tcontextdata]

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

export default fed;

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
