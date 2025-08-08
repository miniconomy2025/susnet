import { useState } from 'react';
import { Req_Feed, Res_Feed } from '../../../types/api.ts';
import FeedContainer from '../components/FeedContainer/FeedContainer.tsx';
import { BannerProps, FeedContainerProps } from '../models/Feed.ts';
import { fetchApi } from '../utils/fetchApi.ts';
import CreateSubModal from '../components/CreateSub/CreateSubModal.tsx';

function Home({ refreshSubs }) {
  const limit: number = 10;
  const [isCreateSubModalOpen, setIsCreateSubModalOpen] = useState(false);

  const bannerProps: BannerProps = {
    title: 'Homepage',
    onCreateSub: () => setIsCreateSubModalOpen(true),
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
		showCardFollowButton: true,
		onRefresh: async () => {},
		refreshSubs,
	};

  return (
    <>
      <FeedContainer {...feedContainerProps} />
      <CreateSubModal 
        isOpen={isCreateSubModalOpen} 
        onClose={() => setIsCreateSubModalOpen(false)}
        onSubCreated={refreshSubs}
      />
    </>
  );
}

export default Home;
