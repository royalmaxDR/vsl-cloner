import { useState } from 'react';
import { User, Mail, Calendar, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function OnboardingView({ onComplete }: { onComplete: (profile: any) => void }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    experience: ''
  });

  const progress = (step / 3) * 100;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      // Simulate verification
      setTimeout(() => {
        onComplete(profile);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_100%)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
          <motion.div 
            className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="text-center mb-8 mt-4">
          <h2 className="text-2xl font-bold text-white mb-2">Concluir Perfil Profissional</h2>
          <p className="text-gray-400 text-sm">
            Falta pouco para liberar suas tarefas nacionais.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-[56px]"
                    placeholder="Ex: Maria Silva"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="email" 
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-[56px]"
                    placeholder="Seu e-mail de contato"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Idade</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="number" 
                    value={profile.age}
                    onChange={(e) => setProfile({...profile, age: e.target.value})}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-[56px]"
                    placeholder="Sua idade"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Gênero</label>
                <select 
                  value={profile.gender}
                  onChange={(e) => setProfile({...profile, gender: e.target.value})}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none h-[56px]"
                >
                  <option value="" disabled>Selecione...</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Nível de Experiência com Computador</label>
              <div className="space-y-3">
                {['Nenhuma', 'Básica', 'Intermediária'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setProfile({...profile, experience: level})}
                    className={`w-full text-left px-5 py-4 rounded-2xl border transition-all h-[56px] flex items-center justify-between ${
                      profile.experience === level 
                        ? 'bg-blue-600/10 border-blue-600 text-white' 
                        : 'bg-slate-950/50 border-white/10 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{level}</span>
                      {profile.experience === level && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8">
          <button 
            onClick={handleNext}
            disabled={
              (step === 1 && (!profile.name || !profile.email)) ||
              (step === 2 && (!profile.age || !profile.gender)) ||
              (step === 3 && !profile.experience)
            }
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-900/40 disabled:shadow-none h-[56px]"
          >
            {step === 3 ? 'FINALIZAR PERFIL' : 'PRÓXIMO PASSO'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {step === 3 && profile.experience && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center gap-2 text-sm text-blue-400 bg-blue-400/10 py-2.5 px-5 rounded-full border border-blue-400/20"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Perfil Verificado para Tarefas Nacionais</span>
        </motion.div>
      )}
    </div>
  );
}
