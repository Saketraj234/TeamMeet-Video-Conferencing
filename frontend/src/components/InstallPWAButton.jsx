import { useState, useEffect } from 'react';
import { Download, CheckCircle2, X } from 'lucide-react';
import { installApp } from '../serviceWorkerRegistration';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPWAButton({ floating = false }) {
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(floating);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
    if (standalone) setInstalled(true);

    const ua = navigator.userAgent || '';
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const android = /Android/.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);

    const handleReady = () => {
      setInstallable(true);
      if (floating) setShowBanner(true);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallable(false);
    };

    window.addEventListener('app-ready-to-install', handleReady);
    window.addEventListener('appinstalled', handleInstalled);

    if (floating && (ios || android)) {
      const t = setTimeout(() => setShowBanner(true), 800);
      return () => {
        clearTimeout(t);
        window.removeEventListener('app-ready-to-install', handleReady);
        window.removeEventListener('appinstalled', handleInstalled);
      };
    }

    return () => {
      window.removeEventListener('app-ready-to-install', handleReady);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [floating]);

  const isMobile = isIOS || isAndroid;
  const shouldShowInstall = installable || isMobile;

  const handleInstall = async () => {
    try {
      const outcome = await installApp();
      if (outcome === 'accepted') {
        setInstalled(true);
        setInstallable(false);
      }
    } catch (err) {
      console.error('Install error:', err);
    }
  };

  if (isStandalone) return null;

  const buttonContent = (
    <button
      onClick={handleInstall}
      className="flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-4 py-1.5 xs:py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl xs:rounded-2xl font-semibold text-[10px] xs:text-sm shadow-lg shadow-blue-500/25 backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-white/10 shrink-0 whitespace-nowrap"
    >
      {installed ? (
        <>
          <CheckCircle2 size={14} className="xs:hidden" />
          <CheckCircle2 size={18} className="hidden xs:block" />
          <span className="hidden xs:inline">Installed</span>
          <span className="xs:hidden">Done</span>
        </>
      ) : (
        <>
          <Download size={14} className="xs:hidden" />
          <Download size={18} className="hidden xs:block" />
          <span className="hidden xs:inline">Install App</span>
          <span className="xs:hidden">Install</span>
        </>
      )}
    </button>
  );

  if (!floating) {
    if (!shouldShowInstall) return null;
    return buttonContent;
  }

  return (
    <AnimatePresence>
      {showBanner && shouldShowInstall && (
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed bottom-4 xs:bottom-5 md:bottom-7 left-1/2 -translate-x-1/2 z-[80] w-[96%] xs:w-[92%] sm:max-w-lg md:max-w-xl safe-bottom"
        >
          <div className="relative bg-slate-900/95 backdrop-blur-2xl border border-blue-500/20 rounded-2xl xs:rounded-3xl shadow-2xl shadow-blue-950/60 p-3 xs:p-4 pr-11 xs:pr-14">
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-2 xs:top-3 right-2 xs:right-3 p-1 xs:p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
              aria-label="Close install banner"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 xs:gap-4">
              <div className="w-11 h-11 xs:w-13 xs:h-13 md:w-14 md:h-14 shrink-0 rounded-xl xs:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/40 ring-1 ring-white/10">
                <span className="text-white text-lg xs:text-xl md:text-2xl font-black">TM</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm xs:text-base md:text-lg leading-tight">
                  Install TeamMeet
                </h4>
                <p className="text-blue-200/80 text-[10px] xs:text-xs mt-0.5 leading-snug">
                  {isIOS
                    ? 'Tap Share → "Add to Home Screen"'
                    : isAndroid
                    ? 'Tap Menu → "Add to Home Screen"'
                    : 'Click Install for quick access & offline use'}
                </p>
              </div>
              {installable && (
                <div className="shrink-0 hidden xs:block">
                  {buttonContent}
                </div>
              )}
            </div>
            {installable && (
              <div className="xs:hidden mt-3 w-full">
                <button
                  onClick={handleInstall}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] border border-white/10"
                >
                  {installed ? (
                    <>
                      <CheckCircle2 size={14} />
                      Installed
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      Install App
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
