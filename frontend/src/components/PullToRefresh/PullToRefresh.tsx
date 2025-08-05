import { useRef, useState, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import styles from './PullToRefresh.module.css';

export default function PullToRefresh({
	children,
	onRefresh,
	threshold = 80,
	maxPull = 160,
	containerStyling,
}) {
	const containerRef = useRef(null);
	const contentRef = useRef(null);

	const startYRef = useRef(0);
	const pullingRef = useRef(false);
	const [pullDistance, setPullDistance] = useState(0);
	const [refreshing, setRefreshing] = useState(false);
	const [willRefresh, setWillRefresh] = useState(false);

	// fixed visual spinner height (must match CSS .spinnerInner height)
	const SPINNER_HEIGHT = 60;

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		function onPointerDown(e) {
			if (el.scrollTop > 0 || refreshing) return;
			pullingRef.current = true;
			startYRef.current = e.clientY ?? e.touches?.[0]?.clientY;
			el.setPointerCapture?.(e.pointerId);
		}

		function onPointerMove(e) {
			if (!pullingRef.current) return;
			const currentY = e.clientY ?? (e.touches && e.touches[0].clientY);
			if (currentY == null) return;
			let delta = currentY - startYRef.current;
			if (delta <= 0) {
				setPullDistance(0);
				setWillRefresh(false);
				return;
			}
			const dampened = Math.min(maxPull, delta * 0.5);
			setPullDistance(dampened);
			setWillRefresh(dampened >= threshold);
		}

		function onPointerUp(e) {
			if (!pullingRef.current) return;
			pullingRef.current = false;

			if (willRefresh) {
				const spinnerLock = Math.min(80, threshold);
				setPullDistance(spinnerLock);
				setRefreshing(true);
				Promise.resolve()
					.then(() => onRefresh?.())
					.catch(() => {})
					.finally(() => {
						setRefreshing(false);
						setWillRefresh(false);
						setTimeout(() => setPullDistance(0), 1000);
					});
			} else {
				setPullDistance(0);
				setWillRefresh(false);
			}

			try {
				el.releasePointerCapture?.(e.pointerId);
			} catch (err) {}
		}

		el.addEventListener('pointerdown', onPointerDown);
		el.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
		el.addEventListener('touchstart', onPointerDown, { passive: true });
		el.addEventListener('touchmove', onPointerMove, { passive: false });
		window.addEventListener('touchend', onPointerUp);

		return () => {
			el.removeEventListener('pointerdown', onPointerDown);
			el.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			el.removeEventListener('touchstart', onPointerDown);
			el.removeEventListener('touchmove', onPointerMove);
			window.removeEventListener('touchend', onPointerUp);
		};
	}, [onRefresh, threshold, maxPull, refreshing, willRefresh]);

	const contentStyle = {
		transform: `translateY(${pullDistance}px)`,
		transition: pullingRef.current || refreshing ? 'none' : 'transform 300ms ease',
		zIndex: 2,
		position: 'relative',
	};

	// spinner moves slightly differently so it comes up from under the content
	const spinnerTranslate = Math.max(
		0.5 * (maxPull - pullDistance - SPINNER_HEIGHT),
		0.5 * (threshold - SPINNER_HEIGHT)
	);
	const spinnerStyle = {
		transform: `translateY(${spinnerTranslate}px)`,
		transition:
			pullingRef.current || refreshing ? 'none' : 'transform 300ms ease, opacity 200ms',
	};

	return (
		<div className={styles.ptrWrapper} ref={containerRef}>
			{/* absolutely positioned spinner slot (under the content) */}
			<div
				className={styles.spinnerSlot}
				style={{
					// keep the slot's container height equal to spinner height; actual reveal is via transform
					height: SPINNER_HEIGHT,
					zIndex: 1,
				}}
				aria-hidden={!refreshing && !willRefresh}
			>
				<div
					className={styles.spinnerInner}
					style={{
						opacity: pullDistance > 6 ? 1 : 0,
						...spinnerStyle,
					}}
				>
					<LoadingSpinner active={refreshing || willRefresh} />
				</div>
			</div>

			{/* the feed content — sits above the spinner and translates down */}
			<div
				ref={contentRef}
				style={contentStyle}
				className={`${styles.ptrContent} ${containerStyling}`}
			>
				{children}
			</div>
		</div>
	);
}
