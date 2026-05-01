import Link from 'next/link';
import { Zap, Video, Tag, Globe, ArrowRight, CheckCircle, Shield, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/4 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold">VSL Cloner</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-slate-400 hover:text-white text-sm font-medium transition px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
          <Zap className="w-3.5 h-3.5" />
          Clone funis VSL em segundos
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight max-w-4xl mx-auto">
          Clone qualquer funil{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            VSL
          </span>{' '}
          e publique com seus links
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Cole a URL de qualquer página VSL. O sistema extrai automaticamente o player,
          vídeos .m3u8, pixels de rastreamento, delay de CTA e links de checkout — tudo pronto
          para você personalizar e publicar.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-200 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
          >
            Criar conta grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium text-lg px-6 py-4 rounded-2xl border border-slate-700 hover:border-slate-500 transition-all duration-200 hover:bg-slate-800"
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Tudo que você precisa para clonar funis VSL
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Video className="w-6 h-6 text-purple-400" />,
                color: 'bg-purple-500/10 border-purple-500/20',
                title: 'Extração de Players',
                desc: 'Detecta e extrai automaticamente players ConvertAI, VTurb e SmartPlayer com todos os IDs e manifestos .m3u8.',
              },
              {
                icon: <Tag className="w-6 h-6 text-blue-400" />,
                color: 'bg-blue-500/10 border-blue-500/20',
                title: 'Pixels e Rastreamento',
                desc: 'Identifica Facebook Pixel, Google Analytics e UTMify. Troque pelo seu ID com um clique.',
              },
              {
                icon: <Clock className="w-6 h-6 text-yellow-400" />,
                color: 'bg-yellow-500/10 border-yellow-500/20',
                title: 'Delay de CTA',
                desc: 'Detecta configurações de delay (scrollToActionIn, ctaDelay) para replicar a mesma experiência do funil original.',
              },
              {
                icon: <Globe className="w-6 h-6 text-green-400" />,
                color: 'bg-green-500/10 border-green-500/20',
                title: 'Publicação Instantânea',
                desc: 'Gera uma URL pública para sua página clonada com seus links de checkout e pixels personalizados.',
              },
              {
                icon: <Shield className="w-6 h-6 text-indigo-400" />,
                color: 'bg-indigo-500/10 border-indigo-500/20',
                title: 'Server-side Seguro',
                desc: 'Todo processamento ocorre no servidor, evitando bloqueios CORS e garantindo extração confiável.',
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-emerald-400" />,
                color: 'bg-emerald-500/10 border-emerald-500/20',
                title: 'Editor Visual',
                desc: 'Interface limpa para trocar checkout, pixel e textos. Preview do relatório de extração em tempo real.',
              },
            ].map(({ icon, color, title, desc }) => (
              <div key={title} className={`glass-panel rounded-2xl p-6 border ${color}`}>
                <div className={`w-12 h-12 rounded-xl ${color} border flex items-center justify-center mb-4`}>
                  {icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Players supported */}
      <section className="relative z-10 py-12 px-4 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-500 text-sm mb-6 uppercase tracking-wider">Players suportados</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {['ConvertAI', 'VTurb', 'SmartPlayer'].map((player) => (
              <div
                key={player}
                className="glass-panel px-6 py-3 rounded-xl text-slate-300 font-semibold text-sm"
              >
                {player}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="relative z-10 py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pronto para clonar seu primeiro funil?
          </h2>
          <p className="text-slate-400 mb-8">
            Crie sua conta gratuitamente e comece a clonar funis VSL agora mesmo.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-200 shadow-2xl shadow-blue-500/30 hover:-translate-y-0.5"
          >
            Começar agora — é grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 py-8 px-4 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} VSL Cloner. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
