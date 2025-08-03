import { useState } from 'react';
import styles from './FeedCard.module.css';

function FeedCard({
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
		<div className={`${styles.container}`}>
			<div className={styles.header}>
				<span className={styles.subreddit}>r/{subreddit}</span>
				{!isFollowing && (
					<button onClick={onFollowClick} className={styles.joinButton}>
						Join
					</button>
				)}
			</div>
			<span className={styles.timestamp}>{timestamp}</span>
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
