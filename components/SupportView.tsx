import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, MessageCircle, ShieldCheck, Clock, FileText } from 'lucide-react';

const faqs = [
  {
    id: 1,
    question: 'Como acelerar minha análise?',
    answer: 'A análise é automática e leva em média 24 horas úteis. Para acelerar, certifique-se de preencher todas as tarefas com atenção e manter uma boa taxa de aprovação. Usuários com nível Especialista ou Global têm prioridade na fila de análise.',
    icon: Clock
  },
  {
    id: 2,
    question: 'Qual o limite de saque diário?',
    answer: 'O limite de saque varia conforme o seu nível. Iniciantes podem sacar até R$ 50,00 por dia. Intermediários até R$ 150,00. Especialistas e Globais não possuem limite diário de saque.',
    icon: FileText
  },
  {
    id: 3,
    question: 'Meus dados estão seguros?',
    answer: 'Sim! Utilizamos criptografia de ponta a ponta (AES-256) para proteger todos os seus dados pessoais e financeiros. Nossa plataforma segue rigorosamente as diretrizes da LGPD (Lei Geral de Proteção de Dados).',
    icon: ShieldCheck
  },
  {
    id: 4,
    question: 'Por que meu saldo está em análise?',
    answer: 'O saldo "Em Análise" é uma medida de segurança para garantir que a tarefa foi realizada corretamente e evitar fraudes. Após a verificação pelo nosso sistema automatizado (que leva até 24h), o valor é transferido para o seu Saldo Disponível.',
    icon: HelpCircle
  }
];

export default function SupportView() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4 border border-blue-500/20 shadow-lg shadow-blue-900/20">
          <MessageCircle className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2 tracking-tight">Central de Suporte</h1>
        <p className="text-slate-400 text-sm">
          Tire suas dúvidas e entenda como a plataforma funciona.
        </p>
      </div>

      {/* Contact Widget */}
      <div className="glass-panel rounded-3xl p-6 border-white/10 flex items-center justify-between mb-8 bg-slate-900/40 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center flex-shrink-0 border border-white/5">
            <MessageCircle className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100">Atendimento Online</h3>
            <p className="text-xs text-slate-400">Seg a Sex, 09h às 18h</p>
          </div>
        </div>
        <button className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-bold py-2 px-4 rounded-xl text-sm transition-colors border border-blue-500/20">
          Iniciar Chat
        </button>
      </div>

      {/* FAQ Section */}
      <div>
        <h3 className="text-lg font-bold text-slate-100 tracking-tight mb-4">Perguntas Frequentes</h3>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div 
              key={faq.id} 
              className="glass-panel rounded-2xl border-white/10 overflow-hidden transition-all bg-slate-900/40 backdrop-blur-xl"
            >
              <button
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${openFaq === faq.id ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800/50 text-slate-400'}`}>
                    <faq.icon className="w-5 h-5" />
                  </div>
                  <span className={`font-bold text-sm ${openFaq === faq.id ? 'text-blue-400' : 'text-slate-200'}`}>{faq.question}</span>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-slate-500 transition-transform ${openFaq === faq.id ? 'rotate-180 text-blue-400' : ''}`} 
                />
              </button>
              
              <AnimatePresence>
                {openFaq === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5 pt-0"
                  >
                    <div className="text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4 pl-10">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
