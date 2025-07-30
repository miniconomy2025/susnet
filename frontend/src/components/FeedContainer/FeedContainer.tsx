import FeedCard from '../FeedCard/FeedCard';
import classes from './FeedContainer.module.css';

function FeedContainer() {
	return (
		<main className={classes.container}>
			<FeedCard title={'Check out my OF!'} />
		</main>
	);
}

export default FeedContainer;
