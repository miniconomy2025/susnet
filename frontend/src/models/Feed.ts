import { PostData, Res_Feed, Res_getActor } from '../../../types/api';

export interface BannerProps {
	title: string;
	displayImage?: string;
	membershipStatus?: MembershipStatus;
	onCreatePost?: () => void;
	onSetMembershipClick?: (status: MembershipStatus) => void;
	onSettingsClick?: () => void;
}

export interface FeedContainerProps {
	bannerProps: BannerProps;
	availablePosts: PostData<'full'>[];
	onLoadPosts: () => Promise<Res_Feed | Res_getActor>;
	onRefresh: () => Promise<void>;
}

export enum MembershipStatus {
	JOINED = 'Joined',
	NOT_JOINED = 'Not Joined',
}
