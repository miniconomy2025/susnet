/// <reference lib="deno.unstable" />

import {
    Accept, Create, createFederation, Endpoints,
    Follow, Group, importJwk,
    InProcessMessageQueue, MemoryKvStore, Note, Like,
    Person, PUBLIC_COLLECTION, exportJwk, generateCryptoKeyPair, Image,
    getActorHandle, isActor, Undo, type Actor as APActor, type Recipient,
} from "@fedify/fedify";
import { ActorModel, ActorType, KeyModel, Key, PostModel, FollowModel, Actor, VoteModel, VoteType } from "../db/schema.ts";
import { DenoKvStore } from "@fedify/fedify/x/denokv";

//---------- Setup federation instance ----------//
const kv = await Deno.openKv();
const fed = createFederation({
    kv: new DenoKvStore(kv),
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
    if (actor == null) return null;

    const keys = await ctx.getActorKeyPairs(id);
    // console.log("KEYS:", keys);

    const actorData: any = {
        id: ctx.getActorUri(id),
        name: actor.name,
        summary: actor.description ?? "",
        preferredUsername: actor.name,
        inbox: ctx.getInboxUri(id),
        endpoints: new Endpoints({ sharedInbox: ctx.getInboxUri() }),
        url: ctx.getActorUri(id),
        publicKey: keys[0]?.cryptographicKey,
    };
    try {
        if (actor.thumbnailUrl && !actor.thumbnailUrl.startsWith('<')) { 
            actorData.icon = new Image({
                mediaType: "image/jpeg",
                url: new URL(actor.thumbnailUrl)
            });
        }
    } catch { }

    return new (actor.type === ActorType.user ? Person : Group)(actorData);
}).setKeyPairsDispatcher(async (ctx, id) => {
    const user = await ActorModel.findOne({ name: id });
    if (user == null) return [];

    const rows = await KeyModel.find({ actorRef: user._id })
    const keys = Object.fromEntries(rows.map((row) => [row.keyType, row])) as Record<Key["keyType"], Key>;

    const pairs: CryptoKeyPair[] = [];

    // Ensure that the user has a key pair for each supported key type
    // If not, generate & store in the DB
    const KEY_TYPES = ["RSASSA-PKCS1-v1_5", "Ed25519"] as const;
    for (const keyType of KEY_TYPES) {
        if (keys[keyType] == null) {
            console.log(`${id} does not have an ${keyType} key, creating one...`);
            const { privateKey, publicKey } = await generateCryptoKeyPair(keyType);

            const pubKey = JSON.stringify(await exportJwk(publicKey));
            const prvKey = JSON.stringify(await exportJwk(privateKey));
            console.log("PUB:", pubKey);
            console.log("PRV:", prvKey);

            await KeyModel.findOneAndUpdate({ actorRef: user._id, keyType }, {
                actorRef: user._id,
                keyType,
                privateKey: prvKey,
                publicKey: pubKey,
            }, { upsert: true, new: true });

            pairs.push({ privateKey, publicKey });
        }
        else {
            pairs.push({
                privateKey: await importJwk(JSON.parse(keys[keyType].privateKey), "private"),
                publicKey: await importJwk(JSON.parse(keys[keyType].publicKey), "public"),
            });
        }
    }

    return pairs;
});

//---------- Posts (Objects) ----------//
fed.setObjectDispatcher(Note, "/users/{identifier}/posts/{postId}", async (ctx, { identifier: id, postId }) => {
    const post = await PostModel.findOne({ postId }).populate('actorRef');
    if (post == null) return null;

    const actor = post.actorRef as Actor;
    if (actor?.name !== id) return null;

    return new Note({
        id: ctx.getObjectUri(Note, { identifier: id, postId }),
        attribution: ctx.getActorUri(id),
        to: PUBLIC_COLLECTION,
        cc: ctx.getFollowersUri(id),
        content: post.content,
        name: post.title,
        mediaType: "text/html",
        published: Temporal.Instant.fromEpochMilliseconds(post.createdAt?.getTime() ?? Date.now()),
        url: ctx.getObjectUri(Note, { identifier: id, postId }),
        attachments: post.attachments?.map(a => new URL(a.url)) ?? []
    });
});

// fed.setObjectDispatcher(Follow, "/activities/{id}", async (ctx, { id }: { id: string }) => {
//     return inboxActivityToActivityPubActivity(inboxActivity);
// });

//---------- Followers ----------//
fed.setFollowersDispatcher("/users/{identifier}/followers", async (ctx, id) => {
    const actor = await ActorModel.findOne({ name: id });
    if (actor == null) return { items: [] };

    const follows = await FollowModel.find({ targetRef: actor._id }).populate('followerRef');
    const items: Recipient[] = follows
        .filter(follow => {
            const follower = follow.followerRef as Actor;
            return follower.uri && follower.inbox;
        })
        .map(follow => {
            const follower = follow.followerRef as Actor;
            return {
                id: new URL(follower.uri!),
                inboxId: new URL(follower.inbox!),
                endpoints: follower.sharedInbox ? { sharedInbox: new URL(follower.sharedInbox) } : null,
            };
        });
    return { items };
}).setCounter(async (ctx, identifier) => {
    const actor = await ActorModel.findOne({ name: identifier });
    if (actor == null) return 0;
    return await FollowModel.countDocuments({ targetRef: actor._id });
});

//---------- Following ----------//
fed.setFollowingDispatcher("/users/{identifier}/following", async (ctx, id) => {
    const actor = await ActorModel.findOne({ name: id });
    if (actor == null) return { items: [] };

    const follows = await FollowModel.find({ followerRef: actor._id }).populate('targetRef');
    const items: Recipient[] = follows
        .filter(follow => {
            const target = follow.targetRef as Actor;
            return target.uri && target.inbox;
        })
        .map(follow => {
            const target = follow.targetRef as Actor;
            return {
                id: new URL(target.uri!),
                inboxId: new URL(target.inbox!),
                endpoints: target.sharedInbox ? { sharedInbox: new URL(target.sharedInbox) } : null,
            };
        });
    return { items };
}).setCounter(async (ctx, identifier) => {
    const actor = await ActorModel.findOne({ name: identifier });
    if (actor == null) return 0;
    return await FollowModel.countDocuments({ followerRef: actor._id });
});

//---------- Outbox ----------//
fed.setOutboxDispatcher("/users/{identifier}/outbox", async (ctx, id) => {
    const actor = await ActorModel.findOne({ name: id });
    if (actor == null) return { items: [] };

    const posts = await PostModel.find({ actorRef: actor._id }).sort({ createdAt: -1 }).limit(20);
    const items = posts.map(post => ({
        id: ctx.getObjectUri(Note, { identifier: id, postId: post.postId ?? "" }),
        type: "Create",
        actor: ctx.getActorUri(id),
        object: ctx.getObjectUri(Note, { identifier: id, postId: post.postId ?? "" }),
        published: post.createdAt,
    }));
    return { items };

}).setCounter(async (ctx, identifier) => {
    const actor = await ActorModel.findOne({ name: identifier });
    if (actor == null) return 0;
    return await PostModel.countDocuments({ actorRef: actor._id });
});



//---------- Liked Collection ----------//
fed.setLikedDispatcher("/users/{identifier}/liked", async (ctx, identifier) => {
    const actor = await ActorModel.findOne({ name: identifier });
    if (actor == null) return { items: [] };

    const votes = await VoteModel.find({ actorRef: actor._id, vote: VoteType.up }).populate('postId');
    const items = votes.map(vote => {
        const post = vote.postId as any;
        return ctx.getObjectUri(Note, { identifier: post.actorRef.name, postId: post.postId });
    });
    return { items };
}).setCounter(async (ctx, identifier) => {
    const actor = await ActorModel.findOne({ name: identifier });
    if (actor == null) return 0;
    return await VoteModel.countDocuments({ actorRef: actor._id, vote: VoteType.up });
});

//==================== Listeners  ====================//
//---------- Inbox ----------//
fed.setInboxListeners("/users/{identifier}/inbox", "/inbox")
    .on(Follow, async (ctx, follow) => {
        if (follow.objectId == null) { console.log(`Follow missing object: ${follow}`); return; }

        const obj = ctx.parseUri(follow.objectId);
        if (obj == null || obj.type !== "actor") { console.log(`Attempt to follow non-actor: ${follow}`); return; }

        const follower = await follow.getActor();
        if (follower?.id == null || follower.inboxId == null) { console.log(`Follow object does not have an actor: ${follow}`); return; }

        const following = await ActorModel.findOne({ name: obj.identifier });
        if (following == null) { console.log(`Failed to find actor to follow: ${obj}`); return; }

        const followerActor = await persistActor(follower);
        if (followerActor == null) return;

        await FollowModel.findOneAndUpdate(
            { followerRef: followerActor._id, targetRef: following._id },
            { followerRef: followerActor._id, targetRef: following._id, role: 'pleb' },
            { upsert: true }
        );

        const accept = new Accept({
            actor: follow.objectId,
            to: follow.actorId,
            object: follow,
        });
        await ctx.sendActivity(obj, follower, accept);
    })
    .on(Accept, async (ctx, accept) => {
        const follow = await accept.getObject();
        if (!(follow instanceof Follow)) return;

        const following = await accept.getActor();
        if (!isActor(following)) return;

        const follower = follow.actorId;
        if (follower == null) return;

        const parsed = ctx.parseUri(follower);
        if (parsed == null || parsed.type !== "actor") return;

        const followingActor = await persistActor(following);
        const followerActor = await ActorModel.findOne({ name: parsed.identifier });

        if (followingActor && followerActor) {
            await FollowModel.findOneAndUpdate(
                { followerRef: followerActor._id, targetRef: followingActor._id },
                { followerRef: followerActor._id, targetRef: followingActor._id, role: 'pleb' },
                { upsert: true }
            );
        }
    })
    .on(Like, async (ctx, like) => {
        if (like.objectId == null || like.actorId == null) return;

        const parsed = ctx.parseUri(like.objectId);
        if (parsed == null || parsed.type !== "object") return;

        const post = await PostModel.findOne({ postId: parsed.values.postId });
        const liker = await ActorModel.findOne({ uri: like.actorId.href });

        if (post && liker) {
            await VoteModel.findOneAndUpdate(
                { postId: post._id, actorRef: liker._id },
                { postId: post._id, actorRef: liker._id, vote: VoteType.up },
                { upsert: true }
            );
        }
    })
    .on(Undo, async (ctx, undo) => {
        const object = await undo.getObject();

        if (object instanceof Follow) {
            if (undo.actorId == null || object.objectId == null) return;

            const parsed = ctx.parseUri(object.objectId);
            if (parsed == null || parsed.type !== "actor") return;

            const following = await ActorModel.findOne({ name: parsed.identifier });
            const follower = await ActorModel.findOne({ uri: undo.actorId.href });

            if (following && follower) {
                await FollowModel.deleteOne({ followerRef: follower._id, targetRef: following._id });
            }
        }

        if (object instanceof Like) {
            if (undo.actorId == null || object.objectId == null) return;

            const parsed = ctx.parseUri(object.objectId);
            if (parsed == null || parsed.type !== "object") return;

            const post = await PostModel.findOne({ postId: parsed.values.postId });
            const unliker = await ActorModel.findOne({ uri: undo.actorId.href });

            if (post && unliker) {
                await VoteModel.deleteOne({ postId: post._id, actorRef: unliker._id });
            }
        }
    })
    .on(Create, async (ctx, create) => {
        const object = await create.getObject();
        if (!(object instanceof Note)) return;

        const actor = create.actorId;
        if (actor == null) return;

        const author = await object.getAttribution();
        if (!isActor(author) || author.id?.href !== actor.href) return;

        const actorDoc = await persistActor(author);
        if (actorDoc == null || object.id == null) return;

        // Check if post already exists
        const existingPost = await PostModel.findOne({ uri: object.id.href });
        if (existingPost) return;

        // Find a sub to post to (for now, just use the first sub)
        const sub = await ActorModel.findOne({ type: ActorType.sub });
        if (sub == null) return;

        try {
            await PostModel.create({
                actorRef: actorDoc._id,
                subRef: sub._id,
                title: object.name?.toString() || 'Untitled',
                content: object.content?.toString() || '',
                uri: object.id.href,
                url: object.url?.href || object.id.href,
            });
            console.log('Created external post from:', author.id?.href);
        } catch (error) {
            console.error('Failed to create external post:', error);
        }
    });

async function persistActor(actor: APActor): Promise<Actor | null> {
    if (actor.id == null || actor.inboxId == null) {
        console.log('Actor is missing required fields:', actor);
        return null;
    }

    const handle = (await getActorHandle(actor)).slice(1);
    const name = handle?.split('@')[0] || actor.preferredUsername || 'unknown';
    const origin = handle?.split('@')[1] || 'unknown';

    return await ActorModel.findOneAndUpdate(
        { uri: actor.id.href },
        {
            name,
            type: ActorType.user,
            thumbnailUrl: (await actor.getIcon())?.url?.href,
            description: actor.summary?.toString() || '',
            uri: actor.id.href,
            inbox: actor.inboxId.href,
            sharedInbox: actor.endpoints?.sharedInbox?.href || actor.inboxId.href,
            url: actor.url?.href || actor.id.href,
            origin
        },
        { upsert: true, new: true }
    );
}

export default fed;
