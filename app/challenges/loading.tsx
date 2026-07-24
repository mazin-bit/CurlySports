import styles from "./challenges.module.css";

export default function ChallengesLoading() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonHero} />
      <div className={styles.skeletonCard} />
      <div className={styles.skeletonCard} />
    </div>
  );
}
