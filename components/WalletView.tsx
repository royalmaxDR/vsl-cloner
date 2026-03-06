import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, Smartphone, Key, FileText, BarChart3, Globe, ShieldAlert, Info, Lock } from 'lucide-react';
import { UserProfile } from '@/app/page';

export default function WalletView({ balances, profile }: { balances: { available: number, analysis: number, international: number }, profile: UserProfile }) {
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [pixKey, setPixKey] = useState(profile.pixKey || '');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const totalBalance = balances.available + balances.analysis;
  const [daysSinceCreation] = useState(() => Math.floor((Date.now() - profile.createdAt) / (1000 * 60 * 60 * 24)) + 1);
  const isWithdrawLocked = totalBalance < 1000 || daysSinceCreation < 7;
  const progressPercentage = Math.min((daysSinceCreation / 7) * 100, 100);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixKey || isWithdrawLocked) return;
    
    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Contract Status Card */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Contrato Ativo</h3>
              <p className="text-[10px] text-slate-400 font-medium">Auditoria de Conformidade em Andamento</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-100">Dia {daysSinceCreation}/7</div>
          </div>
        </div>
        
        <div className="w-full bg-slate-950/50 rounded-full h-2 mb-3 overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
          />
        </div>
        
        <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
          <Info className="w-3 h-3 flex-shrink-0 text-blue-500" />
          <span>O saque será desbloqueado automaticamente após a conclusão do ciclo de 7 dias e validação do saldo mínimo.</span>
        </div>
      </div>

      {/* Total Balance */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        
        <div className="flex items-center gap-2 text-blue-400 mb-2 relative z-10">
          <Wallet className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Total Acumulado</span>
        </div>
        <div className="text-4xl font-bold text-slate-100 tracking-tight relative z-10 mb-4 drop-shadow-md">
          R$ {totalBalance.toFixed(2).replace('.', ',')}
        </div>
        
        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 relative z-10">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Disponível para Saque</div>
            <div className="text-lg font-bold text-blue-400">R$ {balances.available.toFixed(2).replace('.', ',')}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Em Auditoria</div>
            <div className="text-lg font-bold text-amber-400">R$ {balances.analysis.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>
      </div>

      {/* Withdrawal Rules */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <ShieldAlert className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-slate-100 tracking-tight mb-1">Requisitos para Liberação</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Protocolo de segurança financeira internacional.
            </p>
          </div>
        </div>
        
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-white/5">
            <span className="text-xs text-slate-400 font-medium">Ciclo de Auditoria (7 dias)</span>
            {daysSinceCreation >= 7 ? (
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400">{7 - daysSinceCreation} dias restantes</span>
                <Lock className="w-3 h-3 text-amber-400" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-white/5">
            <span className="text-xs text-slate-400 font-medium">Saldo Mínimo (R$ 1.000,00)</span>
            {totalBalance >= 1000 ? (
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400">
                  Faltam R$ {(1000 - totalBalance).toFixed(2).replace('.', ',')}
                </span>
                <Lock className="w-3 h-3 text-amber-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdraw Form */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative group shadow-xl">
        <h3 className="text-lg font-bold text-slate-100 tracking-tight mb-4">Sacar via PIX</h3>
        
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Tipo de Chave</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cpf', icon: FileText, label: 'CPF' },
                { id: 'phone', icon: Smartphone, label: 'Celular' },
                { id: 'random', icon: Key, label: 'Aleatória' }
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setPixKeyType(type.id)}
                  disabled={isWithdrawLocked}
                  className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${
                    pixKeyType === type.id 
                      ? 'bg-blue-600/10 border-blue-600 text-blue-500' 
                      : 'bg-slate-950/50 border-white/10 text-slate-400 hover:bg-slate-800/60'
                  } ${isWithdrawLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <type.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Sua Chave PIX</label>
            <input 
              type="text" 
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Digite sua chave aqui"
              required
              disabled={isWithdrawLocked}
              className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-4 text-slate-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="relative">
            <button 
              type="button"
              onClick={() => {
                if (isWithdrawLocked) {
                  alert(`Protocolo de Compliance: Seu saldo diário acumulado de R$ ${totalBalance.toFixed(2).replace('.', ',')} está em fase de processamento bancário. Liberação em ${7 - daysSinceCreation} dias.`);
                }
              }}
              disabled={!pixKey || isWithdrawing || (isWithdrawLocked && !pixKey)}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/40 disabled:shadow-none mt-2"
            >
              {isWithdrawing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'SOLICITAR SAQUE'
              )}
            </button>
            
            {/* Tooltip on hover when locked */}
            {isWithdrawLocked && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-950/95 border border-white/10 rounded-lg text-[10px] text-center text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 backdrop-blur-md">
                Seu saldo estará disponível após o ciclo de auditoria de 7 dias e atingir R$ 1.000,00.
              </div>
            )}
          </div>
        </form>

        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-start gap-3 text-sm text-blue-400 bg-blue-400/10 p-4 rounded-2xl border border-blue-400/20"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-1">Saque Solicitado!</strong>
                <span className="text-blue-400/80 text-xs">Seu PIX está em processamento e cairá na sua conta em até 24h úteis.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Extract */}
      <div>
        <h3 className="text-lg font-bold text-slate-100 tracking-tight mb-4 drop-shadow-sm">Extrato Diário de Ganhos</h3>
        <div className="space-y-3">
          {profile.history && profile.history.length > 0 ? (
            profile.history.map((item, idx) => (
              <div key={`${item.date}-${idx}`} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-100 mb-0.5">Dia {profile.history.length - idx}: Ganhos Acumulados</div>
                    <div className="text-[10px] text-slate-500 font-medium">{new Date(item.date).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-400">
                    +R$ {item.amount.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-500" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500">
                      Auditado
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-dashed border-white/10">
              <p className="text-xs text-slate-500">Nenhum ganho registrado ainda.</p>
            </div>
          )}
          
          {/* Legacy items for visual variety if history is short */}
          {(!profile.history || profile.history.length < 2) && (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between opacity-50 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100 mb-0.5">Bônus de Boas-vindas</div>
                  <div className="text-[10px] text-slate-500 font-medium">Processando...</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-blue-400">+R$ 145,50</div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">Pendente</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
