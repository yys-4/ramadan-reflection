import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Hooks into the browser's PWA install prompt lifecycle.
 *
 * The `beforeinstallprompt` event fires when the browser determines the app
 * meets PWA install criteria (HTTPS, valid manifest, service worker). We
 * intercept it to defer the native prompt and show our own custom install
 * banner instead — this gives us control over timing and UX (e.g., showing
 * the banner only on the dashboard, not during onboarding).
 *
 * The `display-mode: standalone` check on mount detects if the app is already
 * running as an installed PWA, preventing the install banner from appearing
 * to users who've already installed it.
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Already installed — no need to listen for install prompts
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === "accepted";
  };

  return { canInstall: !!deferredPrompt && !isInstalled, isInstalled, install };
}
