import { PostData, Req_Feed, Res_Feed } from '../../../types/api.ts';
import FeedContainer from '../components/FeedContainer/FeedContainer.tsx';
import { BannerProps, FeedContainerProps } from '../models/Feed.ts';
import { fetchApi } from '../utils/fetchApi.ts';

function Home() {
	const limit: number = 10;

	const bannerProps: BannerProps = {
		title: 'Homepage',
	};

	async function onLoadPosts(cursor: string): Promise<Res_Feed | undefined> {
		const reqFeed: Req_Feed = {
			limit,
			cursor,
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

export default Home;
