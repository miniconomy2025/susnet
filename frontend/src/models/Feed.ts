import { PostData, Res_Feed, Res_getActor } from '../../../types/api';

export interface BannerProps {
	title: string;
	displayImage?: string;
	initialIsFollowing?: boolean;
	sortOptions?: string[];
	selectedSort?: string;
	onCreatePost?: () => void;
	onCreateSub?: () => void;
	onSettingsClick?: () => void;
	onChangeSort?: (sortOption: string) => void;
	refreshSubs?: () => void;
	isModerator?: boolean;
}

export interface FeedContainerProps {
	bannerProps: BannerProps;
	availablePosts?: PostData<'full'>[];
	showCardFollowButton: boolean;
	onLoadPosts: (cursor: string) => Promise<Res_Feed | undefined>;
	onRefresh: () => Promise<void>;
	refreshSubs?: () => void;
}

export enum MembershipStatus {
	JOINED = 'Joined',
	NOT_JOINED = 'Not Joined',
}

export enum VoteType { up = "up", down = "down" };