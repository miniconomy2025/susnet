import {
    ActorModel, AuthModel, PostModel, VoteModel,
    FollowModel, VoteType, ActorType, Actor, Post, Follow
} from './db/schema.ts';
import {
    Req_createSub, Req_updateActor, Req_SearchActors, Req_SearchTags,
    Req_EditPost, Req_EditActor, Req_vote, Req_login,
    Req_createPost, Req_Feed,
    ActorData,
    PostData,
    Endpoints,
    AuthUser,
    endpointSignatures,
} from '../types/api.ts';
import {
  Res_health, Res_login, Res_me, Res_getActor,
  Res_followers, Res_following, Res_createSub,
  Res_updateActor, Res_getPost, Res_createPost, Res_vote,
  Res_follow, Res_unfollow, Res_followStatus, Res_Feed,
  Res_SearchActors, Res_SearchTags, Res_EditPost, Res_EditActor,
} from '../types/api.ts';
import { authenticate, noop, AuthenticatedRequest } from './auth.ts';

import express, { Request, Response } from 'express';
import { Types } from "mongoose";
import { HTTPMethodLower } from "../types/types.ts";
import { MongoServerError } from "mongodb";
import { decodeJWT, verifyJWT } from "./utils/authUtils.ts";
import { createPost, createUserAccount, getActorObjId, getFeed } from "./db/utils.ts";

const ORIGIN = "susnet.co.za";
const JWT_SECRET = "";

//---------- Utils ----------//

function toActorDataSimple(doc: any): ActorData<'simple'> {
  return {
    name: doc.name,
    type: doc.type,
    thumbnailUrl: doc.thumbnailUrl,
    description: doc.description ?? "",
    origin: doc.origin ?? ORIGIN,
  };
}
function toActorDataFull(
  doc:            any,
  postCount:      number,
  followerCount:  number,
  followingCount: number,
  isFollowing:    boolean,
): ActorData<'full'> {
  return { ...toActorDataSimple(doc), postCount, followerCount, followingCount, isFollowing, };
}

function toPostDataSimple(doc: any): PostData<'simple'> {
  return {
    postId: doc.postId,
    title: doc.title,
    actorName: doc.actorName,
    subName: doc.subName,
    content: doc.content,
    attachments: doc.attachments.map((a: any) => ({ ...a, _id: undefined})),
    tags: doc.tags,
  };
}

function toPostDataFull(
  doc:            any, 
  upvotes:        number,
  downvotes:      number,
  score:          number,
  isFollowingSub: boolean,
  timestamp:      number,
  subThumbnailUrl: string,
): PostData<'full'> {
  return {
    ...toPostDataSimple(doc),
    upvotes, downvotes, score, subThumbnailUrl,
    isFollowingSub, timestamp
  };
}


//---------- Endpoints ----------//

const endpoints: Endpoints = {
    'health': async (): Promise<Res_health> => ({ success: true }),

    'login': async (req: Req_login): Promise<void> => {
        // return await createUserAccount({
        //   name: req.googleId,
        //   type: ActorType.user,
        //   thumbnailUrl: `https://www.gravatar.com/avatar/${req.googleId}?d=mp&s=256`,
        //   origin: ORIGIN,
        //   description: "",
        // }, {
        //   accessToken: req.accessToken,
        //   email: req.email,
        //   googleId: req.googleId,
        //   refreshToken: req.refreshToken,
        // });

      // TODO: Move to createUserAccount
        await verifyJWT(req.token);
        const payload = await decodeJWT(req.token);
        const isNew = await AuthModel.findOne({
            googleId: payload.sub,
        }) == null;
        let actor = null;
        if (isNew) {
            actor = await ActorModel.create(
                {
                    name: (payload.email as string).split('@')[0],
                    type: "user",
                    thumbnailUrl: payload.picture,
                },
            );
        }
        const auth = await AuthModel.findOneAndUpdate(
            { googleId: payload.sub },
            {
                email: payload.email,
                ...(isNew && actor ? { actorRef: actor._id } : {}),
            },
            { upsert: true, new: true, runValidators: true },
        ).exec();
    },

    'me': async (_1, _2, user: AuthUser): Promise<Res_me> => {
        const doc = await ActorModel.findById(user.id).lean().exec();
        if (doc == null) return { success: false, error: "invalidAuth" };
        return { success: true, actor: toActorDataSimple(doc) };
    },

  'getActor': async (_, { name }: { name: string }): Promise<Res_getActor> => {
    const doc = await ActorModel.findOne({ name }).lean().exec();
    if (doc == null) return { success: false, error: 'notFound' };
    const [postCount, followerCount, followingCount] = await Promise.all([
      PostModel.countDocuments({ actorRef: doc._id }),
      FollowModel.countDocuments({ targetRef: doc._id }),
      FollowModel.countDocuments({ followerRef: doc._id })
    ]);
    return { success: true, actor: toActorDataFull({ ...doc, postCount, followerCount, followingCount }) };
  },

  // Get all posts for an actor
  // REMOVED: Use getFeed instead
  // 'getActorPosts': async (_, { name, limit = 20, cursor = "" }: { name: string, limit?: number, cursor?: string }): Promise<Res_getActorPosts> => {
  //   const actorId = await getActorObjId(name);
  //   if (actorId == null) return { success: false, error: 'notFound' };
  //   const { posts, nextCursor } = await getFeed({ actorRef: actorId }, limit, cursor);
  //   return { success: true, posts, nextCursor };
  // },

  // Get all followers of an actor
  'getActorFollowers': async (_, { name }: { name: string }): Promise<Res_followers> => {
    const actorId = await getActorObjId(name);
    if (actorId == null) return { success: false, error: 'notFound' };

        const docs = await FollowModel.find({ targetRef: actorId })
            .populate('followerRef')
            .lean()
            .exec();
        return { success: true, followers: docs.map(f => toActorDataSimple(f.followerRef)) };
    },

  // Get all actors that an actor is following
  'getActorFollowing': async (_, { name }: { name: string }): Promise<Res_following> => {
    const actorId = await getActorObjId(name);
    if (actorId == null) return { success: false, error: 'notFound' };

        const docs = await FollowModel.find({ followerRef: actorId })
            .populate('targetRef')
            .lean()
            .exec();
        return { success: true, following: docs.map(f => toActorDataSimple(f.targetRef)) }; // TODO: Fix
    },

  'createSub': async (req: Req_createSub, _, user: AuthUser): Promise<Res_createSub> => {
    try {
      const sub = await ActorModel.create({
        name: req.name,
        type: ActorType.sub,
        thumbnailUrl: req.thumbnailUrl,
        description: req.description,
        origin: ORIGIN,
      });

      // Add follow relationship for the creator with role 'mod'
      await FollowModel.create({
        targetRef: sub._id,
        followerRef: user.id, // The actor creating the sub
        role: 'mod',
      });

      return { success: true, sub: toActorDataSimple(sub) };
    }
    catch (err) {
      if (!(err instanceof MongoServerError)) return { success: false, error: 'internalError' }

            console.log("ERR:", JSON.stringify(err, null, 2));

            // See: [https://www.mongodb.com/docs/manual/reference/error-codes]
            switch (err.code) {
                case 11000: return { success: false, error: 'alreadyExists' };
                // case 121: return { success: false, error: 'invalidRequest' }; // TODO
                default: return { success: false, error: 'internalError' };
            }
        }
    },

    // Update your user data
    'updateMe': async (req: Req_updateActor, _, user: AuthUser): Promise<Res_updateActor> => {
        const doc = await ActorModel.findByIdAndUpdate(user.id, req, { new: true }).lean().exec(); // TODO: Filter fields
        return { success: true, actor: toActorDataSimple(doc) };
    },

    'getPost': async (_, { postId }: { postId: string }): Promise<Res_getPost> => {
        const doc = await PostModel.findOne({ postId }).lean().exec();
        if (doc == null) return { success: false, error: 'notFound' };
        return { success: true, post: toPostDataFull(doc) };
    },

  'createPost': async (req: Req_createPost, _, user: AuthUser): Promise<Res_createPost> => {
    return await createPost(user.id, user.name, req);
  },

    'voteOnPost': async ({ vote }: Req_vote, { postId }: { postId: string; }, user: AuthUser): Promise<Res_vote> => {
        const record = await VoteModel.findOneAndUpdate(
            { postId, actorId: user.id },
            { vote, actorId: user.id, postId },
            { upsert: true, new: true }
        ).lean().exec();
        return { success: true, vote: record.vote };
    },

  'followActor': async (_, { targetName }: { targetName: string }, user: AuthUser): Promise<Res_follow> => {
    if (targetName === user.name) return { success: false, error: 'invalidRequest' };
    const targetRef = await getActorObjId(targetName);
    if (targetRef == null) return { success: false, error: 'notFound' };

    await FollowModel.updateOne(
      { targetRef, followerRef: user.id },
      { targetRef, followerRef: user.id },
      { upsert: true }
    ).exec();

    return { success: true };
  },

  'unfollowActor': async (_, { targetName }: { targetName: string }, user: AuthUser): Promise<Res_unfollow> => {
    const targetRef = await getActorObjId(targetName)
    if (targetRef == null) return { success: false, error: 'notFound' };

    await FollowModel.deleteOne({ targetRef, followerRef: user.id }).exec();
    return { success: true };
  },

    'getFollowingStatus': async (_, { targetName }: { targetName: string }, user: AuthUser): Promise<Res_followStatus> => {
        const targetRef = getActorObjId(targetName)
        const exists = await FollowModel.exists({ followerRef: user.id, targetRef: targetRef });
        return { success: true, following: Boolean(exists) };
    },

  'getFeed': async (req: Req_Feed, _, user: AuthUser): Promise<Res_Feed> => {
    return await getFeed(req, user.id);
  },

    'searchActors': async (req: Req_SearchActors): Promise<Res_SearchActors> => {
        const docs = await ActorModel.find({ name: new RegExp(req.query, 'i') }).lean().exec();
        return { success: true, actors: docs.map(d => toActorDataSimple(d)) };
    },

    'searchTags': async (req: Req_SearchTags): Promise<Res_SearchTags> => {
        const tags = await PostModel.aggregate([
            { $unwind: '$tags' },
            { $match: { tags: new RegExp(req.query, 'i') } },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $project: { tag: '$_id', count: 1, _id: 0 } },
        ]).exec();
        return { success: true, tags };
    },

    'updatePost': async (_, { postId, ...rest }: { postId: string } & Req_EditPost, user: AuthUser): Promise<Res_EditPost> => {
        const updated = await PostModel.findOneAndUpdate(
            { _id: postId, actorName: user.name },
            rest,
            { new: true }
        ).lean().exec();
        if (updated == null) return { success: false, error: 'notFound' };
        return { success: true };
    },

    'updateActor': async (_, { actorName, ...rest }: { actorName: string } & Req_EditActor, user: AuthUser): Promise<Res_EditActor> => {
        const updated = await ActorModel.findOneAndUpdate(
            { name: actorName, _id: user.id },
            rest,
            { new: true }
        ).lean().exec();
        if (updated == null) return { success: false, error: 'notFound' };
        return { success: true };
    },
};


//---------- Endpoint scaffolding ----------//

const authenticated: Set<keyof Endpoints> = new Set([
    'me',
    'updateMe',
    'updateActor',
    'followActor',
    'unfollowActor',
    "getFeed",
    'createSub',
    'createPost',
]);

const router = express.Router();

for (const [route, handler] of Object.entries(endpoints)) {
    const [method, path] = endpointSignatures[route as keyof Endpoints];
    const middleware = authenticated.has(route as any) ? await authenticate : noop;

    router[method.toLowerCase() as HTTPMethodLower](path, middleware, async (req: Request, res: Response) => {
        try {
            console.log("\x1b[93mREQUEST\x1b[0m:", req.method, req.path, "\n- BODY:", req.body, "\n- PARAMS:", req.params);
            const result = await handler(req.body, req.params, req.user);
            res.json(result);
        }
        catch (err) {
            console.error("\x1b[91mERROR\x1b[0m:", err);
            res.json({
                success: false,
                error: 'internalError',
                message: String(err)
            })
        }
    });
}

export default router;