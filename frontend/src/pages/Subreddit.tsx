import { useParams } from 'react-router-dom';
import FeedContainer from '../components/FeedContainer/FeedContainer';
import { BannerProps, FeedContainerProps, MembershipStatus } from '../models/Feed';
import { Req_Feed, Res_Feed } from '../../../types/api';
import { fetchApi } from '../utils/fetchApi';

function Subreddit() {
	const { id } = useParams();

	const limit: number = 10;
	const fromActorName = ""; // TODO: get actor name or id?

	const bannerProps: BannerProps = {
		displayImage: '/images/profile.jpg',
		title: id!,
		membershipStatus: MembershipStatus.JOINED,
		onCreatePost: async () => {},
		onSetMembershipClick: async (membershipStatus) => {},
		onSettingsClick: async () => {},
	};

	async function onLoadPosts(cursor: string): Promise<Res_Feed | undefined> {
		const reqFeed: Req_Feed = {
			limit,
			cursor,
			fromActorName,
		}

		try { return await fetchApi('getFeed', {}, reqFeed); } catch {}
	};


	const feedContainerProps: FeedContainerProps = {
		bannerProps,
		onLoadPosts,
		onRefresh: async () => {},
	};

	return <FeedContainer {...feedContainerProps} />;
}

export default Subreddit;
