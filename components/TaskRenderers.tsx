import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, RotateCcw, FileText, Check, AlertCircle, ShieldCheck, Package, MapPin, Truck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

export function VideoTaskRenderer({ 
  onAttentionCheck 
}: { 
  onAttentionCheck: (passed: boolean) => void 
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const popupTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 0.5;
        });
      }
    }, 100);

    // Random Popup
    const randomTime = Math.random() * 5000 + 2000; // 2-7s
    const timer = setTimeout(() => {
      setShowPopup(true);
      setIsPlaying(false);
    }, randomTime);
    popupTimerRef.current = timer;

    return () => {
      clearInterval(interval);
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, [isPlaying]);

  const handlePopupAction = (action: 'continue' | 'report') => {
    setShowPopup(false);
    setIsPlaying(true);
    onAttentionCheck(true);
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-lg border border-slate-800">
      <div className="absolute inset-0 opacity-50">
        <Image 
          src="https://picsum.photos/seed/video/800/600" 
          alt="Video Content" 
          fill 
          className="object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-blue-400">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${progress}%` }} />
          </div>
          <Volume2 className="w-5 h-5 text-slate-400" />
        </div>
      </div>

      {showPopup && (
        <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-100 mb-2">Verificação de Atenção</h3>
            <p className="text-sm text-slate-400 mb-6">
              O vídeo apresentou alguma violação de direitos autorais até o momento?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => handlePopupAction('continue')}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase transition-all shadow-lg shadow-blue-900/20"
              >
                Não, Continuar
              </button>
              <button 
                onClick={() => handlePopupAction('report')}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase transition-all"
              >
                Sim, Reportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function LogisticsTaskRenderer({ 
  data, 
  onUpdate 
}: { 
  data: any, 
  onUpdate: (val: any) => void 
}) {
  const nfe = data.nfe;
  const [formData, setFormData] = useState({ totalValue: '', issueDate: '', cnpj: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newForm = { ...formData, [e.target.name]: e.target.value };
    setFormData(newForm);
    onUpdate(newForm);
  };

  if (!nfe) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-y-auto p-4 custom-scrollbar">
      {/* NF-e Visualizer - Official DANFE Style */}
      <div className="bg-white p-4 sm:p-8 rounded-sm shadow-2xl border border-gray-400 font-serif text-[9px] text-black min-h-[500px] flex flex-col scale-95 origin-top">
        <div className="border-2 border-black p-2 mb-2 flex justify-between items-center">
          <div className="flex flex-col border-r-2 border-black pr-4 mr-4 flex-grow">
            <div className="font-bold text-sm mb-1">{nfe.company}</div>
            <div className="text-[8px]">AVENIDA DAS NAÇÕES UNIDAS, 12901</div>
            <div className="text-[8px]">SÃO PAULO - SP - CEP: 04578-000</div>
            <div className="text-[8px]">FONE: (11) 5504-1000</div>
          </div>
          <div className="text-center px-4 border-r-2 border-black">
            <div className="font-bold text-xs uppercase">Danfe</div>
            <div className="text-[7px]">Documento Auxiliar da Nota Fiscal Eletrônica</div>
            <div className="flex justify-center gap-2 mt-1">
              <div className="border border-black px-1">0 - ENTRADA</div>
              <div className="border border-black px-1 font-bold">1 - SAÍDA</div>
            </div>
            <div className="font-bold mt-1">Nº 000.442.102</div>
            <div className="font-bold">SÉRIE: 1</div>
          </div>
          <div className="flex flex-col items-center pl-4">
             <div className="w-24 h-8 bg-black mb-1"></div>
             <div className="text-[7px]">Controle do Fisco</div>
          </div>
        </div>

        <div className="border-2 border-black p-2 mb-2">
          <div className="font-bold uppercase text-[7px] mb-1">Chave de Acesso</div>
          <div className="tracking-[0.2em] text-center py-1 bg-gray-50 font-mono text-[10px]">{nfe.accessKey.match(/.{1,4}/g)?.join(' ') || nfe.accessKey}</div>
        </div>

        <div className="border-2 border-black grid grid-cols-3 mb-2">
          <div className="border-r-2 border-black p-1">
            <div className="font-bold uppercase text-[7px]">Natureza da Operação</div>
            <div className="font-medium">VENDA DE MERCADORIA</div>
          </div>
          <div className="border-r-2 border-black p-1">
            <div className="font-bold uppercase text-[7px]">Protocolo de Autorização</div>
            <div className="font-medium">135240008821992 - 05/03/2026</div>
          </div>
          <div className="p-1">
            <div className="font-bold uppercase text-[7px]">CNPJ</div>
            <div className="font-bold text-[10px]">{nfe.cnpj}</div>
          </div>
        </div>

        <div className="border-2 border-black p-2 mb-2">
          <div className="font-bold uppercase text-[7px] mb-1">Destinatário / Remetente</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[7px]">NOME / RAZÃO SOCIAL</div>
              <div className="font-bold">CLIENTE FINAL - CONSUMIDOR</div>
            </div>
            <div>
              <div className="text-[7px]">CNPJ / CPF</div>
              <div className="font-bold">000.000.000-00</div>
            </div>
          </div>
        </div>

        <div className="flex-grow border-2 border-black mb-2 overflow-hidden">
          <table className="w-full text-[8px]">
            <thead className="bg-gray-100 border-b-2 border-black">
              <tr>
                <th className="p-1 border-r border-black">CÓDIGO</th>
                <th className="p-1 border-r border-black">DESCRIÇÃO DOS PRODUTOS / SERVIÇOS</th>
                <th className="p-1 border-r border-black">NCM</th>
                <th className="p-1 border-r border-black">QTD</th>
                <th className="p-1 text-right">V. TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-1 border-r border-black">99281</td>
                <td className="p-1 border-r border-black font-bold">PRESTAÇÃO DE SERVIÇOS DIGITAIS - LOTE #{nfe.accessKey.slice(-4)}</td>
                <td className="p-1 border-r border-black">85423190</td>
                <td className="p-1 border-r border-black">1,00</td>
                <td className="p-1 text-right">R$ {nfe.totalValue}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-2 border-black grid grid-cols-4 bg-gray-50">
          <div className="border-r-2 border-black p-1">
            <div className="font-bold uppercase text-[7px]">Base de Cálculo ICMS</div>
            <div className="font-bold">0,00</div>
          </div>
          <div className="border-r-2 border-black p-1">
            <div className="font-bold uppercase text-[7px]">Valor do ICMS</div>
            <div className="font-bold">0,00</div>
          </div>
          <div className="border-r-2 border-black p-1">
            <div className="font-bold uppercase text-[7px]">Data de Emissão</div>
            <div className="font-bold text-xs">{nfe.issueDate}</div>
          </div>
          <div className="p-1 bg-gray-200">
            <div className="font-bold uppercase text-[7px]">Valor Total da Nota</div>
            <div className="font-bold text-xs">R$ {nfe.totalValue}</div>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="space-y-4">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
          <h4 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            Terminal de Auditoria Fiscal
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">CNPJ do Emitente (Apenas números)</label>
              <input 
                type="text" 
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                placeholder="Ex: 12345678000199"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors font-mono backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Valor Total (R$)</label>
              <input 
                type="text" 
                name="totalValue"
                value={formData.totalValue}
                onChange={handleChange}
                placeholder="Ex: 1250,50"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors font-mono backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Data de Emissão</label>
              <input 
                type="text" 
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                placeholder="DD/MM/AAAA"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors font-mono backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl backdrop-blur-sm">
            <p className="text-[10px] text-amber-200/80 leading-relaxed flex gap-2">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span><strong>Protocolo de Segurança:</strong> A divergência de um único caractere resultará no bloqueio imediato do lote por suspeita de fraude.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AudioTaskRenderer({ 
  data, 
  onUpdate,
  onFinished
}: { 
  data: any, 
  onUpdate: (val: string) => void,
  onFinished?: (finished: boolean) => void
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [translation, setTranslation] = useState('');
  const [isAudioFinished, setIsAudioFinished] = useState(false);

  const handlePlay = () => {
    if (!isPlaying) {
      try {
        const utterance = new SpeechSynthesisUtterance(data.audioText);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.85;
        utterance.pitch = 1;
        
        utterance.onstart = () => {
          setIsPlaying(true);
          setProgress(0);
          setIsAudioFinished(false);
          if (onFinished) onFinished(false);
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
          setProgress(100);
          const newCount = playCount + 1;
          setPlayCount(newCount);
          
          if (newCount >= 2) {
            setIsAudioFinished(true);
            if (onFinished) onFinished(true);
          }
        };

        utterance.onerror = (e) => {
          console.error('SpeechSynthesis Error:', e);
          setIsPlaying(false);
        };

        // Progress simulation (since speechSynthesis doesn't provide real-time progress)
        const duration = data.audioText.length * 80; // Rough estimate
        const start = Date.now();
        const interval = setInterval(() => {
          const elapsed = Date.now() - start;
          const p = Math.min((elapsed / duration) * 100, 100);
          setProgress(p);
          if (p >= 100 || !window.speechSynthesis.speaking) clearInterval(interval);
        }, 50);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Failed to play audio:', err);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranslation(e.target.value);
    onUpdate(e.target.value);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Volume2 className="w-32 h-32 text-blue-500" />
        </div>

        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20 shadow-2xl shadow-blue-900/20">
            <button 
              onClick={handlePlay}
              disabled={isPlaying}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl ${
                isPlaying ? 'bg-slate-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-blue-900/40'
              }`}
            >
              {isPlaying ? (
                <div className="flex gap-1 items-center">
                  <motion.div animate={{ height: [8, 20, 8] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
                  <motion.div animate={{ height: [12, 24, 12] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-1 bg-white rounded-full" />
                  <motion.div animate={{ height: [8, 20, 8] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-1 bg-white rounded-full" />
                </div>
              ) : (
                <Play className="w-10 h-10 text-white fill-current ml-1" />
              )}
            </button>
          </div>

          <div className="w-full max-w-md space-y-4">
            <div className="flex justify-between items-end mb-1">
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Audio Stream #882</span>
                <span className="text-[9px] text-slate-500 font-mono">BITRATE: 128KBPS / 44.1KHZ</span>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${playCount >= 2 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                  {playCount} / 2 REPRODUÇÕES
                </span>
              </div>
            </div>
            
            <div className="h-12 flex items-center gap-1 bg-slate-950/50 rounded-xl px-4 border border-white/5 backdrop-blur-sm">
              {Array.from({ length: 40 }).map((_, i) => {
                const h = 10 + ((i * 7) % 30);
                return (
                  <motion.div 
                    key={i}
                    animate={{ 
                      height: isPlaying ? [h, h + 10, h] : 10,
                      backgroundColor: progress > (i / 40) * 100 ? '#2563eb' : '#334155'
                    }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.02 }}
                    className="w-1 rounded-full"
                  />
                );
              })}
            </div>

            <div className="w-full bg-slate-950/50 h-1.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-blue-600 h-full transition-all duration-100 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-3 h-3 text-blue-500" />
            Transcrição / Tradução
          </label>
          {playCount < 2 && (
            <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              OUÇA MAIS {2 - playCount}X PARA LIBERAR
            </span>
          )}
        </div>
        
        <textarea 
          value={translation}
          onChange={handleInputChange}
          disabled={playCount < 2}
          placeholder={playCount < 2 ? "Aguardando reprodução mínima de segurança..." : "Digite o texto exato do áudio..."}
          className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-6 text-sm text-slate-100 min-h-[140px] focus:outline-none focus:border-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed resize-none font-medium leading-relaxed backdrop-blur-sm shadow-inner"
        />
      </div>
    </div>
  );
}
