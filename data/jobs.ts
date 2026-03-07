import { Mission } from '@/app/page';

const COMPANIES = [
  { name: 'Amazon Logistics', domain: 'amazon.com', logo: 'https://logo.clearbit.com/amazon.com' },
  { name: 'Google Data Research', domain: 'google.com', logo: 'https://logo.clearbit.com/google.com' },
  { name: 'Meta Security Ops', domain: 'meta.com', logo: 'https://logo.clearbit.com/meta.com' },
  { name: 'Netflix Content QA', domain: 'netflix.com', logo: 'https://logo.clearbit.com/netflix.com' },
  { name: 'Spotify Audio AI', domain: 'spotify.com', logo: 'https://logo.clearbit.com/spotify.com' },
  { name: 'Airbnb Trust & Safety', domain: 'airbnb.com', logo: 'https://logo.clearbit.com/airbnb.com' },
  { name: 'Uber Risk Management', domain: 'uber.com', logo: 'https://logo.clearbit.com/uber.com' },
  { name: 'Microsoft Compliance', domain: 'microsoft.com', logo: 'https://logo.clearbit.com/microsoft.com' },
  { name: 'TikTok Moderation', domain: 'tiktok.com', logo: 'https://logo.clearbit.com/tiktok.com' },
  { name: 'Nubank Quality Control', domain: 'nubank.com.br', logo: 'https://logo.clearbit.com/nubank.com.br' },
  { name: 'Mercado Livre Fraud', domain: 'mercadolivre.com.br', logo: 'https://logo.clearbit.com/mercadolivre.com.br' },
  { name: 'PicPay Audit', domain: 'picpay.com', logo: 'https://logo.clearbit.com/picpay.com' },
  { name: 'Stripe Payments QA', domain: 'stripe.com', logo: 'https://logo.clearbit.com/stripe.com' },
  { name: 'Coinbase Security', domain: 'coinbase.com', logo: 'https://logo.clearbit.com/coinbase.com' },
  { name: 'Tesla Autopilot Training', domain: 'tesla.com', logo: 'https://logo.clearbit.com/tesla.com' },
  { name: 'OpenAI Ethics', domain: 'openai.com', logo: 'https://logo.clearbit.com/openai.com' }
];

const JOB_TEMPLATES: Mission[] = [
  {
    id: 'TEMPLATE-AUDIT',
    category: 'Especialista',
    type: 'audit',
    company: 'Nubank Quality Control',
    title: 'Auditoria de Fraude em Transações Pix',
    value: 65.00,
    logo: '',
    completed: false,
    level: 2,
    currency: 'BRL',
    duration: '15 min',
    description: 'Análise detalhada de padrões suspeitos em transferências P2P.',
    briefing: {
      context: 'Detectamos um aumento de 15% em fraudes do tipo "Golpe do Pix" em contas recém-criadas. Sua missão é analisar um lote de 5 transações suspeitas e determinar se devem ser bloqueadas ou liberadas.',
      requirements: [
        'Analisar histórico de IP e Device ID.',
        'Verificar padrão de horário das transações.',
        'Cruzar dados com listas de laranjas conhecidos.',
        'Gerar relatório técnico justificando cada bloqueio.'
      ],
      rubric: [
        { criterion: 'Precisão na Detecção', weight: 40 },
        { criterion: 'Clareza do Relatório', weight: 30 },
        { criterion: 'Uso de Evidências', weight: 30 }
      ],
      estimatedTime: 15
    },
    steps: [
      { id: 's1', label: 'Verificar IP de Origem (Geolocalização)', type: 'check', hint: 'IPs de estados diferentes em < 1h são suspeitos.' },
      { id: 's2', label: 'Analisar Device Fingerprint', type: 'check', hint: 'Dispositivos com root/jailbreak têm alto risco.' },
      { id: 's3', label: 'Checar vínculo com chaves Pix aleatórias', type: 'check' },
      { id: 's4', label: 'Validar valor médio de transação (Ticket Médio)', type: 'input', hint: 'Digite o valor médio das últimas 3 transações.' },
      { id: 's5', label: 'Classificar Risco da Conta', type: 'select', options: ['Baixo', 'Médio', 'Alto', 'Crítico'] }
    ],
    evidence: {
      type: 'text',
      minLength: 150,
      placeholder: 'Descreva os padrões anômalos encontrados (ex: IP rotativo, valor fracionado, horário atípico). Cite os IDs das transações bloqueadas.'
    },
    data: {
      transactions: [
        { id: 'TX-9921', value: 'R$ 4.500,00', time: '02:14 AM', ip: '192.168.1.1 (SP)', device: 'Android 10 (Rooted)' },
        { id: 'TX-9922', value: 'R$ 12,50', time: '14:30 PM', ip: '192.168.1.5 (RJ)', device: 'iPhone 12' }
      ]
    }
  },
  {
    id: 'TEMPLATE-AD',
    category: 'Iniciante',
    type: 'ad',
    company: 'TikTok Moderation',
    title: 'Moderação de Conteúdo Sensível (Ads)',
    value: 50.00,
    logo: '',
    completed: false,
    level: 1,
    currency: 'BRL',
    duration: '15 min',
    description: 'Revisão de anúncios para garantir conformidade com as diretrizes da comunidade.',
    briefing: {
      context: 'Nossa IA sinalizou este lote de anúncios como potencialmente violadores das regras de "Promessas de Ganho Fácil" e "Conteúdo Enganoso". Precisamos de revisão humana para confirmar.',
      requirements: [
        'Assistir aos vídeos completos (não pular).',
        'Verificar se há promessas de "dinheiro rápido" ou "urubu do pix".',
        'Checar se o áudio condiz com a legenda.',
        'Classificar a severidade da violação.'
      ],
      rubric: [
        { criterion: 'Assertividade', weight: 50 },
        { criterion: 'Tempo de Análise', weight: 20 },
        { criterion: 'Justificativa', weight: 30 }
      ],
      estimatedTime: 15
    },
    steps: [
      { id: 's1', label: 'Assistir vídeo 1 (30s)', type: 'check' },
      { id: 's2', label: 'Identificar promessa de lucro garantido', type: 'select', options: ['Sim', 'Não', 'Dúvida'] },
      { id: 's3', label: 'Verificar uso de imagem de celebridades (Deepfake)', type: 'check' },
      { id: 's4', label: 'Analisar Landing Page de destino', type: 'check', hint: 'Links encurtados ou sem HTTPS são suspeitos.' },
      { id: 's5', label: 'Veredito Final', type: 'select', options: ['Aprovar', 'Rejeitar - Golpe', 'Rejeitar - Nudez', 'Rejeitar - Spam'] }
    ],
    evidence: {
      type: 'text',
      minLength: 100,
      placeholder: 'Justifique sua decisão citando o minuto exato da violação e qual regra foi quebrada.'
    },
    data: {
      videoUrl: 'https://example.com/video-placeholder.mp4',
      landingPage: 'bit.ly/ganhe-dinheiro-agora'
    }
  },
  {
    id: 'TEMPLATE-QA',
    category: 'Especialista',
    type: 'qa',
    company: 'Netflix Content QA',
    title: 'Quality Assurance de Legendas PT-BR',
    value: 75.00,
    logo: '',
    completed: false,
    level: 2,
    currency: 'BRL',
    duration: '20 min',
    description: 'Validação de sincronia e tradução de legendas para novos lançamentos.',
    briefing: {
      context: 'Estamos lançando uma nova série documental e precisamos garantir que as legendas em PT-BR estejam perfeitamente sincronizadas e localizadas culturalmente.',
      requirements: [
        'Verificar timecodes de entrada e saída.',
        'Identificar erros de digitação ou gramática.',
        'Validar adaptação de gírias e expressões idiomáticas.',
        'Reportar falhas de quebra de linha.'
      ],
      rubric: [
        { criterion: 'Atenção aos Detalhes', weight: 40 },
        { criterion: 'Conhecimento Linguístico', weight: 40 },
        { criterion: 'Formatação', weight: 20 }
      ],
      estimatedTime: 20
    },
    steps: [
      { id: 's1', label: 'Revisar bloco 00:00 - 05:00', type: 'check' },
      { id: 's2', label: 'Identificar erro de sincronia (> 500ms)', type: 'input', hint: 'Informe o timecode do erro.' },
      { id: 's3', label: 'Verificar tradução de termos técnicos', type: 'check' },
      { id: 's4', label: 'Checar legibilidade (contraste/tamanho)', type: 'check' },
      { id: 's5', label: 'Aprovar qualidade geral', type: 'select', options: ['Excelente', 'Bom', 'Regular', 'Ruim'] }
    ],
    evidence: {
      type: 'text',
      minLength: 120,
      placeholder: 'Liste as correções sugeridas no formato: [Timecode] Original -> Sugestão.'
    },
    data: {
      contentId: 'DOC-S01E04',
      language: 'PT-BR'
    }
  },
  {
    id: 'TEMPLATE-SUPPORT',
    category: 'Global',
    type: 'support',
    company: 'Airbnb Trust & Safety',
    title: 'Resolução de Disputas (Tier 2)',
    value: 12.00, // USD
    logo: '',
    completed: false,
    level: 4,
    currency: 'USD',
    duration: '20 min',
    description: 'Mediação de conflitos entre anfitriões e hóspedes envolvendo danos à propriedade.',
    briefing: {
      context: 'Um anfitrião alega que o hóspede danificou uma TV de 50 polegadas. O hóspede nega. Precisamos analisar as evidências (fotos, mensagens) e decidir sobre o reembolso.',
      requirements: [
        'Analisar fotos do "antes" e "depois".',
        'Ler o histórico de chat na plataforma.',
        'Verificar se a reclamação foi feita dentro do prazo de 24h.',
        'Calcular depreciação do item danificado.'
      ],
      rubric: [
        { criterion: 'Imparcialidade', weight: 30 },
        { criterion: 'Análise de Evidências', weight: 40 },
        { criterion: 'Comunicação', weight: 30 }
      ],
      estimatedTime: 20
    },
    steps: [
      { id: 's1', label: 'Verificar data do check-out e da reclamação', type: 'check' },
      { id: 's2', label: 'Analisar metadados das fotos enviadas', type: 'check', hint: 'As fotos devem ser datadas do dia do checkout.' },
      { id: 's3', label: 'Ler chat em busca de admissão de culpa', type: 'check' },
      { id: 's4', label: 'Estimar valor de mercado do item', type: 'input', hint: 'Pesquise o modelo da TV e informe o valor atual.' },
      { id: 's5', label: 'Decisão Final', type: 'select', options: ['Reembolso Total', 'Reembolso Parcial', 'Negar Pedido'] }
    ],
    evidence: {
      type: 'text',
      minLength: 200,
      placeholder: 'Redija a resposta oficial para ambas as partes, explicando a decisão baseada nas evidências analisadas.'
    },
    data: {
      ticketId: 'DISPUTE-8821',
      claimAmount: '$450.00'
    }
  },
  {
    id: 'TEMPLATE-TRAINING',
    category: 'Iniciante',
    type: 'training',
    company: 'Tesla Autopilot Training',
    title: 'Rotulagem de Objetos em Vias Urbanas',
    value: 55.00,
    logo: '',
    completed: false,
    level: 1,
    currency: 'BRL',
    duration: '15 min',
    description: 'Identificação e marcação de pedestres, ciclistas e obstáculos em imagens de câmeras veiculares.',
    briefing: {
      context: 'Para melhorar a segurança do nosso sistema de direção autônoma, precisamos de dados rotulados com alta precisão em cenários urbanos complexos (chuva, noite).',
      requirements: [
        'Marcar TODOS os pedestres visíveis, mesmo parcialmente ocultos.',
        'Diferenciar ciclistas de motociclistas.',
        'Sinalizar placas de trânsito ilegíveis.',
        'Ignorar reflexos em vitrines.'
      ],
      rubric: [
        { criterion: 'Cobertura (Recall)', weight: 50 },
        { criterion: 'Precisão (Precision)', weight: 30 },
        { criterion: 'Velocidade', weight: 20 }
      ],
      estimatedTime: 15
    },
    steps: [
      { id: 's1', label: 'Ajustar brilho/contraste da imagem', type: 'check' },
      { id: 's2', label: 'Contar número de pedestres na cena', type: 'input' },
      { id: 's3', label: 'Verificar oclusão (objetos escondidos)', type: 'check' },
      { id: 's4', label: 'Identificar semáforos ativos', type: 'select', options: ['Verde', 'Amarelo', 'Vermelho', 'Nenhum/Desligado'] },
      { id: 's5', label: 'Confirmar rotulagem completa', type: 'check' }
    ],
    evidence: {
      type: 'text',
      minLength: 80,
      placeholder: 'Descreva as condições climáticas e de iluminação da cena analisada e quaisquer dificuldades encontradas.'
    },
    data: {
      batchId: 'CAM-FRONT-Lidar-09',
      conditions: 'Night/Rain'
    }
  },
  {
    id: 'TEMPLATE-LOGISTICS',
    category: 'Especialista',
    type: 'logistics',
    company: 'Amazon Logistics',
    title: 'Otimização de Rotas de Entrega - Last Mile',
    value: 70.00,
    logo: '',
    completed: false,
    level: 2,
    currency: 'BRL',
    duration: '20 min',
    description: 'Revisão manual de rotas geradas por IA para evitar áreas de risco e otimizar tempo.',
    briefing: {
      context: 'Algumas rotas geradas automaticamente estão enviando motoristas para ruas sem saída ou áreas com restrição de horário. Precisamos de validação humana para ajustar o trajeto final.',
      requirements: [
        'Verificar restrições de tráfego local (zonas de rodízio).',
        'Evitar áreas marcadas como "Alto Risco de Roubo".',
        'Agrupar entregas no mesmo condomínio.',
        'Garantir pausa para almoço do motorista.'
      ],
      rubric: [
        { criterion: 'Eficiência', weight: 40 },
        { criterion: 'Segurança', weight: 40 },
        { criterion: 'Compliance', weight: 20 }
      ],
      estimatedTime: 20
    },
    steps: [
      { id: 's1', label: 'Analisar mapa de calor de criminalidade', type: 'check' },
      { id: 's2', label: 'Identificar gargalos de trânsito em tempo real', type: 'check' },
      { id: 's3', label: 'Reordenar paradas 4 e 5 (Otimização)', type: 'check' },
      { id: 's4', label: 'Calcular tempo total estimado', type: 'input', hint: 'Em minutos.' },
      { id: 's5', label: 'Aprovar Rota Modificada', type: 'select', options: ['Sim', 'Não - Requer Supervisão'] }
    ],
    evidence: {
      type: 'text',
      minLength: 120,
      placeholder: 'Justifique as alterações feitas na rota original. Ex: "Desviei da Rua X devido a alagamento reportado".'
    },
    data: {
      routeId: 'SP-ZSL-992',
      driver: 'Carlos M.'
    }
  }
];

const generateJobs = (count: number): Mission[] => {
  const jobs: Mission[] = [];
  
  for (let i = 0; i < count; i++) {
    // Pick a random template
    const template = JOB_TEMPLATES[Math.floor(Math.random() * JOB_TEMPLATES.length)];
    
    // Pick a random company suitable for the type if possible, or generic
    const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
    
    // Generate random value variation (+- 20%)
    const valueVariation = (Math.random() * 0.4) + 0.8; 
    const value = Number((template.value * valueVariation).toFixed(2));
    
    // Create unique ID
    const id = `JOB-${template.type.toUpperCase()}-${1000 + i}`;
    
    // Clone and modify
    const job: Mission = {
      ...template,
      id,
      company: company.name,
      logo: company.logo,
      value,
      // Randomly mark some as completed for realism if needed, but usually we want available jobs
      completed: false, 
      // Add slight variation to title
      title: `${template.title} #${1000 + i}`,
      // Randomize data slightly
      data: {
        ...template.data,
        generatedId: Math.random().toString(36).substring(7).toUpperCase()
      }
    };
    
    jobs.push(job);
  }
  
  return jobs;
};

// Generate 1000 jobs
export const JOBS_DB = generateJobs(1000);
