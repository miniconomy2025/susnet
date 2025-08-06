import express, { Request, Response } from 'express';
import { authenticate } from './auth.ts';
import {
  ActorModel, AuthModel, PostModel, VoteModel, FollowModel,
  VoteType, ActorType, Actor, Post, Follow
} from './db/schema.ts';
import {
  createPost, createSub, createUserAccount, createJWT, followActor, getActorsFollowedBy,
  getPostVoteAggregate, getSubAggregate, voteOnPost, getUserVote, getPostsForActor
} from './db/utils.ts';
import { decodeGoogleToken } from "./utils/authUtils.ts";

//----------- Request/Response Types -----------//

type Unit = Record<string, never>;

export type Result<S extends object, E extends { [key: string]: object } = {}, Es extends string = keyof E extends string ? keyof E : never> =
  | ({ success: true } & S)
  | ({ [K in keyof E]: { success: false; error: K } & E[K] }[Es]);

export type SimpleResult<S extends object, Es extends string> = Result<S, { [K in Es]: {} }>;

type Res_health = Result<Unit>;
type Req_login = { googleId: string; email: string; accessToken: string; refreshToken?: string };
type Res_login = Result<{ token: string }>;
type Res_me = Result<{ actor: Actor }>;
type Res_getActor = SimpleResult<{ actor: Actor }, 'notFound'>;
type Res_getActorPosts = Result<{ posts: Post[] }>;
type Res_followers = Result<{ followers: Follow[] }>;
type Res_following = Result<{ following: Actor[] }>;
type Res_aggregate = Result<{ postCount: number; followerCount: number }>;
type Req_createSub = { name: string; thumbnailUrl: string; description?: string };
type Res_createSub = Result<{ sub: Actor }>;
type Req_updateActor = { description?: string; thumbnailUrl?: string };
type Res_updateActor = Result<{ actor: Actor }>;
type Res_getPost = SimpleResult<{ post: Post }, 'notFound'>;
type Res_postAggregate = Result<{ upvotes: number; downvotes: number; score: number }>;
type Req_createPost = {
  subName: string;
  title: string;
  content: string;
  attachments?: Post['attachments'];
  tags?: string[];
};
type Res_createPost = Result<{ post: Post }>;
type Req_vote = { vote: 'up' | 'down' | null };
type Res_vote = Result<{ vote: VoteType }>;
type Res_follow = Result<{ follow: Follow }>;
type Res_unfollow = Result<{ success: true }>;
type Res_followStatus = Result<{ following: boolean }>;

const router = express.Router();

//---------- Health ----------//

router.get('/health', async (_: Request, res: Response<Res_health>) => {
  res.json({ success: true });
});

//---------- Auth ----------//

router.post('/auth/login', async (req: any, res: any) => {
  const {token} = req.body;
  let a = decodeGoogleToken(token);
  res.json({success: true})
})

// router.post('/auth/login', async (req: Request<{}, {}, Req_login>, res: Response<Res_login>) => {
//   const { googleId, email, accessToken, refreshToken } = req.body;
//   // TEMP: Add name and thumbnailUrl from body until OAuth2 flow is implemented
//   const { name, thumbnailUrl, description = '' } = req.body as any;

//   const { actor } = await createUserAccount({ googleId, email, accessToken, refreshToken, name, thumbnailUrl, description });
//   const token = createJWT(actor);
//   res.json({ success: true, token });
// });

// router.get('/auth/me', authenticate, async (req: Request, res: Response<Res_me>) => {
//   const actor = await ActorModel.findOne({ name: req.user.name });
//   res.json({ success: true, actor: actor! });
// });

//---------- Actors ----------//

router.get('/actors/:name', async (req: Request<{ name: string }>, res: Response<Res_getActor>) => {
  const actor = await ActorModel.findOne({ name: req.params.name });
  if (!actor) return res.json({ success: false, error: 'notFound' });
  res.json({ success: true, actor });
});

router.get('/actors/:name/posts', async (req: Request<{ name: string }>, res: Response<Res_getActorPosts>) => {
  const posts = await getPostsForActor(req.params.name);
  res.json({ success: true, posts });
});

router.get('/actors/:name/followers', async (req: Request<{ name: string }>, res: Response<Res_followers>) => {
  const actor = await ActorModel.findOne({ name: req.params.name });
  if (!actor) return res.json({ success: true, followers: [] });

  const followers = await FollowModel.find({ targetRef: actor._id });
  res.json({ success: true, followers });
});

router.get('/actors/:name/following', async (req: Request<{ name: string }>, res: Response<Res_following>) => {
  const following = await getActorsFollowedBy(req.params.name);
  res.json({ success: true, following });
});

router.get('/actors/:name/aggregate', async (req: Request<{ name: string }>, res: Response<Res_aggregate>) => {
  const agg = await getSubAggregate(req.params.name);
  res.json({ success: true, ...agg });
});

router.post('/actors/subs', authenticate, async (req: Request<{}, {}, Req_createSub>, res: Response<Res_createSub>) => {
  const sub = await createSub(req.body);
  res.json({ success: true, sub });
});

router.patch('/actors/me', authenticate, async (req: Request<{}, {}, Req_updateActor>, res: Response<Res_updateActor>) => {
  const updated = await ActorModel.findOneAndUpdate({ name: req.user.name }, req.body, { new: true });
  res.json({ success: true, actor: updated! });
});

//---------- Posts ----------//

router.get('/posts/:postId', async (req: Request<{ postId: string }>, res: Response<Res_getPost>) => {
  const post = await PostModel.findOne({ postId: req.params.postId });
  if (!post) return res.json({ success: false, error: 'notFound' });
  res.json({ success: true, post });
});

router.get('/posts/:postId/votes', async (req: Request<{ postId: string }>, res: Response<Res_postAggregate>) => {
  const agg = await getPostVoteAggregate(req.params.postId);
  res.json({ success: true, ...agg });
});

router.post('/posts', authenticate, async (req: Request<{}, {}, Req_createPost>, res: Response<Res_createPost>) => {
  const post = await createPost({
    actorName: req.user.name,
    subName: req.body.subName,
    title: req.body.title,
    content: req.body.content,
    attachments: req.body.attachments,
    tags: req.body.tags,
  });
  res.json({ success: true, post });
});

//---------- Votes ----------//

router.post('/posts/:postId/vote', authenticate, async (req: Request<{ postId: string }, {}, Req_vote>, res: Response<Res_vote>) => {
  const result = await voteOnPost(req.params.postId, req.user.name, req.body.vote as VoteType);
  res.json({ success: true, vote: result.vote });
});

//---------- Follows ----------//

router.post('/actors/:targetName/follow', authenticate, async (req: Request<{ targetName: string }>, res: Response<Res_follow>) => {
  const follow = await followActor(req.user.name, req.params.targetName);
  res.json({ success: true, follow });
});

router.delete('/actors/:targetName/follow', authenticate, async (req: Request<{ targetName: string }>, res: Response<Res_unfollow>) => {
  const [follower, target] = await ActorModel.find({ name: { $in: [req.user.name, req.params.targetName] } });
  const followerRef = follower?.name === req.user.name ? follower._id : target?._id;
  const targetRef = target?.name === req.params.targetName ? target._id : follower?._id;

  if (followerRef && targetRef) {
    await FollowModel.deleteOne({ followerRef, targetRef });
  }

  res.json({ success: true });
});

router.get('/actors/:targetName/following-status', authenticate, async (req: Request<{ targetName: string }>, res: Response<Res_followStatus>) => {
  const [follower, target] = await ActorModel.find({ name: { $in: [req.user.name, req.params.targetName] } });
  const followerRef = follower?.name === req.user.name ? follower._id : target?._id;
  const targetRef = target?.name === req.params.targetName ? target._id : follower?._id;

  const isFollowing = followerRef && targetRef
    ? await FollowModel.exists({ followerRef, targetRef })
    : false;

  res.json({ success: true, following: Boolean(isFollowing) });
});

export default router;