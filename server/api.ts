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
  Res_login,
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

const ORIGIN = "susnet.co.za";
const JWT_SECRET = "";

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
type Endpoints = {
  [K in `${ReqType}|/${string}`]: (params: any, user: AuthUser) => Promise<any>;
};

const endpoints: Endpoints = {
  "GET|/health": async (): Promise<Res_health> => ({ success: true }),

  "POST|/auth/login": async (req: Req_login): Promise<Res_login> => {
    const auth = await AuthModel.findOneAndUpdate(
      { googleId: req.googleId },
      {
        email: req.email,
        accessToken: req.accessToken,
        refreshToken: req.refreshToken,
      },
      { upsert: true, new: true },
    ).exec();
    const token = jwt.sign({ sub: auth._id.toString() }, JWT_SECRET!);
    return { success: true, token };
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

//---------- Health ----------//

router.get("/health", async (_: Request, res: Response) => {
  res.json({ success: true });
});

//---------- Auth ----------//

router.post("/auth/login", async (req: Request, res: Response) => {
  const { token } = req.body;
  if (await verifyJWT(token)) {
    console.log("Token is real");
    const auth = await decodeJWT(token);
    if (auth.sub) {
      res.cookie("token", token, {
        httpOnly: true, // prevent JS access (XSS protection)
        secure: process.env.NODE_ENV === "production", // use HTTPS in prod
        sameSite: "lax", // or "strict" or "none" depending on your frontend/backend setup
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      const isNew = (await searchAuthsByExactGoogleID(token)).length == 0;
      if (isNew) {
      }

      res.json({ success: true });
    }
  } else {
    res.json({ success: false });
    //TODO YOU GOT A BAD TOKEN
  }
});

router.get("/auth/me", async (req: Request, res: Response) => {
  const { token } = req.cookies.token;
  res.json({ success: true, isNew: isNew });
});

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

router.get(
  "/actors/:name",
  async (req: Request<{ name: string }>, res: Response<Res_getActor>) => {
    const actor = await ActorModel.findOne({ name: req.params.name });
    if (!actor) return res.json({ success: false, error: "notFound" });
    res.json({ success: true, actor });
  },
);

router.get(
  "/actors/:name/posts",
  async (req: Request<{ name: string }>, res: Response<Res_getActorPosts>) => {
    const posts = await getPostsForActor(req.params.name);
    res.json({ success: true, posts });
  },
);

router.get(
  "/actors/:name/followers",
  async (req: Request<{ name: string }>, res: Response<Res_followers>) => {
    const actor = await ActorModel.findOne({ name: req.params.name });
    if (!actor) return res.json({ success: true, followers: [] });

    const followers = await FollowModel.find({ targetRef: actor._id });
    res.json({ success: true, followers });
  },
);

router.get(
  "/actors/:name/following",
  async (req: Request<{ name: string }>, res: Response<Res_following>) => {
    const following = await getActorsFollowedBy(req.params.name);
    res.json({ success: true, following });
  },
);

router.get(
  "/actors/:name/aggregate",
  async (req: Request<{ name: string }>, res: Response<Res_aggregate>) => {
    const agg = await getSubAggregate(req.params.name);
    res.json({ success: true, ...agg });
  },
);

router.post(
  "/actors/subs",
  authenticate,
  async (req: Request<{}, {}, Req_createSub>, res: Response<Res_createSub>) => {
    const sub = await createSub(req.body);
    res.json({ success: true, sub });
  },
);

router.patch(
  "/actors/me",
  authenticate,
  async (
    req: Request<{}, {}, Req_updateActor>,
    res: Response<Res_updateActor>,
  ) => {
    const updated = await ActorModel.findOneAndUpdate(
      { name: req.user.name },
      req.body,
      { new: true },
    );
    res.json({ success: true, actor: updated! });
  },
);

//---------- Posts ----------//

router.get(
  "/posts/:postId",
  async (req: Request<{ postId: string }>, res: Response<Res_getPost>) => {
    const post = await PostModel.findOne({ postId: req.params.postId });
    if (!post) return res.json({ success: false, error: "notFound" });
    res.json({ success: true, post });
  },
);

router.get(
  "/posts/:postId/votes",
  async (
    req: Request<{ postId: string }>,
    res: Response<Res_postAggregate>,
  ) => {
    const agg = await getPostVoteAggregate(req.params.postId);
    res.json({ success: true, ...agg });
  },
);

router.post(
  "/posts",
  authenticate,
  async (
    req: Request<{}, {}, Req_createPost>,
    res: Response<Res_createPost>,
  ) => {
    const post = await createPost({
      actorName: req.user.name,
      subName: req.body.subName,
      title: req.body.title,
      content: req.body.content,
      attachments: req.body.attachments,
      tags: req.body.tags,
    });
    res.json({ success: true, post });
  },
);

//---------- Votes ----------//

router.post(
  "/posts/:postId/vote",
  authenticate,
  async (
    req: Request<{ postId: string }, {}, Req_vote>,
    res: Response<Res_vote>,
  ) => {
    const result = await voteOnPost(
      req.params.postId,
      req.user.name,
      req.body.vote as VoteType,
    );
    res.json({ success: true, vote: result.vote });
  },
);

//---------- Follows ----------//

router.post(
  "/actors/:targetName/follow",
  authenticate,
  async (req: Request<{ targetName: string }>, res: Response<Res_follow>) => {
    const follow = await followActor(req.user.name, req.params.targetName);
    res.json({ success: true, follow });
  },
);

router.delete(
  "/actors/:targetName/follow",
  authenticate,
  async (req: Request<{ targetName: string }>, res: Response<Res_unfollow>) => {
    const [follower, target] = await ActorModel.find({
      name: { $in: [req.user.name, req.params.targetName] },
    });
    const followerRef = follower?.name === req.user.name
      ? follower._id
      : target?._id;
    const targetRef = target?.name === req.params.targetName
      ? target._id
      : follower?._id;

    if (followerRef && targetRef) {
      await FollowModel.deleteOne({ followerRef, targetRef });
    }

    res.json({ success: true });
  },
);

router.get(
  "/actors/:targetName/following-status",
  authenticate,
  async (
    req: Request<{ targetName: string }>,
    res: Response<Res_followStatus>,
  ) => {
    const [follower, target] = await ActorModel.find({
      name: { $in: [req.user.name, req.params.targetName] },
    });
    const followerRef = follower?.name === req.user.name
      ? follower._id
      : target?._id;
    const targetRef = target?.name === req.params.targetName
      ? target._id
      : follower?._id;

    const isFollowing = followerRef && targetRef
      ? await FollowModel.exists({ followerRef, targetRef })
      : false;

    res.json({ success: true, following: Boolean(isFollowing) });
  },
);
for (const [route, handler] of Object.entries(endpoints)) {
  const [method, path] = route.split("|");
  const middleware = authenticated.has(route) ? authenticate : noop;

  router[method.toLowerCase()](
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

        const result = await handler({ ...req.body, ...req.params }, req.user);
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
