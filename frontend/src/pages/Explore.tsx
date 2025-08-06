import React, { useState } from 'react'
import CreatePostModal from '../components/CreatePost/CreatePostModal'
import FeedContainer from '../components/FeedContainer/FeedContainer';
import { MembershipStatus } from '../models/Feed';

function Explore() {
	const bannerProps: BannerProps = {
		title: 'Explore',
	};

	const availablePosts: Post[] = [
		{
			profileImage: '/images/profile.jpg',
			title: 'Check out this cool sunset!',
			textBody: 'Captured this in Cape Town last weekend. Nature goes hard 🔥',
			subreddit: 'southafrica',
			membershipStatus: MembershipStatus.JOINED,
			timestamp: 'Posted 2 hours ago',
			attachments: ['/images/sunset1.jpg', '/images/sunset2.jpg', '/images/sunset3.jpg'],
		},
		{
			title: 'Just some vibes',
			subreddit: 'aestheticshots',
			membershipStatus: MembershipStatus.JOINED,
			timestamp: 'Posted 1 hour ago',
			attachments: ['/images/sunset1.jpg'],
		},
		{
			title: 'Funny thing happened today...',
			textBody:
				'So I’m walking through Menlyn and I hear someone yell “FREE BOEREWORS!” — I ran, no shame.',
			subreddit: 'pretoria',
			membershipStatus: MembershipStatus.NOT_JOINED,
			timestamp: 'Posted 3 hours ago',
		},
		{
			title: 'Minimalist inspo',
			subreddit: 'design',
			membershipStatus: MembershipStatus.JOINED,
			timestamp: 'Posted yesterday',
			attachments: ['/images/sunset1.jpg', '/images/sunset2.jpg'],
		},
		{
			title: 'Exam week blues',
			textBody: 'Everything hurts and nothing is real. Engineering students know.',
			subreddit: 'studentlife',
			membershipStatus: MembershipStatus.NOT_JOINED,
			timestamp: 'Posted 5 hours ago',
		},
	];

	const feedContainerProps: FeedContainerProps = {
		bannerProps,
		availablePosts,
		onLoadPosts: async () => {},
		onRefresh: async () => {},
	};

	return <FeedContainer {...feedContainerProps} />;
}

export default Explore