import { PostData } from '../../../types/api.ts';
import FeedContainer from '../components/FeedContainer/FeedContainer.tsx';
import { BannerProps, FeedContainerProps } from '../models/Feed.ts';
import { fetchApi } from '../utils/fetchApi.ts';

function Home() {
	const bannerProps: BannerProps = {
		title: 'homepage',
	};

	const availablePosts: PostData<'full'>[] = [
		{
			postId: '1',
			actorName: 'greg',
			subThumbnailUrl: '/images/profile.jpg',
			title: 'Check out this cool sunset!',
			content: 'Captured this in Cape Town last weekend. Nature goes hard 🔥',
			subName: 'southafrica',
			isFollowingSub: true,
			timestamp: 5,
			attachments: [
				{ url: '/images/sunset1.jpg', mimeType: 'jpg', altText: 'sunset' },
				{ url: '/images/sunset2.jpg', mimeType: 'jpg', altText: 'sunset' },
				{ url: '/images/sunset3.jpg', mimeType: 'jpg', altText: 'sunset' },
			],
			tags: ['cool'],
			upvotes: 5,
			downvotes: 5,
			score: 4
		},
	];

	const onLoadPosts = async () => {
		return await fetchApi('getFeed', {}); // TODO: DINO DINO!
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
