import { useEffect, useRef } from 'react';

const handleLogin = (credential: string) => {
    console.log("Google JWT:", credential);
}

const GoogleLoginButton: React.FC = () => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const CLIENT_ID = '144675851144-dqjsn3ff0urka9mogbss98irppd81sns.apps.googleusercontent.com';

  useEffect(() => {
    if (globalThis.google && buttonRef.current) {
      globalThis.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response: google.accounts.id.CredentialResponse) => {
          handleLogin(response.credential);
        },
      });

      globalThis.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
      });
    }
  }, []);

  return <div ref={buttonRef}></div>;
};

export default GoogleLoginButton;