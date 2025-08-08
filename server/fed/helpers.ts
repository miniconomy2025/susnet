import { Context } from "@fedify/fedify";
import { ActorModel, PostModel, VoteModel, VoteType, ExternalPostModel } from "../db/schema.ts";

// Helper functions for ActivityPub operations

export async function sendFollowActivity(ctx: Context, followerName: string, targetUri: string) {
    const follower = await ActorModel.findOne({ name: followerName });
    if (!follower) throw new Error("Follower not found");
    
    const follow = new Follow({
        actor: ctx.getActorUri(followerName),
        object: new URL(targetUri),
    });
    
    // Send to target's inbox
    await ctx.sendActivity({ identifier: followerName }, targetUri, follow);
}

export async function sendUnfollowActivity(ctx: Context, followerName: string, targetUri: string) {
    const follower = await ActorModel.findOne({ name: followerName });
    if (!follower) throw new Error("Follower not found");
    
    const originalFollow = new Follow({
        actor: ctx.getActorUri(followerName),
        object: new URL(targetUri),
    });
    
    const undo = new Undo({
        actor: ctx.getActorUri(followerName),
        object: originalFollow,
    });
    
    await ctx.sendActivity({ identifier: followerName }, targetUri, undo);
}

export async function sendLikeActivity(ctx: Context, likerName: string, postUri: string) {
    const like = new Like({
        actor: ctx.getActorUri(likerName),
        object: new URL(postUri),
    });
    
    await ctx.sendActivity({ identifier: likerName }, postUri, like);
}

export async function sendUnlikeActivity(ctx: Context, likerName: string, postUri: string) {
    const originalLike = new Like({
        actor: ctx.getActorUri(likerName),
        object: new URL(postUri),
    });
    
    const undo = new Undo({
        actor: ctx.getActorUri(likerName),
        object: originalLike,
    });
    
    await ctx.sendActivity({ identifier: likerName }, postUri, undo);
}

export async function sendCreatePostActivity(ctx: Context, authorName: string, postId: string) {
    const post = await PostModel.findOne({ postId }).populate('actorRef');
    if (!post) throw new Error("Post not found");
    
    const note = new Note({
        id: ctx.getObjectUri(Note, { identifier: authorName, postId }),
        attribution: ctx.getActorUri(authorName),
        to: PUBLIC_COLLECTION,
        content: post.content,
        name: post.title,
        published: post.createdAt,
    });
    
    const create = new Create({
        actor: ctx.getActorUri(authorName),
        object: note,
        to: PUBLIC_COLLECTION,
    });
    
    // Send to followers
    const followers = await ctx.getFollowers(authorName);
    for await (const follower of followers) {
        await ctx.sendActivity({ identifier: authorName }, follower, create);
    }
}