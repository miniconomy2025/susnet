import { useEffect, useRef, useState } from 'react';
import FeedCard from '../FeedCard/FeedCard';
import Banner from '../Banner/Banner';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import PullToRefresh from '../PullToRefresh/PullToRefresh';
import styles from './FeedContainer.module.css';

function FeedContainer({ initialPosts, refreshFeed }) {
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
		await new Promise((r) => setTimeout(r, 2000));

		const newPosts = posts.slice(0, 2).map((post) => ({
			...post,
			timestamp: 'Just now',
			isFollowing: Math.random() > 0.5,
		}));

		setPosts((prev) => [...prev, ...newPosts]);
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
				{posts.map((post, idx) => (
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
