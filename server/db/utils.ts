/* import { DocumentType } from "@typegoose/typegoose";
import { ActorModel, AuthModel, PostModel, VoteModel, FollowModel } from './schema.ts';
import { Actor, ActorType, Attachment, VoteType } from './schema.ts';

import jwt from 'jsonwebtoken';
import { env } from "../utils/env.ts";
import { Types } from "mongoose";

import { PostData, Req_Feed, Res_Feed } from "../../types/api.ts";

//---------- Setup ----------//
const JWT_SECRET = env("JWT_SECRET");


//---------- Utils ----------//

export async function createUserAccount({
  googleId,
  email,
  accessToken,
  refreshToken,
  name,
  thumbnailUrl,
  description = '',
}: {
  googleId: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  name: string;
  thumbnailUrl: string;
  description?: string;
}) {
  const actor = await ActorModel.create({
    name,
    type: 'user',
    thumbnailUrl,
    description,
  });

  const auth = await AuthModel.create({
    actorRef: actor._id,
    googleId,
    email,
    accessToken,
    refreshToken,
  });

  return { actor, auth };
}

export function createJWT(actor: DocumentType<Actor>) {
  return jwt.sign({ id: actor._id }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyJWT(token: string) {
  return jwt.verify(token, JWT_SECRET) as { id: string };
}

export async function createSub({
  name,
  thumbnailUrl,
  description = '',
}: {
  name: string;
  thumbnailUrl: string;
  description?: string;
}) {
  return await ActorModel.create({
    name,
    type: 'sub',
    thumbnailUrl,
    description,
  });
}

export async function createPost({
  actorName,
  subName,
  title,
  content,
  attachments = [],
  tags = [],
}: {
  actorName: string;
  subName: string;
  title: string;
  content: string;
  attachments?: Attachment[];
  tags?: string[];
}) {
  const [actor, sub] = await ActorModel.find({
    name: { $in: [actorName, subName] }
  });

  const actorMap = { [actor.name]: actor, [sub.name]: sub };
  const actorRef = actorMap[actorName]?._id;
  const subRef = actorMap[subName]?._id;

  if (!actorRef || !subRef) {
    throw new Error("Actor or Sub not found");
  }

  return await PostModel.create({
    actorRef,
    subRef,
    title,
    content,
    attachments,
    tags,
  });
}

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

// Fetches the key pagination metric(s) for a given postId, depending on sort
async function getCursorMetrics(postId: string, sort: "new" | "top" | "hot"): Promise<{ createdAt: Date; score?: number; hotScore?: number } | undefined> {

  // Get creation time
  const base = await PostModel.findOne({ postId }, { createdAt: 1 }).lean();
  if (!base) return undefined;

  const createdAt = base.createdAt ?? new Date();

  if (sort === "new") { return { createdAt }; }

  // Get aggregate voting scores
  const [{ upCount = 0, downCount = 0 }] =
    await VoteModel.aggregate([
      { $match: { postId: base._id } },
      {
        $group: {
          _id: "$postId",
          upCount:   { $sum: { $cond: [{ $eq: ["$vote", "up"]   }, 1, 0] }, },
          downCount: { $sum: { $cond: [{ $eq: ["$vote", "down"] }, 1, 0] }, },
        },
      },
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
function buildCursorMatch(
  cursorMetrics: { createdAt: Date; score?: number; hotScore?: number },
  sort: "new" | "top" | "hot"
) {
  const { createdAt, score = 0, hotScore = 0 } = cursorMetrics;
  switch (sort) {
    case "new": return { createdAt: { $lt: createdAt } };
    case "top": return { $or: [ { score:    { $lt: score    } }, { score, createdAt:    { $lt: createdAt } } ] };
    case "hot": return { $or: [ { hotScore: { $lt: hotScore } }, { hotScore, createdAt: { $lt: createdAt } } ] };
  }
}

export async function getFeed({
  limit = 25,
  cursor,
  subName,
  actorName,
  sort = "new",
}: Req_Feed): Promise<Res_Feed> {
  try {
    //----- Pull cursor metrics for paging -----//
    let cursorMatch: object | undefined;
    if (cursor) {
      const cm = await getCursorMetrics(cursor, sort);
      if (cm) cursorMatch = buildCursorMatch(cm, sort);
    }

    //----- Build one big aggregation -----//
    const pipeline: any[] = [];

    // Lookup poster & sub
    pipeline.push(
      {
        $lookup: {
          from: ActorModel.collection.collectionName,
          localField: "actorRef",
          foreignField: "_id",
          as: "actorDoc",
        },
      },
      { $unwind: "$actorDoc" },
      {
        $lookup: {
          from: ActorModel.collection.collectionName,
          localField: "subRef",
          foreignField: "_id",
          as: "subDoc",
        },
      },
      { $unwind: "$subDoc" }
    );

    // Optional actorName/subName filters
    if (actorName) pipeline.push({ $match: { "actorDoc.name": actorName } });
    if (subName) pipeline.push({ $match: { "subDoc.name": subName } });

    // Bring in vote docs & compute up/down counts + score
    pipeline.push(
      {
        $lookup: {
          from: VoteModel.collection.collectionName,
          localField: "_id",
          foreignField: "postId",
          as: "votes",
        },
      },
      {
        $addFields: {
          upCount:   { $size: { $filter: { input: "$votes", cond: { $eq: ["$$this.vote", "up"]   }, }, }, },
          downCount: { $size: { $filter: { input: "$votes", cond: { $eq: ["$$this.vote", "down"] }, }, }, },
        },
      },
      { $addFields: { score: { $subtract: ["$upCount", "$downCount"] } }, }
    );

    // for hot, compute a hotScore field
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

    // sort stage
    const sortStage: Record<string, -1> =
      sort === "new"
        ? { createdAt: -1 }
        : sort === "top"
        ? { score: -1, createdAt: -1 }
        : { hotScore: -1, createdAt: -1 };
    pipeline.push({ $sort: sortStage });

    // limit & project our PostData shape
    pipeline.push(
      { $limit: limit },
      {
        $project: {
          _id: 0,
          postId: 1,
          title: 1,
          content: 1,
          tags: 1,
          attachments: 1,
          actorName: "$actorDoc.name",
          subName: "$subDoc.name",
        },
      }
    );

    const docs = (await PostModel.aggregate(pipeline)) as PostData[];

    return { success: true, posts: docs };
  }
  catch (err) {
    console.error("getFeed error:", err);
    return { success: false, error: "internalError" };
  }
} */