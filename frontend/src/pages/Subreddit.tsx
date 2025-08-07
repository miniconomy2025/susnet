import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import FeedContainer from '../components/FeedContainer/FeedContainer';
import { BannerProps, FeedContainerProps } from '../models/Feed';
import { Req_Feed, Res_Feed } from '../../../types/api';
import { fetchApi } from '../utils/fetchApi';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';

function Subreddit() {
	const { id } = useParams();
	const limit: number = 10;

	const [initialIsFollowing, setInitialIsFollowing] = useState<boolean | null>(null);

	useEffect(() => {
		const fetchFollowingStatus = async () => {
			const res = await fetchApi('getFollowingStatus', { targetName: id! });
			if (res?.success) {
				setInitialIsFollowing(res.following);
			}
		};
		fetchFollowingStatus();
	}, [id]);

	if (!id || initialIsFollowing === null) {
		return <LoadingSpinner />;
	}

	const bannerProps: BannerProps = {
		displayImage: '/images/profile.jpg',
		title: id,
		initialIsFollowing,
		onCreatePost: async () => {},
		onSettingsClick: async () => {},
	};

	async function onLoadPosts(cursor: string): Promise<Res_Feed | undefined> {
		const reqFeed: Req_Feed = {
			limit,
			cursor,
			fromActorName: id,
		};

		try {
			return await fetchApi('getFeed', {}, reqFeed);
		} catch {}
	}

	const feedContainerProps: FeedContainerProps = {
		bannerProps,
		onLoadPosts,
		showCardFollowButton: false,
		onRefresh: async () => {},
	};

	return <FeedContainer {...feedContainerProps} />;
}

export default Subreddit;