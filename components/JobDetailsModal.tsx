import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, CheckCircle2, FileText, DollarSign, Briefcase, AlertTriangle, User, CreditCard, Lock, Clock, Check, ArrowRight, BrainCircuit } from 'lucide-react';
import Image from 'next/image';
import { Mission } from '@/app/page';

import CompanyLogo from './CompanyLogo';

export default function JobDetailsModal({ 
  mission, 
  onClose, 
  onStart 
}: { 
  mission: Mission, 
  onClose: () => void, 
  onStart: () => void 
}) {
  const [step, setStep] = useState<'rules' | 'details' | 'kyc' | 'contract' | 'waiting'>('rules');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [kycData, setKycData] = useState({ name: '', cpf: '' });
  const [isSigning, setIsSigning] = useState(false);
  const [contractId, setContractId] = useState(() => `OS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
  const [errors, setErrors] = useState({ name: '', cpf: '' });

  const validateName = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length < 2) return 'Nome completo deve ter pelo menos 2 palavras.';
    if (/\d/.test(name)) return 'Nome não pode conter números.';
    return '';
  };

  const validateCPF = (cpf: string) => {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return 'CPF deve ter 11 dígitos.';
    if (/^(\d)\1{10}$/.test(cleanCpf)) return 'CPF inválido.';
    return '';
  };

  const handleKycSubmit = () => {
    const nameError = validateName(kycData.name);
    const cpfError = validateCPF(kycData.cpf);
    
    if (nameError || cpfError) {
      setErrors({ name: nameError, cpf: cpfError });
      return;
    }
    
    setStep('contract');
  };

  const handleSignContract = () => {
    try {
      setIsSigning(true);
      console.log(`[Legal] Processando assinatura da OS ${contractId}`);
      
      setTimeout(() => {
        setIsSigning(false);
        setStep('waiting');
        console.log('[Legal] OS assinada. Liberando ambiente de trabalho.');
        
        // Auto-advance for demo purposes after 2s
        setTimeout(() => {
          try {
            onStart();
          } catch (err) {
            console.error('[Legal] Erro ao iniciar tarefa:', err);
          }
        }, 2000);
      }, 1500);
    } catch (err) {
      console.error('[Legal] Erro na assinatura:', err);
      setIsSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md sm:p-4">
      <motion.div 
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        className="w-full max-w-md bg-slate-950/90 backdrop-blur-xl border border-white/10 sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-slate-900/40 flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-500 opacity-50" />
          
          <div className="flex items-center gap-4 relative z-10">
            <CompanyLogo src={mission.logo} name={mission.company} size={64} />
            <div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">{mission.company}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-sm shadow-blue-900/20">
                  <Shield className="w-3 h-3" /> Vaga Verificada
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-slate-950/30 relative">
          
          {step === 'rules' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Resumo da Oportunidade</h3>
              <div className="text-sm text-slate-300 space-y-2 text-left bg-slate-900/40 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-slate-400">Pagamento Base</span>
                  <span className="font-bold text-emerald-400">R$ {mission.value.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 py-2">
                  <span className="text-slate-400">Duração Estimada</span>
                  <span className="font-bold text-white">{mission.duration}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">SLA de Revisão</span>
                  <span className="font-bold text-amber-400">até 24h</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">Cancelar</button>
                <button onClick={() => setStep('details')} className="flex-1 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                  Ver Detalhes
                </button>
              </div>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              {/* Job Description */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  Escopo do Trabalho
                </h3>
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-inner">
                  <p className="text-slate-300 text-sm leading-relaxed font-medium mb-3">
                    {mission.description}
                  </p>
                  {mission.briefing?.context && (
                    <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/10">
                      <h4 className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-1">
                        <BrainCircuit className="w-3 h-3" /> Contexto
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {mission.briefing.context}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Termo de Confidencialidade (NDA)
                </h3>
                <label className="flex items-start gap-3 p-4 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl cursor-pointer hover:bg-slate-900/60 transition-colors group select-none">
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    acceptedTerms 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-slate-600 group-hover:border-slate-500'
                  }`}>
                    {acceptedTerms && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span className="text-xs text-slate-400 leading-relaxed font-medium group-hover:text-slate-300 transition-colors">
                    Comprometo-me a não divulgar, copiar ou compartilhar os dados sensíveis apresentados nesta tarefa, sob pena de banimento e processo legal.
                  </span>
                </label>
              </div>
            </motion.div>
          )}

          {step === 'kyc' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-xl shadow-blue-900/20">
                  <User className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">Identificação do Prestador</h3>
                <p className="text-xs text-slate-400 mt-1">Necessário para emissão da Ordem de Serviço</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome Completo</label>
                  <input 
                    type="text" 
                    value={kycData.name}
                    onChange={(e) => setKycData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600 backdrop-blur-sm"
                    placeholder="Digite seu nome completo"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CPF</label>
                  <input 
                    type="text" 
                    value={kycData.cpf}
                    onChange={(e) => setKycData(prev => ({ ...prev, cpf: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600 backdrop-blur-sm"
                    placeholder="000.000.000-00"
                  />
                  {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'contract' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-xl font-serif text-[10px] leading-relaxed relative overflow-hidden">
                <div className="absolute top-4 right-4 opacity-10">
                  <Shield className="w-24 h-24 text-blue-600" />
                </div>
                <h3 className="text-center font-bold text-sm mb-4 uppercase border-b border-slate-200 pb-2">Ordem de Serviço (OS)</h3>
                <p className="mb-2"><strong>EMISSOR:</strong> {mission.company} Inc.</p>
                <p className="mb-2"><strong>EXECUTOR:</strong> {kycData.name.toUpperCase()}, CPF {kycData.cpf}.</p>
                <p className="mb-2"><strong>SERVIÇO:</strong> {mission.title}</p>
                <p className="mb-2"><strong>VALOR PACTUADO:</strong> R$ {mission.value.toFixed(2)}</p>
                <p className="mb-4"><strong>PRAZO:</strong> Imediato (SLA 24h para revisão).</p>
                
                <div className="mt-6 border-t border-slate-200 pt-4 flex justify-between items-end">
                  <div>
                    <p className="font-bold">OS: {contractId}</p>
                    <p>{new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="h-8 border-b border-slate-900 w-32 mb-1"></div>
                    <p className="font-bold">Assinatura Digital</p>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl cursor-pointer hover:bg-slate-900/60 transition-colors group select-none">
                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                  acceptedTerms 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-slate-600 group-hover:border-slate-500'
                }`}>
                  {acceptedTerms && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span className="text-xs text-slate-400 leading-relaxed font-medium group-hover:text-slate-300 transition-colors">
                  Aceito a OS e confirmo disponibilidade imediata.
                </span>
              </label>
            </motion.div>
          )}

          {step === 'waiting' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10 text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-xl">
                  <Clock className="w-10 h-10 text-slate-500 animate-pulse" />
                </div>
                <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-slate-950 animate-bounce shadow-lg">
                  <Check className="w-4 h-4 text-slate-950" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-100">Preparando Ambiente</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                  Carregando ferramentas e dados seguros...
                </p>
              </div>

              <div className="w-full max-w-xs bg-slate-950/50 rounded-full h-1.5 overflow-hidden mt-4 border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                />
              </div>
            </motion.div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-slate-900/40">
          {step === 'details' && (
            <button
              onClick={() => {
                if (acceptedTerms) {
                  setAcceptedTerms(false); // Reset for next step
                  setStep('kyc');
                }
              }}
              disabled={!acceptedTerms}
              className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                acceptedTerms
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {acceptedTerms ? (
                <>
                  ACEITAR E PROSSEGUIR
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                'Aguardando Aceite do NDA...'
              )}
            </button>
          )}

          {step === 'kyc' && (
            <button
              onClick={handleKycSubmit}
              disabled={kycData.name.length <= 3 || kycData.cpf.length < 11}
              className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                kycData.name.length > 3 && kycData.cpf.length >= 11
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              GERAR ORDEM DE SERVIÇO
              <FileText className="w-4 h-4" />
            </button>
          )}

          {step === 'contract' && (
            <button
              onClick={handleSignContract}
              disabled={!acceptedTerms || isSigning}
              className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                acceptedTerms && !isSigning
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {isSigning ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  ASSINAR E INICIAR
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          )}
          
          {step === 'waiting' && (
            <div className="text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold font-mono">
              OS: {contractId}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
