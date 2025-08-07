import { Unit, Result, SimpleResult, HTTPMethod } from './types.ts';

//----------- Data Types -----------//

// Simple -> Only base 'direct' properties
// Full   -> Base + derived properties
export type ActorData<Meta extends 'simple' | 'full' = 'simple'> = {
  name:          string;
  type:          ActorType;
  thumbnailUrl:  string;
  description:   string;
  origin:        string;
} & (Meta extends 'simple' ? Unit : {
  postCount:      number;
  followerCount:  number;
  followingCount: number;
  isFollowing:    boolean;
});
export type EditableActorData = 'description' | 'thumbnailUrl';


export type AttachmentData = {
  url:string;
  mimeType: string;
  altText?: string;
};


export type PostData<Meta extends 'simple' | 'full' = 'simple'> = {
  postId:          string;
  actorName:       string;
  subName:         string;
  title:           string;
  content:         string;
  attachments:  AttachmentData[];
  tags:         string[];
} & (Meta extends 'simple' ? Unit : {
  upvotes:        number;
  downvotes:      number;
  score:          number;
  isFollowingSub: boolean;
  timestamp:      number;
  subThumbnailUrl: string;
});
export type EditablePostData = 'title' | 'content' | 'tags';


export type AuthData = {
  accessToken:  string;
  email:        string;
  googleId:     string;
  refreshToken: string | undefined;
};

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
  googleId:      string;
  email:         string;
  accessToken:   string;
  refreshToken?: string
  token:         string
};
export type Req_createPost = {
  subName:     string;
  title:       string;
  content:     string;
  attachments: AttachmentData[];
  tags:        string[];
};
export type Req_Feed = {
  limit?:         number;
  cursor:         string; // Cursor for pagination, last post that was received in the previous requerst | "" -> starting point
  fromActorName?: string; // If provided, fetch posts posted by this actor only
  sort?:          'top' | 'new' | 'hot';
};

//--- Result types ---//
export type Res_health        = Result<Unit>;
export type Res_login         = SimpleResult<Unit, 'internalError'>;
export type Res_me            = SimpleResult<{ actor: ActorData }, 'invalidAuth'>;
export type Res_getActor      = SimpleResult<{ actor: ActorData<'full'> }, 'notFound'>;
// export type Res_getActorPosts = SimpleResult<{ posts: PostData<'full'>[] }, 'notFound'>;
export type Res_followers     = SimpleResult<{ followers: ActorData<'simple'>[] }, 'notFound'>;
export type Res_following     = SimpleResult<{ following: ActorData<'simple'>[] }, 'notFound'>;
export type Res_createSub     = SimpleResult<{ sub: ActorData<'simple'> }, 'internalError' | 'invalidRequest' | 'alreadyExists'>;
export type Res_updateActor   = Result<{ actor: ActorData<'simple'> }>;
export type Res_getPost       = SimpleResult<{ post: PostData<'full'> }, 'notFound'>;
export type Res_createPost    = SimpleResult<{ post: PostData<'simple'> }, 'notFound'>;
export type Res_vote          = Result<{ vote: VoteType }>;
export type Res_follow        = SimpleResult<Unit, 'notFound' | 'invalidRequest'>;
export type Res_unfollow      = SimpleResult<{ success: true }, 'notFound'>;
export type Res_followStatus  = Result<{ following: boolean }>;
export type Res_Feed          = SimpleResult<{ posts: PostData<'full'>[], nextCursor: string | null }, 'internalError' | 'invalidRequest'>;
export type Res_SearchActors  = Result<{ actors: ActorData[] }>;
export type Res_SearchTags    = Result<{ tags: { tag: string; count: number; }[]}>;
export type Res_EditPost      = SimpleResult<Unit, 'notFound' | 'forbidden'>;
export type Res_EditActor     = SimpleResult<Unit, 'notFound' | 'forbidden'>;


export type AuthUser = AuthenticatedRequest["user"];
// type AuthUser = { id: Types.ObjectId; name: string };


//----------- Endpoint Schema -----------//

export type EndpointIO = {
  "health":             [Unit,             null,         Res_health       ],
  "login":              [Req_login,        null,         Res_login        ],
  "me":                 [Unit,             null,         Res_me           ],
  "getActor":           [Unit,             "name",       Res_getActor     ],
  // "getActorPosts":      [Unit,             "name",       Res_getActorPosts],
  "getActorFollowers":  [Unit,             "name",       Res_followers    ],
  "getActorFollowing":  [Unit,             "name",       Res_following    ],
  "createSub":          [Req_createSub,    null,         Res_createSub    ],
  "updateMe":           [Req_updateActor,  null,         Res_updateActor  ],
  "getPost":            [Unit,             "postId",     Res_getPost      ],
  "createPost":         [Req_createPost,   null,         Res_createPost   ],
  "voteOnPost":         [Req_vote,         "postId",     Res_vote         ],
  "followActor":        [Unit,             "targetName", Res_follow       ],
  "unfollowActor":      [Unit,             "targetName", Res_unfollow     ],
  "getFollowingStatus": [Unit,             "targetName", Res_followStatus ],
  "getFeed":            [Req_Feed,         null,         Res_Feed         ],
  "searchActors":       [Req_SearchActors, null,         Res_SearchActors ],
  "searchTags":         [Req_SearchTags,   null,         Res_SearchTags   ],
  "updatePost":         [Req_EditPost,     "postId",     Res_EditPost     ],
  "updateActor":        [Req_EditActor,    "actorName",  Res_EditActor    ],
};

export type EndpointRequest<E extends keyof EndpointIO> = EndpointIO[E][0];
export type EndpointParams<E extends keyof EndpointIO> = EndpointIO[E][1] extends string ? { [K in EndpointIO[E][1]]: string } : Unit;
export type EndpointResponse<E extends keyof EndpointIO> = EndpointIO[E][2];

export type Endpoints = { [E in keyof EndpointIO]: (req: EndpointRequest<E>, params: EndpointParams<E>, user: AuthUser) => Promise<EndpointResponse<E>> };

export const endpointSignatures: { [K in keyof EndpointIO]: [HTTPMethod, `/${string}`] } = {
  "health":             ['GET',    '/health'                             ],
  "login":              ['POST',   '/auth/login'                         ],
  "me":                 ['GET',    '/auth/me'                            ],
  "getActor":           ['GET',    '/actors/:name'                       ],
  // "getActorPosts":      ['GET',    '/actors/:name/posts'                 ],
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