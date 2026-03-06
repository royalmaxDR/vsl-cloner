import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

export default function ToastNotification({ title, message }: { title: string, message: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 pointer-events-none"
    >
      <div className="glass-panel rounded-2xl p-4 border-emerald-500/20 shadow-2xl flex items-start gap-3 bg-black/90 backdrop-blur-xl">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">{title}</h4>
          <p className="text-xs text-emerald-400/80 mt-0.5 font-medium">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}
