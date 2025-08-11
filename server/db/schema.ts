import { prop, index, modelOptions, getModelForClass, type Ref } from '@typegoose/typegoose';
import { Types } from "mongoose";


//---------- Actor (User or Sub) -----------//

const LOCAL_ORIGIN = "https://susnet.co.za";

export enum ActorType { user = "user", sub = "sub" };

@index({ type: 1, name: 1 }, { unique: true })
@index({ uri: 1 }, { unique: false })
@modelOptions({ schemaOptions: { timestamps: true } })
export class Actor {
  @prop({ required: true, unique: true })                         name!:          string;     // Unique amongst users & subs
  @prop({ required: true, enum: ActorType })                      type!:          ActorType;
  @prop({ required: true })                                       thumbnailUrl!:  string;
  @prop({ default: "" })                                          description?:   string;     // Bio in the case of a user
  @prop({ default: LOCAL_ORIGIN })                                origin?:        string;     // Empty string => local

  // See: [https://fedify.dev/tutorial/microblog#table-creation]
  @prop({})                                                       uri?:          string;
  @prop({})                                                       inbox?:        string;      // "http[s]://*"
  @prop({})                                                       sharedInbox?:  string;      // "http[s]://*"
  @prop({})                                                       url?:          string;      // profile page url
  // @prop({ required: true, unique: true })                      handle?:       string;      // Derived: "@<name>@<origin>"

  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export const ActorModel = getModelForClass(Actor);


//---------- Key pair -----------//
@index({ actorRef: 1, keyType: 1 }, { unique: true })
@modelOptions({ schemaOptions: { timestamps: true , strict: "throw"} })
export class Key {
  @prop({ ref: () => Actor, required: true })                     actorRef!:     Ref<Actor>;
  @prop({ required: true, default: "Ed25519" })                   keyType!:      string; // "RSASSA-PKCS1-v1_5" | "Ed25519"
  @prop({ required: true, default: "" })                          publicKey!:    string;
  @prop({ required: true, default: "" })                          privateKey!:   string;

  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export const KeyModel = getModelForClass(Key);


//---------- Auth (OAuth 2.0 credentials) -----------//

@index({ googleId: 1 }, { unique: true })
@index({ email: 1 })
@modelOptions({ schemaOptions: { timestamps: true , strict: "throw"} })
export class Auth {
  @prop({ ref: () => Actor, required: true, unique: true })       actorRef!:     Ref<Actor>;
  @prop({ required: true })                                       googleId!:     string;
  @prop({ required: true })                                       email!:        string;

  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export const AuthModel = getModelForClass(Auth);


//---------- Post -----------//

const ID_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
const generateRandomPostId = (length: number = 10): string =>
  Array.from({ length }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join('');

export class Attachment {
  @prop({ required: true })                                       url!:      string;
  @prop({ required: true })                                       mimeType!: string;
  @prop({ default: "" })                                          altText?:  string;

  _id?: Types.ObjectId;
}

@index({ subRef: 1, createdAt: -1 })
@index({ actorRef: 1, createdAt: -1 })
@index({ tags: 1 })
@index({ uri: 1 }, { unique: true, sparse: true })
@modelOptions({ schemaOptions: { timestamps: true } })
export class Post {
  @prop({ unique: true, default: () => generateRandomPostId() })  postId?:       string;
  @prop({ ref: () => Actor, required: true })                     actorRef!:    Ref<Actor>; // poster
  @prop({ ref: () => Actor, required: true })                     subRef!:      Ref<Actor>; // parent sub
  @prop({ required: true })                                       title!:       string;
  @prop({ required: true })                                       content!:     string;
  @prop({ type: () => [Attachment], default: [] })                attachments?: Attachment[];
  @prop({ type: () => [String], default: [] })                    tags?:        string[];

  // See: [https://fedify.dev/tutorial/microblog#table-creation-3]
  @prop({})                                                       uri?:          string;
  @prop({})                                                       url?:          string;      // profile page url

  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export const PostModel = getModelForClass(Post);


//---------- Vote -----------//

export enum VoteType { up = "up", down = "down" };

@index({ postId: 1, actorRef: 1 }, { unique: true })
@modelOptions({ schemaOptions: { timestamps: { createdAt: true, updatedAt: false } } })
export class Vote {
  @prop({ ref: () => Post, required: true })                      postId!:      Ref<Post>;
  @prop({ ref: () => Actor, required: true })                     actorRef!:    Ref<Actor>;
  @prop({ required: true, enum: VoteType })                       vote!:        VoteType;

  _id?: Types.ObjectId;
  createdAt?: Date;
}

export const VoteModel = getModelForClass(Vote);


//---------- Follow (user -> sub || user -> user) -----------//

export enum FollowRole { pleb = "pleb", mod = "mod" };

@index({ followerRef: 1, targetRef: 1 }, { unique: true })
@index({ targetRef: 1 })
@modelOptions({ schemaOptions: { timestamps: { createdAt: true, updatedAt: false } } })
export class Follow {
  @prop({ ref: () => Actor, required: true })                     followerRef!: Ref<Actor>;
  @prop({ ref: () => Actor, required: true })                     targetRef!:   Ref<Actor>;
  @prop({ required: true, enum: FollowRole })                     role!:        FollowRole;

  _id?: Types.ObjectId;
  createdAt?: Date;
}

export const FollowModel = getModelForClass(Follow);
