import { AgencyModule, Plan, FAQItem, Lead, FinancialEntry, CalendarEvent } from './types';

export const INITIAL_MODULES: AgencyModule[] = [
  {
    id: 'financeiro',
    name: 'Financeiro',
    description: 'KPIs em tempo real: MRR, ARR, LTV, CAC e Churn Rate',
    price: 0,
    isIncluded: true,
    iconName: 'DollarSign'
  },
  {
    id: 'fluxo_caixa',
    name: 'Fluxo de Caixa',
    description: 'Controle total de entradas, saídas e categorias',
    price: 0,
    isIncluded: true,
    iconName: 'TrendingUp'
  },
  {
    id: 'trafego',
    name: 'Tráfego',
    description: 'Dashboards de Facebook Ads, Google Ads integrados',
    price: 47,
    isIncluded: false,
    iconName: 'BarChart3'
  },
  {
    id: 'maps_scraper',
    name: 'Maps Scraper',
    description: 'Extraia leads do Google Maps e importe para o CRM',
    price: 97,
    isIncluded: false,
    iconName: 'MapPin'
  },
  {
    id: 'calculadora_roi',
    name: 'Calculadora ROI',
    description: 'Preveja faturamento e calcule rentabilidade real',
    price: 0,
    isIncluded: true,
    iconName: 'Calculator'
  },
  {
    id: 'agenda',
    name: 'Agenda',
    description: 'Calendário inteligente com eventos e compromissos',
    price: 0,
    isIncluded: true,
    iconName: 'Calendar'
  },
  {
    id: 'ia_consultora',
    name: 'IA Consultora',
    description: 'Chat que lê seus dados e sugere ações de gestão',
    price: 97,
    isIncluded: false,
    iconName: 'Sparkles'
  }
];

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 197,
    description: 'Ideal para agências iniciantes organizarem suas finanças',
    features: [
      'Dashboard Financeiro (MRR, LTV, CAC)',
      'Fluxo de Caixa',
      'Agenda',
      'Calculadora de ROI',
      '1 usuário'
    ],
    buttonText: 'Assinar Starter'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 497,
    description: 'O plano perfeito para agências que buscam escala acelerada',
    features: [
      'Tudo do Starter',
      'Dashboard de Tráfego',
      'Maps Scraper + CRM',
      'IA Consultora (GPT)',
      '3 usuários',
      'Exportação CSV/Excel'
    ],
    isPopular: true,
    buttonText: 'Assinar Pro'
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 997,
    description: 'Para agências de grande porte com múltiplos clientes',
    features: [
      'Tudo do Pro',
      'Multi-tenant (clientes)',
      'White Label',
      'Usuários Ilimitados',
      'API Access',
      'Suporte prioritário'
    ],
    buttonText: 'Falar com Vendas'
  }
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq1',
    question: 'Preciso instalar alguma coisa?',
    answer: 'Não! O AgencyOS é 100% baseado em nuvem e funciona no seu navegador, celular ou computador, sem necessidade de servidores ou instalações complexas.'
  },
  {
    id: 'faq2',
    question: 'Meus dados são seguros?',
    answer: 'Sim, extremamente. Nós utilizamos criptografia SSL de ponta a ponta e isolamento total de dados para garantir que seus registros fiquem seguros e inacessíveis para terceiros.'
  },
  {
    id: 'faq3',
    question: 'Posso cancelar quando quiser?',
    answer: 'Com certeza! Nossos planos não têm período de fidelidade ou multas de cancelamento. Você pode alterar seu plano ou cancelar sua assinatura a qualquer momento com um único clique.'
  },
  {
    id: 'faq4',
    question: 'A IA Consultora tem acesso a todos os dados?',
    answer: 'A IA Consultora foi projetada com privacidade e isolamento total de dados (tecnologia RAG). Ela só lê as informações do seu painel e os documentos que você compartilha se você autorizar explicitamente, sem usar seus dados para alimentar modelos públicos terceiros.'
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'l1',
    name: 'Clínica OdontoSorriso - Dr. Mateus',
    phone: '(11) 98765-4321',
    address: 'Av. Paulista, 1200 - Bela Vista, São Paulo - SP',
    category: 'Dentista',
    rating: 4.6,
    reviewsCount: 84,
    status: 'Novo',
    website: 'odontosorrisopaulista.com.br'
  },
  {
    id: 'l2',
    name: 'Academia FitLife & Saúde',
    phone: '(11) 97722-1144',
    address: 'Rua Augusta, 450 - Consolação, São Paulo - SP',
    category: 'Academia',
    rating: 4.2,
    reviewsCount: 156,
    status: 'Em Contato',
    website: 'academiafitlife.com.br'
  },
  {
    id: 'l3',
    name: 'Belli Capelli Salão de Beleza',
    phone: '(21) 96123-9988',
    address: 'Av. Atlântica, 1820 - Copacabana, Rio de Janeiro - RJ',
    category: 'Salão de Beleza',
    rating: 4.8,
    reviewsCount: 204,
    status: 'Ganho',
    website: 'bellicapellisalao.com.br'
  },
  {
    id: 'l4',
    name: 'Imobiliária Prime Properties',
    phone: '(19) 3254-8899',
    address: 'Av. Norte Sul, 800 - Cambuí, Campinas - SP',
    category: 'Imobiliária',
    rating: 3.9,
    reviewsCount: 32,
    status: 'Novo'
  },
  {
    id: 'l5',
    name: 'Oficina Mecânica Precision Car',
    phone: '(31) 3456-1212',
    address: 'Av. do Contorno, 5400 - Savassi, Belo Horizonte - MG',
    category: 'Oficina Mecânica',
    rating: 4.7,
    reviewsCount: 91,
    status: 'Não Tem Interesse',
    website: 'precisioncarbh.com.br'
  }
];

export const INITIAL_TRANSACTIONS: FinancialEntry[] = [
  {
    id: 't1',
    description: 'Assinatura Mensal - Clínica OdontoSorriso',
    amount: 1500.00,
    type: 'receita',
    category: 'Gestão de Tráfego',
    date: '2026-05-20'
  },
  {
    id: 't2',
    description: 'Faturamento Mensal - Academia FitLife',
    amount: 2000.00,
    type: 'receita',
    category: 'Consultoria e CRM',
    date: '2026-05-18'
  },
  {
    id: 't3',
    description: 'Ferramente de CRM & Disparador',
    amount: -350.00,
    type: 'despesa',
    category: 'Software e Ferramentas',
    date: '2026-05-17'
  },
  {
    id: 't4',
    description: 'Taxa Cloud Server - VPS Leads',
    amount: -120.00,
    type: 'despesa',
    category: 'Infraestrutura',
    date: '2026-05-15'
  },
  {
    id: 't5',
    description: 'Prospecção e Nutrição de Leads Pro',
    amount: 900.00,
    type: 'receita',
    category: 'Maps Scraper Services',
    date: '2026-05-12'
  }
];

export const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Alinhamento OdontoSorriso - Meta de leads',
    date: '2026-05-25',
    time: '14:00',
    module: 'Tráfego',
    color: '#a3e635'
  },
  {
    id: 'e2',
    title: 'Conselho de Gestão - Techify Integrator',
    date: '2026-05-26',
    time: '10:00',
    module: 'Financeiro',
    color: '#0ea5e9'
  },
  {
    id: 'e3',
    title: 'Demostração Maps Scraper Leads - Novo Lead',
    date: '2026-05-27',
    time: '16:30',
    module: 'Maps Scraper',
    color: '#f43f5e'
  }
];

export const MOCK_EXTRACTION_RECORDS: Record<string, Omit<Lead, 'id' | 'status'>[]> = {
  'restaurante': [
    { name: 'Pizzaria Bella Italia', phone: '(11) 96541-2299', address: 'Rua Pamplona, 950 - Jardim Paulista', category: 'Restaurante', rating: 4.5, reviewsCount: 312, website: 'bellaitaliapizzas.com' },
    { name: 'Burger & Craft House', phone: '(11) 3885-3300', address: 'Av. Brigadeiro Luis Antônio, 3400', category: 'Restaurante', rating: 4.7, reviewsCount: 618 },
    { name: 'Sushi Golden Delivery', phone: '(11) 94451-2233', address: 'Alameda Lorena, 1500 - Cerqueira César', category: 'Restaurante', rating: 4.1, reviewsCount: 78, website: 'sushigolden.com' },
  ],
  'dentista': [
    { name: 'Vitta Odontologia Avançada', phone: '(11) 3254-1188', address: 'Av. Paulista, 1800 - Conj 12', category: 'Dentista', rating: 4.9, reviewsCount: 142, website: 'vittaodonto.com.br' },
    { name: 'Sorria Mais Consultório Integrado', phone: '(11) 98112-5566', address: 'Rua Bela Cintra, 890 - Consolação', category: 'Dentista', rating: 4.4, reviewsCount: 56 },
  ],
  'academia': [
    { name: 'Iron Gym Club', phone: '(11) 3455-8888', address: 'Rua da Consolação, 1200 - Higienópolis', category: 'Academia', rating: 4.6, reviewsCount: 290 },
    { name: 'Studio Pilates & Cross', phone: '(11) 97788-5522', address: 'Alameda Santos, 450 - Cerqueira César', category: 'Academia', rating: 4.8, reviewsCount: 110, website: 'studiopilatescross.com' },
  ],
  'padaria': [
    { name: 'Panificadora Pão de Cristal', phone: '(11) 3844-5511', address: 'Rua Augusta, 2100 - Cerqueira César', category: 'Padaria', rating: 4.3, reviewsCount: 420 },
    { name: 'Boutique do Trigo', phone: '(11) 99334-1122', address: 'Alameda Franca, 120 - Jardim Paulista', category: 'Padaria', rating: 4.7, reviewsCount: 175, website: 'boutiquedotrigo.com' },
  ]
};
