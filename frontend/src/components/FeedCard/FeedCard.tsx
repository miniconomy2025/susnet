import styles from './FeedCard.module.css';

function FeedCard({ title }) {
	return (
		<div className={styles.container}>
			<h1 className={styles.title}>{title}</h1>
		</div>
	);
}

export default FeedCard;
