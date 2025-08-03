import { useState } from 'react';
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
					<button onClick={onFollowClick} className={`${styles.button} ${styles.joinButton}`}>
						Join
					</button>
				)}
				<span className={styles.timestamp}>{timestamp}</span>
			</div>
			<h1 className={styles.title}>{title}</h1>
			<p className={styles.textBody}>{textBody}</p>

			{attachments.length > 0 && (
				<div className={styles.imageCarousel}>
					<span className={`material-symbols-outlined ${styles.imageNavLeft}`} onClick={handlePrevImage}>
						chevron_left
					</span>
					<img
						src={attachments[currentImageIndex]}
						className={styles.image}
						alt={`attachment-${currentImageIndex}`}
					/>
					<span className={`material-symbols-outlined ${styles.imageNavRight}`} onClick={handleNextImage}>
						chevron_right
					</span>
				</div>
			)}
		</div>
	);
}

export default FeedCard;
