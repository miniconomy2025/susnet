import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ImageCarousel from '../ImageCarousel/ImageCarousel.tsx';
import styles from './FeedCard.module.css';

function getTimeAgo(epochMs: number): string {
	const now = Date.now();
	const diffInSeconds = Math.floor((now - epochMs) / 1000);

	if (diffInSeconds < 0) return 'Posted just now';
	if (diffInSeconds < 60) return `Posted ${diffInSeconds}s ago`;
	if (diffInSeconds < 3600) return `Posted ${Math.floor(diffInSeconds / 60)}m ago`;
	if (diffInSeconds < 86400) return `Posted ${Math.floor(diffInSeconds / 3600)}h ago`;
	if (diffInSeconds < 604800) return `Posted ${Math.floor(diffInSeconds / 86400)}d ago`;
	if (diffInSeconds < 2419200) return `Posted ${Math.floor(diffInSeconds / 604800)}w ago`; // ~4 weeks

	const months = Math.floor(diffInSeconds / 2592000); // 30 days
	if (months < 12) return `Posted ${months}mo ago`;

	const years = Math.floor(diffInSeconds / 31536000); // 365 days
	if (years < 10) return `Posted ${years}y ago`;

	const decades = Math.floor(years / 10);
	return `Posted ${decades} decade${decades === 1 ? '' : 's'} ago`;
}


function FeedCard({
	postId,
	actorName,
	subName,
	subThumbnailUrl,
	title,
	content,
	attachments,
	tags,
	upvotes,
	downvotes,
	score,
	isFollowingSub,
	timestamp,
}) {
	const navigate = useNavigate();
	const [isFollowing, setIsFollowing] = useState(isFollowingSub);

	const onSubredditClick = () => {
		navigate(`/subreddit/${encodeURIComponent(subName)}`);
	};

	const onFollowToggle = () => {
		setIsFollowing(() => !isFollowing);
	};

	return (
		<div className={`${styles.cardContainer}`}>
			<div className={styles.headerGrid}>
				{subThumbnailUrl && (
					<img className={styles.profileImage} src={subThumbnailUrl} alt="" />
				)}
				<span className={styles.subreddit} onClick={onSubredditClick}>
					r/{subName}
				</span>
				{isFollowing ? (
					<button onClick={onFollowToggle} className={`${styles.button}`}>Following</button>
				) : (
					<button
						onClick={onFollowToggle}
						className={`${styles.button} ${styles.joinButton}`}
					>
						Follow
					</button>
				)}
				<span className={styles.timestamp}>{getTimeAgo(timestamp)}</span>
			</div>
			<h1 className={styles.title}>{title}</h1>
			<p className={styles.textBody}>{content}</p>

			{attachments?.length > 0 && <ImageCarousel attachments={attachments} />}
		</div>
	);
}

export default FeedCard;
