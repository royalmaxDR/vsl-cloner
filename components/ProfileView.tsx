import { useState } from 'react';
import { UserProfile } from '@/app/page';
import { User, Mail, Calendar, ShieldCheck, Star, Award, CheckCircle2, Globe, Key, Edit2, Save, Camera } from 'lucide-react';
import Image from 'next/image';

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
    if (level === 'Nacional Bronze') return 'text-amber-700 border-amber-200 bg-amber-50';
    if (level === 'Nacional Prata') return 'text-slate-700 border-slate-200 bg-slate-50';
    if (level === 'Nacional Ouro') return 'text-yellow-700 border-yellow-200 bg-yellow-50';
    return 'text-blue-700 border-blue-200 bg-blue-50';
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
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500 p-1">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden relative">
              {profile.avatar ? (
                <Image src={profile.avatar} alt={profile.name} fill className="object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-500" />
              )}
            </div>
          </div>
          <button 
            onClick={() => setShowAvatarSelector(!showAvatarSelector)}
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:scale-110 transition-transform"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>
        
        {showAvatarSelector && (
          <div className="bg-white rounded-2xl p-4 mb-6 border border-slate-200 shadow-lg animate-in fade-in slide-in-from-top-4">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Escolha seu Avatar</h4>
            
            <div className="mb-4">
              <label className="flex items-center justify-center w-full h-12 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="text-xs font-bold text-blue-600 flex items-center gap-2">
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
                    profile.avatar === avatar ? 'border-blue-600 scale-105' : 'border-transparent hover:border-slate-200'
                  }`}
                >
                  <Image src={avatar} alt={`Avatar ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
            <button 
              onClick={() => handleSelectAvatar('')}
              className="w-full mt-3 py-2 text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
            >
              Remover Foto
            </button>
          </div>
        )}

        <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${getLevelColor(profile.level)}`}>
            Nível: {profile.level}
          </span>
          {profile.isVerified && (
            <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              Verificado
            </span>
          )}
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900">Progresso de Nível</span>
          </div>
          <span className="text-sm text-slate-600">{profile.tasksCompleted} / {nextLevelTasks || 'Max'}</span>
        </div>
        
        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 border border-slate-200 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-600 text-center">
          {profile.level === 'Global' 
            ? 'Você atingiu o nível máximo!' 
            : `Complete mais ${nextLevelTasks - profile.tasksCompleted} tarefas para subir de nível`}
        </p>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-4">Dados Pessoais</h3>
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
            <Mail className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">E-mail</div>
            <div className="text-sm font-medium text-slate-900">{profile.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
            <Calendar className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Idade</div>
            <div className="text-sm font-medium text-slate-900">{profile.age} anos</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
            <Star className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Experiência Inicial</div>
            <div className="text-sm font-medium text-slate-900">{profile.experience}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Key className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-grow">
            <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center justify-between">
              Chave PIX
              {!isEditingPix && (
                <button onClick={() => setIsEditingPix(true)} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
                />
                <button onClick={handleSavePix} className="p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-700">
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                {profile.pixKey ? profile.pixKey : <span className="text-amber-600 text-xs">Não cadastrada (Necessário para Nível 2)</span>}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Premium Status */}
      {profile.isPremium && (
        <div className="bg-white rounded-3xl p-6 border border-purple-200 shadow-sm flex items-center gap-4 bg-gradient-to-br from-purple-50 to-white">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 border border-purple-200">
            <Globe className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Acesso Global Ativo</h4>
            <p className="text-xs text-slate-600">Você pode realizar tarefas em Dólar e Euro.</p>
          </div>
        </div>
      )}
    </div>
  );
}
