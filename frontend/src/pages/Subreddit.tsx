import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import FeedContainer from '../components/FeedContainer/FeedContainer.tsx';
import { BannerProps, FeedContainerProps } from "../models/Feed.ts";
import { Req_Feed, Res_Feed, ActorData } from '../../../types/api.ts';
import { fetchApi } from "../utils/fetchApi.ts";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner.tsx";
import CreatePostModal from "../components/CreatePost/CreatePostModal.tsx";
import AccountModal from "../components/AccountCard/AccountModal.tsx";
import { useAuth } from "../hooks/UseAuth.ts";
import { useCreatePost } from "../hooks/UseCreatePost.ts";
import { sortBy } from "effect/Array";

function Subreddit({ refreshSubs }) {
	const { id } = useParams();
	const { currentUser } = useAuth();
	const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
	const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);
	const [subInfo, setSubInfo] = useState<ActorData<'full'> | null>(null);
	const [isModerator, setIsModerator] = useState(false);
	const { createPost } = useCreatePost();

	const limit: number = 10;

	useEffect(() => {
		const loadSubInfo = async () => {
			if (!id || !currentUser) return;
			
			try {
				const [actorRes, followingRes] = await Promise.all([
					fetchApi('getActor', { name: id }),
					fetchApi('getActorFollowing', { name: currentUser.name })
				]);
				
				if (actorRes.success) {
					setSubInfo(actorRes.actor);
				}
				
				if (followingRes.success) {
					const modRelation = followingRes.following.find(f => f.name === id && f.role === 'mod');
					setIsModerator(!!modRelation);
				}
			} catch (error) {
				console.error('Failed to load sub info:', error);
			}
		};

		loadSubInfo();
	}, [id, currentUser]);

	const handleCreatePost = async ({ title, textBody, attachments }) => {
		if (!id || !currentUser) {
			console.log('Missing id or user:', { id, currentUser });
			return;
		}
		
		const tags = textBody.split(/\s+/).filter(word => word.startsWith('#')).map(tag => tag.slice(1));
		
		const postData = {
			subName: id,
			title,
			content: textBody,
			attachments: attachments.map(url => ({ url, mimeType: 'image/jpeg' })),
			tags
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
		displayImage: subInfo?.thumbnailUrl || '/images/profile.jpg',
		title: id!,
		initialIsFollowing: isModerator ? undefined : (subInfo?.isFollowing || false),
		onCreatePost: () => setIsCreatePostModalOpen(true),
		onSettingsClick: isModerator ? () => setIsAccountModalOpen(true) : undefined,
		isModerator,
	};

	async function onLoadPosts(cursor: string): Promise<Res_Feed | undefined> {
		const reqFeed: Req_Feed = {
			limit,
			cursor,
			fromActorName: id,
			sort: "new"
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

	return (
		<>	
			<FeedContainer key={`${id}-${refreshKey}`} {...feedContainerProps} />
			<CreatePostModal
				isOpen={isCreatePostModalOpen} 
				onClose={() => setIsCreatePostModalOpen(false)} 
				onSubmit={handleCreatePost}
			/>
			{isAccountModalOpen && (
				<AccountModal 
					isOpen={isAccountModalOpen} 
					onClose={() => setIsAccountModalOpen(false)}
					actorName={id}
				/>
			)}
		</>
	);
}

export default Subreddit;