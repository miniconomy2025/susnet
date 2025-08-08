import { useState, useCallback } from 'react';
import { Req_Feed, Res_Feed } from '../../../types/api.ts';
import FeedContainer from '../components/FeedContainer/FeedContainer.tsx';
import { BannerProps, FeedContainerProps } from '../models/Feed.ts';
import { fetchApi } from '../utils/fetchApi.ts';
import CreateSubModal from '../components/CreateSub/CreateSubModal.tsx';

function Home({ refreshSubs }) {
  const limit = 10;
  const [isCreateSubModalOpen, setIsCreateSubModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"top" | "hot" | "new">('top');
  const [reloadKey, setReloadKey] = useState(0); // Used to trigger FeedContainer reload

  // Always sees latest sortBy
  const onLoadPosts = useCallback(async (cursor: string): Promise<Res_Feed | undefined> => {
    const reqFeed: Req_Feed = {
      limit,
      cursor,
      sort: sortBy,
    };
    try {
      return await fetchApi('getFeed', {}, reqFeed);
    } catch {}
  }, [sortBy]);

  const onChangeSort = (sortOption) => {
    setSortBy(sortOption);
    setReloadKey((prev) => prev + 1); // Force FeedContainer remount
  };

  const bannerProps: BannerProps = {
    title: 'Homepage',
    sortOptions: ['hot', 'new', 'top'],
    selectedSort: sortBy,
    onCreateSub: () => setIsCreateSubModalOpen(true),
    onChangeSort,
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
      <FeedContainer key={reloadKey} {...feedContainerProps} />
      <CreateSubModal
        isOpen={isCreateSubModalOpen}
        onClose={() => setIsCreateSubModalOpen(false)}
        onSubCreated={refreshSubs}
      />
    </>
  );
}

export default Home;
