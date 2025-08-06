import jwt from 'jsonwebtoken';

import {
  ActorModel, AuthModel, PostModel, VoteModel,
  FollowModel, VoteType, ActorType, Actor, Post, Follow
} from '../server/db/schema.ts';
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
  Res_getActorPosts, Res_followers, Res_following, Res_createSub,
  Res_updateActor, Res_getPost, Res_createPost, Res_vote,
  Res_follow, Res_unfollow, Res_followStatus, Res_Feed,
  Res_SearchActors, Res_SearchTags, Res_EditPost, Res_EditActor,
} from '../types/api.ts';
import { authenticate, noop, AuthenticatedRequest } from './auth.ts';

import express, { Request, Response } from 'express';
import { Types } from "mongoose";
import { HTTPMethod, Unit } from "../types/types.ts";
import { MongoServerError } from "mongodb";

const ORIGIN = "susnet.co.za";
const JWT_SECRET = "";

//---------- Utils ----------//

function toActorDataSimple(doc: any): ActorData<'simple'> {
  return {
    name: doc.name,
    type: doc.type,
    thumbnailUrl: doc.thumbnailUrl,
    description: doc.description,
    origin: doc.origin
  };
}
function toActorDataFull(doc: any): ActorData<'full'> {
  return {
    ...toActorDataSimple(doc),
    postCount: doc.postCount,
    followerCount: doc.followerCount,
    followingCount: doc.followingCount,
  };
}

function toPostDataSimple(doc: any): PostData<'simple'> {
  return {
    postId: doc.postId,
    actorName: doc.actorName,
    subName: doc.subName,
    title: doc.title,
    content: doc.content,
    attachments: doc.attachments.map((a: any) => ({ ...a, _id: undefined})),
    tags: doc.tags,
  };
}
function toPostDataFull(doc: any): PostData<'full'> {
  return {
    ...toPostDataSimple(doc),
    upvotes: doc.upvotes,
    downvotes: doc.downvotes,
    score: doc.score,
  };
}

async function getActorObjId(name: string): Promise<Types.ObjectId | null> {
  const doc = await ActorModel.findOne({ name }).lean().exec();
  return doc?._id ?? null;
}

async function getPostObjId(postId: string): Promise<Types.ObjectId | null> {
  const doc = await PostModel.findOne({ postId }).lean().exec();
  return doc?._id ?? null;
}


//---------- Endpoints ----------//

const endpoints: Endpoints = {
  'health': async (): Promise<Res_health> => ({ success: true }),

  'login': async (req: Req_login): Promise<Res_login> => {
    const auth = await AuthModel.findOneAndUpdate(
      { googleId: req.googleId },
      { email: req.email, accessToken: req.accessToken, refreshToken: req.refreshToken },
      { upsert: true, new: true }
    ).exec();
    const token = jwt.sign({ sub: auth._id.toString() }, JWT_SECRET!);
    return { success: true, token };
  },

  'me': async (_1, _2, user: AuthUser): Promise<Res_me> => {
    const doc = await ActorModel.findById(user.id).lean().exec();
    if (doc == null) return { success: false, error: 'invalidAuth' };
    return { success: true, actor: toActorDataFull(doc) };
  },

  'getActor': async (_, { name }: { name: string }): Promise<Res_getActor> => {
    const doc = await ActorModel.findOne({ name }).lean().exec();
    if (doc == null) return { success: false, error: 'notFound' };

    const postCount = await PostModel.countDocuments({ actorRef: doc._id });
    const followerCount = await FollowModel.countDocuments({ targetRef: doc._id });
    const followingCount = await FollowModel.countDocuments({ followerRef: doc._id });
    return { success: true, actor: toActorDataFull({ ...doc, postCount, followerCount, followingCount }) };
  },

  // Get all posts for an actor
  'getActorPosts': async (_, { name }: { name: string }): Promise<Res_getActorPosts> => { // TODO: Paginate
    const actorId = await getActorObjId(name);
    if (actorId == null) return { success: false, error: 'notFound' };

    const docs = await PostModel.find({ actorRef: actorId }).lean().exec();
    return { success: true, posts: docs.map(d => toPostDataFull(d)) };
  },

  'getActorFollowers': async (_, { name }: { name: string }): Promise<Res_followers> => {
    const actorId = await getActorObjId(name);
    if (actorId == null) return { success: false, error: 'notFound' };

    const docs = await FollowModel.find({ targetRef: actorId })
      .populate('followerRef')
      .lean()
      .exec();
    return { success: true, followers: docs.map(f => toActorDataSimple(f.followerRef)) };
  },

  'getActorFollowing': async (_, { name }: { name: string }): Promise<Res_following> => {
    const actorId = await getActorObjId(name);
    if (actorId == null) return { success: false, error: 'notFound' };

    const docs = await FollowModel.find({ followerRef: actorId })
      .populate('targetRef')
      .lean()
      .exec();
    return { success: true, following: docs.map(f => toActorDataSimple(f.targetRef)) }; // TODO: Fix
  },

  'createSub': async (req: Req_createSub): Promise<Res_createSub> => {
    try {
      const sub = await ActorModel.create({
        name: req.name,
        type: ActorType.sub,
        thumbnailUrl: req.thumbnailUrl,
        description: req.description,
        origin: ORIGIN,
      });
      return { success: true, sub: toActorDataSimple(sub) };
    }
    catch (err) {
      if (!(err instanceof MongoServerError)) return { success: false, error: 'internalError' }

      console.log("ERR:", JSON.stringify(err, null, 2));

      // See: [https://www.mongodb.com/docs/manual/reference/error-codes]
      switch(err.code) {
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
    console.log("USER:", user);
    const postDoc = await PostModel.create({ ...req, actorId: user.id, actorName: user.name });
    return { success: true, post: toPostDataSimple(postDoc) };
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

    await FollowModel.create({ targetName, followerName: user.name });
    return { success: true };
  },

  'unfollowActor': async (_, { targetName }: { targetName: string }, user: AuthUser): Promise<Res_unfollow> => {
    await FollowModel.deleteOne({ targetName, followerName: user.name }).exec();
    return { success: true };
  },

  'getFollowingStatus': async (_, { targetName }: { targetName: string }, user: AuthUser): Promise<Res_followStatus> => {
    const exists = await FollowModel.exists({ targetName, followerName: user.name });
    return { success: true, following: Boolean(exists) };
  },

  'getFeed': async (req: Req_Feed, _, user: AuthUser): Promise<Res_Feed> => {
    const { limit = 20, cursor, actorName, sort = 'new' } = req;
    const match: any = {};

    if (actorName) match.actorName = actorName;
    const sortOrder = sort === 'new' ? { _id: -1 } : sort === 'top' ? { score: -1 } : { score: -1, _id: -1 };

    const pipeline: any[] = [
      { $match: match },
      { $sort: sortOrder },
      { $limit: limit + 1 },
    ];

    const docs = await PostModel.aggregate(pipeline).exec();
    const hasMore = docs.length > limit;
    const results = (hasMore ? docs.slice(0, limit) : docs).map(d => toPostDataFull(d));

    return { success: true, posts: results };
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

const authenticated: Set<keyof Endpoints> = new Set([ 'me', 'updateMe', 'updateActor' ]);

const router = express.Router();

for(const [route, handler] of Object.entries(endpoints)) {
  const [method, path] = endpointSignatures[route as keyof Endpoints];
  const middleware = authenticated.has(route as any) ? authenticate : noop;

  router[method.toLowerCase()](path, middleware, async (req: Request, res: Response) => {
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