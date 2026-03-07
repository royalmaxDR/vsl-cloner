import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Clock, CheckCircle2, AlertTriangle, FileText, ChevronRight, Save, Upload, Send, AlertOctagon, BrainCircuit, Eye, Lock } from 'lucide-react';
import Image from 'next/image';
import { Mission } from '@/app/page';

// Components
import ChatSidebar from './ChatSidebar';

export default function TaskSimulator({ 
  mission, 
  onClose, 
  onComplete 
}: { 
  mission: Mission, 
  onClose: () => void, 
  onComplete: () => void 
}) {
  // Phases: 'briefing' | 'execution' | 'submission'
  const [phase, setPhase] = useState<'briefing' | 'execution' | 'submission'>('briefing');
  
  // State
  const [timeLeft, setTimeLeft] = useState(mission.briefing?.estimatedTime ? mission.briefing.estimatedTime * 60 : 900); // Default 15 min
  const [checklist, setChecklist] = useState<Record<string, any>>({});
  const [evidenceText, setEvidenceText] = useState('');
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [briefingTimer, setBriefingTimer] = useState(5); // 5s mandatory reading time

  // Refs
  const evidenceRef = useRef<HTMLTextAreaElement>(null);

  // Timer Logic
  useEffect(() => {
    if (phase === 'execution' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [phase, timeLeft]);

  // Briefing Timer
  useEffect(() => {
    if (phase === 'briefing' && briefingTimer > 0) {
      const timer = setInterval(() => setBriefingTimer(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [phase, briefingTimer]);

  // Autosave Simulation
  useEffect(() => {
    if (phase === 'execution') {
      const interval = setInterval(() => {
        setIsAutosaving(true);
        setTimeout(() => {
          setIsAutosaving(false);
          setLastSaved(new Date());
        }, 800);
      }, 30000); // Every 30s
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Calculate Quality Score Real-time (Derived State)
  const calculateQualityScore = () => {
    if (!mission.steps) return 0;
    
    const totalSteps = mission.steps.length;
    const completedSteps = Object.keys(checklist).length;
    const stepWeight = 50 / totalSteps; // Steps are worth 50%
    
    let score = completedSteps * stepWeight;
    
    // Evidence length weight (30%)
    const minLength = mission.evidence?.minLength || 100;
    const lengthScore = Math.min(evidenceText.length / minLength, 1) * 30;
    
    score += lengthScore;
    
    // Base score for just being here (20%)
    if (phase !== 'briefing') score += 20;

    return Math.round(score);
  };

  const qualityScore = calculateQualityScore();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStepChange = (stepId: string, value: any) => {
    setChecklist(prev => ({ ...prev, [stepId]: value }));
  };

  const startExecution = () => {
    setPhase('execution');
  };

  const goToSubmission = () => {
    setPhase('submission');
  };

  const submitTask = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-200 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">{mission.title}</h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="uppercase tracking-wider">{mission.company}</span>
              <span>•</span>
              <span className="font-mono">ID: {mission.id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {phase === 'execution' && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              {isAutosaving ? (
                <span className="text-blue-400 flex items-center gap-1">
                  <Save className="w-3 h-3 animate-pulse" /> Salvando...
                </span>
              ) : (
                <span>Salvo às {lastSaved?.toLocaleTimeString() || '--:--'}</span>
              )}
            </div>
          )}
          
          <div className={`flex items-center gap-2 font-mono text-sm px-3 py-1.5 rounded border ${
            timeLeft < 300 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-800 border-white/10 text-slate-300'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Panel: Context/Data (Always visible in desktop, tab in mobile) */}
        <div className="w-full md:w-1/2 lg:w-2/5 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-slate-900/30">
          <div className="p-4 border-b border-white/10 bg-slate-900/50">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Material de Apoio
            </h2>
          </div>
          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {/* Dynamic Data Rendering based on Job Type */}
            <div className="space-y-4">
              <div className="bg-slate-950 border border-white/10 rounded-lg p-4 font-mono text-xs text-slate-300">
                <div className="flex justify-between border-b border-white/10 pb-2 mb-2">
                  <span className="text-slate-500">DATA_SOURCE_ID</span>
                  <span className="text-blue-400">{mission.id.split('-')[1] || 'RAW_DATA'}</span>
                </div>
                <pre className="whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(mission.data, null, 2)}
                </pre>
              </div>
              
              <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4" />
                  Contexto da IA
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {mission.briefing?.context}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Workflow */}
        <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col bg-slate-950 relative">
          
          {/* Phase 1: Briefing */}
          {phase === 'briefing' && (
            <div className="absolute inset-0 z-10 bg-slate-950 flex flex-col p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto w-full space-y-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Briefing da Missão</h2>
                  <p className="text-slate-400">Leia atentamente antes de iniciar. O tempo começará a contar após o aceite.</p>
                </div>

                <div className="grid gap-6">
                  <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-amber-500" />
                      Requisitos Obrigatórios
                    </h3>
                    <ul className="space-y-3">
                      {mission.briefing?.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-emerald-500" />
                      Critérios de Avaliação (Rubrica)
                    </h3>
                    <div className="space-y-4">
                      {mission.briefing?.rubric.map((r, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">{r.criterion}</span>
                            <span className="text-slate-500">{r.weight}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500/50" style={{ width: `${r.weight}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={startExecution}
                    disabled={briefingTimer > 0}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {briefingTimer > 0 ? (
                      <>Leia o briefing ({briefingTimer}s)</>
                    ) : (
                      <>
                        ACEITAR E INICIAR
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-3">
                    Ao iniciar, você concorda com os termos de confidencialidade (NDA).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Phase 2: Execution */}
          {phase === 'execution' && (
            <div className="flex-grow flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-slate-900/50 flex justify-between items-center">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Checklist de Execução</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Qualidade Prevista:</span>
                  <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                    qualityScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                    qualityScore >= 50 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {qualityScore}/100
                  </div>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-8">
                {/* Steps */}
                <div className="space-y-4">
                  {mission.steps?.map((step) => (
                    <div key={step.id} className="bg-slate-900/50 border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {step.type === 'check' ? (
                            <input
                              type="checkbox"
                              checked={!!checklist[step.id]}
                              onChange={(e) => handleStepChange(step.id, e.target.checked)}
                              className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                              {step.id.replace(/\D/g, '')}
                            </div>
                          )}
                        </div>
                        <div className="flex-grow space-y-2">
                          <label className={`text-sm font-medium ${checklist[step.id] ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                            {step.label}
                          </label>
                          
                          {step.hint && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {step.hint}
                            </p>
                          )}

                          {step.type === 'input' && (
                            <input
                              type="text"
                              placeholder="Digite o valor encontrado..."
                              value={checklist[step.id] || ''}
                              onChange={(e) => handleStepChange(step.id, e.target.value)}
                              className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none mt-2"
                            />
                          )}

                          {step.type === 'select' && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {step.options?.map(opt => (
                                <button
                                  key={opt}
                                  onClick={() => handleStepChange(step.id, opt)}
                                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${
                                    checklist[step.id] === opt
                                      ? 'bg-blue-600 border-blue-500 text-white'
                                      : 'bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Evidence Section */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Relatório Técnico & Evidências
                  </h3>
                  <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden focus-within:border-blue-500/50 transition-colors">
                    <textarea
                      ref={evidenceRef}
                      value={evidenceText}
                      onChange={(e) => setEvidenceText(e.target.value)}
                      placeholder={mission.evidence?.placeholder || "Descreva sua análise..."}
                      className="w-full bg-transparent p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none min-h-[150px] resize-none"
                    />
                    <div className="bg-slate-950 px-4 py-2 flex items-center justify-between border-t border-white/5">
                      <span className={`text-xs ${evidenceText.length < (mission.evidence?.minLength || 100) ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {evidenceText.length} / {mission.evidence?.minLength || 100} caracteres
                      </span>
                      <button className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        <Upload className="w-3 h-3" />
                        Anexar Print
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur-md">
                <button
                  onClick={goToSubmission}
                  disabled={qualityScore < 50} // Basic gate
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {qualityScore < 50 ? (
                    <>Complete mais etapas para enviar</>
                  ) : (
                    <>
                      REVISAR E ENVIAR
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Phase 3: Submission */}
          {phase === 'submission' && (
            <div className="absolute inset-0 z-10 bg-slate-950 flex flex-col p-6 overflow-y-auto">
              <div className="max-w-md mx-auto w-full space-y-8 my-auto">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                    <CheckCircle2 className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Revisão Final</h2>
                  <p className="text-slate-400">Confirme os dados antes de enviar para auditoria.</p>
                </div>

                <div className="bg-slate-900 border border-white/10 rounded-xl p-6 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-sm text-slate-400">Tempo de Execução</span>
                    <span className="text-sm font-mono text-white">
                      {formatTime((mission.briefing?.estimatedTime ? mission.briefing.estimatedTime * 60 : 900) - timeLeft)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-sm text-slate-400">Etapas Concluídas</span>
                    <span className="text-sm font-mono text-white">
                      {Object.keys(checklist).length} / {mission.steps?.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-sm text-slate-400">Qualidade Estimada</span>
                    <span className={`text-sm font-bold ${qualityScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {qualityScore}/100
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-4 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600" />
                    <span className="text-xs text-slate-300">
                      Declaro que todas as informações inseridas são verdadeiras e de minha autoria. Entendo que fraudes resultarão em banimento permanente.
                    </span>
                  </label>

                  <button
                    onClick={submitTask}
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Criptografando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        ENVIAR PARA AUDITORIA
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => setPhase('execution')}
                    disabled={isSubmitting}
                    className="w-full text-slate-400 text-sm hover:text-white transition-colors"
                  >
                    Voltar e Editar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
