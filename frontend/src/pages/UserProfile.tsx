import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import FeedContainer from '../components/FeedContainer/FeedContainer';
import { BannerProps, FeedContainerProps } from '../models/Feed';
import { Req_Feed, Res_Feed, ActorData } from '../../../types/api';
import { fetchApi } from '../utils/fetchApi';
import { useAuth } from '../hooks/UseAuth';

function UserProfile({ refreshSubs }) {
	const { username } = useParams();
	const { currentUser } = useAuth();
	const [userInfo, setUserInfo] = useState<ActorData<'full'> | null>(null);
	const [loading, setLoading] = useState(true);
	const [userExists, setUserExists] = useState(true);

	const limit: number = 10;

	useEffect(() => {
		const loadUserInfo = async () => {
			if (!username) return;
			
			try {
				const res = await fetchApi('getActor', { name: username });
				if (res.success) {
					setUserInfo(res.actor);
					setUserExists(true);
				} else {
					setUserExists(false);
				}
			} catch (error) {
				console.error('Failed to load user info:', error);
				setUserExists(false);
			}
			setLoading(false);
		};

		loadUserInfo();
	}, [username]);

	const bannerProps: BannerProps = {
		displayImage: userInfo?.thumbnailUrl || '/images/profile.jpg',
		title: username!,
		subtitle: userInfo?.origin,
		initialIsFollowing: userInfo?.isFollowing || false,
		onSettingsClick: currentUser?.name === username ? () => {} : undefined,
	};

	async function onLoadPosts(cursor: string): Promise<Res_Feed | undefined> {
		const reqFeed: Req_Feed = {
			limit,
			cursor,
			fromActorName: username,
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
		refreshSubs,
	};

	if (loading) {
		return <div>Loading...</div>;
	}

	if (!userExists) {
		return <div>User does not exist</div>;
	}

	return (
		<FeedContainer key={username} {...feedContainerProps} />
	);
}

export default UserProfile;