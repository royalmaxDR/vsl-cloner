import { useState } from 'react';
import { Mail, ArrowRight, Building2, Globe, Briefcase, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginView({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate Supabase Magic Link
    console.log('Enviando link de confirmação para:', email);
    alert('Verifique seu e-mail de compra. Enviamos um link de acesso exclusivo para você.');
    
    // Simulate CPF Lock check (7 days)
    localStorage.setItem('hopro_cpf', cpf);
    localStorage.setItem('hopro_login_time', Date.now().toString());
    
    setLoading(false);
    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_100%)] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl z-10 relative"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-6 shadow-lg shadow-blue-500/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">HomeOffice Pro</h1>
          <p className="text-slate-400 text-sm">
            Insira o e-mail utilizado na compra para receber seu link de acesso exclusivo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Email da Compra</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="email" 
                placeholder="nome@empresa.com" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-[56px]"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase ml-1">CPF do Titular</label>
            <div className="relative group">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="000.000.000-00" 
                required
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-[56px]"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all mt-6 shadow-xl shadow-blue-900/40 group h-[56px] disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar Link de Acesso'}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 text-slate-500">
            <div className="flex items-center gap-2 text-xs">
              <Globe className="w-3 h-3" />
              <span>Global Access</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Briefcase className="w-3 h-3" />
              <span>Enterprise Only</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 text-center max-w-xs">
            Ambiente seguro e monitorado. O acesso não autorizado é proibido e sujeito a penalidades.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
