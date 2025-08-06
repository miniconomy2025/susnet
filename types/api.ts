import { Unit, Result, SimpleResult, HTTPMethod } from './types.ts';

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
import { AuthenticatedRequest } from "../server/auth.ts";

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
export type Res_follow        = SimpleResult<Unit, 'notFound' | 'invalidRequest'>;
export type Res_unfollow      = Result<{ success: true }>;
export type Res_followStatus  = Result<{ following: boolean }>;
export type Res_Feed          = SimpleResult<{ posts: PostData<'full'>[] }, 'internalError'>;
export type Res_SearchActors  = Result<{ actors: ActorData[] }>;
export type Res_SearchTags    = Result<{ tags: { tag: string; count: number; }[]}>;
export type Res_EditPost      = SimpleResult<Unit, 'notFound' | 'forbidden'>;
export type Res_EditActor     = SimpleResult<Unit, 'notFound' | 'forbidden'>;


export type AuthUser = AuthenticatedRequest["user"];
// type AuthUser = { id: Types.ObjectId; name: string };


//----------- Endpoint Schema -----------//

export type EndpointIO = {
  "health":             [Unit,             Res_health       ],
  "login":              [Req_login,        Res_login        ],
  "me":                 [Unit,             Res_me           ],
  "getActor":           [Unit,             Res_getActor     ],
  "getActorPosts":      [Unit,             Res_getActorPosts],
  "getActorFollowers":  [Unit,             Res_followers    ],
  "getActorFollowing":  [Unit,             Res_following    ],
  "createSub":          [Req_createSub,    Res_createSub    ],
  "updateMe":           [Req_updateActor,  Res_updateActor  ],
  "getPost":            [Unit,             Res_getPost      ],
  "createPost":         [Req_createPost,   Res_createPost   ],
  "voteOnPost":         [Req_vote,         Res_vote         ],
  "followActor":        [Unit,             Res_follow       ],
  "unfollowActor":      [Unit,             Res_unfollow     ],
  "getFollowingStatus": [Unit,             Res_followStatus ],
  "getFeed":            [Req_Feed,         Res_Feed         ],
  "searchActors":       [Req_SearchActors, Res_SearchActors ],
  "searchTags":         [Req_SearchTags,   Res_SearchTags   ],
  "updatePost":         [Req_EditPost,     Res_EditPost     ],
  "updateActor":        [Req_EditActor,    Res_EditActor    ],
};

export type EndpointRequest<E extends keyof EndpointIO> = EndpointIO[E][0];
export type EndpointResponse<E extends keyof EndpointIO> = EndpointIO[E][1];

type Primitive = string | number | boolean | null;
export type Endpoints = { [E in keyof EndpointIO]: (req: EndpointRequest<E>, params: any, user: AuthUser) => Promise<EndpointResponse<E>> };

export const endpointSignatures: { [K in keyof EndpointIO]: [HTTPMethod, `/${string}`] } = {
  "health":             ['GET',    '/health'                             ],
  "login":              ['POST',   '/auth/login'                         ],
  "me":                 ['GET',    '/auth/me'                            ],
  "getActor":           ['GET',    '/actors/:name'                       ],
  "getActorPosts":      ['GET',    '/actors/:name/posts'                 ],
  "getActorFollowers":  ['GET',    '/actors/:name/followers'             ],
  "getActorFollowing":  ['GET',    '/actors/:name/following'             ],
  "createSub":          ['POST',   '/actors/subs'                        ],
  "updateMe":           ['PATCH',  '/actors/me'                          ],
  "getPost":            ['GET',    '/posts/:postId'                      ],
  "createPost":         ['POST',   '/posts'                              ],
  "voteOnPost":         ['POST',   '/posts/:postId/vote'                 ],
  "followActor":        ['POST',   '/actors/:targetName/follow'          ],
  "unfollowActor":      ['DELETE', '/actors/:targetName/follow'          ],
  "getFollowingStatus": ['GET',    '/actors/:targetName/following-status'],
  "getFeed":            ['POST',   '/posts/feed'                         ],
  "searchActors":       ['POST',   '/actors/search'                      ],
  "searchTags":         ['POST',   '/tags/search'                        ],
  "updatePost":         ['PATCH',  '/posts/:postId'                      ],
  "updateActor":        ['PATCH',  '/actors/:actorName'                  ],
};