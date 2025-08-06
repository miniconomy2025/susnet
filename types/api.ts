import { Unit, Result, SimpleResult } from './types.ts';

//----------- Data Types -----------//

export type ActorData<Meta extends 'simple' | 'full' = 'simple'> = {
  name:          string;
  type:          ActorType;
  thumbnailUrl:  string;
  description:   string;
  origin:        string;
} & (Meta extends 'simple' ? Unit : {
  postCount: number;
  followerCount: number
  followingCount: number
});
export type EditableActorData = 'description' | 'thumbnailUrl';


export type AttachmentData = {
  url:        string;
  mimeType:   string;
  altText?:   string;
};


export type PostData<Meta extends 'simple' | 'full' = 'simple'> = {
  postId:       string;
  actorName:    string;
  subName:      string;
  title:        string;
  content:      string;
  attachments:  AttachmentData[];
  tags:         string[];
} & (Meta extends 'simple' ? Unit : {
  upvotes: number;
  downvotes: number;
  score: number
});
export type EditablePostData = 'title' | 'content' | 'tags';

//----------- Request/Response Types -----------//

import { VoteType, ActorType } from "../server/db/schema.ts";

//--- Request types ----//
export type Req_createSub    = { name: string; thumbnailUrl: string; description?: string };
export type Req_updateActor  = { description?: string; thumbnailUrl?: string };
export type Req_SearchActors = { query: string; };
export type Req_SearchTags   = { query: string; };
export type Req_EditPost     = Partial<Pick<PostData, EditablePostData>>;
export type Req_EditActor    = Partial<Pick<ActorData, EditableActorData>>;
export type Req_vote         = { vote: VoteType | null };

export type Req_login = {
  googleId: string;
  email: string;
  accessToken: string;
  refreshToken?: string
};
export type Req_createPost = {
  subName: string;
  title: string;
  content: string;
  attachments: AttachmentData[];
  tags: string[];
};
export type Req_Feed = {
  limit?: number;
  cursor: string;
  actorName?: string;
  sort?: 'top' | 'new' | 'hot';
};

//--- Result types ---//
export type Res_health        = Result<Unit>;
export type Res_login         = Result<{ token: string }>;
export type Res_me            = SimpleResult<{ actor: ActorData }, 'invalidAuth'>;
export type Res_getActor      = SimpleResult<{ actor: ActorData<'full'> }, 'notFound'>;
export type Res_getActorPosts = SimpleResult<{ posts: PostData<'full'>[] }, 'notFound'>;
export type Res_followers     = SimpleResult<{ followers: ActorData<'simple'>[] }, 'notFound'>;
export type Res_following     = SimpleResult<{ following: ActorData<'simple'>[] }, 'notFound'>;
export type Res_createSub     = SimpleResult<{ sub: ActorData<'simple'> }, 'internalError' | 'invalidRequest' | 'alreadyExists'>;
export type Res_updateActor   = Result<{ actor: ActorData<'simple'> }>;
export type Res_getPost       = SimpleResult<{ post: PostData<'full'> }, 'notFound'>;
export type Res_createPost    = Result<{ post: PostData }>;
export type Res_vote          = Result<{ vote: VoteType }>;
export type Res_follow        = Result<Unit>;
export type Res_unfollow      = Result<{ success: true }>;
export type Res_followStatus  = Result<{ following: boolean }>;
export type Res_Feed          = SimpleResult<{ posts: PostData<'full'>[] }, "internalError">;
export type Res_SearchActors  = Result<{ actors: ActorData[] }>;
export type Res_SearchTags    = Result<{ tags: { tag: string; count: number; }[]}>;
export type Res_EditPost      = SimpleResult<Unit, 'notFound' | 'forbidden'>;
export type Res_EditActor     = SimpleResult<Unit, 'notFound' | 'forbidden'>;