// hooks/useGoogleSignIn.ts
import { useEffect } from "react";

export function useGoogleSignIn(
  buttonRef: React.RefObject<HTMLDivElement | null>, // allow null here
  clientId: string,
  onLogin: (cred: string) => void
) {
  useEffect(() => {
    let cancelled = false;

    const initGoogle = () => {
      if (cancelled) return;
      if (!globalThis.google || !buttonRef.current) return;

      globalThis.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: any) => {
          if (resp?.credential) onLogin(resp.credential);
        },
      });

      buttonRef.current.innerHTML = "";
      globalThis.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
      });
    };

    const existing = document.getElementById("gsi-script") as HTMLScriptElement | null;

    if (globalThis.google) {
      initGoogle();
    } else if (existing) {
      existing.addEventListener("load", initGoogle);
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = "gsi-script";
      script.onload = initGoogle;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      existing?.removeEventListener("load", initGoogle);
    };
  }, [buttonRef, clientId, onLogin]);
}
