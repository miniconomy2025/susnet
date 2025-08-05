import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import styles from './ImageCarousel.module.css';

export default function ImageCarousel({ images }) {
	const [index, setIndex] = useState(0);

	const nextImage = () => {
		setIndex((i) => (i + 1) % images.length);
	};

	const prevImage = () => {
		setIndex((i) => (i - 1 + images.length) % images.length);
	};

	const swipeHandlers = useSwipeable({
		onSwipedLeft: nextImage,
		onSwipedRight: prevImage,
		preventScrollOnSwipe: true,
		trackMouse: true,
	});

	return (
		<div className={styles.carouselWrapper} {...swipeHandlers}>
			{images.length > 1 && (
				<>
					<button
						className={`material-symbols-outlined ${styles.navLeft}`}
						onClick={prevImage}
					>
						chevron_left
					</button>
					<button
						className={`material-symbols-outlined ${styles.navRight}`}
						onClick={nextImage}
					>
						chevron_right
					</button>
				</>
			)}
			<div
				className={styles.slidesContainer}
				style={{ transform: `translateX(-${index * 100}%)` }}
			>
				{images.map((src, i) => (
					<img
						key={i}
						src={src}
						alt={`carousel-${i}`}
						className={styles.image}
						draggable={false}
					/>
				))}
			</div>

			{images.length > 1 && (
				<div className={styles.dots}>
					{images.map((_, i) => (
						<span
							key={i}
							className={`${styles.dot} ${index === i ? styles.activeDot : ''}`}
							onClick={() => setIndex(i)}
						/>
					))}
				</div>
			)}
		</div>
	);
}
