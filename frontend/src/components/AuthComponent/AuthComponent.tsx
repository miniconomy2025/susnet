import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext.tsx";
import { post } from "../../utils/requests.ts";
import { useGoogleSignIn } from "../../hooks/useGoogleSignIn";
import styles from "./AuthComponent.module.css";

const CLIENT_ID = "144675851144-dqjsn3ff0urka9mogbss98irppd81sns.apps.googleusercontent.com";

export default function GoogleLoginButton() {
  const { getCurrentUser } = useAuthContext();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (credential: string) => {
    sessionStorage.setItem("Token", credential);
    const res = await post("/auth/login", { token: credential });
    if (res.ok) {
      await getCurrentUser();
      navigate("/account");
    }
  };

  useGoogleSignIn(buttonRef, CLIENT_ID, handleLogin);

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Welcome to SusNet!</h1>
        <p className={styles.authSubtitle}>Sign in to continue to your account</p>
        <div ref={buttonRef}></div>
        <div className={styles.authFooter}>
          <p className={styles.authText}>Thank you for joining SusNet!</p>
        </div>
      </div>
    </div>
  );
}
