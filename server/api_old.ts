// import express, { Request, Response } from 'express';
// import { authenticate } from './auth.ts';

// import {
//   ActorModel, AuthModel, PostModel, VoteModel, FollowModel,
//   VoteType, ActorType, Actor, Post, Follow
// } from './db/schema.ts';

// import {
//   createPost, createSub, createUserAccount, createJWT, followActor, getActorsFollowedBy,
//   getPostVoteAggregate, getSubAggregate, voteOnPost, getUserVote, getPostsForActor, getFeed
// } from './db/utils.ts';

// import {
//   Res_health, Req_login, Res_login, Res_me,
//   Res_getActor, Res_getActorPosts, Res_followers, Res_following,
//   Res_aggregate, Req_createSub, Res_createSub, Req_updateActor,
//   Res_updateActor, Res_getPost, Res_postAggregate, Req_createPost,
//   Res_createPost, Req_vote, Res_vote, Res_follow,
//   Res_unfollow, Res_followStatus, Req_Feed, Req_SearchActors,
//   Res_SearchActors, Req_SearchTags, Res_SearchTags, Req_EditPost,
//   Req_EditActor, Res_Feed, Res_EditPost, Res_EditActor
// } from '../types/api.ts';

// const router = express.Router();


// //---------- Health ----------//

// router.get('/health', async (_: Request, res: Response<Res_health>) => {
//   res.json({ success: true });
// });

// //---------- Auth ----------//

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

// //---------- Actors ----------//

// router.get('/actors/:name', async (req: Request<{ name: string }>, res: Response<Res_getActor>) => {
//   const actor = await ActorModel.findOne({ name: req.params.name });
//   if (!actor) return res.json({ success: false, error: 'notFound' });
//   res.json({ success: true, actor });
// });

// router.get('/actors/:name/posts', async (req: Request<{ name: string }>, res: Response<Res_getActorPosts>) => {
//   const posts = await getPostsForActor(req.params.name);
//   res.json({ success: true, posts });
// });

// router.get('/actors/:name/followers', async (req: Request<{ name: string }>, res: Response<Res_followers>) => {
//   const actor = await ActorModel.findOne({ name: req.params.name });
//   if (!actor) return res.json({ success: true, followers: [] });

//   const followers = await FollowModel.find({ targetRef: actor._id });
//   res.json({ success: true, followers });
// });

// router.get('/actors/:name/following', async (req: Request<{ name: string }>, res: Response<Res_following>) => {
//   const following = await getActorsFollowedBy(req.params.name);
//   res.json({ success: true, following });
// });

// router.get('/actors/:name/aggregate', async (req: Request<{ name: string }>, res: Response<Res_aggregate>) => {
//   const agg = await getSubAggregate(req.params.name);
//   res.json({ success: true, ...agg });
// });

// router.post('/actors/subs', authenticate, async (req: Request<{}, {}, Req_createSub>, res: Response<Res_createSub>) => {
//   const sub = await createSub(req.body);
//   res.json({ success: true, sub });
// });

// router.patch('/actors/me', authenticate, async (req: Request<{}, {}, Req_updateActor>, res: Response<Res_updateActor>) => {
//   const updated = await ActorModel.findOneAndUpdate({ name: req.user.name }, req.body, { new: true });
//   res.json({ success: true, actor: updated! });
// });

// //---------- Posts ----------//

// router.get('/posts/:postId', async (req: Request<{ postId: string }>, res: Response<Res_getPost>) => {
//   const post = await PostModel.findOne({ postId: req.params.postId });
//   if (!post) return res.json({ success: false, error: 'notFound' });
//   res.json({ success: true, post });
// });

// router.get('/posts/:postId/votes', async (req: Request<{ postId: string }>, res: Response<Res_postAggregate>) => {
//   const agg = await getPostVoteAggregate(req.params.postId);
//   res.json({ success: true, ...agg });
// });

// router.post('/posts', authenticate, async (req: Request<{}, {}, Req_createPost>, res: Response<Res_createPost>) => {
//   const post = await createPost({
//     actorName: req.user.name,
//     subName: req.body.subName,
//     title: req.body.title,
//     content: req.body.content,
//     attachments: req.body.attachments,
//     tags: req.body.tags,
//   });
//   res.json({ success: true, post });
// });

// //---------- Votes ----------//

// router.post('/posts/:postId/vote', authenticate, async (req: Request<{ postId: string }, {}, Req_vote>, res: Response<Res_vote>) => {
//   const result = await voteOnPost(req.params.postId, req.user.name, req.body.vote as VoteType);
//   res.json({ success: true, vote: result.vote });
// });

// //---------- Follows ----------//

// router.post('/actors/:targetName/follow', authenticate, async (req: Request<{ targetName: string }>, res: Response<Res_follow>) => {
//   const follow = await followActor(req.user.name, req.params.targetName);
//   res.json({ success: true, follow });
// });

// router.delete('/actors/:targetName/follow', authenticate, async (req: Request<{ targetName: string }>, res: Response<Res_unfollow>) => {
//   const [follower, target] = await ActorModel.find({ name: { $in: [req.user.name, req.params.targetName] } });
//   const followerRef = follower?.name === req.user.name ? follower._id : target?._id;
//   const targetRef = target?.name === req.params.targetName ? target._id : follower?._id;

//   if (followerRef && targetRef) {
//     await FollowModel.deleteOne({ followerRef, targetRef });
//   }

//   res.json({ success: true });
// });

// router.get('/actors/:targetName/following-status', authenticate, async (req: Request<{ targetName: string }>, res: Response<Res_followStatus>) => {
//   const [follower, target] = await ActorModel.find({ name: { $in: [req.user.name, req.params.targetName] } });
//   const followerRef = follower?.name === req.user.name ? follower._id : target?._id;
//   const targetRef = target?.name === req.params.targetName ? target._id : follower?._id;

//   const isFollowing = followerRef && targetRef
//     ? await FollowModel.exists({ followerRef, targetRef })
//     : false;

//   res.json({ success: true, following: Boolean(isFollowing) });
// });


// //---------- Endpoints ----------//

// router.post('/api/posts/feed', async (req: Request<{}, {}, Req_Feed>, res: Response<Res_Feed>) => {
//   try {
//     const posts = await getFeed(req.body);
//     res.json({ success: true, posts });
//   }
//   catch (err) { res.status(500).json({ success: false, error: 'internalError' }); }
// });

// router.post('/api/actors/search', async (req: Request<{}, {}, Req_SearchActors>, res: Response<Res_SearchActors>) => {
//   const { query } = req.body;
//   const actors = await ActorModel.find({ name: { $regex: query, $options: 'i' } }).limit(25);
//   res.json({ success: true, actors });
// });

// router.post('/api/tags/search', async (req: Request<{}, {}, Req_SearchTags>, res: Response<Res_SearchTags>) => {
//   const { query } = req.body;
//   const tagsAgg = await PostModel.aggregate([
//     { $unwind: '$tags' },
//     { $match: { tags: { $regex: query, $options: 'i' } } },
//     { $group: { _id: '$tags', count: { $sum: 1 } } },
//     { $sort: { count: -1 } },
//     { $limit: 25 },
//     { $project: { tag: '$_id', count: 1, _id: 0 } }
//   ]);

//   res.json({ success: true, tags: tagsAgg });
// });

// router.patch('/api/posts/:postId', authenticate, async (req: Request<{ postId: string }, {}, Req_EditPost>, res: Response<Res_EditPost>) => {
//   const { postId } = req.params;
//   const actor = req.actor;

//   const post = await PostModel.findOne({ postId });
//   if (!post) return res.status(404).json({ success: false, error: 'notFound' });
//   if (post.actorRef !== actor.name) return res.status(403).json({ success: false, error: 'forbidden' });

//   Object.assign(post, req.body);
//   await post.save();

//   res.json({ post });
// });

// router.patch('/api/actors/:actorName', authenticate, async (req: Request<{ actorName: string }, {}, Req_EditActor>, res: Response<Res_EditActor>) => {
//   const { actorName } = req.params;
//   const authActor = req.actor;

//   const target = await ActorModel.findOne({ name: actorName });
//   if (!target) return res.status(404).json({ success: false, error: 'notFound' });

//   if (authActor.name === actorName) {
//     Object.assign(target, req.body);
//     await target.save();
//     return res.json(target);
//   }

//   const followDoc = await FollowModel.findOne({ actorRef: authActor.name, targetRef: actorName });
//   if (target.type === 'sub' && followDoc?.role === 'mod') {
//     Object.assign(target, req.body);
//     await target.save();
//     return res.json(target);
//   }

//   res.status(403).json({ success: false, error: 'forbidden' });
// });
