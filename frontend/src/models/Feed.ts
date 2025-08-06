export interface BannerProps {
	title: string;
	displayImage?: string;
	membershipStatus?: MembershipStatus;
	onCreatePost?: () => void;
	onSetMembershipClick?: (status: MembershipStatus) => void;
	onSettingsClick?: () => void;
}

export interface Post {
	profileImage?: string;
	title: string;
	content?: string;
	subreddit: string;
	membershipStatus: MembershipStatus;
	timestamp: string;
	attachments?: string[];
}

export interface FeedContainerProps {
	bannerProps: BannerProps;
	availablePosts: Post[];
	onLoadPosts: () => Promise<void>;
	onRefresh: () => Promise<void>;
}

export enum MembershipStatus {
	JOINED = 'Joined',
	NOT_JOINED = 'Not Joined',
}
