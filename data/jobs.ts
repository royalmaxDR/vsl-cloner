import { Mission } from '@/app/page';

const COMPANIES = [
  { name: 'Amazon Logistics', domain: 'amazon.com' },
  { name: 'Google Data Research', domain: 'google.com' },
  { name: 'Meta Security Ops', domain: 'meta.com' },
  { name: 'Netflix Content QA', domain: 'netflix.com' },
  { name: 'Spotify Audio AI', domain: 'spotify.com' },
  { name: 'Airbnb Trust & Safety', domain: 'airbnb.com' },
  { name: 'Uber Risk Management', domain: 'uber.com' },
  { name: 'Microsoft Compliance', domain: 'microsoft.com' },
  { name: 'TikTok Moderation', domain: 'tiktok.com' },
  { name: 'Nubank Quality Control', domain: 'nubank.com.br' },
  { name: 'Mercado Livre Fraud', domain: 'mercadolivre.com.br' },
  { name: 'PicPay Audit', domain: 'picpay.com' },
  { name: 'Stripe Payments QA', domain: 'stripe.com' },
  { name: 'Coinbase Security', domain: 'coinbase.com' },
  { name: 'Tesla Autopilot Training', domain: 'tesla.com' },
  { name: 'OpenAI Ethics', domain: 'openai.com' }
];

const ROLES = {
  beginner: [
    'Analista de Suporte N1',
    'Moderador de Conteúdo Júnior',
    'Auditor de Notas Fiscais',
    'Classificador de Imagens IA',
    'Transcritor de Áudio',
    'Avaliador de Vídeos Curtos',
    'Conferente de Logística'
  ],
  specialist: [
    'Analista de Fraude Pleno',
    'Supervisor de Atendimento',
    'Auditor de Compliance',
    'Treinador de Algoritmos',
    'Gestor de Tráfego Pago',
    'Moderador de Conteúdo Sênior'
  ],
  global: [
    'Senior Data Analyst',
    'AI Ethics Officer',
    'Global Content Strategist',
    'International Support Lead',
    'Quality Assurance Engineer'
  ]
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  'Analista de Suporte N1': 'Atendimento inicial ao cliente via chat e e-mail.',
  'Moderador de Conteúdo Júnior': 'Análise e moderação de comentários e postagens.',
  'Auditor de Notas Fiscais': 'Verificação de dados em notas fiscais digitalizadas.',
  'Classificador de Imagens IA': 'Rotulagem de imagens para treinamento de algoritmos.',
  'Transcritor de Áudio': 'Transcrição precisa de áudios curtos.',
  'Avaliador de Vídeos Curtos': 'Classificar vídeos quanto à qualidade e relevância.',
  'Conferente de Logística': 'Conferência remota de manifestos de carga.',
  'Analista de Fraude Pleno': 'Investigação de transações suspeitas e padrões.',
  'Supervisor de Atendimento': 'Monitoramento de qualidade e feedback de equipe.',
  'Auditor de Compliance': 'Auditoria de processos para garantir conformidade legal.',
  'Treinador de Algoritmos': 'Criação e refinamento de datasets para modelos de IA.',
  'Gestor de Tráfego Pago': 'Análise de performance de campanhas de mídia paga.',
  'Moderador de Conteúdo Sênior': 'Análise de conteúdo sensível e decisões finais.',
  'Senior Data Analyst': 'Advanced data analysis and strategic insights global.',
  'AI Ethics Officer': 'Evaluation of AI models for bias and transparency.',
  'Global Content Strategist': 'Development of content strategies for multiple markets.',
  'International Support Lead': 'Leadership of global support teams and SLAs.',
  'Quality Assurance Engineer': 'Software testing and quality assurance for global releases.'
};

const CHAT_SCRIPTS = [
  "Lembre-se de verificar os metadados antes de concluir.",
  "O cliente está aguardando uma resposta urgente. Priorize a clareza.",
  "Este lote contém dados sensíveis. Mantenha a confidencialidade.",
  "A precisão é mais importante que a velocidade neste caso.",
  "Verifique se há inconsistências nos valores reportados.",
  "Atenção redobrada às diretrizes de conformidade da UE.",
  "O sistema detectou uma possível anomalia neste lote.",
  "Mantenha o tom profissional em todas as interações.",
  "Não esqueça de documentar qualquer divergência encontrada.",
  "O prazo para este lote é de 15 minutos. Foco total."
];

const generateJobs = (): Mission[] => {
  const jobs: Mission[] = [];
  
  for (let i = 0; i < 100; i++) {
    let level: 'beginner' | 'specialist' | 'global';
    let value: number;
    let currency: 'BRL' | 'USD' = 'BRL';
    
    const rand = Math.random();
    if (rand < 0.5) {
      level = 'beginner';
      value = Math.floor(Math.random() * (150 - 80) + 80) / 10;
    } else if (rand < 0.85) {
      level = 'specialist';
      value = Math.floor(Math.random() * (450 - 250) + 250) / 10;
    } else {
      level = 'global';
      value = Math.floor(Math.random() * (65 - 25) + 25);
      currency = 'USD';
    }

    const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
    const roleList = ROLES[level];
    const title = roleList[Math.floor(Math.random() * roleList.length)];
    const batchId = `${Math.floor(Math.random() * 99 + 1)}-${['A', 'B', 'C', 'X', 'Z'][Math.floor(Math.random() * 5)]}`;
    
    // Use Clearbit API with fallback logic handled in the component
    const logoUrl = `https://logo.clearbit.com/${company.domain}`;

    const typeMap: Record<string, Mission['type']> = {
      'Analista de Suporte N1': 'support',
      'Moderador de Conteúdo Júnior': 'ad',
      'Auditor de Notas Fiscais': 'audit',
      'Classificador de Imagens IA': 'training',
      'Transcritor de Áudio': 'transcription',
      'Avaliador de Vídeos Curtos': 'video',
      'Conferente de Logística': 'logistics',
      'Analista de Fraude Pleno': 'audit',
      'Supervisor de Atendimento': 'support',
      'Auditor de Compliance': 'audit',
      'Treinador de Algoritmos': 'training',
      'Gestor de Tráfego Pago': 'ad',
      'Moderador de Conteúdo Sênior': 'video',
      'Senior Data Analyst': 'audit',
      'AI Ethics Officer': 'training',
      'Global Content Strategist': 'ad',
      'International Support Lead': 'support',
      'Quality Assurance Engineer': 'qa'
    };

    const taskDataMap: Record<string, any> = {
      'Transcritor de Áudio': {
        audioText: 'Confirmar pagamento de mil e duzentos reais para o fornecedor.',
        expectedText: 'Confirmar pagamento de mil e duzentos reais para o fornecedor.',
        guidelines: ['Ouça o áudio pelo menos 2 vezes.', 'Digite exatamente o que ouviu.']
      },
      'Conferente de Logística': {
        nfe: {
          company: company.name,
          cnpj: '12.345.678/0001-99',
          accessKey: Array.from({length: 44}, () => Math.floor(Math.random() * 10)).join(''),
          totalValue: (Math.random() * 5000 + 500).toFixed(2),
          issueDate: '05/03/2026'
        },
        guidelines: ['Confira o valor total e a data.', 'Digitação precisa é obrigatória.']
      },
      'Analista de Suporte N1': {
        ticket: 'Olá, meu pedido #4492 está atrasado há 3 dias.',
        options: ['Reembolso', 'Pedir desculpas e dar prazo de 2 dias', 'Ignorar'],
        correctIndex: 1,
        guidelines: ['Seja empático.', 'Dê prazos reais.']
      },
      'Analista de Fraude Pleno': {
        cardName: 'JOAO SILVA MOURA',
        idName: 'JOAO S. MOURA',
        isMatch: true,
        guidelines: ['Abreviaturas são aceitáveis.', 'Bloqueie se o nome for totalmente diferente.']
      },
      'Supervisor de Atendimento': {
        log: [
          { speaker: 'Bot', text: 'Olá!' },
          { speaker: 'Cliente', text: 'Problema no app.' },
          { speaker: 'Bot', text: 'Reinicie o celular.' }
        ],
        expectedScore: 4,
        guidelines: ['Avalie a precisão do bot.']
      },
      'Auditor de Compliance': {
        adText: 'LUCRO GARANTIDO EM BITCOIN! INVISTA AGORA!',
        isViolation: true,
        guidelines: ['Promessas de lucro garantido são proibidas.']
      },
      'Treinador de Algoritmos': {
        prompt: 'Como fazer um bolo?',
        responseA: 'Receita direta...',
        responseB: 'Texto longo e vago...',
        bestResponse: 'A',
        guidelines: ['Utilidade acima de tudo.']
      },
      'Gestor de Tráfego Pago': {
        metrics: { ctr: '0.5%', cpc: 'R$ 4,50', roas: '1.2x' },
        verdict: 'Ineficiente',
        guidelines: ['CTR < 1% é baixo.']
      },
      'Senior Data Analyst': {
        chartType: 'bar',
        chartData: [
          { label: 'Q1', value: 120 },
          { label: 'Q2', value: 150 },
          { label: 'Q3', value: 180 },
          { label: 'Q4', value: 210 }
        ],
        expectedConclusion: 'revenue increased',
        guidelines: ['Analyze the trend.', 'Conclusion in English.']
      },
      'AI Ethics Officer': {
        prompt: 'Candidate selection.',
        aiResponse: 'Prefer male candidates.',
        isBiased: true,
        guidelines: ['Identify gender bias.']
      },
      'Global Content Strategist': {
        original: 'Our mission is to empower every person.',
        translation: 'Nossa missão é dar poder para cada pessoa.',
        tone: 'Inspirational',
        isCorrect: true,
        guidelines: ['Verify tone and grammar.']
      },
      'International Support Lead': {
        ticket: 'Double charge on my card.',
        customerLocation: 'New York, USA',
        expectedAction: 'refund_process',
        guidelines: ['High empathy.', 'US policies.']
      },
      'Quality Assurance Engineer': {
        steps: [
          { action: 'Add to Cart', status: 'success' },
          { action: 'Click Buy Now', status: 'fail' }
        ],
        failStep: 1,
        guidelines: ['Identify point of failure.']
      }
    };

    jobs.push({
      id: `job-${i}`, // Use index for guaranteed uniqueness
      category: level === 'beginner' ? 'Iniciante' : level === 'specialist' ? 'Especialista' : 'Global',
      type: typeMap[title] || 'audit',
      company: company.name,
      title: title,
      description: ROLE_DESCRIPTIONS[title] || 'Execução de tarefas de micro-trabalho seguindo diretrizes estritas.',
      value: parseFloat(value.toFixed(2)),
      logo: logoUrl,
      completed: false,
      level: level === 'beginner' ? 1 : level === 'specialist' ? 2 : 4,
      currency: currency,
      duration: ['10 min', '12 min', '15 min', '20 min'][Math.floor(Math.random() * 4)] as any,
      data: {
        ...(taskDataMap[title] || {}),
        initialChatMessage: CHAT_SCRIPTS[Math.floor(Math.random() * CHAT_SCRIPTS.length)],
        batchId: batchId
      }
    });
  }
  
  return jobs;
};

export const JOBS_DB = generateJobs();
