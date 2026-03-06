import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, DollarSign, Euro, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function UpsellModal({ onClose, onUpgrade }: { onClose: () => void, onUpgrade: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md glass-panel rounded-3xl overflow-hidden neon-border-purple relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pt-10 relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-1 mb-6 shadow-lg shadow-purple-500/30">
            <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
              <Globe className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-red-500/20">
            <Zap className="w-3 h-3" />
            Oportunidade Única
          </div>

          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
            Seu perfil foi pré-aprovado para vagas em Dólar e Euro!
          </h2>

          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Multiplique seus ganhos por 5x recebendo em moeda estrangeira. Libere agora o acesso aos servidores internacionais.
          </p>

          <div className="space-y-3 mb-8 text-left">
            {[
              { icon: DollarSign, text: 'Tarefas que pagam até $45 (R$ 225)' },
              { icon: Euro, text: 'Acesso a empresas europeias' },
              { icon: CheckCircle2, text: 'Saque imediato sem limite diário' }
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm font-medium text-white">{benefit.text}</span>
              </div>
            ))}
          </div>

          <div className="bg-black/40 rounded-2xl p-4 border border-white/10 mb-6">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Taxa única de liberação</div>
            <div className="flex items-end justify-center gap-2">
              <span className="text-gray-500 line-through text-lg">R$ 197,00</span>
              <span className="text-3xl font-bold text-emerald-400">R$ 47,90</span>
            </div>
          </div>

          <button 
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/30 text-lg mb-4"
          >
            DESBLOQUEAR ACESSO GLOBAL
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4" />
            <span>Pagamento 100% Seguro via PIX ou Cartão</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
