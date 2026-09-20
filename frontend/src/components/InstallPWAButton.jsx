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
      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-blue-500/25 backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-white/10"
    >
      {installed ? (
        <>
          <CheckCircle2 size={18} />
          Installed
        </>
      ) : (
        <>
          <Download size={18} />
          Install App
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
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md"
        >
          <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 p-4 pr-12">
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              aria-label="Close install banner"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white text-2xl font-black">TM</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-base leading-tight">
                  Install TeamMeet
                </h4>
                <p className="text-slate-400 text-xs mt-0.5 leading-snug">
                  {isIOS
                    ? 'Tap Share → Add to Home Screen'
                    : 'Add to home screen for quick access & offline use.'}
                </p>
              </div>
              {!isIOS && buttonContent}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
