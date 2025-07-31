import { DocumentType } from "@typegoose/typegoose";
import { ActorModel, AuthModel, PostModel, VoteModel, FollowModel } from './schema.ts';
import { Actor, Attachment, VoteType } from './schema.ts';

import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from "../utils/env.ts";

//---------- Setup ----------//
const JWT_SECRET = env("JWT_SECRET");


//---------- Utils ----------//

// Create a new user account with Google auth
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
  const actorId = `https://susnet.co.za/users/${name}`;
  const actor = await ActorModel.create({
    actorId,
    type: 'user',
    name,
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

// JWT creation and validation
export function createJWT(actor: DocumentType<Actor>) {
  return jwt.sign({ actorId: actor.actorId, id: actor._id }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyJWT(token: string) {
  return jwt.verify(token, JWT_SECRET) as { actorId: string; id: string };
}

// Create a new sub
export async function createSub({
  name,
  thumbnailUrl,
  description = '',
}: {
  name: string;
  thumbnailUrl: string;
  description?: string;
}) {
  const actorId = `https://susnet.co.za/s/${name}`;
  return await ActorModel.create({
    actorId,
    type: 'sub',
    name,
    thumbnailUrl,
    description,
  });
}

// Create a new post
export async function createPost({
  actorRef,
  subRef,
  title,
  content,
  attachments = [],
  tags = [],
}: {
  actorRef: Types.ObjectId;
  subRef: Types.ObjectId;
  title: string;
  content: string;
  attachments?: Attachment[];
  tags?: string[];
}) {
  return await PostModel.create({
    actorRef,
    subRef,
    title,
    content,
    attachments,
    tags,
  });
}

// Follow a user or sub
export async function followActor(followerRef: Types.ObjectId, targetRef: Types.ObjectId) {
  return await FollowModel.findOneAndUpdate(
    { followerRef, targetRef },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

// Upvote/downvote a post
export async function voteOnPost(postId: Types.ObjectId, actorRef: Types.ObjectId, vote: VoteType) {
  return await VoteModel.findOneAndUpdate(
    { postId, actorRef },
    { vote },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

// Get post aggregate (upvotes, downvotes, net score)
export async function getPostVoteAggregate(postId: Types.ObjectId) {
  const votes = await VoteModel.aggregate([
    { $match: { postId } },
    {
      $group: {
        _id: null,
        upvotes: {
          $sum: {
            $cond: [{ $eq: ['$vote', VoteType.up] }, 1, 0],
          },
        },
        downvotes: {
          $sum: {
            $cond: [{ $eq: ['$vote', VoteType.down] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        upvotes: 1,
        downvotes: 1,
        score: { $subtract: ['$upvotes', '$downvotes'] },
      },
    },
  ]);

  return votes[0] ?? { upvotes: 0, downvotes: 0, score: 0 };
}

// Get sub aggregate (total posts, total followers)
export async function getSubAggregate(subRef: Types.ObjectId) {
  const [postCount, followerCount] = await Promise.all([
    PostModel.countDocuments({ subRef }),
    FollowModel.countDocuments({ targetRef: subRef }),
  ]);

  return { postCount, followerCount };
}

// Get subs a user is following
export async function getFollowedSubs(actorRef: Types.ObjectId) {
  return await FollowModel.find({ followerRef: actorRef })
    .populate({ path: 'targetRef', match: { type: 'sub' }, })
    .then(follows => follows.map(f => f.targetRef).filter(Boolean));
}

// Get users a user is following
export async function getFollowedUsers(actorRef: Types.ObjectId) {
  return await FollowModel.find({ followerRef: actorRef })
    .populate({ path: 'targetRef', match: { type: 'user' } })
    .then(follows => follows.map(f => f.targetRef).filter(Boolean));
}