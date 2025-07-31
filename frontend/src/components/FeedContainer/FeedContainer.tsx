import classes from './FeedContainer.module.css';
import FeedCard from '../FeedCard/FeedCard';

function FeedContainer() {
	const post = {
		title: 'Check out this cool sunset!',
		textBody: 'Captured this in Cape Town last weekend. Nature goes hard 🔥Captured this in Cape Town last weekend. Nature goes hard 🔥',
		subreddit: 'southafrica',
		isFollowing: false,
		timestamp: 'Posted 2 hours ago',
		attachments: ['/images/sunset1.jpg', '/images/sunset2.jpg', '/images/sunset3.jpg'],
	};

	return (
		<main className={classes.container}>
			<FeedCard
				title={post.title}
				textBody={post.textBody}
				subreddit={post.subreddit}
				isFollowing={post.isFollowing}
				timestamp={post.timestamp}
				attachments={post.attachments}
			/>
		</main>
	);
}

export default FeedContainer;
