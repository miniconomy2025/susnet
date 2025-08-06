import { useEffect, useRef, useState } from 'react';
import FeedCard from '../FeedCard/FeedCard.tsx';
import Banner from '../Banner/Banner.tsx';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner.tsx';
import PullToRefresh from '../PullToRefresh/PullToRefresh.tsx';
import styles from './FeedContainer.module.css';
import { PostData } from "../../../../types/api.ts";
import { fetchApi } from "../../utils/fetchApi.ts";

function FeedContainer({ initialPosts, refreshFeed }: any) {
	const [posts, setPosts] = useState(initialPosts);
	const [loading, setLoading] = useState(false);
	const sentinelRef = useRef(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !loading) {
					loadMorePosts();
				}
			},
			{ root: null, rootMargin: '200px', threshold: 0.1 }
		);

		if (sentinelRef.current) {
			observer.observe(sentinelRef.current);
		}

		return () => observer.disconnect();
	}, [loading]);

	const loadMorePosts = async () => {
		setLoading(true);
		// await new Promise((r) => setTimeout(r, 2000));

		// TODO: Integrate
		const res = await fetchApi("getFeed", { cursor: "" });
		if(res.success) {
			console.log("POSTS:", res.posts);
		}

		const newPosts = posts.slice(0, 2).map((post: PostData) => ({
			...post,
			timestamp: 'Just now',
			isFollowing: Math.random() > 0.5,
		}));

		setPosts((prev: PostData[]) => [...prev, ...newPosts]);
		setLoading(false);
	};

	return (
		<div className={styles.feedContainer}>
			<Banner
				profileImage="/images/profile.jpg"
				title="r/southafrica"
				onCreatePost={() => console.log('Create Post clicked')}
				onJoin={() => console.log('Join clicked')}
				onSettingsClick={() => console.log('Settings clicked')}
			/>

			<PullToRefresh onRefresh={refreshFeed} containerStyling={styles.feedContainer}>
				{posts.map((post: PostData, idx: number) => (
					<div key={idx} className={styles.cardWrap}>
						<FeedCard {...post} />
					</div>
				))}

				<div ref={sentinelRef} style={{ height: '0px' }} />
				{loading && <LoadingSpinner />}
			</PullToRefresh>
		</div>
	);
}

export default FeedContainer;
