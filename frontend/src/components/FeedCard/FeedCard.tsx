import { useState } from 'react';
import ImageCarousel from '../ImageCarousel/ImageCarousel';
import styles from './FeedCard.module.css';

function FeedCard({
	profileImage,
	title,
	textBody,
	subreddit,
	isFollowing,
	onFollowClick,
	timestamp,
	attachments = [],
}) {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);

	const handleNextImage = () => {
		setCurrentImageIndex((currentImageIndex + 1) % attachments.length);
	};

	const handlePrevImage = () => {
		setCurrentImageIndex((currentImageIndex - 1 + attachments.length) % attachments.length);
	};

	return (
		<div className={`${styles.cardContainer}`}>
			<div className={styles.headerGrid}>
				{profileImage && <img className={styles.profileImage} src={profileImage} alt="" />}
				<span className={styles.subreddit}>r/{subreddit}</span>
				{isFollowing ? (
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
