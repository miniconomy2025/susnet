import FeedCard from '../components/FeedCard/FeedCard';
import FeedContainer from '../components/FeedContainer/FeedContainer';

function Home() {
	const posts = [
		{
			profileImage: '/images/profile.jpg',
			title: 'Check out this cool sunset!',
			textBody: 'Captured this in Cape Town last weekend. Nature goes hard 🔥',
			subreddit: 'southafrica',
			isFollowing: false,
			timestamp: 'Posted 2 hours ago',
			attachments: ['/images/sunset1.jpg', '/images/sunset2.jpg', '/images/sunset3.jpg'],
		},
		{
			title: 'Just some vibes',
			subreddit: 'aestheticshots',
			isFollowing: true,
			timestamp: 'Posted 1 hour ago',
			attachments: ['/images/sunset1.jpg'],
		},
		{
			title: 'Funny thing happened today...',
			textBody: 'So I’m walking through Menlyn and I hear someone yell “FREE BOEREWORS!” — I ran, no shame.',
			subreddit: 'pretoria',
			isFollowing: false,
			timestamp: 'Posted 3 hours ago',
		},
		{
			title: 'Minimalist inspo',
			subreddit: 'design',
			isFollowing: true,
			timestamp: 'Posted yesterday',
			attachments: ['/images/sunset1.jpg', '/images/sunset2.jpg'],
		},
		{
			title: 'Exam week blues',
			textBody: 'Everything hurts and nothing is real. Engineering students know.',
			subreddit: 'studentlife',
			isFollowing: false,
			timestamp: 'Posted 5 hours ago',
		},
	];

	return (
		<FeedContainer initialPosts={posts} />
	);
}

export default Home;
