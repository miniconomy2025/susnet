import { useNavigate } from 'react-router-dom';
import ImageCarousel from '../ImageCarousel/ImageCarousel.tsx';
import styles from './FeedCard.module.css';
import { MembershipStatus } from '../../models/Feed.ts';
import { PostData } from '../../../../types/api.ts';

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
}: PostData<'full'>) {
	const navigate = useNavigate();

	const onSubredditClick = () => {
		navigate(`/subreddit/${encodeURIComponent(subName)}`);
	};

	return (
		<div className={`${styles.cardContainer}`}>
			<div className={styles.headerGrid}>
				{subThumbnailUrl && <img className={styles.profileImage} src={subThumbnailUrl} alt="" />}
				<span className={styles.subreddit} onClick={onSubredditClick}>
					r/{subName}
				</span>
				{isFollowingSub ? (
					<button className={`${styles.button}`}>Following</button>
				) : (
					<button
						type="button"
						onClick={onFollowClick}
						className={`${styles.button} ${styles.joinButton}`}
					>
						Join
					</button>
				)}
				<span className={styles.timestamp}>{timestamp}</span>
			</div>
			<h1 className={styles.title}>{title}</h1>
			<p className={styles.textBody}>{content}</p>

			{attachments.length > 0 && <ImageCarousel attachments={attachments} />}
		</div>
	);
}

export default FeedCard;
