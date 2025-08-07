import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import FeedContainer from '../components/FeedContainer/FeedContainer';
import { BannerProps, FeedContainerProps } from '../models/Feed';
import { Req_Feed, Res_Feed } from '../../../types/api';
import { fetchApi } from '../utils/fetchApi';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import CreatePostModal from '../components/CreatePost/CreatePostModal';
import { useAuth } from '../hooks/UseAuth';
import { useCreatePost } from '../hooks/UseCreatePost';

function Subreddit() {
	const { id } = useParams();
	const { currentUser } = useAuth();
	const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);
	const { createPost } = useCreatePost();

	const limit: number = 10;

	const handleCreatePost = async ({ title, textBody, attachments }) => {
		if (!id || !currentUser) {
			console.log('Missing id or user:', { id, currentUser });
			return;
		}
		
		const postData = {
			subName: id,
			title,
			content: textBody,
			attachments: attachments.map(url => ({ url, mimeType: 'image/jpeg' })),
			tags: []
		};

		const result = await createPost(postData);
		if (result.success) {
			setIsCreatePostModalOpen(false);
			setRefreshKey(prev => prev + 1); 
		} else {
			console.error('Post creation failed:', result);
		}
	};

	const bannerProps: BannerProps = {
		displayImage: '/images/profile.jpg',
		title: id!,
		initialIsFollowing: false,
		onCreatePost: () => setIsCreatePostModalOpen(true),
		onSettingsClick: () => {},
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

	return (
		<>	
			<FeedContainer key={refreshKey} {...feedContainerProps} />
			<CreatePostModal
				isOpen={isCreatePostModalOpen} 
				onClose={() => setIsCreatePostModalOpen(false)} 
				onSubmit={handleCreatePost}
			/>
		</>
	);
}

export default Subreddit;