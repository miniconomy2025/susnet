import { useEffect, useRef } from "react";
import { post } from "../../utils/requests.ts";
import { useNavigate } from "react-router-dom";
import styles from "./AuthComponent.module.css";

const GoogleLoginButton: React.FC = () => {
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const CLIENT_ID =
    "144675851144-dqjsn3ff0urka9mogbss98irppd81sns.apps.googleusercontent.com";

  const handleLogin = async (credential: string) => {
    sessionStorage.setItem('Token', credential)
    const res = await post("/auth/login", { token: credential });
    if (res.ok) {
      navigate("/home");
    } else {
      //TODO BAD ACCOUNT
    }
  };

  useEffect(() => {
    if (globalThis.google && buttonRef.current) {
      globalThis.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response: google.accounts.id.CredentialResponse) => {
          handleLogin(response.credential);
        },
      });

      globalThis.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
      });
    }
  }, []);

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>
          Welcome to SusNet!
        </h1>
        <p className={styles.authSubtitle}>
            Sign in to continue to your account
        </p>

        <div ref={buttonRef}></div>

        <div className={styles.authFooter}>
          <p className={styles.authText}>Thank you for joining SusNet!</p>
        </div>
      </div>
    </div>
  );
  
  
  
};

export default GoogleLoginButton;
