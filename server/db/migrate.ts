// Utilities for generation of dummy data

import mongoose from "mongoose";
import { ActorModel, PostModel, VoteModel, FollowModel, Actor, ActorType, Follow, VoteType, FollowRole } from './schema.ts';
import type { Ref } from '@typegoose/typegoose';

//---------- Setup ----------//
const HOST = 'https://susnet.co.za';
const ADJECTIVES = [
  'cool', 'weird', 'awesome', 'happy', 'noisy', 'silent', 'brave', 'curious', 'eager', 'fuzzy', 'gloomy', 'shiny', 'breezy', 'dusty', 'quirky', 'vibrant',
  'zany', 'mysterious', 'odd', 'jolly', 'grumpy', 'cheerful', 'fierce', 'chill', 'nervous', 'bright', 'dim', 'gentle', 'bold', 'funky', 'strange',
  'cranky', 'fluffy', 'crisp', 'messy', 'sharp', 'sleek', 'tidy', 'clumsy', 'crafty', 'friendly', 'greedy', 'witty', 'spooky', 'moody', 'jazzy',
  'tough', 'whiny', 'zesty', 'sleepy', 'lively'
];

const NOUNS = [
  'tiger', 'banana', 'cloud', 'code', 'tree', 'circuit', 'robot', 'panda', 'ocean', 'mountain', 'planet', 'moon', 'star', 'galaxy', 'book', 'keyboard',
  'monitor', 'rocket', 'penguin', 'donut', 'coffee', 'camera', 'carrot', 'cookie', 'cloud', 'guitar', 'flame', 'dragon', 'glitch', 'storm', 'castle',
  'forest', 'river', 'valley', 'island', 'phoenix', 'button', 'sensor', 'light', 'socket', 'comet', 'helmet', 'portal', 'ghost', 'switch', 'matrix',
  'beacon', 'symbol', 'microbe', 'laser', 'nugget'
];

const TITLES = [
  'Check this out', 'What do you think?', 'Daily update', 'Funny meme', 'Important news', 'Thoughts?', 'Quick question', 'Just a note', 'Random thought', 'Can’t believe this!',
  'This made my day', 'News flash', 'Update time', 'Whoa!', 'Hilarious post', 'Any ideas?', 'Big reveal', 'Sneak peek', 'What’s happening?', 'This or that?',
  'Guess what?', 'Little surprise', 'Epic moment', 'Big change ahead', 'Behind the scenes', 'Fun fact', 'Let’s chat', 'You won’t believe this', 'Throwback', 'Flashback moment',
  'Late night thought', 'Top 10', 'Let’s vote', 'So relatable', 'Mini rant', 'Poll time', 'Today I learned', 'Unexpected find', 'Major upgrade', 'PSA',
  'Here’s the deal', 'Mini challenge', 'Share your thoughts', 'This cracked me up', 'Don’t miss this', 'What just happened?', 'Let’s debate', 'I need advice', 'Question of the day',
  'Big news'
];

const TAGS = [
  'tech', 'fun', 'daily', 'mongodb', 'typescript', 'javascript', 'coding', 'nodejs', 'webdev', 'frontend', 'backend', 'cloud', 'startup', 'devlife', 'opensource', 'react',
  'angular', 'vue', 'svelte', 'ai', 'ml', 'design', 'ux', 'api', 'serverless', 'linux', 'windows', 'macos', 'docker', 'kubernetes', 'graphql', 'html', 'css',
  'tailwind', 'nextjs', 'nuxt', 'remix', 'vite', 'testing', 'ci', 'devops', 'security', 'performance', 'productivity', 'automation', 'firebase', 'netlify',
  'vercel', 'deno', 'bun', 'express'
];
const CONTENT = "This is a test post generated for seeding."


//---------- Utils ----------//
const randItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const title = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);


//---------- Generation ----------//
const generateName = (type: ActorType): string => {
  switch(type) {
    case ActorType.user: return `${randItem(ADJECTIVES)}_${randItem(NOUNS)}_${Math.floor(Math.random() * 1000)}`;
    case ActorType.sub:  return `${randItem(ADJECTIVES)}${randItem(NOUNS)}`;
  }
};

const generateActor = (type: ActorType, existing: Set<string>): Actor => {
  let name;
  while (existing.has(name = generateName(type)));
  existing.add(name);

  return {
    name, type,
    thumbnailUrl: `https://placehold.co/100x100?font=roboto&text=${encodeURIComponent(name)}`,
    description: `${title(type.toString())} ${type === ActorType.user ? "bio" : "description"} for ${name}`
  };
};

const generatePost = (actorRef: Ref<Actor>, subRef: Ref<Actor>) => {
  return {
    actorRef,
    subRef,
    title: randItem(TITLES),
    content: CONTENT,
    tags: Array.from({ length: Math.floor(Math.random() * 5) }, () => randItem(TAGS)),
    attachments: Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) =>
      ({ url: `https://placehold.co/300x200?text=placeholder+${i+1}`, mimeType: 'image/png', altText: `Placeholder image ${i+1}` })
    ),
  };
};

export const migrateDb = async (
  numUsers: number = 256,
  numSubs: number = 64,
  numPosts: number = 1024,
  followRatio: number = 0.1,
  modCount: number = 3,
  subRatio: number = 0.1,
  voteRatio: number = 0.1
) => {
  console.log('🌱 Populating DB...');

  //--- Clean slate ---//
  await Promise.all([
    ActorModel.deleteMany({}),
    PostModel.deleteMany({}),
    VoteModel.deleteMany({}),
    FollowModel.deleteMany({})
  ]);

  //--- Create dummy users and subs ---//
  console.log('🤖 - Creating users & subs');
  const names = new Set<string>();
  const users = Array.from({ length: numUsers }, () => generateActor(ActorType.user, names));
  const subs = Array.from({ length: numSubs }, () => generateActor(ActorType.sub, names));

  const userDocs = await ActorModel.insertMany(users);
  const subDocs = await ActorModel.insertMany(subs);

  //--- Create posts ---//
  console.log('📝 - Creating posts');
  const posts = [];

  for (let i = 0; i < numPosts; i++) {
    const user = randItem(userDocs);
    const sub = randItem(subDocs);
    posts.push(generatePost(user._id, sub._id));
  }

  const postDocs = await PostModel.insertMany(posts);

  //--- Create follows (users -> users && users -> subs) ---//
  console.log('👥 - Creating follows');
  const follows: Follow[] = [];
  const followSet = new Set<string>();

  // user -> user
  for (const follower of userDocs) {
    for (const followee of userDocs) {
      if (!follower._id.equals(followee._id) && Math.random() < followRatio) {
        const key = `${follower._id}_${followee._id}`;

        if (!followSet.has(key)) {
          followSet.add(key);
          follows.push({ followerRef: follower._id, targetRef: followee._id, role: FollowRole.pleb });
        }
      }
    }

    // user -> sub
    let numMods = 0;
    for (const sub of subDocs) {
      if (Math.random() < subRatio) {
        const key = `${follower._id}_${sub._id}`;
        if (!followSet.has(key)) {
          followSet.add(key);
          const role = ++numMods < modCount ? FollowRole.mod : FollowRole.pleb;
          follows.push({ followerRef: follower._id, targetRef: sub._id, role });
        }
      }
    }
  }

  await FollowModel.insertMany(follows);

  //--- Create votes ---//
  console.log('👍 - Creating votes');
  const votes = [];
  const voteSet = new Set<string>();

  for (const post of postDocs) {
    const favorability = Math.random();

    for (const user of userDocs) {
      if (Math.random() < voteRatio) {
        const key = `${user._id}_${post._id}`;
        if (!voteSet.has(key)) {
          voteSet.add(key);
          votes.push({
            postId: post._id,
            actorRef: user._id,
            vote: Math.random() < favorability ? VoteType.up : VoteType.down
          });
        }
      }
    }
  }

  await VoteModel.insertMany(votes);

  console.log('✅ Done populating.');
};