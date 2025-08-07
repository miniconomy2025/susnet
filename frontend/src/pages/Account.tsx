import { useState } from 'react';
import AccountModal from '../components/AccountCard/AccountModal';
import CreatePostModal from '../components/CreatePost/CreatePostModal';
import FeedContainer from '../components/FeedContainer/FeedContainer';
import { BannerProps, FeedContainerProps, MembershipStatus } from '../models/Feed';
import { useAuth } from '../hooks/UseAuth';
import { PostData, Req_Feed, Res_Feed } from '../../../types/api';
import { fetchApi } from '../utils/fetchApi';

function Account() {
	const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
	const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

	const limit: number = 10;

	const bannerProps: BannerProps = {
		title: 'Your Feed',
		onSettingsClick: () => setIsAccountModalOpen(true),
		onCreatePost: () => setIsCreatePostModalOpen(true),
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

	return (
		<>
			<FeedContainer {...feedContainerProps} />
			{isAccountModalOpen && (
				<AccountModal 
					isOpen={isAccountModalOpen} 
					onClose={() => setIsAccountModalOpen(false)}
				/>
			)}
			<CreatePostModal isOpen={isCreatePostModalOpen} onClose={() => setIsCreatePostModalOpen(false)} onSubmit={undefined}/>
		</>
	);
}

export default Account;
