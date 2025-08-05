import styles from './Banner.module.css';

function Banner({ profileImage, title, onCreatePost, onJoin, onSettingsClick }) {
	return (
		<div className={styles.bannerWrapper}>
			<div className={styles.banner}>
				<h1 className={styles.bannerTitle}>{title}</h1>
			</div>
			<div className={styles.bannerOverlay}>
				<img className={styles.bannerProfileImage} src={profileImage} alt="Profile" />
				<div className={styles.bannerActions}>
					<button className={styles.bannerButton} onClick={onCreatePost}>
						Create Post
					</button>

					<button
						className={`${styles.bannerButton} ${styles.joinButton}`}
						onClick={onJoin}
					>
						Join
					</button>

					{onSettingsClick && (
						<button
							className={styles.bannerButton}
							onClick={onSettingsClick}
							aria-label="Settings"
						>
							<span className="material-symbols-outlined">settings</span>
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

export default Banner;
