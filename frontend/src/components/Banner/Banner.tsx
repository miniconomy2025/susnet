import { useEffect, useState } from 'react';
import { BannerProps } from '../../models/Feed';
import styles from './Banner.module.css';
import { fetchApi } from '../../utils/fetchApi';

function Banner({
	displayImage,
	title,
	initialIsFollowing,
	onCreatePost,
	onCreateSub,
	onSettingsClick,
	refreshSubs,
	isModerator,
	sortOptions,
	onChangeSort,
	selectedSort,
}: BannerProps) {
	const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

	useEffect(() => {
		const fetchFollowingStatus = async () => {
			const res = await fetchApi('getFollowingStatus', { targetName: title });
			if (res?.success) {
				setIsFollowing(res.following)
			}
		};
		if (initialIsFollowing !== undefined) fetchFollowingStatus();
	}, []);

	const onFollowToggle = async () => {
		const prevIsFollowing = isFollowing ? true : false;
		setIsFollowing(!prevIsFollowing);

		const res = await fetchApi(prevIsFollowing ? 'unfollowActor' : 'followActor', { targetName: title });

		if (!res.success) {
			setIsFollowing(prevIsFollowing); 
		} else {
			refreshSubs?.();
		}
	};

	const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		onChangeSort?.(value);
	};

	return (
		<div className={styles.bannerWrapper}>
			<div className={`${styles.banner} ${isModerator ? styles.moderatorBanner : ''}`}>
				<h1 className={styles.bannerTitle}>{title}</h1>
			</div>
			<div className={styles.bannerOverlay}>
				<div className={styles.bannerLeft}>
					{displayImage && (
						<img className={styles.bannerProfileImage} src={displayImage} alt="Profile" />
					)}
				</div>
				<div className={styles.bannerActions}>
					{sortOptions && sortOptions.length > 0 && (
						<select
							value={selectedSort}
							onChange={handleSortChange}
							className={`${styles.bannerButton} ${styles.sortDropdown}`}
						>
							{sortOptions.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>
					)}

					{onCreatePost && (
						<button className={styles.bannerButton} onClick={onCreatePost}>
							Create Post
						</button>
					)}
					{onCreateSub && (
						<button className={styles.bannerButton} onClick={onCreateSub}>
							Create Sub
						</button>
					)}
					{initialIsFollowing !== undefined && (
						isFollowing ? (
							<button onClick={onFollowToggle} className={`${styles.bannerButton} ${styles.followingButton}`}>
							Following
							</button>
						) : (
							<button onClick={onFollowToggle} className={`${styles.bannerButton} ${styles.followButton}`}>
							Follow
							</button>
						)
					)}
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
