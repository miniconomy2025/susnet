import React, { useEffect, useState } from 'react';
import { BannerProps, MembershipStatus } from '../../models/Feed';
import styles from './Banner.module.css';

function Banner({
	displayImage,
	title,
	membershipStatus = MembershipStatus.NOT_JOINED,
	onCreatePost,
	onCreateSub,
	onSetMembershipClick,
	onSettingsClick,
}: BannerProps) {
	const [localStatus, setLocalStatus] = useState<MembershipStatus>(membershipStatus);
	const [pending, setPending] = useState(false);

	useEffect(() => {
		setLocalStatus(membershipStatus ?? MembershipStatus.NOT_JOINED);
	}, [membershipStatus]);

	const buttonText = localStatus === MembershipStatus.JOINED ? 'Leave' : 'Join';

	const handleMembershipClick = async () => {
		if (!onSetMembershipClick || pending) return;
		const newStatus =
			localStatus === MembershipStatus.JOINED
				? MembershipStatus.NOT_JOINED
				: MembershipStatus.JOINED;
		setLocalStatus(newStatus);
		setPending(true);
		try {
			await onSetMembershipClick(newStatus);
		} catch (err) {
			setLocalStatus(localStatus);
			console.error('Failed to update membership:', err);
		} finally {
			setPending(false);
		}
	};

	return (
		<div className={styles.bannerWrapper}>
			<div className={styles.banner}>
				<h1 className={styles.bannerTitle}>{title}</h1>
			</div>
			<div className={styles.bannerOverlay}>
				<div className={styles.bannerLeft}>
					{displayImage && (
						<img className={styles.bannerProfileImage} src={displayImage} alt="Profile" />
					)}
				</div>
				<div className={styles.bannerActions}>
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
					{onSetMembershipClick && (
						<button
							className={`${styles.bannerButton} ${styles.joinButton}`}
							onClick={handleMembershipClick}
							disabled={pending}
						>
							{pending ? 'Saving...' : buttonText}
						</button>
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
