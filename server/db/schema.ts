import { prop, index, modelOptions, getModelForClass, type Ref } from '@typegoose/typegoose';
import { Types } from "mongoose";


//---------- Actor (User or Sub) -----------//

const LOCAL_ORIGIN = "https://susnet.co.za";

export enum ActorType { user, sub };

@index({ type: 1, name: 1 }, { unique: true })
@modelOptions({ schemaOptions: { timestamps: true } })
export class Actor {
  @prop({ required: true, unique: true })                   actorId!:       string;     // ActivityPub actor ID
  @prop({ required: true, enum: ActorType })                type!:          ActorType;
  @prop({ required: true })                                 name!:          string;
  @prop({ required: true })                                 thumbnailUrl!:  string;
  @prop({ default: "" })                                    description?:   string;
  @prop({ default: LOCAL_ORIGIN })                          origin?:        string;     // Empty string => local

  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export const ActorModel = getModelForClass(Actor);


//---------- Auth (OAuth 2.0 credentials) -----------//

@index({ googleId: 1 }, { unique: true })
@index({ email: 1 })
@modelOptions({ schemaOptions: { timestamps: true } })
export class Auth {
  @prop({ ref: () => Actor, required: true, unique: true }) actorRef!:     Ref<Actor>;
  @prop({ required: true })                                 googleId!:     string;
  @prop({ required: true })                                 accessToken!:  string;
  @prop({ default: "" })                                    refreshToken?: string;
  @prop({ required: true })                                 email!:        string;

  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export const AuthModel = getModelForClass(Auth);


//---------- Post -----------//

export class Attachment {
  @prop({ required: true })                                 url!:      string;
  @prop({ required: true })                                 mimeType!: string;
  @prop({ default: "" })                                    altText?:  string;

  _id?: Types.ObjectId;
}

@index({ subRef: 1, createdAt: -1 })
@index({ actorRef: 1, createdAt: -1 })
@index({ tags: 1 })
@modelOptions({ schemaOptions: { timestamps: true } })
export class Post {
  @prop({ ref: () => Actor, required: true })               actorRef!:    Ref<Actor>; // poster
  @prop({ ref: () => Actor, required: true })               subRef!:      Ref<Actor>; // parent sub
  @prop({ required: true })                                 title!:       string;
  @prop({ required: true })                                 content!:     string;
  @prop({ type: () => [Attachment], default: [] })          attachments?: Attachment[];
  @prop({ type: () => [String], default: [] })              tags?:        string[];

  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export const PostModel = getModelForClass(Post);


//---------- Vote -----------//

export enum VoteType { up, down };

@index({ postId: 1, actorRef: 1 }, { unique: true })
@modelOptions({ schemaOptions: { timestamps: { createdAt: true, updatedAt: false } } })
export class Vote {
  @prop({ ref: () => Post, required: true })                postId!:      Ref<Post>;
  @prop({ ref: () => Actor, required: true })               actorRef!:    Ref<Actor>;
  @prop({ required: true, enum: VoteType })                 vote!:        VoteType;

  _id?: Types.ObjectId;
  createdAt?: Date;
}

export const VoteModel = getModelForClass(Vote);


//---------- Follow (user -> sub || user -> user) -----------//

@index({ followerRef: 1, targetRef: 1 }, { unique: true })
@index({ targetRef: 1 })
@modelOptions({ schemaOptions: { timestamps: { createdAt: true, updatedAt: false } } })
export class Follow {
  @prop({ ref: () => Actor, required: true })               followerRef!: Ref<Actor>;
  @prop({ ref: () => Actor, required: true })               targetRef!:   Ref<Actor>;

  _id?: Types.ObjectId;
  createdAt?: Date;
}

export const FollowModel = getModelForClass(Follow);