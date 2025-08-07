import { PostData, Res_Feed, Res_getActor } from '../../../types/api';

export interface BannerProps {
	title: string;
	displayImage?: string;
	initialIsFollowing?: boolean;
	onCreatePost?: () => void;
	onCreateSub?: () => void;
	onSettingsClick?: () => void;
}

export interface FeedContainerProps {
	bannerProps: BannerProps;
	availablePosts?: PostData<'full'>[];
	showCardFollowButton: boolean;
	onLoadPosts: (cursor: string) => Promise<Res_Feed | undefined>;
	onRefresh: () => Promise<void>;
}

export enum MembershipStatus {
	JOINED = 'Joined',
	NOT_JOINED = 'Not Joined',
}
