'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, PlusSquare, X, Smartphone, Download } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>(() => {
    if (typeof window === 'undefined') return 'other';
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    return 'other';
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    if (platform === 'ios') {
      // Show prompt after 5 seconds
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    } else if (platform === 'android') {
      
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Show prompt after 5 seconds
        setTimeout(() => setShowPrompt(true), 5000);
      };

      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, [platform]);

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Neon Border Effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-500 opacity-50" />
            
            <button 
              onClick={() => setShowPrompt(false)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-xl shadow-blue-900/20">
                <Download className="w-8 h-8 text-blue-400" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-100 tracking-tight">Instalar HomeOffice Pro</h3>
                <p className="text-sm text-slate-400">Tenha acesso rápido e notificações em tempo real instalando nosso App.</p>
              </div>

              {platform === 'ios' ? (
                <div className="w-full bg-slate-950/50 rounded-2xl p-4 border border-white/5 space-y-4">
                  <p className="text-xs text-slate-300 font-medium">Siga os passos para instalar no seu iPhone:</p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold">1</div>
                      <div className="flex items-center gap-2">
                        Toque no ícone <Share className="w-4 h-4 text-blue-500" /> (Compartilhar)
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold">2</div>
                      <div className="flex items-center gap-2">
                        Role e toque em <PlusSquare className="w-4 h-4 text-blue-500" /> <span className="font-bold text-slate-200">Adicionar à Tela de Início</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleInstallAndroid}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm uppercase tracking-wider transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  Instalar Agora
                </button>
              )}

              <button 
                onClick={() => setShowPrompt(false)}
                className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
              >
                Talvez mais tarde
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
