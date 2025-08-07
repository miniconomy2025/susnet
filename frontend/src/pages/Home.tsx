import { PostData, Req_Feed, Res_Feed } from '../../../types/api.ts';
import FeedContainer from '../components/FeedContainer/FeedContainer.tsx';
import { BannerProps, FeedContainerProps } from '../models/Feed.ts';
import { fetchApi } from '../utils/fetchApi.ts';

function Home() {
	const limit: number = 10;

	const bannerProps: BannerProps = {
		title: 'Homepage',
	};

	const availablePosts: PostData<'full'>[] = [
	{
		postId: '1',
		actorName: 'anonymous',
		subThumbnailUrl: '/images/profile.jpg',
		title: 'Check out this cool sunset!',
		content: 'Captured this in Cape Town last weekend. Nature goes hard 🔥',
		subName: 'r/southafrica',
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
		subName: 'r/aestheticshots',
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
		subName: 'r/pretoria',
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
		subName: 'r/design',
		isFollowingSub: true,
		timestamp: 24, 
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
		subName: 'r/studentlife',
		isFollowingSub: false,
		timestamp: 5,
		attachments: [],
		tags: [],
		upvotes: 0,
		downvotes: 0,
		score: 0,
	},
];

	async function onLoadPosts(cursor: string): Promise<Res_Feed | undefined> {
		const reqFeed: Req_Feed = {
			limit,
			cursor,
		}

		try { return await fetchApi('getFeed', {}, reqFeed); } catch {}
	};

	const feedContainerProps: FeedContainerProps = {
		bannerProps,
		availablePosts,
		onLoadPosts,
		onRefresh: async () => {},
	};

	return <FeedContainer {...feedContainerProps} />;
}

export default Home;
