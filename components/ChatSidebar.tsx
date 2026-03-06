import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Paperclip, MoreVertical, X } from 'lucide-react';

type Message = {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
};

export default function ChatSidebar({ 
  supervisorName, 
  isOpen, 
  onClose,
  initialMessage,
  proactiveMessage
}: { 
  supervisorName: string, 
  isOpen: boolean, 
  onClose: () => void,
  initialMessage?: string,
  proactiveMessage?: string
}) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: '1',
      sender: 'agent',
      text: initialMessage || `Olá! Sou ${supervisorName}, responsável pela supervisão desta tarefa. Siga as diretrizes com atenção.`,
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = useCallback((sender: 'user' | 'agent', text: string) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      sender,
      text,
      timestamp: Date.now()
    }]);
  }, []);

  // Proactive message after 2 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      addMessage('agent', proactiveMessage || `Prossiga com a análise dos dados. O lote expira em breve.`);
    }, 120000); // 2 minutes

    return () => clearTimeout(timer);
  }, [addMessage, proactiveMessage]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    addMessage('user', inputValue);
    const userText = inputValue.toLowerCase();
    setInputValue('');

    // Smart Auto-Replies
    setTimeout(() => {
      if (userText.includes('sacar') || userText.includes('saque') || userText.includes('pagamento')) {
        addMessage('agent', 'Sua liquidação está programada para o 7º dia após auditoria de conformidade.');
      } else if (userText.includes('ajuda') || userText.includes('duvida') || userText.includes('erro')) {
        addMessage('agent', 'Por favor, consulte as diretrizes no painel à direita. Se o erro persistir, reporte como "Escalar".');
      } else if (userText.includes('ola') || userText.includes('oi')) {
        addMessage('agent', 'Olá. Vamos manter o foco na produtividade. Alguma dúvida técnica?');
      }
    }, 1500 + Math.random() * 2000); // Random delay 1.5-3.5s
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-40 shadow-2xl"
        >
          {/* Header */}
          <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">{supervisorName}</h3>
                <p className="text-[10px] text-emerald-400 font-medium">Online • Supervisão</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/30">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                  }`}
                >
                  {msg.text}
                  <div className={`text-[9px] mt-1 opacity-50 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-800 bg-slate-900">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2 focus-within:border-indigo-500/50 transition-colors">
              <button className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className={`p-2 rounded-lg transition-all ${
                  inputValue.trim() 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20' 
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
