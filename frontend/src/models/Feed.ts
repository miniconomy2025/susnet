import { PostData, Res_Feed, Res_getActor } from '../../../types/api';

export interface BannerProps {
	title: string;
	displayImage?: string;
	membershipStatus?: MembershipStatus;
	onCreatePost?: () => void;
	onCreateSub?: () => void;
	onSetMembershipClick?: (status: MembershipStatus) => void;
	onSettingsClick?: () => void;
}

export interface FeedContainerProps {
	bannerProps: BannerProps;
	availablePosts?: PostData<'full'>[];
	onLoadPosts: (cursor: string) => Promise<Res_Feed | undefined>;
	onRefresh: () => Promise<void>;
}

export enum MembershipStatus {
	JOINED = 'Joined',
	NOT_JOINED = 'Not Joined',
}
