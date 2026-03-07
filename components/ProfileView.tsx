import { useState } from 'react';
import { UserProfile } from '@/app/page';
import { User, Mail, Calendar, ShieldCheck, Star, Award, CheckCircle2, Globe, Key, Edit2, Save, Camera } from 'lucide-react';
import Image from 'next/image';
import UserAvatar from './UserAvatar';

const AVATARS = [
  "https://picsum.photos/seed/avatar1/100/100",
  "https://picsum.photos/seed/avatar2/100/100",
  "https://picsum.photos/seed/avatar3/100/100",
  "https://picsum.photos/seed/avatar4/100/100",
  "https://picsum.photos/seed/avatar5/100/100",
  "https://picsum.photos/seed/avatar6/100/100",
];

export default function ProfileView({ profile, onUpdateProfile }: { profile: UserProfile, onUpdateProfile: (updates: Partial<UserProfile>) => void }) {
  const [isEditingPix, setIsEditingPix] = useState(false);
  const [pixKeyInput, setPixKeyInput] = useState(profile.pixKey || '');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const getLevelColor = (level: string) => {
    if (level === 'Nacional Bronze') return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
    if (level === 'Nacional Prata') return 'text-slate-300 border-slate-500/20 bg-slate-500/10';
    if (level === 'Nacional Ouro') return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
    return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
  };

  const nextLevelTasks = profile.level === 'Nacional Bronze' ? 5 : profile.level === 'Nacional Prata' ? 15 : profile.level === 'Nacional Ouro' ? 50 : 0;
  const progress = nextLevelTasks > 0 ? (profile.tasksCompleted / nextLevelTasks) * 100 : 100;

  const handleSavePix = () => {
    onUpdateProfile({ pixKey: pixKeyInput });
    setIsEditingPix(false);
  };

  const handleSelectAvatar = (avatarUrl: string) => {
    onUpdateProfile({ avatar: avatarUrl });
    setShowAvatarSelector(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfile({ avatar: reader.result as string });
        setShowAvatarSelector(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24">
      <div className="text-center mb-6">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 p-1 shadow-lg shadow-blue-900/40">
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center overflow-hidden relative">
              <UserAvatar src={profile.avatar} name={profile.name} size={90} />
            </div>
          </div>
          <button 
            onClick={() => setShowAvatarSelector(!showAvatarSelector)}
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-lg hover:scale-110 transition-transform"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>
        
        {showAvatarSelector && (
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 mb-6 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Escolha seu Avatar</h4>
            
            <div className="mb-4">
              <label className="flex items-center justify-center w-full h-12 border border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Carregar Foto da Galeria
                </span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {AVATARS.map((avatar, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSelectAvatar(avatar)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    profile.avatar === avatar ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/20' : 'border-transparent hover:border-white/20'
                  }`}
                >
                  <Image src={avatar} alt={`Avatar ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
            <button 
              onClick={() => handleSelectAvatar('')}
              className="w-full mt-3 py-2 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors"
            >
              Remover Foto
            </button>
          </div>
        )}

        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">{profile.name}</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${getLevelColor(profile.level)}`}>
            {profile.level}
          </span>
          {profile.isVerified && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              Verificado
            </span>
          )}
        </div>
      </div>

      {/* Level Progress */}
      <div className="glass-panel rounded-3xl p-6 border-white/10 bg-slate-900/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-slate-100 text-sm uppercase tracking-wide">Progresso de Nível</span>
          </div>
          <span className="text-xs font-bold text-slate-400">{profile.tasksCompleted} / {nextLevelTasks || 'Max'}</span>
        </div>
        
        <div className="w-full bg-slate-950/50 rounded-full h-2.5 mb-2 border border-white/5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider font-bold">
          {profile.level === 'Global' 
            ? 'Você atingiu o nível máximo!' 
            : `Complete mais ${nextLevelTasks - profile.tasksCompleted} tarefas para subir de nível`}
        </p>
      </div>

      {/* Personal Info */}
      <div className="glass-panel rounded-3xl p-6 border-white/10 bg-slate-900/40 space-y-5">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-500" />
          Dados Pessoais
        </h3>
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center flex-shrink-0 border border-white/5">
            <Mail className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">E-mail</div>
            <div className="text-sm font-medium text-slate-200">{profile.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center flex-shrink-0 border border-white/5">
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Idade</div>
            <div className="text-sm font-medium text-slate-200">{profile.age} anos</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center flex-shrink-0 border border-white/5">
            <Star className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Experiência</div>
            <div className="text-sm font-medium text-slate-200">{profile.experience}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
            <Key className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-grow">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
              Chave PIX
              {!isEditingPix && (
                <button onClick={() => setIsEditingPix(true)} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                  <Edit2 className="w-3 h-3" /> Editar
                </button>
              )}
            </div>
            {isEditingPix ? (
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="text" 
                  value={pixKeyInput}
                  onChange={(e) => setPixKeyInput(e.target.value)}
                  placeholder="Sua chave PIX"
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-1.5 px-3 text-slate-100 focus:outline-none focus:border-blue-500 text-sm placeholder:text-slate-600"
                />
                <button onClick={handleSavePix} className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-sm font-medium text-slate-200 flex items-center gap-2 mt-1">
                {profile.pixKey ? profile.pixKey : <span className="text-amber-500 text-xs font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Não cadastrada</span>}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Premium Status */}
      {profile.isPremium && (
        <div className="glass-panel rounded-3xl p-6 border-purple-500/30 shadow-xl flex items-center gap-4 bg-gradient-to-br from-purple-900/20 to-slate-900/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-purple-500/5 blur-xl"></div>
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 border border-purple-500/20 relative z-10">
            <Globe className="w-6 h-6 text-purple-400" />
          </div>
          <div className="relative z-10">
            <h4 className="font-bold text-slate-100 text-sm uppercase tracking-wide">Acesso Global Ativo</h4>
            <p className="text-xs text-slate-400 mt-0.5">Você pode realizar tarefas em Dólar e Euro.</p>
          </div>
        </div>
      )}
    </div>
  );
}
