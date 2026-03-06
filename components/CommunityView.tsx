import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Lock, MessageCircle, Heart, Share2, Star, CheckCircle2, X, Send } from 'lucide-react';
import Image from 'next/image';
import { UserProfile } from '@/app/page';

const brazilianNames = [
  "Marcos Vinícius", "Ana Beatriz", "Cláudia Souza", "Ricardo Lima",
  "João Silva", "Maria Santos", "Pedro Costa", "Lucas Pereira", "Julia Rodrigues",
  "Gabriel Almeida", "Laura Carvalho", "Mateus Gomes", "Beatriz Martins", "Rafael Araújo",
  "Larissa Melo", "Thiago Ribeiro", "Camila Alves", "Bruno Barbosa", "Letícia Cardoso",
  "Gustavo Rocha", "Amanda Dias", "Felipe Castro", "Fernanda Fernandes", "Diego Pinto",
  "Carolina Moura", "Eduardo Cavalcanti", "Bruna Monteiro", "Leonardo Correia", "Juliana Lima",
  "Rodrigo Teixeira", "Vanessa Mendes", "Marcelo Vieira", "Aline Borges", "Guilherme Farias",
  "Patrícia Machado", "Henrique Barros", "Natália Moraes", "Caio Freitas", "Renata Nunes",
  "Vinícius Pires", "Mariana Duarte", "Daniel Ramos", "Isabela Moraes", "Alexandre Cunha",
  "Tatiana Viana", "Arthur Peixoto", "Priscila Rocha", "Vitor Nogueira", "Luana Batista",
  "Fernando Marques", "Sabrina Neves", "Igor Sales", "Bianca Reis", "Roberto Campos",
  "Thais Azevedo", "Leandro Aguiar", "Débora Moraes", "André Paiva", "Mônica Silveira",
  "Victor Dantas", "Cíntia Pires", "Samuel Fogaça", "Talita Guedes", "Tiago Assis",
  "Nayara Lemos", "Douglas Macedo", "Evelyn Viana", "Murilo Pacheco", "Gisele Franco",
  "Renato Brito", "Lívia Bentes", "Fábio Meireles", "Suelen Gusmão", "Anderson Lira",
  "Flávia Muniz", "Elias Sampaio", "Raquel Novaes", "Wesley Teles", "Paloma Barreto",
  "Márcio Valente", "Tainá Cordeiro", "Alex Goulart", "Lorena Pimenta", "Willian Bicalho",
  "Bárbara Leal", "Alan Furtado", "Milena Veloso", "Hugo Tavares", "Joana Diniz",
  "Wellington Maia", "Kelly Brandão", "Breno Lovato", "Joyce Camargo", "César Fontes",
  "Silvia Rangel", "Danilo Prado", "Mirian Lacerda", "Edson Xavier", "Teresa Pinho",
  "Jéssica Oliveira"
];

const cities = [
  "São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Salvador, BA", 
  "Fortaleza, CE", "Brasília, DF", "Curitiba, PR", "Manaus, AM", "Recife, PE", 
  "Porto Alegre, RS", "Goiânia, GO", "Belém, PA", "Campinas, SP", "São Luís, MA"
];

const generateProfiles = () => {
  return brazilianNames.map((name, index) => ({
    id: index,
    name,
    city: cities[Math.floor(Math.random() * cities.length)],
    earnings: (Math.random() * (5000 - 1000) + 1000).toFixed(2).replace('.', ','),
    avatar: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/100/100`,
    isOnline: false
  }));
};

const POSTS = [
  {
    id: 1,
    author: "Jéssica Oliveira",
    avatar: "https://picsum.photos/seed/JessicaOliveira/100/100",
    content: "Alguém conseguiu a vaga da Amazon de hoje? Pagança absurda! 🚀",
    likes: 24,
    comments: 5,
    time: "2 min atrás",
    earnings: "1.152,40"
  },
  {
    id: 2,
    author: "Marcos Vinícius",
    avatar: "https://picsum.photos/seed/MarcosVinicius/100/100",
    content: "Meu bônus de R$ 600 caiu! Muito obrigado pelas dicas do módulo 2 galera 🙏",
    likes: 89,
    comments: 12,
    time: "15 min atrás",
    earnings: "1.520,00"
  },
  {
    id: 3,
    author: "Ana Beatriz",
    avatar: "https://picsum.photos/seed/AnaBeatriz/100/100",
    content: "Dica de ouro: As tarefas de IA da Meta estão pagando o dobro hoje. Corram!",
    likes: 156,
    comments: 34,
    time: "1 hora atrás",
    earnings: "1.080,75"
  },
  {
    id: 4,
    author: "Ricardo Lima",
    avatar: "https://picsum.photos/seed/RicardoLima/100/100",
    content: "Primeiro saque de R$ 1.340,50 processado com sucesso! Demorou os 7 dias certinho, valeu a pena a espera.",
    likes: 210,
    comments: 45,
    time: "2 horas atrás",
    earnings: "1.340,50"
  }
];

const VETERAN_RESPONSES = [
  "Fala! Cara, foca nas tarefas da Meta e Google, são as que pagam melhor e aprovam rápido.",
  "O segredo é bater os R$ 1.000 logo nos primeiros dias. Depois é só esperar o ciclo de 7 dias de auditoria.",
  "Não desiste! Meu primeiro saque demorou os 7 dias certinho, mas depois cai direto no PIX.",
  "As tarefas de IA pagam em dólar, vale muito a pena. Já tirei uns R$ 3k só esse mês.",
  "O ciclo de 7 dias é normal, é norma de compliance (KYC/AML) das empresas gringas. Fica tranquilo que paga certinho."
];

export default function CommunityView({ 
  profile, 
  onJoinCommunity 
}: { 
  profile: UserProfile,
  onJoinCommunity: () => void 
}) {
  const [profiles, setProfiles] = useState(generateProfiles());
  const [isJoining, setIsJoining] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<{id: string, text: string, isUser: boolean}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [feedPosts, setFeedPosts] = useState(POSTS);
  const [postInput, setPostInput] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const messageCounter = useRef(0);

  useEffect(() => {
    // Randomly set 15-25 profiles as online
    const updateOnlineStatus = () => {
      const numOnline = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
      const shuffled = [...profiles].sort(() => 0.5 - Math.random());
      const onlineIds = shuffled.slice(0, numOnline).map(p => p.id);
      
      setProfiles(prev => prev.map(p => ({
        ...p,
        isOnline: onlineIds.includes(p.id)
      })));
    };

    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [profiles]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleJoin = () => {
    setIsJoining(true);
    setTimeout(() => {
      setIsJoining(false);
      onJoinCommunity();
    }, 1500);
  };

  const openChat = (user: any) => {
    setActiveChatUser(user);
    setChatMessages([
      { id: `msg-${messageCounter.current++}`, text: `E aí! Vi que você é novo por aqui. Precisando de dicas pra bater a meta de R$ 1.000?`, isUser: false }
    ]);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessages = [...chatMessages, { id: `msg-${messageCounter.current++}`, text: chatInput, isUser: true }];
    setChatMessages(newMessages);
    setChatInput('');

    // Simulate veteran response
    setTimeout(() => {
      const randomResponse = VETERAN_RESPONSES[Math.floor(Math.random() * VETERAN_RESPONSES.length)];
      setChatMessages(prev => [...prev, { id: `msg-${messageCounter.current++}`, text: randomResponse, isUser: false }]);
    }, 1500 + Math.random() * 2000);
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postInput.trim()) return;

    setIsPosting(true);
    setTimeout(() => {
      const newPost = {
        id: Date.now(),
        author: profile.name || "Você",
        avatar: "https://picsum.photos/seed/user/100/100",
        content: postInput,
        likes: 0,
        comments: 0,
        time: "Agora mesmo",
        earnings: "0,00"
      };
      
      setFeedPosts([newPost, ...feedPosts]);
      setPostInput('');
      setIsPosting(false);

      // Simulate veteran commenting on user's post
      setTimeout(() => {
        setFeedPosts(prev => prev.map(p => {
          if (p.id === newPost.id) {
            return { ...p, comments: p.comments + 1, likes: p.likes + 1 };
          }
          return p;
        }));
      }, 3000 + Math.random() * 5000);
    }, 1000);
  };

  const onlineCount = profiles.filter(p => p.isOnline).length;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24 relative min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Comunidade VIP
          </h1>
          <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {onlineCount} membros online agora
          </p>
        </div>
      </div>

      {/* Content Area - Blurred if not a member */}
      <div className={`space-y-6 transition-all duration-500 ${!profile.isCommunityMember ? 'blur-md opacity-50 pointer-events-none select-none' : ''}`}>
        
        {/* Online Members Horizontal Scroll */}
        <div>
          <h2 className="text-sm font-bold text-white mb-3 px-1">Veteranos Online (Clique para conversar)</h2>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {profiles.filter(p => p.isOnline).map(member => (
              <button 
                key={member.id} 
                onClick={() => openChat(member)}
                className="flex flex-col items-center gap-1 min-w-[72px] focus:outline-none group"
              >
                <div className="relative transition-transform group-hover:scale-105">
                  <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-primary to-accent">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                      <Image src={member.avatar} alt={member.name} width={64} height={64} className="object-cover" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full"></div>
                </div>
                <span className="text-[10px] font-medium text-gray-300 truncate w-full text-center group-hover:text-white">
                  {member.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Create Post */}
        <div className="glass-panel rounded-3xl p-4 border-white/5">
          <form onSubmit={handlePost} className="flex gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
              <Image src="https://picsum.photos/seed/user/100/100" alt="Você" width={40} height={40} />
            </div>
            <div className="flex-grow flex flex-col gap-2">
              <textarea 
                value={postInput}
                onChange={(e) => setPostInput(e.target.value)}
                placeholder="Compartilhe seus resultados ou faça uma pergunta..."
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 resize-none focus:outline-none min-h-[40px]"
                rows={2}
              />
              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={!postInput.trim() || isPosting}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2 px-4 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isPosting ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      Publicar
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {feedPosts.map(post => (
            <div key={post.id} className="glass-panel rounded-3xl p-5 border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image src={post.avatar} alt={post.author} width={40} height={40} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white text-sm">{post.author}</span>
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-[10px] text-gray-500">Ganhou R$ {post.earnings} • {post.time}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                {post.content}
              </p>
              
              <div className="flex items-center gap-6 pt-3 border-t border-white/5">
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-primary transition-colors">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs font-bold">{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs font-bold">{post.comments}</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors ml-auto">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {activeChatUser && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-x-0 bottom-0 z-50 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-96 bg-black/95 backdrop-blur-xl border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[60vh] sm:h-[500px]"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                    <Image src={activeChatUser.avatar} alt={activeChatUser.name} width={40} height={40} />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1">
                    {activeChatUser.name}
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  </h3>
                  <p className="text-[10px] text-emerald-400">Online agora</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveChatUser(null)}
                className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.isUser 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white/10 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-grow bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim()}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paywall Overlay */}
      {!profile.isCommunityMember && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 pt-20 pb-32 bg-gradient-to-t from-background via-background/80 to-transparent">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl p-6 border-primary/20 bg-black/60 backdrop-blur-xl max-w-sm w-full text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
            
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito aos Melhores</h2>
            
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              Junte-se a +1.500 colaboradores ativos, acesse dicas de tarefas de alto valor e receba suporte dos veteranos.
            </p>

            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Taxa de Adesão Única</div>
              <div className="text-3xl font-bold text-white">R$ 19,90</div>
            </div>
            
            <button 
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              {isJoining ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Star className="w-5 h-5" />
                  DESBLOQUEAR COMUNIDADE
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-500 mt-4">
              Pagamento 100% seguro. Acesso imediato após a confirmação.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
