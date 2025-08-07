import { useParams } from 'react-router-dom';
import FeedContainer from '../components/FeedContainer/FeedContainer';
import { BannerProps, FeedContainerProps, MembershipStatus } from '../models/Feed';

function Subreddit() {
	const { id } = useParams();
	const bannerProps: BannerProps = {
		displayImage: '/images/profile.jpg',
		title: id!,
		membershipStatus: MembershipStatus.JOINED,
		onCreatePost: async () => {},
		onSetMembershipClick: async (membershipStatus) => {},
		onSettingsClick: async () => {},
	};

	const feedContainerProps: FeedContainerProps = {
		bannerProps,
		availablePosts: [],
		onLoadPosts: async () => {},
		onRefresh: async () => {},
	};

	return <FeedContainer {...feedContainerProps} />;
}

export default Subreddit;
