import { useEffect, useRef, useState } from 'react';
import FeedCard from '../FeedCard/FeedCard.tsx';
import Banner from '../Banner/Banner.tsx';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner.tsx';
import styles from './FeedContainer.module.css';
import { FeedContainerProps } from '../../models/Feed.ts';
import { PostData, Res_Feed } from '../../../../types/api.ts';

function FeedContainer({
	bannerProps,
	availablePosts = [],
	onLoadPosts,
	onRefresh,
}: FeedContainerProps) {
	const [posts, setPosts] = useState(availablePosts);
	const [loading, setLoading] = useState(false);
	const [cursor, setCursor] = useState('');
	const sentinelRef = useRef(null);
	const triggerLoadThreshload = 2000; 

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !loading) {
					loadMorePosts();
				}
			},
			{ root: null, rootMargin: `${triggerLoadThreshload}px`, threshold: 0.1 }
		);

		if (sentinelRef.current) {
			observer.observe(sentinelRef.current);
		}

		return () => observer.disconnect();
	}, [loading]);

	const loadMorePosts = async () => {
		console.log('fetching')
		setLoading(true);

		let newPosts: PostData<'full'>[];
		const res: Res_Feed | undefined = await onLoadPosts(cursor);
		
		if (res?.success) {
			if (res.nextCursor) setCursor(() => res.nextCursor);
			newPosts = res.posts; 
			setPosts((prev) => [...prev, ...newPosts]);
			setLoading(false);
		} else {
			console.log('Failed to fetch feed: ', res ? res.error : 'failed to connect to server');
		}
	};

	return (
		<div className={styles.feedContainer}>
			<Banner {...bannerProps} />

			{posts.map((post, idx) => (
				<div key={idx} className={styles.cardWrap}>
					<FeedCard {...post} />
				</div>
			))}

			<div ref={sentinelRef} style={{
				height: `${triggerLoadThreshload}px`,
				marginTop: `-${triggerLoadThreshload}px`,
				pointerEvents: 'none',
			}} />
			{loading && <LoadingSpinner />}
		</div>
	);
}

export default FeedContainer;
