import { useState, useEffect } from 'react';
import { Download, CheckCircle2, X } from 'lucide-react';
import { installApp } from '../serviceWorkerRegistration';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPWAButton({ floating = false }) {
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(floating);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
    if (standalone) setInstalled(true);

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

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

    return () => {
      window.removeEventListener('app-ready-to-install', handleReady);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [floating]);

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
    if (!installable && !isIOS) return null;
    return buttonContent;
  }

  return (
    <AnimatePresence>
      {showBanner && (installable || isIOS) && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="fixed bottom-3 xs:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] xs:w-[92%] max-w-md safe-bottom"
        >
          <div className="relative bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl xs:rounded-3xl shadow-2xl shadow-black/50 p-3 xs:p-4 pr-10 xs:pr-12">
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-2 xs:top-3 right-2 xs:right-3 p-1 xs:p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
              aria-label="Close install banner"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2.5 xs:gap-4">
              <div className="w-10 h-10 xs:w-12 xs:h-12 md:w-14 md:h-14 shrink-0 rounded-xl xs:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white text-lg xs:text-xl md:text-2xl font-black">TM</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm xs:text-base leading-tight">
                  Install TeamMeet
                </h4>
                <p className="text-slate-400 text-[10px] xs:text-xs mt-0.5 leading-snug">
                  {isIOS
                    ? 'Tap Share → Add to Home Screen'
                    : 'Quick access & offline use.'}
                </p>
              </div>
              {!isIOS && (
                <div className="shrink-0 hidden xs:block">
                  {buttonContent}
                </div>
              )}
            </div>
            {!isIOS && (
              <div className="xs:hidden mt-3 w-full">
                <button
                  onClick={handleInstall}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] border border-white/10"
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
