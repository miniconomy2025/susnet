import jwt from "jsonwebtoken";

import {
  Actor,
  ActorModel,
  ActorType,
  AuthModel,
  Follow,
  FollowModel,
  Post,
  PostModel,
  VoteModel,
  VoteType,
} from "../server/db/schema.ts";
import {
  ActorData,
  PostData,
  Req_createPost,
  Req_createSub,
  Req_EditActor,
  Req_EditPost,
  Req_Feed,
  Req_login,
  Req_SearchActors,
  Req_SearchTags,
  Req_updateActor,
  Req_vote,
} from "../types/api.ts";
import {
  Res_createPost,
  Res_createSub,
  Res_EditActor,
  Res_EditPost,
  Res_Feed,
  Res_follow,
  Res_followers,
  Res_following,
  Res_followStatus,
  Res_getActor,
  Res_getActorPosts,
  Res_getPost,
  Res_health,
  Res_me,
  Res_SearchActors,
  Res_SearchTags,
  Res_unfollow,
  Res_updateActor,
  Res_vote,
} from "../types/api.ts";
import { authenticate, AuthenticatedRequest, noop } from "./auth.ts";

import express, { Request, Response } from "express";
import { Types } from "mongoose";
import { Unit } from "../types/types.ts";
import { MongoServerError } from "mongodb";
import { env } from "./utils/env.ts";
import { Random } from "effect/Random";
import { verify } from "node:crypto";
import { decodeJWT, verifyJWT } from "./utils/authUtils.ts";

const ORIGIN = "susnet.co.za";
const JWT_SECRET = env("JWT_SECRET");

//---------- Utils ----------//

type AuthUser = AuthenticatedRequest["user"];
// type AuthUser = { id: Types.ObjectId; name: string };

function toActorDataSimple(doc: any): ActorData<"simple"> {
  return {
    name: doc.name,
    type: doc.type,
    thumbnailUrl: doc.thumbnailUrl,
    description: doc.description,
    origin: doc.origin,
  };
}
function toActorDataFull(doc: any): ActorData<"full"> {
  return {
    ...toActorDataSimple(doc),
    postCount: doc.postCount,
    followerCount: doc.followerCount,
    followingCount: doc.followingCount,
  };
}

function toPostDataSimple(doc: any): PostData<"simple"> {
  return {
    postId: doc.postId,
    actorName: doc.actorName,
    subName: doc.subName,
    title: doc.title,
    content: doc.content,
    attachments: doc.attachments.map((a: any) => ({ ...a, _id: undefined })),
    tags: doc.tags,
  };
}
function toPostDataFull(doc: any): PostData<"full"> {
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

type ReqType = "GET" | "POST" | "PATCH" | "DELETE";
type ReqTypeLower = "get" | "post" | "patch" | "delete";
type Endpoints = {
  [K in `${ReqType}|/${string}`]: (params: any) => Promise<any>;
};

const endpoints: Endpoints = {
  "GET|/health": async (): Promise<Res_health> => ({ success: true }),

  "POST|/auth/login": async (req: any): Promise<void> => {
    await verifyJWT(req.token);
    const payload = await decodeJWT(req.token);
    const isNew = await AuthModel.findOne({
      googleId: payload.sub,
    }) == null;
    let actor = null;
    if (isNew) {
      actor = await ActorModel.create(
        {
          name: payload.jti,
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

  "GET|/auth/me": async (_: Unit, user: AuthUser): Promise<Res_me> => {
    const doc = await ActorModel.findById(user.id).lean().exec();
    if (doc == null) return { success: false, error: "invalidAuth" };
    return { success: true, actor: toActorDataFull(doc) };
  },

  // Get data for a specific actor
  "GET|/actors/:name": async (
    { name }: { name: string },
  ): Promise<Res_getActor> => { // DONE
    const doc = await ActorModel.findOne({ name }).lean().exec();
    if (doc == null) return { success: false, error: "notFound" };

    const postCount = await PostModel.countDocuments({ actorRef: doc._id });
    const followerCount = await FollowModel.countDocuments({
      targetRef: doc._id,
    });
    const followingCount = await FollowModel.countDocuments({
      followerRef: doc._id,
    });
    return {
      success: true,
      actor: toActorDataFull({
        ...doc,
        postCount,
        followerCount,
        followingCount,
      }),
    };
  },

  // Get all posts for an actor
  "GET|/actors/:name/posts": async (
    { name }: { name: string },
  ): Promise<Res_getActorPosts> => { // TODO: Paginate
    const actorId = await getActorObjId(name);
    if (actorId == null) return { success: false, error: "notFound" };

    const docs = await PostModel.find({ actorRef: actorId }).lean().exec();
    return { success: true, posts: docs.map((d) => toPostDataFull(d)) };
  },

  // Get all the actors following a specific actor
  "GET|/actors/:name/followers": async (
    { name }: { name: string },
  ): Promise<Res_followers> => { // DONE
    const actorId = await getActorObjId(name);
    if (actorId == null) return { success: false, error: "notFound" };

    const docs = await FollowModel.find({ targetRef: actorId })
      .populate("followerRef")
      .lean()
      .exec();
    return {
      success: true,
      followers: docs.map((f) => toActorDataSimple(f.followerRef)),
    };
  },

  // Get all the actors a specific actor is following
  "GET|/actors/:name/following": async (
    { name }: { name: string },
  ): Promise<Res_following> => { // DONE
    const actorId = await getActorObjId(name);
    if (actorId == null) return { success: false, error: "notFound" };

    const docs = await FollowModel.find({ followerRef: actorId })
      .populate("targetRef")
      .lean()
      .exec();
    return {
      success: true,
      following: docs.map((f) => toActorDataSimple(f.targetRef)),
    }; // TODO: Fix
  },

  // Create a sub
  "POST|/actors/subs": async (req: Req_createSub): Promise<Res_createSub> => {
    try {
      const sub = await ActorModel.create({
        name: req.name,
        type: ActorType.sub,
        thumbnailUrl: req.thumbnailUrl,
        description: req.description,
        origin: ORIGIN,
      });
      return { success: true, sub: toActorDataSimple(sub) };
    } catch (err) {
      if (!(err instanceof MongoServerError)) {
        return { success: false, error: "internalError" };
      }

      console.log("ERR:", JSON.stringify(err, null, 2));

      // See: [https://www.mongodb.com/docs/manual/reference/error-codes]
      switch (err.code) {
        case 11000:
          return { success: false, error: "alreadyExists" };
        // case 121: return { success: false, error: 'invalidRequest' }; // TODO
        default:
          return { success: false, error: "internalError" };
      }
    }
  },

  // Update your user data
  "PATCH|/actors/me": async (
    req: Req_updateActor,
    user: AuthUser,
  ): Promise<Res_updateActor> => {
    const doc = await ActorModel.findByIdAndUpdate(user.id, req, { new: true })
      .lean().exec(); // TODO: Filter fields
    return { success: true, actor: toActorDataSimple(doc) };
  },

  // Get a specific post
  "GET|/posts/:postId": async (
    { postId }: { postId: string },
  ): Promise<Res_getPost> => { // DONE
    const doc = await PostModel.findOne({ postId }).lean().exec();
    if (doc == null) return { success: false, error: "notFound" };
    return { success: true, post: toPostDataFull(doc) };
  },

  // Create a post
  "POST|/posts": async (
    req: Req_createPost,
    user: AuthUser,
  ): Promise<Res_createPost> => {
    console.log("USER:", user);
    const postDoc = await PostModel.create({
      ...req,
      actorId: user.id,
      actorName: user.name,
    });
    return { success: true, post: toPostDataSimple(postDoc) };
  },

  "POST|/posts/:postId/vote": async (
    { postId, vote }: { postId: string; vote: VoteType | null },
    user: AuthUser,
  ): Promise<Res_vote> => {
    const record = await VoteModel.findOneAndUpdate(
      { postId, actorId: user.id },
      { vote, actorId: user.id, postId },
      { upsert: true, new: true },
    ).lean().exec();
    return { success: true, vote: record.vote };
  },

  "POST|/actors/:targetName/follow": async (
    { targetName }: { targetName: string },
    user: AuthUser,
  ): Promise<Res_follow> => {
    await FollowModel.create({ targetName, followerName: user.name });
    return { success: true };
  },

  "DELETE|/actors/:targetName/follow": async (
    { targetName }: { targetName: string },
    user: AuthUser,
  ): Promise<Res_unfollow> => {
    await FollowModel.deleteOne({ targetName, followerName: user.name }).exec();
    return { success: true };
  },

  "GET|/actors/:targetName/following-status": async (
    { targetName }: { targetName: string },
    user: AuthUser,
  ): Promise<Res_followStatus> => {
    const exists = await FollowModel.exists({
      targetName,
      followerName: user.name,
    });
    return { success: true, following: Boolean(exists) };
  },

  "POST|/api/posts/feed": async (req: Req_Feed): Promise<Res_Feed> => {
    const { limit = 20, cursor, actorName, sort = "new" } = req;
    const match: any = {};
    if (actorName) match.actorName = actorName;
    const sortOrder = sort === "new"
      ? { _id: -1 }
      : sort === "top"
      ? { score: -1 }
      : { score: -1, _id: -1 };
    const pipeline: any[] = [
      { $match: match },
      { $sort: sortOrder },
      { $limit: limit + 1 },
    ];
    const docs = await PostModel.aggregate(pipeline).exec();
    const hasMore = docs.length > limit;
    const results = (hasMore ? docs.slice(0, limit) : docs).map((d) =>
      toPostDataFull(d)
    );
    return { success: true, posts: results };
  },

  "POST|/api/actors/search": async (
    req: Req_SearchActors,
  ): Promise<Res_SearchActors> => {
    const docs = await ActorModel.find({ name: new RegExp(req.query, "i") })
      .lean().exec();
    return { success: true, actors: docs.map((d) => toActorDataSimple(d)) };
  },

  "POST|/api/tags/search": async (
    req: Req_SearchTags,
  ): Promise<Res_SearchTags> => {
    const tags = await PostModel.aggregate([
      { $unwind: "$tags" },
      { $match: { tags: new RegExp(req.query, "i") } },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $project: { tag: "$_id", count: 1, _id: 0 } },
    ]).exec();
    return { success: true, tags };
  },

  "PATCH|/api/posts/:postId": async (
    { postId, ...rest }: { postId: string } & Req_EditPost,
    user: AuthUser,
  ): Promise<Res_EditPost> => {
    const updated = await PostModel.findOneAndUpdate(
      { _id: postId, actorName: user.name },
      rest,
      { new: true },
    ).lean().exec();
    if (updated == null) return { success: false, error: "notFound" };
    return { success: true };
  },

  "PATCH|/api/actors/:actorName": async (
    { actorName, ...rest }: { actorName: string } & Req_EditActor,
    user: AuthUser,
  ): Promise<Res_EditActor> => {
    const updated = await ActorModel.findOneAndUpdate(
      { name: actorName, _id: user.id },
      rest,
      { new: true },
    ).lean().exec();
    if (updated == null) return { success: false, error: "notFound" };
    return { success: true };
  },
};

//---------- Endpoint scaffolding ----------//

const authenticated: Set<string> = new Set([
  "GET|/auth/me",
  "PATCH|/actors/me",
]);

const router = express.Router();

for (const [route, handler] of Object.entries(endpoints)) {
  const [method, path] = route.split("|");
  const middleware = authenticated.has(route) ? authenticate : noop;

  router[method.toLowerCase() as ReqTypeLower](
    path,
    middleware,
    async (req: Request, res: Response) => {
      try {
        console.log(
          "\x1b[93mREQUEST\x1b[0m:",
          req.method,
          req.path,
          "\n- BODY:",
          req.body,
          "\n- PARAMS:",
          req.params,
        );
        console.log("here");
        const result = await handler({ ...req.body, ...req.params });
        res.json(result);
      } catch (err) {
        console.error("\x1b[91mERROR\x1b[0m:", err);
        res.json({
          success: false,
          error: "internalError",
          message: String(err),
        });
      }
    },
  );
}

export default router;
