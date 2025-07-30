"use client";
import styles from "./AuthComponent.module.css";

interface AuthComponentProps {
  onGoogleLogin?: () => void;
  onGitHubLogin?: () => void;
  onDiscordLogin?: () => void;
  isSignup?: boolean;
}

export default function AuthComponent({
  onGoogleLogin,
  onGitHubLogin,
  onDiscordLogin,
  isSignup = false,
}: AuthComponentProps) {
  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>
          {isSignup ? "Create Account" : "Welcome Back"}
        </h1>
        <p className={styles.authSubtitle}>
          {isSignup
            ? "Sign up with your preferred provider"
            : "Sign in to continue to your account"}
        </p>

        <button className={`${styles.oauthButton} ${styles.googleButton}`}>
          <span
            className="material-icons"
            style={{ fontSize: 24, marginRight: "8px" }}
          >
            login
          </span>
          Continue with Google
        </button>

        <div className={styles.authFooter}>
          <p className={styles.authText}>Thank you for joining SusNet!</p>
        </div>
      </div>
    </div>
  );
}
