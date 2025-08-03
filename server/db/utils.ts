import { DocumentType } from "@typegoose/typegoose";
import { ActorModel, AuthModel, PostModel, VoteModel, FollowModel } from './schema.ts';
import { Actor, ActorType, Attachment, VoteType } from './schema.ts';

import jwt from 'jsonwebtoken';
import { env } from "../utils/env.ts";

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

export async function searchActors(query: string) {
  return await ActorModel.find({ name: { $regex: query, $options: 'i' } });
}

export async function searchPosts(query: string) {
  return await PostModel.find({ $text: { $search: query } });
}