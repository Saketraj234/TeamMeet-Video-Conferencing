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
          initial={{ y: 180, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 180, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed inset-x-2 xs:inset-x-3 sm:left-1/2 sm:-translate-x-1/2 z-[9999] sm:max-w-md md:max-w-lg"
          style={{
            bottom: 'max(1rem, env(safe-area-inset-bottom) + 1rem)',
          }}
        >
          <div className="relative overflow-hidden bg-slate-900/98 backdrop-blur-2xl border border-blue-500/25 rounded-2xl xs:rounded-3xl shadow-2xl shadow-blue-950/60">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 via-transparent to-indigo-600/8 pointer-events-none" />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
                setShowBanner(false);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowBanner(false);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute top-0 right-0 z-[100] flex items-center justify-center min-w-[52px] min-h-[52px] xs:min-w-[60px] xs:min-h-[60px] rounded-bl-2xl xs:rounded-bl-3xl text-slate-300 hover:text-white transition-all active:scale-90 cursor-pointer hover:bg-white/10"
              style={{
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
              aria-label="Close install banner"
            >
              <X size={20} strokeWidth={2.5} className="xs:hidden" />
              <X size={24} strokeWidth={2.5} className="hidden xs:block" />
            </button>
            <div className="relative z-10 flex items-center gap-2.5 xs:gap-3 p-3 xs:p-4 pr-[56px] xs:pr-[68px]">
              <div className="w-10 h-10 xs:w-12 xs:h-12 shrink-0 rounded-xl xs:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/40 ring-1 ring-white/10 flex-none">
                <span className="text-white text-base xs:text-xl font-black tracking-tight">TM</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-[13px] xs:text-sm md:text-base leading-tight truncate">
                  Install TeamMeet
                </h4>
                <p className="text-blue-200/80 text-[10px] xs:text-xs mt-0.5 leading-snug truncate">
                  Quick access &amp; offline use
                </p>
              </div>
              {installable && (
                <div className="shrink-0 hidden xs:block flex-none">
                  {buttonContent}
                </div>
              )}
            </div>
            {installable && (
              <div className="xs:hidden px-3 pb-3">
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
