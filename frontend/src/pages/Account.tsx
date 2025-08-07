import { useState } from 'react';
import AccountModal from '../components/AccountCard/AccountModal';
import CreatePostModal from '../components/CreatePost/CreatePostModal';
import FeedContainer from '../components/FeedContainer/FeedContainer';
import { FeedContainerProps, MembershipStatus } from '../models/Feed';

function Account() {
	const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
	const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

	const bannerProps: BannerProps = {
		title: 'Your Feed',
		onSettingsClick: () => setIsAccountModalOpen(true),
		onCreatePost: () => setIsCreatePostModalOpen(true),
	};

	const availablePosts: PostData<'full'>[] = [
		{
			postId: '1',
			actorName: 'anonymous',
			subThumbnailUrl: '/images/profile.jpg',
			title: 'Check out this cool sunset!',
			content: 'Captured this in Cape Town last weekend. Nature goes hard 🔥',
			subName: 'southafrica',
			isFollowingSub: true,
			timestamp: 2,
			attachments: [
				{ url: '/images/sunset1.jpg', mimeType: 'jpg', altText: 'sunset' },
				{ url: '/images/sunset2.jpg', mimeType: 'jpg', altText: 'sunset' },
				{ url: '/images/sunset3.jpg', mimeType: 'jpg', altText: 'sunset' },
			],
			tags: [],
			upvotes: 0,
			downvotes: 0,
			score: 0,
		},
		{
			postId: '2',
			actorName: 'anonymous',
			subThumbnailUrl: '',
			title: 'Just some vibes',
			content: '',
			subName: 'aestheticshots',
			isFollowingSub: true,
			timestamp: 1,
			attachments: [
				{ url: '/images/sunset1.jpg', mimeType: 'jpg', altText: 'image' },
			],
			tags: [],
			upvotes: 0,
			downvotes: 0,
			score: 0,
		},
		{
			postId: '3',
			actorName: 'anonymous',
			subThumbnailUrl: '',
			title: 'Funny thing happened today...',
			content: 'So I’m walking through Menlyn and I hear someone yell “FREE BOEREWORS!” — I ran, no shame.',
			subName: 'pretoria',
			isFollowingSub: false,
			timestamp: 3,
			attachments: [],
			tags: [],
			upvotes: 0,
			downvotes: 0,
			score: 0,
		},
		{
			postId: '4',
			actorName: 'anonymous',
			subThumbnailUrl: '',
			title: 'Minimalist inspo',
			content: '',
			subName: 'design',
			isFollowingSub: true,
			timestamp: 24, // yesterday = 24 hours ago
			attachments: [
				{ url: '/images/sunset1.jpg', mimeType: 'jpg', altText: 'image' },
				{ url: '/images/sunset2.jpg', mimeType: 'jpg', altText: 'image' },
			],
			tags: [],
			upvotes: 0,
			downvotes: 0,
			score: 0,
		},
		{
			postId: '5',
			actorName: 'anonymous',
			subThumbnailUrl: '',
			title: 'Exam week blues',
			content: 'Everything hurts and nothing is real. Engineering students know.',
			subName: 'studentlife',
			isFollowingSub: false,
			timestamp: 5,
			attachments: [],
			tags: [],
			upvotes: 0,
			downvotes: 0,
			score: 0,
		},
	];

	const feedContainerProps: FeedContainerProps = {
		bannerProps,
		availablePosts,
		onLoadPosts: async () => {},
		onRefresh: async () => {},
	};

	return (
		<>
			<FeedContainer {...feedContainerProps} />
			<AccountModal 
				isOpen={isAccountModalOpen} 
				onClose={() => setIsAccountModalOpen(false)}
				actorName={'shiny_symbol_316'}
			/>
			<CreatePostModal isOpen={isCreatePostModalOpen} onClose={() => setIsCreatePostModalOpen(false)} onSubmit={undefined}/>
		</>
	);
}

export default Account;
