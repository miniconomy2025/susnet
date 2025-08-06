import { useNavigate } from 'react-router-dom';
import ImageCarousel from '../ImageCarousel/ImageCarousel';
import styles from './FeedCard.module.css';
import { MembershipStatus } from '../../models/Feed';

function FeedCard({
	profileImage,
	title,
	textBody,
	subreddit,
	membershipStatus,
	onFollowClick,
	timestamp,
	attachments = [],
}) {
	const navigate = useNavigate();

	const onSubredditClick = () => {
		navigate(`/subreddit/${encodeURIComponent(subreddit)}`);
	};

	return (
		<div className={`${styles.cardContainer}`}>
			<div className={styles.headerGrid}>
				{profileImage && <img className={styles.profileImage} src={profileImage} alt="" />}
				<span className={styles.subreddit} onClick={onSubredditClick}>
					r/{subreddit}
				</span>
				{membershipStatus == MembershipStatus.JOINED ? (
					<button className={`${styles.button}`}>Following</button>
				) : (
					<button
						onClick={onFollowClick}
						className={`${styles.button} ${styles.joinButton}`}
					>
						Join
					</button>
				)}
				<span className={styles.timestamp}>{timestamp}</span>
			</div>
			<h1 className={styles.title}>{title}</h1>
			<p className={styles.textBody}>{textBody}</p>

			{attachments.length > 0 && <ImageCarousel images={attachments} />}
		</div>
	);
}

export default FeedCard;
