import { DocumentType } from "@typegoose/typegoose";
import { ActorModel, AuthModel, PostModel, VoteModel, FollowModel, Post } from './schema.ts';
import { Actor, ActorType, Attachment, VoteType } from './schema.ts';

import jwt from 'jsonwebtoken';
import { env } from "../utils/env.ts";
import { Types } from "mongoose";

import { ActorData, AuthData, PostData, Req_createPost, Req_Feed, Res_createPost, Res_Feed, Res_login } from "../../types/api.ts";
import { SimpleResult } from "../../types/types.ts";
import { times } from "effect/Duration";

//---------- Setup ----------//
const JWT_SECRET = env("JWT_SECRET");


//---------- JWT ----------//
export function createJWT(actor: DocumentType<Actor>) {
  return jwt.sign({ id: actor._id }, JWT_SECRET, { expiresIn: '7d', });
}

export function verifyJWT(token: string) {
  return jwt.verify(token, JWT_SECRET) as { id: string };
}


//---------- Getters ----------//

export async function getActorObjId(name: string): Promise<Types.ObjectId | null> {
  const doc = await ActorModel.findOne({ name }).lean().exec();
  return doc?._id ?? null;
}

export async function getActorObj(name: string): Promise<{ objId: Types.ObjectId, actor: ActorData<'simple'> } | null> {
  const actorDoc = await ActorModel.findOne({ name }).lean().exec();
  if (!actorDoc) return null;

  return {
    objId: actorDoc._id,
    actor: {
      name: actorDoc.name,
      type: actorDoc.type,
      thumbnailUrl: actorDoc.thumbnailUrl,
      description: actorDoc.description ?? "",
      origin: actorDoc.origin ?? "",
    }
  };
}

export async function getActorData(name: string, userId?: Types.ObjectId): Promise<ActorData<'full'> | null> {
  const actorDoc = await ActorModel.findOne({ name }).lean().exec();
  if (!actorDoc) return null;

  const [postCount, followerCount, followingCount, isFollowing] = await Promise.all([
    PostModel.countDocuments({ subRef: actorDoc._id }),
    FollowModel.countDocuments({ targetRef: actorDoc._id }),
    FollowModel.countDocuments({ followerRef: actorDoc._id }),
    FollowModel.exists({ targetRef: actorDoc._id, followerRef: userId }),
  ]);

  return {
    name: actorDoc.name,
    type: actorDoc.type,
    thumbnailUrl: actorDoc.thumbnailUrl,
    description: actorDoc.description ?? "",
    origin: actorDoc.origin ?? "",
    postCount,
    followerCount,
    followingCount,
    isFollowing,
  }
}

export async function getPostObjId(postId: string): Promise<Types.ObjectId | null> {
  const doc = await PostModel.findOne({ postId }).lean().exec();
  return doc?._id ?? null;
}

export async function getPostObj(postId: string): Promise<PostData<'simple'> | null> {
  const postDoc = await PostModel.findOne({ postId }).lean().exec();
  if (!postDoc) return null;

  const actorDoc = await ActorModel.findById(postDoc.actorRef, { name: 1 }).lean().exec();
  const subDoc = await ActorModel.findById(postDoc.subRef, { name: 1 }).lean().exec();

  return {
    postId: postDoc.postId ?? "",
    actorName: actorDoc?.name ?? "deleted",
    subName: subDoc?.name ?? "deleted",
    title: postDoc.title,
    content: postDoc.content,
    attachments: postDoc.attachments as Attachment[],
    tags: postDoc.tags ?? [],
  };
}

export async function getPostsForActor(actorName: string) {
  const actor = await ActorModel.findOne({ name: actorName });
  if (!actor) return [];

  return await PostModel.find({ actorRef: actor._id }).sort({ createdAt: -1 });
}

export async function getUserVote(postId: string, actorName: string) {
  const [post, actor] = await Promise.all([
    PostModel.findOne({ postId }),
    ActorModel.findOne({ name: actorName })
  ]);

  if (!post || !actor) return null;

  return await VoteModel.findOne({ postId: post._id, actorRef: actor._id });
}


//---------- Aggregation ----------//

export type PostVoteAggregate = { upvotes: number, downvotes: number, score: number };
export async function getPostVoteAggregate(postId: string): Promise<PostVoteAggregate> {
  const post = await PostModel.findOne({ postId });
  if (!post) return { upvotes: 0, downvotes: 0, score: 0 };

  const votes = await VoteModel.aggregate([
    { $match: { postId: post._id } },
    {
      $group: {
        _id: null,
        upvotes:   { $sum: { $cond: [{ $eq: ['$vote', VoteType.up] }, 1, 0] } },
        downvotes: { $sum: { $cond: [{ $eq: ['$vote', VoteType.down] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: false,
        upvotes: true,
        downvotes: true,
        score: { $subtract: ['$upvotes', '$downvotes'] },
      }
    }
  ]);

  return votes[0] ?? { upvotes: 0, downvotes: 0, score: 0 };
}

export type SubAggregate = { postCount: number, followerCount: number };
export async function getSubAggregate(subName: string): Promise<SubAggregate> {
  const sub = await ActorModel.findOne({ name: subName, type: ActorType.sub });
  if (!sub) return { postCount: 0, followerCount: 0 };

  const [postCount, followerCount] = await Promise.all([
    PostModel.countDocuments({ subRef: sub._id }),
    FollowModel.countDocuments({ targetRef: sub._id }),
  ]);

  return { postCount, followerCount };
}

export async function getActorsFollowedBy(actorName: string, type?: ActorType) {
  const actor = await ActorModel.findOne({ name: actorName });
  if (!actor) return [];

  return FollowModel.aggregate([
    { $match: { followerRef: actor._id } },
    {
      $lookup: {
        from: 'actors',
        localField: 'targetRef',
        foreignField: '_id',
        as: 'target',
        pipeline: type ? [{ $match: { type } }] : [],
      },
    },
    { $unwind: '$target' },
    { $replaceWith: '$target' },
  ]);
}


//---------- Search ----------//

export async function searchActors(query: string, limit: number = 10) {
  return await ActorModel.find({ name: { $regex: query, $options: 'i' }, }).limit(limit);
}

export async function searchPosts(query: string) {
  return await PostModel.find({ $text: { $search: query } });
}

export async function searchTags(query: string) {
  return await PostModel.aggregate([
    { $unwind: '$tags' },
    { $match: { tags: { $regex: query, $options: 'i' } } },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);
}


//---------- Create ----------//

export async function createUserAccount(user: ActorData<"simple">, auth: AuthData): Promise<SimpleResult<{ actorDoc: DocumentType<Actor>, token: string }, 'internalError'>  > {
  const actorDoc = await ActorModel.create({
    name: user.name,
    type: 'user',
    thumbnailUrl: user.thumbnailUrl,
    description: user.description,
  });

  const authDoc = await AuthModel.findOneAndUpdate(
    { googleId: auth.googleId },
    {
      googleId: auth.googleId,
      actorRef: actorDoc._id,
      email: auth.email,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken
    },
    { upsert: true, new: true }
  ).exec();

  if (!authDoc) { return { success: false, error: "internalError" }; }

  const token = jwt.sign({ id: actorDoc._id.toString(), name: user.name }, JWT_SECRET!);

  return { success: true, actorDoc, token };
}

export async function createPost(userId: Types.ObjectId, userName: string, post: Req_createPost): Promise<Res_createPost> {
  // Find sub
  const subId = getActorObjId(post.subName);
  if (userId == null || subId == null) { return { success: false, error: "notFound" }; }

  // Create post
  const postDoc = await PostModel.create({
    actorRef: userId,
    subRef: subId,
    title: post.title,
    content: post.content,
    attachments: post.attachments,
    tags: post.tags,
  });

  return {
    success: true,
    post: {
      postId: postDoc.postId ?? "",
      actorName: userName,
      subName: post.subName,
      title: postDoc.title,
      attachments: postDoc.attachments as Attachment[],
      content: postDoc.content,
      tags: postDoc.tags ?? [],
    }
  };
}


//---------- Interact ----------//

export async function followActor(followerName: string, targetName: string) {
  const [follower, target] = await ActorModel.find({
    name: { $in: [followerName, targetName] }
  });

  const followerRef = follower?.name === followerName ? follower._id : target?._id;
  const targetRef = target?.name === targetName ? target._id : follower?._id;

  if (!followerRef || !targetRef) {
    throw new Error("Follower or Target not found");
  }

  return await FollowModel.findOneAndUpdate(
    { followerRef, targetRef },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function voteOnPost(postId: string, actorName: string, vote: VoteType) {
  const [post, actor] = await Promise.all([
    PostModel.findOne({ postId }),
    ActorModel.findOne({ name: actorName })
  ]);

  if (!post || !actor) {
    throw new Error("Post or Actor not found");
  }

  return await VoteModel.findOneAndUpdate(
    { postId: post._id, actorRef: actor._id },
    { vote },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}


//---------- Feed ----------//

// Fetches the key pagination metric(s) for a given postId, depending on sort
type CursorMetrics = { createdAt: Date; score?: number; hotScore?: number };
async function getCursorMetrics(postId: string, sort: "new" | "top" | "hot"): Promise<CursorMetrics | null> {
  // Get creation time
  const base = await PostModel.findOne({ postId }, { createdAt: 1 }).lean();
  if (!base) return null;
  const createdAt = base.createdAt ?? new Date(0);

  if (sort === "new") { return { createdAt }; }

  // Get aggregate voting scores
  const [{ upCount = 0, downCount = 0 }] =
    await VoteModel.aggregate([
      { $match: { postId: base._id } },
      { $group: {
          _id: "$postId",
          upCount:   { $sum: { $cond: [{ $eq: ["$vote", "up"]   }, 1, 0] }, },
          downCount: { $sum: { $cond: [{ $eq: ["$vote", "down"] }, 1, 0] }, },
      }},
    ]);
  const score = upCount - downCount;
  if (sort === "top") { return { createdAt, score }; }

  // Get 'hotness'
  // Reddit's metric: log10(max(abs(score), 1)) + sign(score) * (ageHrs)/45
  const ageHrs = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  const hotScore = Math.log10(Math.max(Math.abs(score), 1)) + Math.sign(score) * (ageHrs / 45);

  return { createdAt, score, hotScore };
}

// Build match stage to for cursor-based paging
function buildCursorMatch(cursorMetrics: CursorMetrics, sort: "new" | "top" | "hot") {
  const { createdAt, score = 0, hotScore = 0 } = cursorMetrics;
  switch (sort) {
    case "new": return { createdAt: { $lt: createdAt } }; // Ordered by createdAt
    case "top": return { $or: [ { score:    { $lt: score    } }, { score,    createdAt: { $lt: createdAt } } ] }; // Ordered by score, then createdAt
    case "hot": return { $or: [ { hotScore: { $lt: hotScore } }, { hotScore, createdAt: { $lt: createdAt } } ] }; // Ordered by hotScore, then createdAt
  }
}

export async function getFeed({ limit = 20, cursor, fromActorName, sort = "top" }: Req_Feed, userId: Types.ObjectId): Promise<Res_Feed> {
  try {
    //----- Pull cursor details for paging -----//
    let cursorMatch: object | null = null;
    if (!(["new", "top", "hot"].includes(sort))) return { success: false, error: 'invalidRequest' };

    if (cursor != "") {
      getPostObjId(cursor);
      const cm = await getCursorMetrics(cursor, sort);
      if (cm) cursorMatch = buildCursorMatch(cm, sort);
    }

    //----- Build one big aggregation -----//
    const pipeline: any[] = [];

    // Lookup poster & sub
    pipeline.push(
      { $lookup: {
          from: ActorModel.collection.collectionName,
          localField: "actorRef",
          foreignField: "_id",
          as: "actorDoc",
      }},
      { $unwind: "$actorDoc" },
      { $lookup: {
          from: ActorModel.collection.collectionName,
          localField: "subRef",
          foreignField: "_id",
          as: "subDoc",
      }},
      { $unwind: "$subDoc" }
    );

    pipeline.push({
      $lookup: {
        from: FollowModel.collection.collectionName,
        let: {
          followerId: userId,
          targetId: "$subRef"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$followerRef", "$$followerId"] },
                  { $eq: ["$targetRef", "$$targetId"] }
                ]
              }
            }
          }
        ],
        as: "followDoc"
      }
    });
    pipeline.push({
  $addFields: {
    followed: { $gt: [{ $size: "$followDoc" }, 0] }
  }
});

    // Optional actorName/subName filters
    if (fromActorName != null) {
      pipeline.push({
        $match: { $or: [ { "actorDoc.name": fromActorName }, { "subDoc.name": fromActorName }, ]}
      });
    }

    // Aggregate votes & compute scores
    pipeline.push(
      { $lookup: {
          from: VoteModel.collection.collectionName,
          localField: "_id",
          foreignField: "postId",
          as: "votes",
      }},
      { $addFields: {
          upCount:   { $size: { $filter: { input: "$votes", cond: { $eq: ["$$this.vote", "up"]   }, }, }, },
          downCount: { $size: { $filter: { input: "$votes", cond: { $eq: ["$$this.vote", "down"] }, }, }, },
      }},
      { $addFields: { score: { $subtract: ["$upCount", "$downCount"] } }, }
    );

    // Compute hotness score
    if (sort === "hot") {
      pipeline.push({
        $addFields: {
          hotScore: {
            $let: {

              vars: {
                ageHrs: { $divide: [ { $subtract: ["$$NOW", "$createdAt"] }, 1000 * 60 * 60 ], },
                sign: {
                  $switch: {
                    branches: [
                      { case: { $gt: ["$score", 0] }, then: 1 },
                      { case: { $lt: ["$score", 0] }, then: -1 },
                    ],
                    default: 0,
                  },
                },
              },

              in: { $add: [
                { $log10: { $max: [{ $abs: "$score" }, 1], }, },
                { $multiply: ["$$sign", { $divide: ["$$ageHrs", 45] }] },
              ]},

            },
          },
        },
      });
    }

    // Apply cursor-based paging filter
    if (cursorMatch) { pipeline.push({ $match: cursorMatch }); }

    // Sort stage
    const sortStage: Record<string, -1> =
      sort === "new"
        ? { createdAt: -1 }
        : sort === "top"
          ? { score: -1, createdAt: -1 }
          : { hotScore: -1, createdAt: -1 };
    pipeline.push({ $sort: sortStage });

    // Limit & project to PostData
    pipeline.push(
      { $limit: limit },
      { $project: {
          _id: 0,
          postId: 1,
          title: 1,
          content: 1,
          tags: 1,
          attachments: 1,
          actorName: "$actorDoc.name",
          subName: "$subDoc.name",
          timestamp: { $toLong: "$createdAt" },
          subThumbnailUrl: "$subDoc.thumbnailUrl",
          upvotes: "$upCount",
          downvotes: "$downCount",
          score: "$score",
          followed: "$followed",
      }}
    );

    const docs = (await PostModel.aggregate(pipeline)) satisfies PostData<'full'>[];
    const nextCursor = docs.length > 0 ? docs[docs.length - 1].postId : null;

    return { success: true, posts: docs, nextCursor };
  }
  catch (err) {
    console.error("getFeed error:", err);
    return { success: false, error: "internalError" };
  }
}