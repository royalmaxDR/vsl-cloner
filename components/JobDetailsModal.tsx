import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, CheckCircle2, FileText, DollarSign, Briefcase, AlertTriangle, User, CreditCard, Lock, Clock, Check, ArrowRight } from 'lucide-react';
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
  const [contractId, setContractId] = useState(() => `CTR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
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

  const getResponsibilities = (type: string) => {
    switch(type) {
      case 'audit': return 'Auditoria de bugs visuais e conformidade de dados em notas fiscais.';
      case 'ad': return 'Análise de integridade de anúncios e verificação de políticas da plataforma.';
      case 'training': return 'Classificação de imagens para treinamento de modelos de IA.';
      case 'transcription': return 'Transcrição e correção de áudios para sistemas de reconhecimento de voz.';
      case 'support': return 'Resolução de tickets de suporte nível 1 seguindo scripts pré-definidos.';
      default: return 'Execução de tarefas de micro-trabalho seguindo diretrizes estritas.';
    }
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
      console.log(`[Legal] Processando assinatura do contrato ${contractId}`);
      
      setTimeout(() => {
        setIsSigning(false);
        setStep('waiting');
        console.log('[Legal] Contrato assinado. Aguardando homologação do CPF.');
        
        // Auto-advance for demo purposes after 3s
        setTimeout(() => {
          try {
            onStart();
            // Show success toast
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-slate-100 px-6 py-3 rounded-full shadow-2xl z-[100] text-sm font-bold flex items-center gap-2 border border-blue-500/30 animate-in fade-in slide-in-from-top-4 duration-300';
            toast.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Candidatura homologada. Acesso ao terminal liberado.';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 5000);
          } catch (err) {
            console.error('[Legal] Erro ao iniciar tarefa:', err);
          }
        }, 3000);
      }, 2000);
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
          
          {/* Explanation Popup */}
          {/* <AnimatePresence>
            {showExplanation && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/30">
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Sobre o Pagamento</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Você receberá pelos dias trabalhados, mas o saque é liberado após 7 dias de ciclo de auditoria. 
                  Isso garante a segurança dos dados e a conformidade do seu trabalho.
                </p>
                <h3 className="text-xl font-bold text-white mt-4">Sobre a Aprovação</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  A aprovação da sua vaga ocorre em até 24 horas. Nossa equipe analisa seu perfil para garantir 
                  que você esteja apto para a função.
                </p>
                <button 
                  onClick={() => setShowExplanation(false)}
                  className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all"
                >
                  Entendido
                </button>
              </motion.div>
            )}
          </AnimatePresence> */}

          {step === 'rules' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Regras e Pagamento</h3>
              <div className="text-sm text-slate-300 space-y-2 text-left bg-slate-900/40 p-4 rounded-xl border border-white/5">
                <p>• Paga por dia: R$ {mission.value.toFixed(2).replace('.', ',')}</p>
                <p>• Trabalha 7 dias seguidos</p>
                <p>• Total ao concluir: R$ {(mission.value * 7).toFixed(2).replace('.', ',')}</p>
                <p>• Liberação do trabalho somente após 24h da candidatura</p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-800 text-slate-400">Cancelar</button>
                <button onClick={() => setStep('details')} className="flex-1 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white">Entendi e continuar</button>
              </div>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              {/* Job Description */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  Descrição do Posto de Trabalho
                </h3>
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-inner">
                  <p className="text-slate-300 text-sm leading-relaxed font-medium">
                    {mission.description || getResponsibilities(mission.type)}
                  </p>
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Termo de Responsabilidade
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
                    Confirmo que possuo os requisitos técnicos necessários e seguirei rigorosamente as <strong className="text-slate-200">normas de confidencialidade</strong> e <strong className="text-slate-200">protocolos de segurança</strong> da empresa contratante.
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
                <h3 className="text-lg font-bold text-slate-100">Contrato e Confirmação de Identidade</h3>
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
                    Declaro que meu nome e CPF são reais e pertencem a mim.
                  </span>
                </label>
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
                    Li e aceito os termos e regras.
                  </span>
                </label>
              </div>
            </motion.div>
          )}

          {step === 'contract' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-xl font-serif text-[10px] leading-relaxed relative overflow-hidden">
                <div className="absolute top-4 right-4 opacity-10">
                  <Shield className="w-24 h-24 text-blue-600" />
                </div>
                <h3 className="text-center font-bold text-sm mb-4 uppercase border-b border-slate-200 pb-2">Contrato de Prestação de Serviços Digitais</h3>
                <p className="mb-2"><strong>CONTRATANTE:</strong> {mission.company} Inc.</p>
                <p className="mb-2"><strong>CONTRATADO:</strong> {kycData.name.toUpperCase()}, CPF {kycData.cpf}.</p>
                <p className="mb-2"><strong>OBJETO:</strong> Prestação de serviços de análise de dados e auditoria digital conforme demanda.</p>
                <p className="mb-2"><strong>VIGÊNCIA:</strong> Indeterminada, com ciclo de auditoria de 7 dias.</p>
                <p className="mb-4"><strong>CLÁUSULA DE CONFIDENCIALIDADE:</strong> O CONTRATADO compromete-se a manter sigilo absoluto sobre os dados acessados.</p>
                
                <div className="mt-6 border-t border-slate-200 pt-4 flex justify-between items-end">
                  <div>
                    <p className="font-bold">ID: {contractId}</p>
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
                  Aceito os termos de auditoria de 7 dias e confirmo a veracidade dos dados.
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
                <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-4 border-slate-950 animate-bounce shadow-lg">
                  <Lock className="w-4 h-4 text-slate-950" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-100">Aguardando Homologação</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                  Seu CPF está sendo validado pelo Departamento Jurídico.
                </p>
                <div className="inline-block bg-slate-950/50 rounded-lg px-3 py-1 text-xs font-mono text-amber-400 mt-2 border border-amber-500/20 backdrop-blur-sm">
                  Prazo Estimado: 24h
                </div>
              </div>

              <div className="w-full max-w-xs bg-slate-950/50 rounded-full h-1.5 overflow-hidden mt-4 border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                  className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                />
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest animate-pulse font-mono">
                Verificando antecedentes...
              </p>
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
                  CONTINUAR PARA CONTRATO
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                'Aguardando Aceite dos Termos...'
              )}
            </button>
          )}

          {step === 'kyc' && (
            <button
              onClick={handleKycSubmit}
              disabled={!acceptedTerms || kycData.name.length <= 3 || kycData.cpf.length < 11}
              className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                acceptedTerms && kycData.name.length > 3 && kycData.cpf.length >= 11
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              GERAR CONTRATO DIGITAL
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
                  ASSINAR CONTRATO DIGITAL
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          )}
          
          {step === 'waiting' && (
            <div className="text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold font-mono">
              Protocolo: {contractId}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
