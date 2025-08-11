import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ImageCarousel from "../ImageCarousel/ImageCarousel.tsx";
import styles from "./FeedCard.module.css";
import { fetchApi } from "../../utils/fetchApi.ts";
import { VoteType } from "../../models/Feed.ts";
import DOMPurify from 'npm:dompurify';

function getTimeAgo(epochMs: number): string {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - epochMs) / 1000);

  if (diffInSeconds < 0) return "Posted just now";
  if (diffInSeconds < 60) return `Posted ${diffInSeconds}s ago`;
  if (diffInSeconds < 3600)
    return `Posted ${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400)
    return `Posted ${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `Posted ${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2419200)
    return `Posted ${Math.floor(diffInSeconds / 604800)}w ago`;

  const months = Math.floor(diffInSeconds / 2592000);
  if (months < 12) return `Posted ${months}mo ago`;

  const years = Math.floor(diffInSeconds / 31536000);
  if (years < 10) return `Posted ${years}y ago`;

  const decades = Math.floor(years / 10);
  return `Posted ${decades} decade${decades === 1 ? "" : "s"} ago`;
}

function FeedCard({
  postId,
  actorName,
  subName,
  subThumbnailUrl,
  title,
  content,
  attachments,
  tags,
  upvotes,
  downvotes,
  isFollowingSub,
  timestamp,
  showFollowingButton,
  userVote,
  refreshSubs,
}) {
  const safeContent = DOMPurify.sanitize(content)

  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(isFollowingSub);
  const [currentUpvotes, setCurrentUpvotes] = useState(upvotes);
  const [currentDownvotes, setCurrentDownvotes] = useState(downvotes);
  const [vote, setVote] = useState<VoteType | null>(userVote); 


  const onSubredditClick = () => {
    navigate(`/subreddit/${encodeURIComponent(subName)}`);
  };

  const onUserClick = () => {
    navigate(`/user/${encodeURIComponent(actorName)}`);
  };

  const onFollowToggle = async () => {
    const prevIsFollowing = isFollowing ? true : false;
    setIsFollowing(!prevIsFollowing);

    const res = await fetchApi(
      prevIsFollowing ? "unfollowActor" : "followActor",
      { targetName: subName }
    );

    if (!res.success) {
      setIsFollowing(prevIsFollowing);
    } else {
      refreshSubs?.();
    }
  };

  const handleVoteClick = async (type: VoteType) => {
	const newVote = vote === type ? null : type;
	const prevVote = vote;

	setVote(newVote);

	const res = await fetchApi("voteOnPost", { postId }, { vote: newVote });

	if (res.success) {
		if (prevVote === VoteType.up) {
		setCurrentUpvotes(prev => prev - 1);
		}
		if (prevVote === VoteType.down) {
		setCurrentDownvotes(prev => prev - 1);
		}
		if (newVote === VoteType.up) {
		setCurrentUpvotes(prev => prev + 1);
		}
		if (newVote === VoteType.down) {
		setCurrentDownvotes(prev => prev + 1);
		}
	} else {
		setVote(prevVote);
	}
	};

  return (
    <div className={styles.cardContainer}>
      <div className={styles.headerGrid}>
        {subThumbnailUrl && (
          <img className={styles.profileImage} src={subThumbnailUrl} alt="" />
        )}
        <span className={styles.subreddit} onClick={onSubredditClick}>
          r/{subName}
        </span>
        {showFollowingButton &&
          (isFollowing ? (
            <button onClick={onFollowToggle} className={styles.button}>
              Following
            </button>
          ) : (
            <button
              onClick={onFollowToggle}
              className={`${styles.button} ${styles.joinButton}`}
            >
              Follow
            </button>
          ))}
        {actorName && (
          <span className={styles.actorName} onClick={onUserClick}>
            @{actorName}
          </span>
        )}
        <span className={styles.timestamp}>{getTimeAgo(timestamp)}</span>
      </div>

      <h1 className={styles.title}>{title}</h1>
      <p className={styles.textBody} dangerouslySetInnerHTML={{__html: safeContent}}></p>

      {attachments?.length > 0 && <ImageCarousel attachments={attachments} />}

      {tags?.length > 0 && (
        <div className={styles.tagsContainer}>
          {tags.map((tag, idx) => (
            <span key={idx} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {(upvotes != null || downvotes != null) && (
        <div className={styles.voteContainer}>
          {currentUpvotes != null && (
            <span
              className={`${styles.voteItem} ${
                vote === VoteType.up ? styles.selectedVote : ""
              }`}
              onClick={() => handleVoteClick(VoteType.up)}
            >
              <span className="material-symbols-outlined">thumb_up</span>
              {currentUpvotes}
            </span>
          )}
          {currentDownvotes != null && (
            <span
              className={`${styles.voteItem} ${
                vote === VoteType.down ? styles.selectedVote : ""
              }`}
              onClick={() => handleVoteClick(VoteType.down)}
            >
              <span className="material-symbols-outlined">thumb_down</span>
              {currentDownvotes}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default FeedCard;
