import {
    Context, createFederation, Endpoints,
    Federation, Follow, Group, importJwk,
    InProcessMessageQueue, MemoryKvStore, Note,
    Person, exportJwk, generateCryptoKeyPair,
} from "@fedify/fedify";
import { DenoKvStore } from "@fedify/fedify/x/denokv";
import { ActorModel, ActorType, KeyModel, Key, PostModel } from "../db/schema.ts";
import { NextFunction } from "express";

//---------- Setup federation instance ----------//
const fed = createFederation({
    kv: new MemoryKvStore(), // TODO: Replace with DenoKvStore
    queue: new InProcessMessageQueue()
});


//---------- Context injector ----------//
export interface FederatedRequest extends Request { fedCtx: any; }

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



//==================== Dispatchers ====================//
// See [https://fedify.dev/manual/federation#tcontextdata]

//---------- Generic actors (uniform for users & groups) ----------//
fed.setActorDispatcher("/users/{identifier}", async (ctx, id) => {
    console.log("LOOKING FOR ACTOR:", id);
    const actor = await ActorModel.findOne({ name: id });
    console.log("ACTOR:", actor);
    if (actor == null) return null;

    const keys = await ctx.getActorKeyPairs(id);

    return new (actor.type === ActorType.user ? Person : Group)({
        id: ctx.getActorUri(id),
        name: actor.name,
        icon: new URL(actor.thumbnailUrl),
        summary: actor.description ?? "",
        preferredUsername: actor.name,

        inbox: ctx.getInboxUri(id),
        endpoints: new Endpoints({ sharedInbox: ctx.getInboxUri() }),
        // url: new URL("/", ctx.url),
        url: ctx.getActorUri(id),
        publicKey: keys[0]?.cryptographicKey,
    });
}).setKeyPairsDispatcher(async (ctx, id) => {
    const user = await ActorModel.findOne({ name: id });
    console.log("ID:", id);
    if (user == null) return [];

    console.log("USER ID:", user._id);

    const rows = await KeyModel.find({ actorRef: user._id })
    const keys = Object.fromEntries(rows.map((row) => [row.keyType, row])) as Record<Key["keyType"], Key>;

    console.log("ROWS:", rows);
    console.log("KEYS:", keys);

    const pairs: CryptoKeyPair[] = [];

    // Ensure that the user has a key pair for each supported key type
    // If not, generate & store in the DB
    const KEY_TYPES = ["RSASSA-PKCS1-v1_5", "Ed25519"] as const;
    for (const keyType of KEY_TYPES) {
        if (keys[keyType] == null) {
            console.log(`${id} does not have an ${keyType} key, creating one...`);
            const { privateKey, publicKey } = await generateCryptoKeyPair(keyType);

            console.log("UPSERT:", await KeyModel.findOneAndUpdate({ actorRef: user._id, keyType }, {
                actorRef: user._id,
                keyType,
                privateKey: JSON.stringify(await exportJwk(privateKey)),
                publicKey: JSON.stringify(await exportJwk(publicKey)),
            }, { upsert: true, new: true }));

            pairs.push({ privateKey, publicKey });
        }
        else {
            pairs.push({
                privateKey: await importJwk(JSON.parse(keys[keyType].privateKey), "private"),
                publicKey: await importJwk(JSON.parse(keys[keyType].publicKey), "public"),
            });
        }
    }

    console.log("KEY PAIRS:", pairs);
    return pairs;
});

//---------- Posts (Objects) ----------//
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

// fed.setObjectDispatcher(Follow, "/activities/{id}", async (ctx, { id }: { id: string }) => {
//     return inboxActivityToActivityPubActivity(inboxActivity);
// });

//---------- Followers ----------//
//---------- Following ----------//
//---------- Inbox ----------//
//---------- Outbox ----------//



//==================== Listeners  ====================//
//---------- Inbox ----------//
fed.setInboxListeners("/users/{identifier}/inbox", "/inbox")
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



export default fed;