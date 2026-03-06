import { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle2, Lock, Award, PlayCircle, Clock, FileText } from 'lucide-react';
import Image from 'next/image';
import { UserProfile } from '@/app/page';

const MODULES = [
  {
    id: 'Certificação em Suporte',
    title: 'Certificação em Suporte',
    description: 'Aprenda as melhores práticas de atendimento ao cliente e resolução de conflitos.',
    duration: '2h 30m',
    lessons: 12,
    image: 'https://picsum.photos/seed/support/400/200',
    level: 'Iniciante'
  },
  {
    id: 'Certificação em IA Visual',
    title: 'Certificação em IA Visual',
    description: 'Domine as técnicas de rotulagem de dados para visão computacional.',
    duration: '3h 15m',
    lessons: 15,
    image: 'https://picsum.photos/seed/iavisual/400/200',
    level: 'Intermediário'
  },
  {
    id: 'Certificação Internacional',
    title: 'Certificação Internacional',
    description: 'Prepare-se para tarefas globais e receba em Dólar e Euro.',
    duration: '4h 00m',
    lessons: 20,
    image: 'https://picsum.photos/seed/intl/400/200',
    level: 'Avançado'
  }
];

export default function AcademyView({ 
  profile, 
  onCompleteModule 
}: { 
  profile: UserProfile, 
  onCompleteModule: (moduleId: string) => void 
}) {
  const [learningModule, setLearningModule] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleStartModule = (moduleId: string) => {
    setLearningModule(moduleId);
    setProgress(0);
    
    // Simulate learning progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onCompleteModule(moduleId);
            setLearningModule(null);
          }, 500);
          return 100;
        }
        return prev + 2; // 50 steps * 50ms = 2.5s total
      });
    }, 50);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Academia Pro
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Qualifique-se para desbloquear tarefas de alto valor.
          </p>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {MODULES.map(module => {
          const isCompleted = profile.completedModules?.includes(module.id);
          const isLearningThis = learningModule === module.id;

          return (
            <div key={module.id} className="glass-panel rounded-3xl overflow-hidden border-white/5 relative group">
              {/* Module Image */}
              <div className="h-32 w-full relative">
                <Image src={module.image} alt={module.title} width={400} height={200} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                
                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                    module.level === 'Iniciante' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                    module.level === 'Intermediário' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                    'bg-purple-500/20 border-purple-500/30 text-purple-400'
                  }`}>
                    {module.level}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 relative">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white leading-tight">{module.title}</h3>
                  {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                </div>
                
                <p className="text-xs text-gray-400 mb-4 line-clamp-2">
                  {module.description}
                </p>
                
                <div className="flex items-center gap-4 text-[10px] text-gray-500 font-medium mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {module.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {module.lessons} Aulas
                  </span>
                </div>

                {isLearningThis ? (
                  <div className="w-full bg-white/10 rounded-full h-10 flex items-center px-4 relative overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-primary/20 transition-all duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                    <span className="text-xs font-bold text-white relative z-10 w-full text-center">
                      Progresso: {Math.round(progress)}%
                    </span>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleStartModule(module.id)}
                    disabled={isCompleted}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      isCompleted 
                        ? 'bg-emerald-500/10 text-emerald-400 cursor-default border border-emerald-500/20'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <Award className="w-4 h-4" />
                        Certificado Emitido
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        Iniciar Módulo
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
