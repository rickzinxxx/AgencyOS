import React, { useState, useEffect, useRef } from 'react';
import { 
  Bolt, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  MapPin, 
  Calculator, 
  Calendar, 
  Sparkles, 
  Plus, 
  Trash2, 
  Search, 
  Send, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Globe, 
  Phone, 
  ArrowRight, 
  Clock, 
  ChevronRight,
  User,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Lock,
  PlusCircle,
  Star,
  Radio,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_LEADS, 
  INITIAL_EVENTS, 
  MOCK_EXTRACTION_RECORDS 
} from '../data';
import { FinancialEntry, Lead, CalendarEvent, ChatMessage } from '../types';
import { 
  initCalendarAuth, 
  signInGoogleCalendar, 
  logoutGoogleCalendar, 
  fetchGoogleCalendarEvents, 
  insertGoogleCalendarEvent 
} from '../lib/googleCalendar';

import { getApps, initializeApp, getApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserSession } from '../App';

interface DashboardDemoProps {
  initialActiveModules: string[];
  initialPlanId: string;
  onExit: () => void;
  user: UserSession | null;
  initialWorkspaceId?: string | null;
}

export default function DashboardDemo({ 
  initialActiveModules, 
  initialPlanId, 
  onExit,
  user,
  initialWorkspaceId
}: DashboardDemoProps) {
  // Config state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeModules, setActiveModules] = useState<string[]>(initialActiveModules);
  const [planId, setPlanId] = useState<string>(initialPlanId);

  // Google Calendar Integration states
  const [gUser, setGUser] = useState<any>(null);
  const [gToken, setGToken] = useState<string | null>(null);
  const [isGCalendarConnecting, setIsGCalendarConnecting] = useState(false);
  const [gEvents, setGEvents] = useState<any[]>([]);
  const [syncWithGoogleCheck, setSyncWithGoogleCheck] = useState(true);
  const [isFetchingGEvents, setIsFetchingGEvents] = useState(false);

  // Tour popup states
  const [showTour, setShowTour] = useState(false);
  const [tourContent, setTourContent] = useState({ title: '', desc: '', bullets: [] as string[] });

  // Load and check Google Calendar connection on boot
  useEffect(() => {
    const unsub = initCalendarAuth(
      (user, token) => {
        setGUser(user);
        setGToken(token);
        handleFetchGoogleEvents(token);
      },
      () => {
        setGUser(null);
        setGToken(null);
      }
    );
    return () => unsub();
  }, []);

  const handleFetchGoogleEvents = async (token: string) => {
    setIsFetchingGEvents(true);
    try {
      const gEvs = await fetchGoogleCalendarEvents(token);
      setGEvents(gEvs);
    } catch (e) {
      console.error('Erro ao listar eventos do Google Calendar:', e);
    } finally {
      setIsFetchingGEvents(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsGCalendarConnecting(true);
    try {
      const res = await signInGoogleCalendar();
      if (res) {
        setGUser(res.user);
        setGToken(res.token);
        alert(`Sucesso! Google Agenda conectado como ${res.user.email}`);
        handleFetchGoogleEvents(res.token);
      }
    } catch (e: any) {
      alert("Erro ao conectar ao Google Agenda: " + (e.message || e));
    } finally {
      setIsGCalendarConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    const confirmLogout = window.confirm("Deseja realmente desconectar sua conta do Google Agenda?");
    if (!confirmLogout) return;
    try {
      await logoutGoogleCalendar();
      setGUser(null);
      setGToken(null);
      setGEvents([]);
      alert("Google Agenda desconectado com sucesso.");
    } catch (e) {
      console.error(e);
    }
  };

  // Explanation Tour Trigger per tab (Once per tab via localStorage)
  const triggerTour = (tab: string, forced: boolean = false) => {
    const tourData: Record<string, { title: string; desc: string; bullets: string[] }> = {
      dashboard: {
        title: "📈 Painel de KPIs Financeiros",
        desc: "O painel principal consolida as métricas financeiras essenciais da sua agência em gráficos e cartões dinâmicos de alta legibilidade.",
        bullets: [
          "**MRR & ARR**: Acompanhe o faturamento recorrente mensal e anual em tempo real de acordo com as receitas de seus contratos ativos.",
          "**LTV & CAC**: Analise quanto seus clientes valem ao longo de seus contratos contra o custo investido para trazê-los.",
          "**Relação LTV/CAC**: Uma proporção acima de 3.0x indica uma operação comercial saudável de margens extremamente lucrativas."
        ]
      },
      fluxo_caixa: {
        title: "💸 Livro de Fluxo de Caixa",
        desc: "Aqui você gerencia o andamento financeiro diário da agência, permitindo o registro estrito de cada receita e despesa.",
        bullets: [
          "**Lançamento Rápido**: Adicione receitas ou despesas preenchendo valor, tipo e data.",
          "**Sincronização Direta**: Ao registrar lançamentos recorrentes ou saídas de caixa, o painel primário de KPIs atualiza na hora.",
          "**Classificação**: Organize custos operacionais por categoria (Softwares, Tráfego, etc.) para otimizar suas margens."
        ]
      },
      calculadora_roi: {
        title: "🧮 Calculadora de ROI de Vendas",
        desc: "Um simulador interativo ideal para ser usado como ímã comercial ou fechador estratégico de propostas em calls.",
        bullets: [
          "**Simuladores de Performance**: Arraste as barras (investimento, taxa de conversão) para estimar faturamentos e ROAS.",
          "**Métricas Claras**: Demonstre ao prospect o Custo por Lead (CPL) correspondente e projete o faturamento líquido estimado.",
          "**Argumentação Comercial**: Ofereça ciência e previsibilidade financeira para converter clientes céticos com facilidade."
        ]
      },
      agenda: {
        title: "📅 Agenda de Reuniões & Google Calendar",
        desc: "Centralize seus compromissos, calls de fechamento, alinhamentos e revisões semanais de anúncios.",
        bullets: [
          "**Google Agenda Conectado**: Integre com o Google Calendar das suas contas oficiais em poucos segundos para visualizar compromissos.",
          "**Envio Automático**: Ative a caixa de seleção ao criar eventos locais para registrá-los instantaneamente na sua agenda real do Google.",
          "**Categorização**: Separe reuniões de prospecção, reuniões contábeis e auditorias por cores e módulos relacionados."
        ]
      },
      maps_scraper: {
        title: "📍 Buscador de Clientes (Google Maps Scraper)",
        desc: "O motor de prospecção proprietário que puxa informações quentes direto da API geográfica do Google Maps.",
        bullets: [
          "**Varredura Local**: Digite o nicho (ex: Academias, Dentistas) e clique para obter leads reais com e-mail, reputação e telefone corporativo válido.",
          "**Identificação de Dores**: Encontre empresas locais com notas baixas ou sem site. Use essa quebra de reputação como gancho comercial.",
          "**Pipeline de Vendas**: Classifique o andamento dos novos leads (Novo, Em Contato, Ganho) de forma estruturada no CRM."
        ]
      },
      ia_consultora: {
        title: "🤖 Inteligência Artificial Consultora (RAG)",
        desc: "Sua executiva copiloto pessoal integrada aos dados operacionais de sua agência via inteligência geradora profunda.",
        bullets: [
          "**Contexto Completo**: A IA analisa suas métricas de MRR, leads gerados e fluxo de caixa de maneira integrada para responder.",
          "**Roteiros de Vendas**: Use o botão de roteiro comercial nos cartões de leads para criar scripts de prospecção ultra-personalizados.",
          "**Recomendações Saudáveis**: Interrogue a IA com cliques em sugestões rápidas para descobrir pontos de gargalo financeiro."
        ]
      }
    };

    const target = tourData[tab];
    if (target) {
      const seenKey = "seen_tour_" + tab;
      if (forced || !localStorage.getItem(seenKey)) {
        setTourContent(target);
        setShowTour(true);
      }
    }
  };

  const dismissTour = () => {
    localStorage.setItem("seen_tour_" + activeTab, "true");
    setShowTour(false);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      triggerTour(activeTab, false);
    }, 450);
    return () => clearTimeout(t);
  }, [activeTab]);

  // Workspaces / Tenancy configuration list
  const [workspaces, setWorkspaces] = useState<any[]>([
    { id: 'ws1', name: 'Minha Agência Principal', apiKey: 'aos_live_8a93bf81d9f82c499b2e', plan: planId }
  ]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('ws1');
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');

  // DB Overrides state for customizable manually KPIs per tab
  const [dbOverrides, setDbOverrides] = useState<any>({
    mrr: 15450,
    arr: 185400,
    ltv: 12000,
    cac: 450,
    churnRate: 3.2,
    customInstructions: '',
    trafficFbCpc: 0.42,
    trafficFbCtr: 2.1,
    trafficFbSpend: 6200,
    trafficGoogleCpc: 0.51,
    trafficGoogleCtr: 4.8,
    trafficGoogleSpend: 8400
  });

  // Dedicated database loader services
  const loadWorkspaceList = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/workspaces?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.workspaces && data.workspaces.length > 0) {
          setWorkspaces(data.workspaces);
          // Auto choose default workspace if not set
          if (!currentWorkspaceId || currentWorkspaceId === 'ws1') {
            const defaultId = initialWorkspaceId || data.workspaces[0].id;
            setCurrentWorkspaceId(defaultId);
            localStorage.setItem("agencyos_active_workspace", defaultId);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load workspace list:", e);
    }
  };

  const loadWorkspaceData = async (wsId: string) => {
    if (!wsId) return;
    try {
      const res = await fetch(`/api/workspaces/data?workspaceId=${wsId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.transactions) setTransactions(data.transactions);
        if (data.leads) setLeads(data.leads);
        if (data.events) setEvents(data.events);
        if (data.overrides) {
          setDbOverrides((prev: any) => ({
            ...prev,
            ...data.overrides
          }));
        }
      }
    } catch (e) {
      console.error("Failed to load workspace data:", e);
    }
  };

  const handleDeleteWorkspace = async (wsId: string) => {
    if (!user) return;
    if (workspaces.length <= 1) {
      alert("Operação proibida: Você deve possuir ao menos 1 (um) workspace ativo no seu AgencyOS.");
      return;
    }
    const item = workspaces.find(w => w.id === wsId);
    if (!item) return;

    const confirmDel = window.confirm(`Deseja DELETAR permanentemente o workspace individual de client SaaS "${item.name}"?\n\nEsta operação é IRREVERSÍVEL e removerá todos os leads, eventos e relatórios de fluxo de caixa atrelados a ele.`);
    if (!confirmDel) return;

    try {
      const res = await fetch('/api/workspaces/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, workspaceId: wsId })
      });
      if (res.ok) {
        alert("Workspace excluído com sucesso!");
        const remain = workspaces.filter(w => w.id !== wsId);
        setWorkspaces(remain);
        const nextId = remain[0].id;
        setCurrentWorkspaceId(nextId);
        localStorage.setItem("agencyos_active_workspace", nextId);
      } else {
        const errData = await res.json();
        alert("Erro ao excluir: " + errData.error);
      }
    } catch (e: any) {
      alert("Falha de conexão com o banco de dados: " + e.message);
    }
  };

  // Sync effect hooks
  useEffect(() => {
    loadWorkspaceList();
  }, [user]);

  useEffect(() => {
    if (currentWorkspaceId) {
      loadWorkspaceData(currentWorkspaceId);

      // Start dynamic realtime data fetching interval (every 4s)
      const poller = setInterval(() => {
        loadWorkspaceData(currentWorkspaceId);
      }, 4000);

      return () => clearInterval(poller);
    }
  }, [currentWorkspaceId]);

  const [showSettingsPane, setShowSettingsPane] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});

  // Financial Database
  const [transactions, setTransactions] = useState<FinancialEntry[]>(() => {
    const ws1Tx = INITIAL_TRANSACTIONS.map(t => ({ ...t, workspaceId: 'ws1' }));
    const ws2Tx: FinancialEntry[] = [
      { id: 'tx_ws2_1', description: 'Assinatura Stripe Plano Bronze - João', amount: 350, type: 'receita', category: 'Gestão de Tráfego', date: '2026-05-24', workspaceId: 'ws2' },
      { id: 'tx_ws2_2', description: 'Assinatura Stripe Plano Prata - Amanda', amount: 500, type: 'receita', category: 'Consultoria e CRM', date: '2026-05-24', workspaceId: 'ws2' },
      { id: 'tx_ws2_3', description: 'Assinatura Stripe Plano Prata - Maurício', amount: 500, type: 'receita', category: 'Consultoria e CRM', date: '2026-05-23', workspaceId: 'ws2' },
      { id: 'tx_ws2_4', description: 'Infraestrutura AWS Cloud Server', amount: -150, type: 'despesa', category: 'Software e Ferramentas', date: '2026-05-22', workspaceId: 'ws2' }
    ];
    const ws3Tx: FinancialEntry[] = [
      { id: 'tx_ws3_1', description: 'Hotmart Repasse Burger - Pedro', amount: 1500, type: 'receita', category: 'Gestão de Tráfego', date: '2026-05-24', workspaceId: 'ws3' },
      { id: 'tx_ws3_2', description: 'Mentoria Premium Delivery - Bruno', amount: 2500, type: 'receita', category: 'Consultoria e CRM', date: '2026-05-23', workspaceId: 'ws3' },
      { id: 'tx_ws3_3', description: 'Ferramenta Disparos Zap', amount: -97, type: 'despesa', category: 'Software e Ferramentas', date: '2026-05-21', workspaceId: 'ws3' }
    ];
    return [...ws1Tx, ...ws2Tx, ...ws3Tx];
  });
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'receita' | 'despesa'>('receita');
  const [newCategory, setNewCategory] = useState('Gestão de Tráfego');

  // Leads Database
  const [leads, setLeads] = useState<Lead[]>(() => {
    const ws1Leads = INITIAL_LEADS.map(l => ({ ...l, workspaceId: 'ws1' }));
    const ws2Leads: Lead[] = [
      { id: 'l_ws2_1', name: 'Loja Chic Modas', phone: '(11) 95555-4444', address: 'Av. Paulista, 100 - Bela Vista - São Paulo - SP', category: 'Academia', rating: 4.8, reviewsCount: 32, status: 'Novo', website: 'chicmodas.com', workspaceId: 'ws2' },
      { id: 'l_ws2_2', name: 'Boutique Maria Bonita', phone: '(21) 94444-3333', address: 'Rua das Flores, 45 - Rio de Janeiro - RJ', category: 'Academia', rating: 3.9, reviewsCount: 12, status: 'Em Contato', website: 'mariabonitastore.com', workspaceId: 'ws2' }
    ];
    const ws3Leads: Lead[] = [
      { id: 'l_ws3_1', name: 'Pizzaria Bella Massa', phone: '(31) 93333-2222', address: 'Av. Contorno, 1400 - Belo Horizonte - MG', category: 'Restaurante', rating: 4.1, reviewsCount: 410, status: 'Novo', website: 'bellamassapizza.com', workspaceId: 'ws3' }
    ];
    return [...ws1Leads, ...ws2Leads, ...ws3Leads];
  });
  
  // Maps Scraper active state
  const [scraperCategory, setScraperCategory] = useState<string>('dentista');
  const [scraperCustomCategory, setScraperCustomCategory] = useState('');
  const [scraperStatus, setScraperStatus] = useState<'idle' | 'scraping' | 'completed'>('idle');
  const [scraperProgress, setScraperProgress] = useState(0);
  const [scraperLogs, setScraperLogs] = useState<string[]>([]);
  const [extractedCount, setExtractedCount] = useState(0);

  // ROI Calculator state
  const [roiTicket, setRoiTicket] = useState<number>(1500);
  const [roiAds, setRoiAds] = useState<number>(2000);
  const [roiConversion, setRoiConversion] = useState<number>(4);
  const [roiLeads, setRoiLeads] = useState<number>(300);

  // Calendar State
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const ws1Evs = INITIAL_EVENTS.map(e => ({ ...e, workspaceId: 'ws1' }));
    const ws2Evs: CalendarEvent[] = [
      { id: 'ev_ws2_1', title: 'Onboarding - Chic Modas', date: '2026-05-26', time: '11:00', module: 'CRM', color: '#0ea5e9', workspaceId: 'ws2' }
    ];
    const ws3Evs: CalendarEvent[] = [
      { id: 'ev_ws3_1', title: 'Alinhamento Cardápio Burger', date: '2026-05-27', time: '16:30', module: 'Tráfego', color: '#f43f5e', workspaceId: 'ws3' }
    ];
    return [...ws1Evs, ...ws2Evs, ...ws3Evs];
  });
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-05-25');
  const [newEventTime, setNewEventTime] = useState('14:30');
  const [newEventModule, setNewEventModule] = useState('CRM');

  // Real Firestore Vendas Subcollection Snapshot Listener
  const [firestoreVendas, setFirestoreVendas] = useState<any[]>([]);
  const [vendasLoading, setVendasLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user || !user.email) return;

    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const firestoreDb = getFirestore(app);
      const userIdClean = user.email.toLowerCase();

      // Ensure that user profile document exists in Firestore
      const ensureUserProfile = async () => {
        try {
          const userDocRef = doc(firestoreDb, "users", userIdClean);
          const snap = await getDoc(userDocRef);
          if (!snap.exists()) {
            await setDoc(userDocRef, {
              email: userIdClean,
              name: user.name || "Proprietário AgencyOS",
              createdAt: new Date().toISOString()
            });
          }
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          if (errMsg.includes("offline") || errMsg.includes("unavailable") || err?.code === "unavailable") {
            console.info("Firestore is running in Offline Capability Mode: using offline cache / persistent JSON backup.");
          } else {
            console.warn("Firestore user profile sync warning (running in offline simulation fallback):", errMsg);
          }
        }
      };
      ensureUserProfile();

      // Set up onSnapshot listener for the sales subcollection
      const vendasColRef = collection(firestoreDb, "users", userIdClean, "vendas");
      
      const unsubscribe = onSnapshot(vendasColRef, (snapshot) => {
        const vendasData: any[] = [];
        snapshot.forEach((doc) => {
          vendasData.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by date descending
        vendasData.sort((a, b) => {
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        });

        setFirestoreVendas(vendasData);
        setVendasLoading(false);
      }, (error: any) => {
        const errMsg = error?.message || String(error);
        if (errMsg.includes("offline") || errMsg.includes("unavailable") || error?.code === "unavailable") {
          console.info("Firestore snapshot updates deferred: operating in offline sandbox simulator mode.");
        } else {
          console.warn("Firestore snapshot listener connectivity report:", errMsg);
        }
        setVendasLoading(false);
      });

      return () => unsubscribe();
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.info("Firestore connection deferred: running in offline local sandbox mode.", errMsg);
      setVendasLoading(false);
    }
  }, [user]);

  // Multi-tenant Active Data Filters
  const activeTransactions = transactions.filter(t => t.workspaceId === currentWorkspaceId);
  
  // Merge live Firestore sales into our presentation stream
  const mergedTransactions = firestoreVendas.length > 0
    ? firestoreVendas.map(v => ({
        id: v.id,
        description: `Adquirido por: ${v.customer || "Cliente Externo"}`,
        date: v.date ? v.date.split('T')[0] : 'Hoje',
        category: 'Webhook Loja',
        amount: Number(v.amount || 0),
        type: 'receita',
        isFirestore: true
      }))
    : activeTransactions;

  const activeLeads = leads.filter(l => l.workspaceId === currentWorkspaceId);
  const activeEvents = events.filter(e => e.workspaceId === currentWorkspaceId);

  // AI Chat Database
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: 'Olá! Sou a sua **IA Consultora** do AgencyOS. Estou com acesso exclusivo aos seus dados financeiros, CRM de leads e tráfego pago via tecnologia RAG.\n\nComo posso ajudar você a acelerar os resultados da sua agência hoje?',
      timestamp: new Date()
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<string>('loading...');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Conectar Loja State Variables
  const [tutorialTab, setTutorialTab] = useState<'shopify' | 'woocommerce' | 'stripe'>('shopify');
  const [configCopySuccess, setConfigCopySuccess] = useState(false);
  const [simName, setSimName] = useState('Cláudia Alencar');
  const [simAmount, setSimAmount] = useState('450.00');
  const [simStatus, setSimStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [simResponse, setSimResponse] = useState<any>(null);

  // Scroll active chat down
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiLoading]);

  // Hook into AI capabilities mode check
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setAiMode(data.mode === 'gemini' ? 'Gemini 3.5 Active' : 'RAG Simulator Running');
      })
      .catch(() => setAiMode('Simulator Offline'));
  }, []);

  // Module check utility
  const isModuleActive = (id: string) => {
    return activeModules.includes(id);
  };

  // Safe activation of locked addon modules on-the-fly
  const activateModule = (id: string, cost: number) => {
    if (!activeModules.includes(id)) {
      setActiveModules(prev => [...prev, id]);
      // Small notifications log
      alert(`Módulo "${id.toUpperCase()}" ativado com sucesso! +R$${cost}/mês adicionados à fatura.`);
    }
  };

  // Unified helper to save custom manual overrides (MRR, LTV, CAC, etc.) per tab and persist immediately to server database!
  const saveDbOverrides = async (updatedOverrides: any) => {
    setDbOverrides((prev: any) => {
      const nextOverrides = {
        ...prev,
        ...updatedOverrides
      };

      // Auto-save instantly to server db so the 4s poller doesn't wipe them!
      fetch('/api/workspaces/edit-overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId: currentWorkspaceId,
          overrides: nextOverrides
        })
      }).catch(err => console.error("Error auto-saving overrides:", err));

      return nextOverrides;
    });
  };

  const handleSaveConfig = async (pane: string, customSaveFn?: () => Promise<void>) => {
    setSavingStatus(prev => ({ ...prev, [pane]: 'saving' }));
    try {
      if (customSaveFn) {
        await customSaveFn();
      }
      
      const response = await fetch('/api/workspaces/edit-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: currentWorkspaceId,
          overrides: dbOverrides
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to save on server.");
      }
      
      const resData = await response.json();
      if (resData.overrides) {
        setDbOverrides(resData.overrides);
      }

      setSavingStatus(prev => ({ ...prev, [pane]: 'saved' }));
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [pane]: 'idle' }));
      }, 2000);
    } catch (e) {
      console.error("Error saving configs in pane:", pane, e);
      setSavingStatus(prev => ({ ...prev, [pane]: 'idle' }));
    }
  };

  // Unified Item-level CRUD fetchers connecting React to the server
  const handleAddDbItem = async (type: 'transaction' | 'lead' | 'event', item: any) => {
    try {
      const response = await fetch('/api/workspaces/item/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: currentWorkspaceId,
          type: type,
          item: item
        })
      });
      if (response.ok) {
        await loadWorkspaceData(currentWorkspaceId);
      }
    } catch (e) {
      console.error(`Error adding custom ${type}:`, e);
    }
  };

  const handleDeleteDbItem = async (type: 'transaction' | 'lead' | 'event', id: string) => {
    try {
      const response = await fetch('/api/workspaces/item/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: currentWorkspaceId,
          type: type,
          id: id
        })
      });
      if (response.ok) {
        await loadWorkspaceData(currentWorkspaceId);
      }
    } catch (e) {
      console.error(`Error deleting custom ${type}:`, e);
    }
  };

  // Financial Metrics Live Calculations with Dynamic Database Overrides
  const calculateMetrics = () => {
    const hasFirestoreVendas = firestoreVendas.length > 0;
    const firestoreReceitas = firestoreVendas.reduce((sum, v) => sum + Number(v.amount || 0), 0);

    const totalReceitas = hasFirestoreVendas
      ? firestoreReceitas
      : activeTransactions
          .filter(t => t.type === 'receita')
          .reduce((sum, v) => sum + v.amount, 0);

    const totalDespesas = Math.abs(activeTransactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + t.amount, 0));

    const hasReceitas = hasFirestoreVendas || activeTransactions.some(t => t.type === 'receita');
    const hasDespesas = activeTransactions.some(t => t.type === 'despesa');

    const baseMrr = totalReceitas;
    const mrr = dbOverrides.mrr !== undefined ? Number(dbOverrides.mrr) : baseMrr;
    const arr = dbOverrides.arr !== undefined ? Number(dbOverrides.arr) : mrr * 12;
    
    const churnRate = dbOverrides.churnRate !== undefined ? Number(dbOverrides.churnRate) : 2.8;

    const baseLtv = totalReceitas * 8.5;
    const ltv = dbOverrides.ltv !== undefined ? Number(dbOverrides.ltv) : baseLtv;

    const leadCount = activeLeads.length || 1;
    const baseCac = hasDespesas ? (totalDespesas / leadCount) : 380;
    const cac = dbOverrides.cac !== undefined ? Number(dbOverrides.cac) : (baseCac > 0 ? baseCac : 380);

    const cashBalance = totalReceitas - totalDespesas;

    return { mrr, arr, ltv, cac, churnRate, cashBalance };
  };

  const metrics = calculateMetrics();
  const ltvCacRatio = metrics.cac > 0 && isFinite(metrics.ltv / metrics.cac) ? (metrics.ltv / metrics.cac) : 8.5;

  // Add Transaction Form submit
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount) return;
    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount)) return;

    const newTx: FinancialEntry = {
      id: 'tx_dyn_' + Date.now(),
      description: newDesc,
      amount: newType === 'receita' ? parsedAmount : -Math.abs(parsedAmount),
      type: newType,
      category: newCategory,
      date: new Date().toISOString().split('T')[0],
      workspaceId: currentWorkspaceId
    };

    setNewDesc('');
    setNewAmount('');
    await handleAddDbItem('transaction', newTx);
  };

  // Trash transaction record
  const handleDeleteTransaction = async (id: string, isFirestore?: boolean) => {
    if (isFirestore) {
      if (!user || !user.email) return;
      try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const firestoreDb = getFirestore(app);
        const ref = doc(firestoreDb, "users", user.email.toLowerCase(), "vendas", id);
        await deleteDoc(ref);
      } catch (err) {
        console.error("Firestore delete error:", err);
      }
    } else {
      await handleDeleteDbItem('transaction', id);
    }
  };

  // Add Calendar event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;

    const colors = ['#a3e635', '#0ea5e9', '#f43f5e', '#a855f7', '#eab308'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newEv: CalendarEvent = {
      id: 'ev_dyn_' + Date.now(),
      title: newEventTitle,
      date: newEventDate,
      time: newEventTime,
      module: newEventModule,
      color: randomColor,
      workspaceId: currentWorkspaceId
    };

    if (gUser && gToken && syncWithGoogleCheck) {
      try {
        const result = await insertGoogleCalendarEvent(gToken, {
          title: newEventTitle,
          description: `Compromisso agendado via AgencyOS. Canal relacionado: ${newEventModule}`,
          date: newEventDate,
          time: newEventTime
        });
        if (result && result.id) {
          alert("✓ Evento sincronizado e criado com sucesso na sua conta do Google Agenda!");
          handleFetchGoogleEvents(gToken);
        }
      } catch (err: any) {
        alert("Adicionado localmente, mas houve um erro com o Google Agenda: " + (err.message || err));
      }
    }

    setNewEventTitle('');
    await handleAddDbItem('event', newEv);
  };

  // Trigger Maps Scraper process
  const startScrapeLeads = () => {
    const finalCategory = scraperCategory === 'custom' ? scraperCustomCategory : scraperCategory;
    if (!finalCategory) {
      alert("Por favor selecione ou digite uma categoria.");
      return;
    }

    setScraperStatus('scraping');
    setScraperProgress(10);
    setScraperLogs(['Inicializando Maps Scraper v3...', 'Conectando ao Google Maps Local Search...']);

    // Progress step simulation intervals
    const timers: NodeJS.Timeout[] = [];
    
    // Step 2 (30%)
    timers.push(setTimeout(() => {
      setScraperProgress(35);
      setScraperLogs(prev => [...prev, `Buscando estabelecimentos de "${finalCategory}"...`, 'Ignorando anúncios patrocinados...']);
    }, 1200));

    // Step 3 (60%)
    timers.push(setTimeout(() => {
      setScraperProgress(65);
      setScraperLogs(prev => [...prev, 'Filtrando por cidades próximas e avaliações...', 'Extraindo telefones corporativos e URLs de websites...']);
    }, 2400));

    // Step 4 (90%)
    timers.push(setTimeout(() => {
      setScraperProgress(90);
      setScraperLogs(prev => [...prev, 'Armazenando metadados de reputação...', 'Lendo fotos geolocalizadas do Google Street View...']);
    }, 3800));

    // Finish step
    timers.push(setTimeout(() => {
      setScraperProgress(100);
      setScraperStatus('completed');
      setScraperLogs(prev => [...prev, `Processo finalizado com sucesso! Encontrados novos leads de ${finalCategory}.`]);

      // Pull new mock records based on selection
      const key = (scraperCategory === 'custom' ? 'restaurante' : scraperCategory.toLowerCase()) as string;
      const scrapedList = MOCK_EXTRACTION_RECORDS[key] || MOCK_EXTRACTION_RECORDS['restaurante'];

      const parsedLeads: Lead[] = scrapedList.map((item, idx) => ({
        id: `scraped_${Date.now()}_${idx}`,
        name: item.name,
        phone: item.phone,
        address: item.address,
        category: item.category,
        rating: item.rating,
        reviewsCount: item.reviewsCount,
        status: 'Novo',
        website: item.website,
        workspaceId: currentWorkspaceId
      }));

      setLeads(prev => [...parsedLeads, ...prev]);
      setExtractedCount(parsedLeads.length);
    }, 4900));
  };

  // Clear Scraper
  const resetScraperState = () => {
    setScraperStatus('idle');
    setScraperProgress(0);
    setScraperLogs([]);
    setExtractedCount(0);
  };

  // Create workspace under plan limits
  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    let maxWorkspaces = 1;
    if (planId === 'pro') maxWorkspaces = 3;
    if (planId === 'agency') maxWorkspaces = 100;

    if (workspaces.length >= maxWorkspaces) {
      alert(`⚠️ Limite de Workspace Atingido!\n\nO seu plano ${planId.toUpperCase()} atualmente contratado permite criar no máximo ${maxWorkspaces} workspace individual isolado.\n\nPara gerenciar workspaces totalmente independentes para todos os seus clientes/SaaS ou agência ilimitadamente, faça o upgrade para o plano AGENCY na página inicial!`);
      return;
    }

    const newId = 'ws_dyn_' + Date.now();
    const generatedKey = 'aos_live_' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);

    const newWs = {
      id: newId,
      name: newWorkspaceName.trim(),
      apiKey: generatedKey,
      plan: planId
    };

    setWorkspaces(prev => [...prev, newWs]);
    setCurrentWorkspaceId(newId);
    setNewWorkspaceName('');
    alert(`✓ Workspace individual "${newWs.name}" criado com sucesso! Sua chave de API de integração exclusiva já foi gerada.`);
  };

  // Change lead status in CRM
  const updateLeadStatus = (id: string, newStatus: Lead['status']) => {
    setLeads(prev => prev.map(l => {
      if (l.id === id) {
        return { ...l, status: newStatus };
      }
      return l;
    }));
  };

  // Send Lead straight to IA Consultora for custom cold pitch script
  const sendLeadToChat = (lead: Lead) => {
    setActiveTab('ia_consultora');
    const prompt = `Escreva um script de prospecção fria sob medida para o lead "${lead.name}", do nicho de ${lead.category}. 
O telefone deles é: ${lead.phone}. O endereço aponta para: ${lead.address}.
Eles têm nota ${lead.rating} no Google Maps com ${lead.reviewsCount} avaliações. 
Prepare uma abordagem curta, inteligente e irresistível focada em tráfego pago local e atração de clientes.`;
    
    setInputVal(prompt);
  };

  // Handle send message to Gemini / Express api
  const handleSendMessage = async (e?: React.FormEvent, predefinedPrompt?: string) => {
    if (e) e.preventDefault();
    const promptText = predefinedPrompt || inputVal;
    if (!promptText.trim()) return;

    // Push User prompt message
    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: promptText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!predefinedPrompt) setInputVal('');
    setAiLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          history: messages,
          metrics: {
            mrr: metrics.mrr,
            arr: metrics.arr,
            ltv: metrics.ltv,
            cac: metrics.cac,
            churnRate: metrics.churnRate,
            cashBalance: metrics.cashBalance,
            modules: activeModules
          }
        })
      });

      const data = await response.json();
      if (data.text) {
        const aiMsg: ChatMessage = {
          id: 'ai_' + Date.now(),
          sender: 'assistant',
          text: data.text,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error("Formato inválido de resposta do servidor");
      }
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: 'error_' + Date.now(),
        sender: 'assistant',
        text: '⚠️ Ocorreu um problema ao conectar com o serviço de IA. Por favor, certifique-se de que o servidor está rodando ou verifique seus limites de rede.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setAiLoading(false);
    }
  };

  // ROI Math
  const calculateROIValues = () => {
    const costPerLead = roiLeads > 0 ? (roiAds / roiLeads) : 0;
    const totalConversions = Math.round(roiLeads * (roiConversion / 100));
    const estimatedNewFaturamento = totalConversions * roiTicket;
    const netReturn = estimatedNewFaturamento - roiAds;
    const roiMultiplier = roiAds > 0 ? (estimatedNewFaturamento / roiAds) : 0;

    return {
      costPerLead,
      totalConversions,
      estimatedNewFaturamento,
      netReturn,
      roiMultiplier
    };
  };

  const roiMath = calculateROIValues();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#030712] text-gray-100 font-poppins" id="workspace_root">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-gray-950 border-r border-gray-900 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bolt className="w-5 h-5 text-[#a3e635]" />
              <div>
                <span className="font-extrabold text-md tracking-tight text-white block">AgencyOS</span>
                <span className="text-[9px] font-mono text-[#a3e635] tracking-widest block -mt-1 font-bold">Painel de Trabalho</span>
              </div>
            </div>
            
            <span className="text-[9px] font-mono bg-[#a3e635]/15 text-[#a3e635] px-1.5 py-0.5 rounded font-bold uppercase">
              Demo
            </span>
          </div>

          {/* User profile capsule info inside sidebar */}
          <div className="px-6 py-4 border-b border-gray-900/60 bg-gray-950/40 flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-[#a3e635]">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-xs font-bold text-gray-200 truncate">{user?.name || 'Cliente'}</span>
              <span className="block text-[10px] text-gray-500 truncate lowercase font-mono">{user?.email || 'email@dominio.com'}</span>
            </div>
          </div>

          {/* Workspace Multi-tenant Control Center */}
          <div className="px-4 py-4 border-b border-gray-900 bg-[#070b16]">
            <label className="block text-[10px] uppercase font-bold tracking-wider font-mono text-gray-400 mb-1.5 ml-1">
              Workspace Isolado
            </label>
            <div className="space-y-2">
              <select
                value={currentWorkspaceId}
                onChange={(e) => setCurrentWorkspaceId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded-lg p-2 font-bold focus:outline-none focus:border-[#a3e635] transition-colors cursor-pointer"
                title="Selecione o Workspace Isolado do seu Cliente SaaS"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    💼 {ws.name}
                  </option>
                ))}
              </select>

              {/* Fast Inline Workspace Creator form */}
              <form onSubmit={handleCreateWorkspace} className="pt-1 flex gap-1.5">
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Novo cliente/SaaS..."
                  className="w-full min-w-0 bg-gray-900 border border-gray-800 text-[11px] rounded-lg px-2 py-1 text-white placeholder-gray-600 focus:outline-none focus:border-[#a3e635] transition-colors"
                  maxLength={25}
                />
                <button
                  type="submit"
                  className="bg-gray-800 hover:bg-[#a3e635] hover:text-[#030712] text-gray-400 py-1 px-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center shrink-0 cursor-pointer"
                  title="Criar novo individual"
                >
                  +
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Tabs Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 duration-200 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-[#a3e635]/15 to-[#a3e635]/5 text-[#a3e635] border-l-2 border-[#a3e635]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/40'
              }`}
            >
              <BarChart3 className="w-4.5 h-4.5" />
              <span>Painel Financeiro</span>
            </button>

            <button
              onClick={() => setActiveTab('fluxo_caixa')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 duration-200 cursor-pointer ${
                activeTab === 'fluxo_caixa'
                  ? 'bg-gradient-to-r from-[#a3e635]/15 to-[#a3e635]/5 text-[#a3e635] border-l-2 border-[#a3e635]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/40'
              }`}
            >
              <TrendingUp className="w-4.5 h-4.5" />
              <span>Fluxo de Caixa</span>
            </button>

            <button
              onClick={() => setActiveTab('calculadora_roi')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 duration-200 cursor-pointer ${
                activeTab === 'calculadora_roi'
                  ? 'bg-gradient-to-r from-[#a3e635]/15 to-[#a3e635]/5 text-[#a3e635] border-l-2 border-[#a3e635]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/40'
              }`}
            >
              <Calculator className="w-4.5 h-4.5" />
              <span>Calculadora ROI</span>
            </button>

            <button
              onClick={() => setActiveTab('agenda')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 duration-200 cursor-pointer ${
                activeTab === 'agenda'
                  ? 'bg-gradient-to-r from-[#a3e635]/15 to-[#a3e635]/5 text-[#a3e635] border-l-2 border-[#a3e635]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/40'
              }`}
            >
              <Calendar className="w-4.5 h-4.5" />
              <span>Agenda de Reuniões</span>
            </button>

            <button
              onClick={() => setActiveTab('conectar_loja')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 duration-200 cursor-pointer ${
                activeTab === 'conectar_loja'
                  ? 'bg-gradient-to-r from-[#a3e635]/15 to-[#a3e635]/5 text-[#a3e635] border-l-2 border-[#a3e635]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/40'
              }`}
            >
              <Network className="w-4.5 h-4.5 text-[#a3e635]" />
              <span className="flex items-center gap-1.5">
                <span>Conectar Loja</span>
                <span className="w-1.5 h-1.5 bg-[#a3e635] rounded-full animate-pulse"></span>
              </span>
            </button>

            {/* Premium Addon Tabs */}
            <div className="pt-4 pb-2 px-4 text-[9px] font-bold font-mono tracking-widest text-gray-500 uppercase">
              Módulos Premium
            </div>

            <button
              onClick={() => setActiveTab('maps_scraper')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 duration-200 cursor-pointer ${
                activeTab === 'maps_scraper'
                  ? 'bg-gradient-to-r from-[#a3e635]/15 to-[#a3e635]/5 text-[#a3e635] border-l-2 border-[#a3e635]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4.5 h-4.5" />
                <span>Maps Scraper (Leads)</span>
              </div>
              {!isModuleActive('maps_scraper') && <Lock className="w-3 h-3 text-yellow-500" />}
            </button>

            <button
              onClick={() => setActiveTab('ia_consultora')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 duration-200 cursor-pointer ${
                activeTab === 'ia_consultora'
                  ? 'bg-gradient-to-r from-[#a3e635]/15 to-[#a3e635]/5 text-[#a3e635] border-l-2 border-[#a3e635]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4.5 h-4.5" />
                <span>IA Consultora (RAG)</span>
              </div>
              {!isModuleActive('ia_consultora') && <Lock className="w-3 h-3 text-yellow-500" />}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Logout/Exit */}
        <div className="p-4 border-t border-gray-900/80 bg-gray-950/20 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
            <span className="font-mono">IA Status:</span>
            <span className="font-bold flex items-center gap-1 text-[#a3e635]">
              <span className="w-1.5 h-1.5 bg-[#a3e635] rounded-full inline-block animate-pulse"></span>
              {aiMode}
            </span>
          </div>

          <button
            onClick={() => triggerTour(activeTab, true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-850 text-gray-300 border border-gray-800 rounded-xl text-xs transition-colors cursor-pointer font-sans"
          >
            <HelpCircle className="w-4 h-4 text-[#a3e635]" />
            <span>Explicar esta Aba</span>
          </button>

          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-red-950/30 text-gray-400 hover:text-red-400 border border-gray-800 rounded-xl text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Workspace</span>
          </button>
        </div>
      </aside>

      {/* Main panel display scope */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:p-8" id="workspace_display">
        
        {/* TAB 1: DASHBOARD CORE METRICS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6" id="dashboard_tab">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-900 pb-5 text-left">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white font-poppins flex items-center gap-2">
                  <BarChart3 className="w-5.5 h-5.5 text-[#a3e635] animate-pulse" />
                  <span>Análise de Métricas</span>
                </h1>
                <p className="text-xs text-gray-400 font-light mt-0.5 font-sans">
                  Workspace ativo: <strong className="text-white font-bold">{workspaces.find(w => w.id === currentWorkspaceId)?.name}</strong> — Titular: <strong className="text-[#a3e635] font-semibold">{user?.name || "Visitante"}</strong> ({user?.planId?.toUpperCase() || "PRO"})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettingsPane(prev => prev === 'dashboard' ? null : 'dashboard')}
                  className="px-3.5 py-1.5 bg-gray-950 hover:bg-gray-905 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Bolt className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span>Configurar Aba</span>
                </button>

                <div className="flex items-center gap-3 bg-gray-950 p-2 rounded-xl border border-gray-900">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Garantia Multi-Tenant</span>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded">Ativo</span>
                </div>
              </div>
            </div>

            {/* Collapsible settings panel */}
            {showSettingsPane === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gray-950 border border-gray-805 text-left space-y-4 shadow-xl text-xs"
              >
                <div className="border-b border-gray-900 pb-2">
                  <h4 className="text-xs font-mono uppercase font-bold text-[#a3e635]">🔧 Configuração: Dashboard Geral & Métricas</h4>
                  <p className="text-[11px] text-gray-400 font-light mt-0.5 leading-relaxed font-sans">Edite as métricas operacionais principais à mão para simular cenários de vendas para este workspace isolado de forma persistente.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 font-sans">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Override MRR (R$)</label>
                    <input
                      type="number"
                      placeholder="Dinâmico"
                      value={dbOverrides.mrr !== undefined ? dbOverrides.mrr : ''}
                      onChange={(e) => saveDbOverrides({ mrr: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-[#a3e635] text-xs text-white focus:outline-none focus:ring-0 placeholder:text-gray-650"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Override LTV (R$)</label>
                    <input
                      type="number"
                      placeholder="Dinâmico"
                      value={dbOverrides.ltv !== undefined ? dbOverrides.ltv : ''}
                      onChange={(e) => saveDbOverrides({ ltv: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-[#a3e635] text-xs text-white focus:outline-none placeholder:text-gray-650"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Override CAC (R$)</label>
                    <input
                      type="number"
                      placeholder="Dinâmico"
                      value={dbOverrides.cac !== undefined ? dbOverrides.cac : ''}
                      onChange={(e) => saveDbOverrides({ cac: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-[#a3e635] text-xs text-white focus:outline-none placeholder:text-gray-650"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Override Churn Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Dinâmico"
                      value={dbOverrides.churnRate !== undefined ? dbOverrides.churnRate : ''}
                      onChange={(e) => saveDbOverrides({ churnRate: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-[#a3e635] text-xs text-white focus:outline-none placeholder:text-gray-650"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-900">
                  <button
                    onClick={() => {
                      saveDbOverrides({ mrr: undefined, arr: undefined, ltv: undefined, cac: undefined, churnRate: undefined });
                    }}
                    className="px-3 py-1.5 bg-red-950/20 hover:bg-red-950/30 border border-red-900/60 text-red-400 text-[10px] rounded-lg cursor-pointer font-sans"
                  >
                    Resetar Métricas de Inteligência
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSettingsPane(null)}
                      className="px-4 py-1.5 bg-gray-900 hover:bg-gray-805 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white font-bold text-[10px] rounded-lg cursor-pointer transition-all active:scale-95 font-sans"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={() => handleSaveConfig('dashboard')}
                      className="px-4 py-1.5 bg-[#a3e635] hover:bg-[#bbf7d0] text-black font-extrabold text-[10px] rounded-lg cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 font-sans"
                    >
                      {savingStatus['dashboard'] === 'saving' ? (
                        <span>Salvando...</span>
                      ) : savingStatus['dashboard'] === 'saved' ? (
                        <span className="flex items-center gap-1">✓ Salvo com sucesso!</span>
                      ) : (
                        <span>Salvar Configurações</span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Major KPI Metric Boxes */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-gray-950/80 border border-gray-900 text-left hover:-translate-y-1 hover:border-gray-800 hover:shadow-lg hover:shadow-black/50 transition-all duration-300">
                <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wide">MRR (Faturamento Recorrente)</span>
                <h2 className="text-2xl font-black text-white font-mono mt-1">R$ {metrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-[#a3e635] mt-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Calculado via receitas ativas</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gray-950/80 border border-gray-900 text-left hover:-translate-y-1 hover:border-gray-800 hover:shadow-lg hover:shadow-black/50 transition-all duration-300">
                <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wide">LTV (Tempo de vida útil)</span>
                <h2 className="text-2xl font-black text-white font-mono mt-1">R$ {metrics.ltv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-550" />
                  <span>Média contratual: 8.5 meses</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gray-950/80 border border-gray-900 text-left hover:-translate-y-1 hover:border-gray-800 hover:shadow-lg hover:shadow-black/50 transition-all duration-300">
                <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wide">CAC (Custo de Aquisição)</span>
                <h2 className="text-2xl font-black text-white font-mono mt-1">R$ {metrics.cac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-[#a3e635] mt-2">
                  <span className="w-1.5 h-1.5 bg-[#a3e635] rounded-full inline-block animate-pulse"></span>
                  <span>Incluso anúncios em tráfego</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#a3e635]/5 border border-[#a3e635]/20 text-left hover:-translate-y-1 hover:border-[#a3e635]/40 hover:shadow-lg hover:shadow-[#a3e635]/5 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#a3e635]/5 rounded-full blur-2xl group-hover:bg-[#a3e635]/10 transition-all duration-500"></div>
                <span className="text-[9px] font-mono font-bold text-[#a3e635] uppercase tracking-wide relative z-10">Relação LTV / CAC</span>
                <h2 className="text-2xl font-black text-[#a3e635] font-mono mt-1 relative z-10">{ltvCacRatio.toFixed(1)}x</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2 relative z-10">
                  <Sparkles className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span className="text-xs">Escalabilidade alta (&gt; 3x)</span>
                </div>
              </div>
            </div>

            {/* Grid for graphs and details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Custom SVG Growth Chart (handcrafted) */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm shadow-xl shadow-black/40 hover:-translate-y-1 hover:border-gray-800 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white">Evolução do Faturamento Estimado</h3>
                    <p className="text-[11px] text-gray-400">Projeção trimestral baseada nas receitas de CRM</p>
                  </div>
                  <span className="text-[10px] bg-gray-900 border border-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">Trimestral (2026)</span>
                </div>

                {/* Aesthetic handcrafted SVG chart simulating MRR growth */}
                <div className="relative pt-4">
                  <svg viewBox="0 0 500 180" className="w-full h-44 overflow-visible">
                    {/* Grid lines */}
                    <line x1="0" y1="150" x2="500" y2="150" stroke="#1f2937" strokeDasharray="3" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#1f2937" strokeDasharray="3" />
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#1f2937" strokeDasharray="3" />

                    {/* Gradient Area under line */}
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a3e635" stopOpacity="0.16" />
                        <stop offset="100%" stopColor="#a3e635" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10 150 C 100 130, 200 110, 300 80 S 400 40, 490 20 L 490 150 Z"
                      fill="url(#chartGradient)"
                    />

                    {/* Styled Spline curve */}
                    <path
                      d="M 10 150 C 100 130, 200 110, 300 80 S 400 40, 490 20"
                      fill="none"
                      stroke="#a3e635"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Intersects dots */}
                    <circle cx="10" cy="150" r="4.5" fill="#a3e635" />
                    <circle cx="150" cy="122" r="4.5" fill="#a3e635" />
                    <circle cx="300" cy="80" r="4.5" fill="#a3e635" />
                    <circle cx="490" cy="20" r="5" fill="#ffffff" stroke="#a3e635" strokeWidth="2.5" />

                    {/* Labels */}
                    <text x="10" y="172" fill="#4b5563" fontSize="10" fontFamily="monospace">MAR</text>
                    <text x="150" y="172" fill="#4b5563" fontSize="10" fontFamily="monospace">ABR</text>
                    <text x="300" y="172" fill="#4b5563" fontSize="10" fontFamily="monospace">MAI</text>
                    <text x="450" y="172" fill="#4b5563" fontSize="10" fontFamily="monospace">JUN (PREV)</text>
                  </svg>
                </div>
              </div>

              {/* CRM health widget */}
              <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm shadow-xl shadow-black/40 hover:-translate-y-1 hover:border-gray-800 transition-all duration-300 text-left flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Status Geral do CRM</h3>
                  <p className="text-[11px] text-gray-500 mb-5">Atividade dos contatos e funil comercial</p>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-400">Leads Convertidos (Ganho)</span>
                        <span className="font-bold text-white">{activeLeads.filter(l => l.status === 'Ganho').length}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-400">Em Negociação ativos</span>
                        <span className="font-bold text-white">{activeLeads.filter(l => l.status === 'Em Contato').length}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-400">Novos sem abordagem</span>
                        <span className="font-bold text-white">{activeLeads.filter(l => l.status === 'Novo').length}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('maps_scraper')}
                  className="w-full mt-6 py-2 bg-gray-900 hover:bg-gray-850 hover:text-white transition-all text-gray-400 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 border border-gray-800"
                >
                  <span>Prospecção de Leads no Google Maps</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Actions AI Widget inside Dashboard */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-gray-950 to-gray-900 border border-gray-800 text-left flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#a3e635] uppercase tracking-widest">IA Recomendações (RAG Ativo)</span>
                <h4 className="text-white font-bold text-sm mt-0.5">Sua IA avaliou seus números de MRR e projeta margens mais amplas se...</h4>
                <p className="text-gray-400 text-xs font-light mt-1">"Seu LTV/CAC ratio de {ltvCacRatio.toFixed(1)}x está brilhante. Injetar verbas controladas de tráfego pago trará retorno imediato em escala."</p>
              </div>

              <button
                onClick={() => {
                  if (isModuleActive('ia_consultora')) {
                    setActiveTab('ia_consultora');
                    handleSendMessage(undefined, "Pode analisar meus números de LTV e CAC e me dar um plano de ação comercial?");
                  } else {
                    activateModule('ia_consultora', 97);
                  }
                }}
                className="px-4 py-2 bg-[#a3e635] text-[#030712] hover:bg-[#84cc16] font-bold text-xs rounded-xl shrink-0 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 fill-[#030712]" />
                <span>Interrogar IA Agora</span>
              </button>
            </div>


          </div>
        )}

        {/* TAB 2: FLUXO DE CAIXA */}
        {activeTab === 'fluxo_caixa' && (
          <div className="space-y-6" id="fluxo_caixa_tab">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-900 pb-5 text-left">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white font-poppins flex items-center gap-2">
                  <TrendingUp className="w-5.5 h-5.5 text-[#a3e635] animate-pulse" />
                  <span>Fluxo de Caixa</span>
                </h1>
                <p className="text-xs text-gray-400 font-light mt-0.5">Registre entradas e saídas e acompanhe o balanço financeiro em tempo real.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettingsPane(prev => prev === 'fluxo_caixa' ? null : 'fluxo_caixa')}
                  className="px-3.5 py-1.5 bg-gray-950 hover:bg-gray-905 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Bolt className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span>Configurar Aba</span>
                </button>

                <div className="px-4 py-1.5 bg-gray-950 rounded-xl border border-gray-900 flex items-center gap-3">
                  <span className="text-xs text-gray-500">Saldo Consolidado:</span>
                  <span className={`text-sm font-extrabold font-mono ${metrics.cashBalance >= 0 ? 'text-[#a3e635]' : 'text-red-400'}`}>
                    R$ {metrics.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Collapsible settings panel */}
            {showSettingsPane === 'fluxo_caixa' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gray-950 border border-gray-805 text-left space-y-4 shadow-xl text-xs"
              >
                <div className="border-b border-gray-900 pb-2">
                  <h4 className="text-xs font-mono uppercase font-bold text-[#a3e635]">🔧 Configuração: Controle de Caixa</h4>
                  <p className="text-[11px] text-gray-400 font-light mt-0.5 leading-relaxed font-sans">Acesse canais administrativos para limpar histórico de simulações ou importar sementes base.</p>
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    onClick={async () => {
                      const confirmVal = window.confirm("Você de fato quer limpar ABSOLUTAMENTE TODOS os registros de caixa deste workspace?");
                      if (!confirmVal) return;
                      // Delete all active transactions sequentially
                      for (const tx of activeTransactions) {
                        await handleDeleteDbItem('transaction', tx.id);
                      }
                      alert("Histórico de caixa limpo com sucesso!");
                    }}
                    className="px-3.5 py-1.5 bg-red-950/20 hover:bg-red-950/30 border border-red-900/55 text-red-400 rounded-xl cursor-pointer font-sans"
                  >
                    Excluir Absolutamente Tudo (Resetar Banco)
                  </button>

                  <button
                    onClick={async () => {
                      const sampleTxs = [
                        { id: 'sample_1_' + Date.now(), description: 'Assinatura Stripe Recorrente Cliente Premium', amount: 2855, type: 'receita', category: 'Gestão de Tráfego', date: new Date().toISOString().split('T')[0], workspaceId: currentWorkspaceId },
                        { id: 'sample_2_' + Date.now(), description: 'Fee Mensal Consultoria IA Avançada', amount: 4500, type: 'receita', category: 'Consultoria e CRM', date: new Date().toISOString().split('T')[0], workspaceId: currentWorkspaceId },
                        { id: 'sample_3_' + Date.now(), description: 'Infraestrutura Servidor Virtual VPS', amount: -210, type: 'despesa', category: 'Software e Ferramentas', date: new Date().toISOString().split('T')[0], workspaceId: currentWorkspaceId }
                      ];
                      for (const item of sampleTxs) {
                        await handleAddDbItem('transaction', item);
                      }
                      alert("Registros semente integrados com sucesso!");
                    }}
                    className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-300 rounded-xl cursor-pointer font-sans"
                  >
                    Preencher com Dados Sementes de Vendas (Demo)
                  </button>

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => setShowSettingsPane(null)}
                      className="px-4 py-1.5 bg-gray-900 hover:bg-gray-805 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white font-bold text-[11px] rounded-xl cursor-pointer transition-all active:scale-95 font-sans"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={() => handleSaveConfig('fluxo_caixa')}
                      className="px-4 py-1.5 bg-[#a3e635] hover:bg-[#bbf7d0] text-black font-extrabold text-[11px] rounded-xl cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 font-sans"
                    >
                      {savingStatus['fluxo_caixa'] === 'saving' ? (
                        <span>Salvando...</span>
                      ) : savingStatus['fluxo_caixa'] === 'saved' ? (
                        <span className="flex items-center gap-1">✓ Salvo com sucesso!</span>
                      ) : (
                        <span>Salvar Configurações</span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Form entries addition */}
              <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm shadow-xl shadow-black/40 hover:border-gray-800 transition-all duration-300">
                <h3 className="text-sm font-bold text-white mb-4">Novo Registro</h3>
                
                <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 font-bold">Descrição</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Mensalidade Cliente ABC"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-[#a3e635]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 font-bold">Tipo</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewType('receita')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          newType === 'receita'
                            ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                            : 'bg-gray-900 text-gray-400 border border-transparent'
                        }`}
                      >
                        Receita (+)
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewType('despesa')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          newType === 'despesa'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : 'bg-gray-900 text-gray-400 border border-transparent'
                        }`}
                      >
                        Despesa (-)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 font-bold">Valor (R$)</label>
                      <input 
                        type="number"
                        required
                        step="0.01"
                        placeholder="Ex: 1500.00"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-[#a3e635] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 font-bold">Categoria</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-[#a3e635]"
                      >
                        <option value="Gestão de Tráfego">Tráfego Pago</option>
                        <option value="Consultoria e CRM">CRM e Vendas</option>
                        <option value="Software e Ferramentas">Software</option>
                        <option value="Infraestrutura">Infraestrutura</option>
                        <option value="Serviços Diversos">Outros</option>
                      </select>
                    </div>
                  </div>



                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 bg-[#a3e635] hover:bg-[#84cc16] text-[#030712] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Lançar Registro</span>
                  </button>
                </form>
              </div>

              {/* Transactions Ledger Table */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm shadow-xl shadow-black/40 hover:border-gray-800 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Livro Diário / Lançamentos</h3>
                  <span className="text-[10px] font-mono text-gray-500">{activeTransactions.length} registros no sistema</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-900 text-gray-500 text-[10px] font-mono uppercase">
                        <th className="py-2.5 font-bold">Descrição</th>
                        <th className="py-2.5 font-bold">Data</th>
                        <th className="py-2.5 font-bold">Categoria</th>
                        <th className="py-2.5 font-bold text-right">Valor</th>
                        <th className="py-2.5 font-bold text-center w-12">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900/40 text-xs">
                      {mergedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500 font-light">Nenhum registro lançado. Comece adicionando um acima!</td>
                        </tr>
                      ) : (
                        mergedTransactions.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-gray-900/20 group animate-fade-in">
                            <td className="py-3 font-bold text-gray-200">
                              <span className="flex items-center gap-2">
                                {tx.isFirestore && (
                                  <span className="w-1.5 h-1.5 bg-[#a3e635] rounded-full animate-pulse shrink-0" title="Registro via Webhook"></span>
                                )}
                                {tx.description}
                              </span>
                            </td>
                            <td className="py-3 text-gray-400 font-mono text-[11px]">{tx.date}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] border ${
                                tx.isFirestore 
                                  ? 'bg-[#a3e635]/10 text-[#a3e635] border-[#a3e635]/30 font-bold'
                                  : 'bg-gray-900 text-gray-400 border-gray-800'
                              }`}>
                                {tx.category}
                              </span>
                            </td>
                            <td className={`py-3 text-right font-mono font-bold ${
                              tx.type === 'receita' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {tx.type === 'receita' ? '+' : '-'} R$ {Math.abs(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 text-center">
                              <button
                                onClick={() => handleDeleteTransaction(tx.id, tx.isFirestore)}
                                className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-gray-900 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Excluir lançamento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONECTAR LOJA (WEBHOOK CONFIGURATION AND WORKSPACE SYNC) */}
        {activeTab === 'conectar_loja' && (
          <div className="space-y-6 text-left" id="conectar_loja_tab">
            <div className="border-b border-gray-900 pb-5">
              <h1 className="text-2xl font-semibold tracking-tight text-white font-poppins flex items-center gap-2">
                <Network className="w-5.5 h-5.5 text-[#a3e635] animate-pulse" />
                <span>Integração de Webhook & Conexão de Lojas</span>
              </h1>
              <p className="text-xs text-gray-400 mt-1 font-sans font-light">
                Conecte a sua loja (Shopify, WooCommerce, Stripe) usando o endpoint universal abaixo e veja as vendas entrarem no painel financeiro em tempo real.
              </p>
            </div>

            {/* Core Webhook Endpoint display card */}
            <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm shadow-xl shadow-black/40 hover:border-gray-800 transition-all duration-300 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#a3e635] flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
                <span>Seu Webhook Universal Exclusivo</span>
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans max-w-4xl">
                Esta é a URL única do seu workspace no AgencyOS. Copie este link e configure-o no de processador de vendas da sua loja externa para que os dados financeiros sejam atualizados no Firestore instantaneamente por streaming de dados.
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch gap-3 max-w-5xl">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/api/webhookUniversal?userId=${encodeURIComponent(user?.email || "")}`}
                  className="flex-1 bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-4 py-3 font-mono text-[11px] select-all focus:outline-none focus:border-[#a3e635]"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/webhookUniversal?userId=${encodeURIComponent(user?.email || "")}`);
                    setConfigCopySuccess(true);
                    setTimeout(() => setConfigCopySuccess(false), 2000);
                  }}
                  className="bg-gray-800 hover:bg-[#a3e635] hover:text-[#030712] text-gray-250 font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>{configCopySuccess ? "Copiado!" : "Copiar URL"}</span>
                </button>
              </div>
            </div>

            {/* Tutorials Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start font-sans">
              <div className="md:col-span-2 space-y-4">
                <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm shadow-xl shadow-black/40 hover:border-gray-800 transition-all duration-300 space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-900 pb-3">
                    <h3 className="text-sm font-semibold text-white">Manuais de Configuração</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-900 text-[#a3e635] border border-gray-800 uppercase">SaaS Tutorial</span>
                  </div>

                  {/* Manual selector tabs */}
                  <div className="flex gap-2 border-b border-gray-900 pb-2">
                    <button
                      onClick={() => setTutorialTab('shopify')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        tutorialTab === 'shopify'
                          ? 'bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Shopify
                    </button>
                    <button
                      onClick={() => setTutorialTab('woocommerce')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        tutorialTab === 'woocommerce'
                          ? 'bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      WooCommerce
                    </button>
                    <button
                      onClick={() => setTutorialTab('stripe')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        tutorialTab === 'stripe'
                          ? 'bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Stripe
                    </button>
                  </div>

                  {/* Tutorial content */}
                  <div className="space-y-3 pt-2 text-xs text-gray-400 leading-relaxed font-sans text-left">
                    {tutorialTab === 'shopify' && (
                      <div className="space-y-2 animate-fade-in text-left">
                        <p className="font-bold text-gray-200">Como conectar o webhook na Shopify:</p>
                        <ol className="list-decimal list-inside space-y-1.5 pl-1">
                          <li>No painel de administração da sua Shopify, acesse <strong className="text-white font-semibold">Configurações &gt; Notificações</strong>.</li>
                          <li>Role a página até o final para encontrar a seção <strong className="text-white font-semibold">Webhooks</strong>.</li>
                          <li>Clique no botão <strong className="text-white font-semibold">Criar webhook</strong>.</li>
                          <li>Selecione o evento <strong className="text-white font-semibold">Criação de pedido (Order creation)</strong> ou <strong className="text-white font-semibold">Pagamento de pedido (Order payment)</strong>.</li>
                          <li>Defina o formato como <strong className="text-white font-semibold">JSON</strong>.</li>
                          <li>No campo de URL, cole o link universal que você copiou acima.</li>
                          <li>Mantenha a versão da API recomendada e clique em <strong className="text-white font-semibold">Salvar</strong>.</li>
                        </ol>
                      </div>
                    )}

                    {tutorialTab === 'woocommerce' && (
                      <div className="space-y-2 animate-fade-in text-left">
                        <p className="font-bold text-gray-200">Como conectar o webhook no WooCommerce:</p>
                        <ol className="list-decimal list-inside space-y-1.5 pl-1">
                          <li>No painel lateral do WordPress, vá em <strong className="text-white font-semibold">WooCommerce &gt; Configurações</strong>.</li>
                          <li>Clique na guia superior <strong className="text-white font-semibold">Avançado</strong> e selecione a sub-guia <strong className="text-white font-semibold">Webhooks</strong>.</li>
                          <li>Clique em <strong className="text-white font-semibold">Adicionar webhook</strong>.</li>
                          <li>Dê um nome (ex: "Sincronizador AgencyOS") e defina o Status como <strong className="text-white font-semibold">Ativo</strong>.</li>
                          <li>No campo <strong className="text-white font-semibold">Tópico</strong>, filtre por <strong className="text-white font-semibold flex-inline">Pedido Criado (Order Created)</strong>.</li>
                          <li>No campo de URL de entrega, cole sua URL universal e salve as modificações.</li>
                        </ol>
                      </div>
                    )}

                    {tutorialTab === 'stripe' && (
                      <div className="space-y-2 animate-fade-in text-left">
                        <p className="font-bold text-gray-200">Como conectar o webhook na Stripe:</p>
                        <ol className="list-decimal list-inside space-y-1.5 pl-1">
                          <li>Acesse no painel da Stripe a seção de <strong className="text-white font-semibold">Developers &gt; Webhooks</strong>.</li>
                          <li>Clique no botão <strong className="text-white font-semibold">Add endpoint</strong> (+ Adicionar Endpoint).</li>
                          <li>Cole o seu link universal do AgencyOS no campo <strong className="text-white font-semibold">Endpoint URL</strong>.</li>
                          <li>Clique em <strong className="text-white font-semibold">Select events</strong> e selecione o evento <strong className="text-white font-semibold">checkout.session.completed</strong> ou <strong className="text-white font-semibold">payment_intent.succeeded</strong>.</li>
                          <li>Confirme clicando em <strong className="text-white font-semibold">Add endpoint</strong> para finalizar.</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* API and Integration Logs card detail */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm shadow-xl shadow-black/40 hover:border-gray-800 transition-all duration-300 space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-white text-left">Canal de Escuta</h3>
                  <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-900 flex items-center gap-3 text-left">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span>
                    </span>
                    <div>
                      <p className="text-[11px] font-bold text-white">Sincronizadora Ativa</p>
                      <p className="text-[10px] text-gray-500 font-sans mt-0.5">Sua fila de transações está conectada de ponta a ponta.</p>
                    </div>
                  </div>

                  <div className="pt-2 text-left space-y-2">
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none">Métricas Sincronizadas</p>
                    <div className="text-[11px] font-sans text-gray-400">
                      Total de Vendas no Firestore: <strong className="text-[#a3e635] font-black">{firestoreVendas.length}</strong> registradas.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE WEBHOOK SIMULATOR (Sandbox Test Tool) */}
            <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm shadow-xl shadow-black/40 hover:border-gray-800 transition-all duration-300 space-y-4 text-left">
              <div className="border-b border-gray-900 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#a3e635]" />
                  <span>Ambiente de Testes / Simulador Real de Webhooks</span>
                </h3>
                <p className="text-[11px] text-gray-400 font-sans font-light mt-0.5">
                  Não possui uma loja online sobressalente para testar agora? Envie dados simulados para a fila de webhook. Isso fará um envio real HTTP para a api do AgencyOS no Firestore e atualizará o Painel Financeiro na hora!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-sans max-w-5xl items-end">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-gray-500 font-bold mb-1.5">Nome do Cliente Comprador</label>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 focus:border-[#a3e635] text-xs text-white rounded-xl px-3 py-2 outline-none transition-colors"
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-gray-500 font-bold mb-1.5">Valor da Compra (R$)</label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 focus:border-[#a3e635] text-xs text-white rounded-xl px-3 py-2 outline-none transition-colors"
                    placeholder="Ex: 450.00"
                  />
                </div>
                <div>
                  <button
                    onClick={async () => {
                      if (!simName || !simAmount || isNaN(Number(simAmount))) return;
                      setSimStatus('loading');
                      setSimResponse(null);
                      try {
                        const emailQuery = encodeURIComponent(user?.email || "");
                        const payload = {
                          amount: Number(simAmount),
                          customer_name: simName,
                          email: `${simName.toLowerCase().replace(/\s+/g, '')}@exemplo.com`,
                          source: 'Universal Sandbox Applet',
                          test_order_id: 'ORDER_' + Math.random().toString(36).substring(2, 9).toUpperCase()
                        };

                        const response = await fetch(`/api/webhookUniversal?userId=${emailQuery}`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify(payload)
                        });

                        const data = await response.json();
                        if (response.ok) {
                          setSimStatus('success');
                          setSimResponse(data);
                        } else {
                          setSimStatus('error');
                          setSimResponse(data);
                        }
                      } catch (err: any) {
                        setSimStatus('error');
                        setSimResponse({ error: err.message });
                      }
                    }}
                    disabled={simStatus === 'loading'}
                    className="w-full h-[36px] bg-[#a3e635] hover:brightness-110 text-gray-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {simStatus === 'loading' ? (
                      <span className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span>Simular Compra e Enviar</span>
                    )}
                  </button>
                </div>
              </div>

              {simStatus === 'success' && (
                <div className="p-4 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/30 flex flex-col gap-2 font-sans text-xs animate-fade-in max-w-5xl">
                  <p className="font-bold text-[#a3e635] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Evento de Webhook Processado com Sucesso!</span>
                  </p>
                  <p className="text-gray-400">
                    O Payload do Webhook foi entregue e a seguinte venda foi incluída na subcoleção <strong className="text-white">/users/{user?.email.toLowerCase()}/vendas</strong> no Firestore:
                  </p>
                  <div className="bg-gray-900 border border-gray-805/40 rounded-lg p-3 text-[11px] font-mono text-gray-300">
                    <div><strong>Customer:</strong> {simResponse?.savedData?.customer || simName}</div>
                    <div><strong>Amount:</strong> R$ {Number(simAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div><strong>VendaDocId:</strong> {simResponse?.vendaId}</div>
                    <div><strong>Status:</strong> Firestore Sincronizado</div>
                  </div>
                  <p className="text-[10px] text-gray-500 italic mt-1 pb-1">
                    🎯 Vá até a aba "Painel Financeiro" do menu lateral: a receita mensal recorrente (MRR) e o Lifetime Value (LTV) já mudaram de valor instantaneamente via Firestore onSnapshot listener!
                  </p>
                </div>
              )}

              {simStatus === 'error' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col gap-1.5 font-sans text-xs animate-fade-in max-w-5xl">
                  <p className="font-bold text-red-400 flex items-center gap-2 text-left">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Falha no Processamento do Webhook</span>
                  </p>
                  <p className="text-gray-400 text-left">
                    Erro recebido do endpoint de webhook do servidor:
                  </p>
                  <pre className="bg-gray-900 border border-gray-850 rounded-lg p-2.5 text-[11px] font-mono text-red-300 overflow-x-auto text-left">
                    {JSON.stringify(simResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CALCULADORA ROI */}
        {activeTab === 'calculadora_roi' && (
          <div className="space-y-6" id="roi_tab">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-900 pb-5 text-left">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white font-poppins flex items-center gap-2">
                  <Calculator className="w-5.5 h-5.5 text-[#a3e635] animate-pulse" />
                  <span>Calculadora de ROI do Cliente</span>
                </h1>
                <p className="text-xs text-gray-400 font-light mt-0.5">Preveja faturamento e calcule rentabilidade real de suas campanhas e fees comerciais de marketing.</p>
              </div>

              <button
                onClick={() => setShowSettingsPane(prev => prev === 'calculadora_roi' ? null : 'calculadora_roi')}
                className="px-3.5 py-1.5 bg-gray-950 hover:bg-gray-905 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 animate-pulse"
              >
                <Bolt className="w-3.5 h-3.5 text-[#a3e635]" />
                <span>Configurar Aba</span>
              </button>
            </div>

            {/* Collapsible settings panel */}
            {showSettingsPane === 'calculadora_roi' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gray-950 border border-gray-805 text-left space-y-4 shadow-xl text-xs"
              >
                <div className="border-b border-gray-900 pb-2">
                  <h4 className="text-xs font-mono uppercase font-bold text-[#a3e635]">🔧 Configuração: Parâmetros de Campanhas (Tráfego Pago)</h4>
                  <p className="text-[11px] text-gray-400 font-light mt-0.5 leading-relaxed font-sans">Força coeficientes industriais de conversão de cliques e impressões que alteram a margem de retorno calculada pelo sistema.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 font-sans">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Override Facebook CPC (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 0.45"
                      value={dbOverrides.trafficFbCpc !== undefined ? dbOverrides.trafficFbCpc : ''}
                      onChange={(e) => saveDbOverrides({ trafficFbCpc: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-[#a3e635] text-xs text-white focus:outline-none placeholder:text-gray-650"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Facebook CTR (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 2.2"
                      value={dbOverrides.trafficFbCtr !== undefined ? dbOverrides.trafficFbCtr : ''}
                      onChange={(e) => saveDbOverrides({ trafficFbCtr: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-[#a3e635] text-xs text-white focus:outline-none placeholder:text-gray-650"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Override Google CPC (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 0.55"
                      value={dbOverrides.trafficGoogleCpc !== undefined ? dbOverrides.trafficGoogleCpc : ''}
                      onChange={(e) => saveDbOverrides({ trafficGoogleCpc: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-[#a3e635] text-xs text-white focus:outline-none placeholder:text-gray-650"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Google CTR (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 4.5"
                      value={dbOverrides.trafficGoogleCtr !== undefined ? dbOverrides.trafficGoogleCtr : ''}
                      onChange={(e) => saveDbOverrides({ trafficGoogleCtr: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 focus:border-[#a3e635] text-xs text-white focus:outline-none placeholder:text-gray-650"
                    />
                  </div>
                </div>
                <div className="flex justify-end items-center gap-2 pt-3 border-t border-gray-900 mt-2">
                  <button
                    onClick={() => setShowSettingsPane(null)}
                    className="px-4 py-1.5 bg-gray-900 hover:bg-gray-805 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white font-bold text-[10px] rounded-lg cursor-pointer transition-all active:scale-95 font-sans"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => handleSaveConfig('calculadora_roi')}
                    className="px-4 py-1.5 bg-[#a3e635] hover:bg-[#bbf7d0] text-black font-extrabold text-[10px] rounded-lg cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 font-sans"
                  >
                    {savingStatus['calculadora_roi'] === 'saving' ? (
                      <span>Salvando...</span>
                    ) : savingStatus['calculadora_roi'] === 'saved' ? (
                      <span className="flex items-center gap-1">✓ Salvo com sucesso!</span>
                    ) : (
                      <span>Salvar Configurações</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm shadow-xl shadow-black/40 hover:border-gray-800 transition-all duration-300 space-y-4">
                <h3 className="text-sm font-bold text-white mb-2">Variáveis de Entrada</h3>
                
                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px] font-bold font-mono">
                    <span className="text-gray-400 uppercase tracking-wider">Investimento em Ads total (R$)</span>
                    <span className="text-[#a3e635] font-mono">R$ {roiAds}</span>
                  </div>
                  <input 
                    type="range"
                    min="500"
                    max="15000"
                    step="250"
                    value={roiAds}
                    onChange={(e) => setRoiAds(parseInt(e.target.value))}
                    className="w-full accent-[#a3e635] bg-gray-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-gray-600 mt-1">
                    <span>R$ 500</span>
                    <span>R$ 15.000</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px] font-bold font-mono">
                    <span className="text-gray-400 uppercase tracking-wider">Quantidade de Leads Estimada</span>
                    <span className="text-[#a3e635] font-mono">{roiLeads} leads</span>
                  </div>
                  <input 
                    type="range"
                    min="50"
                    max="1500"
                    step="25"
                    value={roiLeads}
                    onChange={(e) => setRoiLeads(parseInt(e.target.value))}
                    className="w-full accent-[#a3e635] bg-gray-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-gray-600 mt-1">
                    <span>50 leads</span>
                    <span>1.500 leads</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px] font-bold font-mono">
                    <span className="text-gray-400 uppercase tracking-wider">Taxa de Conversão em Vendas (%)</span>
                    <span className="text-[#a3e635] font-mono">{roiConversion}%</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="25"
                    step="0.5"
                    value={roiConversion}
                    onChange={(e) => setRoiConversion(parseFloat(e.target.value))}
                    className="w-full accent-[#a3e635] bg-gray-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-gray-600 mt-1">
                    <span>1%</span>
                    <span>25%</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px] font-bold font-mono">
                    <span className="text-gray-400 uppercase tracking-wider">Ticket Médio de Venda do Cliente (R$)</span>
                    <span className="text-[#a3e635] font-mono">R$ {roiTicket}</span>
                  </div>
                  <input 
                    type="range"
                    min="200"
                    max="10000"
                    step="100"
                    value={roiTicket}
                    onChange={(e) => setRoiTicket(parseInt(e.target.value))}
                    className="w-full accent-[#a3e635] bg-gray-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-gray-600 mt-1">
                    <span>R$ 200</span>
                    <span>R$ 10.000</span>
                  </div>
                </div>
              </div>

              {/* Calculations results Panel */}
              <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm shadow-xl shadow-black/40 hover:border-gray-800 transition-all duration-300 flex flex-col justify-between text-left">
                <div>
                  <h3 className="text-sm font-bold text-white mb-4">Métricas Estimadas do Funil</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gray-900 rounded-xl">
                      <span className="text-[9px] text-gray-500 font-mono block">Custo Por Lead (CPL)</span>
                      <span className="text-lg font-black text-white font-mono mt-0.5 block">R$ {roiMath.costPerLead.toFixed(2)}</span>
                    </div>

                    <div className="p-4 bg-gray-900 rounded-xl">
                      <span className="text-[9px] text-gray-500 font-mono block">Vendas Fechadas</span>
                      <span className="text-lg font-black text-white font-mono mt-0.5 block">{roiMath.totalConversions} clientes</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-900 py-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Previsão Faturamento bruto:</span>
                      <span className="font-extrabold text-white font-mono">R$ {roiMath.estimatedNewFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Retorno Líquido das Vendas:</span>
                      <span className="font-extrabold text-[#a3e635] font-mono">R$ {roiMath.netReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/30 text-center mt-4">
                  <span className="text-[10px] text-gray-400 block font-mono">ROI PROJETADO SOBRE A VERBA DE ADS</span>
                  <span className="text-2xl font-black text-[#a3e635] font-mono mt-0.5 block">{roiMath.roiMultiplier.toFixed(1)}x</span>
                  <span className="text-[10px] text-green-400 block font-light mt-1">
                    Cada R$ 1,00 investido gera R$ {roiMath.roiMultiplier.toFixed(2)} em retorno de vendas!
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AGENDA */}
        {activeTab === 'agenda' && (
          <div className="space-y-6" id="agenda_tab">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-900 pb-5 text-left">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white font-poppins flex items-center gap-2">
                  <Calendar className="w-5.5 h-5.5 text-[#a3e635] animate-pulse" />
                  <span>Agenda de Compromissos</span>
                </h1>
                <p className="text-xs text-gray-400 font-light mt-0.5 font-sans">Organize reuniões comerciais e alinhamentos estratégicos integrados ao seu Google Agenda.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettingsPane(prev => prev === 'agenda' ? null : 'agenda')}
                  className="px-3.5 py-1.5 bg-gray-950 hover:bg-gray-905 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border-dashed"
                >
                  <Bolt className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span>Configurar Aba</span>
                </button>

                <span className="px-3 py-1.5 bg-gray-905 border border-gray-900 rounded-xl text-xs text-gray-400 font-mono">
                  {activeEvents.length + gEvents.length} reuniões mapeadas
                </span>
              </div>
            </div>

            {/* Collapsible settings panel */}
            {showSettingsPane === 'agenda' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gray-950 border border-gray-805 text-left space-y-4 shadow-xl text-xs"
              >
                <div className="border-b border-gray-900 pb-2">
                  <h4 className="text-xs font-mono uppercase font-bold text-[#a3e635]">🔧 Configuração: Integrações e Calendário</h4>
                  <p className="text-[11px] text-gray-400 font-light mt-0.5 leading-relaxed font-sans">Altere opções de escopo e habilite alertas de confirmação automáticos via WhatsApp quando novas reuniões entrarem.</p>
                </div>
                <div className="flex flex-wrap gap-4 pt-1 text-xs text-gray-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncWithGoogleCheck}
                      onChange={(e) => setSyncWithGoogleCheck(e.target.checked)}
                      className="rounded border-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0 bg-gray-900"
                    />
                    <span>Ativar sincronização bidirecional do Google Agenda por padrão</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="rounded border-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0 bg-gray-900"
                    />
                    <span>Disparar aviso SMS/Zap para o cliente 15 minutos antes da reunião comercial</span>
                  </label>
                </div>
                <div className="flex justify-end items-center gap-2 pt-3 border-t border-gray-900 mt-2">
                  <button
                    onClick={() => setShowSettingsPane(null)}
                    className="px-4 py-1.5 bg-gray-900 hover:bg-gray-805 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white font-bold text-[10px] rounded-lg cursor-pointer transition-all active:scale-95 font-sans"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => handleSaveConfig('agenda')}
                    className="px-4 py-1.5 bg-[#a3e635] hover:bg-[#bbf7d0] text-black font-extrabold text-[10px] rounded-lg cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 font-sans"
                  >
                    {savingStatus['agenda'] === 'saving' ? (
                      <span>Salvando...</span>
                    ) : savingStatus['agenda'] === 'saved' ? (
                      <span className="flex items-center gap-1">✓ Salvo com sucesso!</span>
                    ) : (
                      <span>Salvar Configurações</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Google Calendar Connection Status box */}
            {!gUser ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-950/20 to-gray-950 border border-blue-900/40 text-left">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse inline-block"></span>
                    Integrar com o Google Agenda (Google Calendar)
                  </h3>
                  <p className="text-xs text-gray-400 font-light mt-1 max-w-xl font-sans">
                    Sincronize as reuniões da sua agência e calls de negócios com permissão da sua conta do Google. Os eventos agendados aqui serão criados em tempo real na sua agenda do Google.
                  </p>
                </div>
                <button
                  onClick={handleConnectGoogle}
                  disabled={isGCalendarConnecting}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shrink-0 shadow-md transition-all active:scale-95 cursor-pointer font-sans"
                >
                  {isGCalendarConnecting ? 'Conectando...' : 'Conectar Google Agenda'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-green-950/20 to-gray-950 border border-green-950/30 text-left animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-ping inline-block"></span>
                      Integração com Google Calendar Ativa
                    </h3>
                    <p className="text-xs text-gray-400 font-light mt-1 font-sans">
                      Sua agência está conectada à conta Google: <span className="font-mono text-green-400 font-semibold">{gUser.email}</span>. Os compromissos estão sincronizados.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-sans">
                  <button
                    onClick={() => handleFetchGoogleEvents(gToken!)}
                    disabled={isFetchingGEvents}
                    className="px-3 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-850 text-gray-300 font-extrabold text-xs rounded-xl transition-all font-sans cursor-pointer"
                  >
                    {isFetchingGEvents ? 'Importando...' : 'Re-sincronizar'}
                  </button>
                  <button
                    onClick={handleDisconnectGoogle}
                    className="px-3 py-2 bg-red-950/20 hover:bg-red-950/50 text-red-400 border border-red-900/40 font-extrabold text-xs rounded-xl transition-all font-sans cursor-pointer"
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Form trigger scheduler */}
              <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm shadow-xl shadow-black/40 hover:border-gray-800 transition-all duration-300 text-left">
                <h3 className="text-sm font-bold text-white mb-4">Agendar Reunião</h3>

                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Título / Cliente</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Call Retenção - Academia FitLife"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-[#a3e635]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Data</label>
                      <input 
                        type="date"
                        required
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-[#a3e635] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Hora</label>
                      <input 
                        type="time"
                        required
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-[#a3e635] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Módulo Relacionado</label>
                    <select
                      value={newEventModule}
                      onChange={(e) => setNewEventModule(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-[#a3e635]"
                    >
                      <option value="Tráfego">Tráfego Pago</option>
                      <option value="CRM">CRM & Leads</option>
                      <option value="Financeiro">Contabilidade / ROI</option>
                      <option value="IA Consultoria">Sessão com Assessor IA</option>
                    </select>
                  </div>

                  {/* Sincronização Google Option checkbox */}
                  {gUser ? (
                    <div className="flex items-center gap-2.5 bg-[#a3e635]/5 border border-[#a3e635]/15 p-3 rounded-xl animate-fadeIn">
                      <input 
                        type="checkbox"
                        id="sync_with_google_check"
                        checked={syncWithGoogleCheck}
                        onChange={(e) => setSyncWithGoogleCheck(e.target.checked)}
                        className="w-4 h-4 rounded text-[#a3e635] bg-gray-900 border-gray-800 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="sync_with_google_check" className="text-[10px] text-gray-300 font-light select-none cursor-pointer">
                        Exportar evento para meu Google Calendar
                      </label>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-blue-950/15 border border-blue-900/20 text-left">
                      <p className="text-[10px] text-blue-400 font-light font-sans">
                        💡 Conecte sua conta do Google acima para exportar essa call diretamente para sua agenda real!
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#a3e635] hover:bg-[#84cc16] text-[#030712] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Confirmar Compromisso</span>
                  </button>
                </form>
              </div>

              {/* Event card display ledger */}
              <div className="lg:col-span-2 space-y-4 text-left">
                
                {/* Local events rendering */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white mb-2 ml-1">Fila Local de Compromissos</h3>

                  {activeEvents.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-gray-950 border border-gray-900 text-gray-500 font-light font-sans">Nenhum evento local agendado.</div>
                  ) : (
                    activeEvents.map((ev) => (
                      <div 
                        key={ev.id}
                        className="p-4 rounded-xl bg-gray-950 border border-gray-900/60 hover:border-gray-800 flex items-center justify-between gap-4 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          {/* Bullet color marker */}
                          <div 
                            className="w-1.5 h-10 rounded-full" 
                            style={{ backgroundColor: ev.color }}
                          ></div>

                          <div>
                            <h4 className="text-white font-bold text-xs sm:text-sm">{ev.title}</h4>
                            <div className="flex items-center gap-3 text-gray-400 text-[10px] font-mono mt-1">
                              <span className="flex items-center gap-1 text-[#a3e635]">
                                <FlagModuleLabel id={ev.module} />
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 opacity-60" />
                                {ev.time}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold block">Encontro</span>
                            <span className="text-[11px] font-bold text-white font-mono mt-0.5 block">{ev.date}</span>
                          </div>

                          <button
                            onClick={() => handleDeleteDbItem('event', ev.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 rounded hover:bg-gray-900 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center"
                            title="Excluir Compromisso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Google Calendar incoming events rendering */}
                {gUser && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between mb-2 ml-1">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span>Compromissos no Google Agenda</span>
                      </h3>
                      {isFetchingGEvents && <span className="text-[10px] text-gray-500 animate-pulse font-mono">Atualizando...</span>}
                    </div>

                    {gEvents.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-gray-950/40 border border-gray-900/40 text-gray-500 font-light font-sans">
                        Sem compromissos futuros localizados no Google Calendar para hoje em diante.
                      </div>
                    ) : (
                      gEvents.map((gev) => {
                        const dateObj = gev.start?.dateTime ? new Date(gev.start.dateTime) : (gev.start?.date ? new Date(gev.start.date) : null);
                        const dateStr = dateObj ? dateObj.toLocaleDateString('pt-BR') : 'Sem data';
                        const timeStr = dateObj ? dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Dia todo';

                        return (
                          <div 
                            key={gev.id}
                            className="p-4 rounded-xl bg-gray-950 border border-blue-950/25 hover:border-blue-900/40 flex items-center justify-between gap-4 transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-1.5 h-10 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20"></div>

                              <div>
                                <h4 className="text-white font-bold text-xs sm:text-sm">{gev.summary || 'Sem título'}</h4>
                                <div className="flex items-center gap-3 text-gray-400 text-[10px] font-mono mt-1">
                                  <span className="text-blue-400 font-semibold tracking-wide uppercase text-[9px] bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/15">
                                    Google Calendar
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 opacity-60" />
                                    {timeStr}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold block">Encontro</span>
                              <span className="text-[11px] font-bold text-white font-mono mt-0.5 block">{dateStr}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
                
              </div>
            </div>
          </div>
        )}

        {/* TAB 5 / LOCK 1: MAPS SCRAPER CAPABILITIES */}
        {activeTab === 'maps_scraper' && (
          <div className="space-y-6" id="maps_scraper_tab">
            <div className="border-b border-gray-900 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white font-poppins flex items-center gap-2">
                  <MapPin className="w-5.5 h-5.5 text-[#a3e635] animate-pulse" />
                  <span>Maps Scraper & CRM</span>
                </h1>
                <p className="text-xs text-gray-400 font-light mt-0.5">Localize negócios locais no Google Maps com fones válidos para alimentar seu funil de tráfego pago.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettingsPane(prev => prev === 'maps_scraper' ? null : 'maps_scraper')}
                  className="px-3.5 py-1.5 bg-gray-950 hover:bg-gray-905 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Bolt className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span>Configurar Aba</span>
                </button>

                {isModuleActive('maps_scraper') && (
                  <span className="px-2.5 py-1 rounded bg-[#a3e635]/15 text-[#a3e635] text-[10px] font-extrabold uppercase font-mono border border-[#a3e635]/30">
                    Módulo Integrado
                  </span>
                )}
              </div>
            </div>

            {/* Collapsible settings panel */}
            {showSettingsPane === 'maps_scraper' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gray-950 border border-gray-805 text-left space-y-4 shadow-xl text-xs"
              >
                <div className="border-b border-gray-900 pb-2">
                  <h4 className="text-xs font-mono uppercase font-bold text-[#a3e635]">🔧 Configuração: Prospecção de Clientes</h4>
                  <p className="text-[11px] text-gray-400 font-light mt-0.5 leading-relaxed font-sans">Cadastre prospects manualmente no CRM comercial de forma direta e persistente sem precisar rodar um scrape longo.</p>
                </div>
                
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const name = fd.get('lead_name') as string;
                    const phone = fd.get('lead_phone') as string;
                    const category = fd.get('lead_niche') as string;
                    if (!name) return;

                    const newL: Lead = {
                      id: 'lead_manual_' + Date.now(),
                      name,
                      phone: phone || '(11) 99999-8888',
                      address: 'Inserido Manualmente',
                      category: category || 'Geral',
                      rating: 5.0,
                      reviewsCount: 1,
                      status: 'Novo',
                      website: 'prospect.com.br',
                      workspaceId: currentWorkspaceId
                    };
                    await handleAddDbItem('lead', newL);
                    alert(`✓ Lead "${name}" inserido diretamente no funil CRM!`);
                    e.currentTarget.reset();
                  }}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 font-sans items-end animate-fade-in"
                >
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Nome do Lead / Empresa</label>
                    <input
                      name="lead_name"
                      required
                      placeholder="Ex: Pizzaria Bella"
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-805 text-xs text-white focus:outline-none focus:border-[#a3e635]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">WhatsApp / Contato</label>
                    <input
                      name="lead_phone"
                      placeholder="Ex: (11) 98765-4321"
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-850 text-xs text-white focus:outline-none focus:border-[#a3e635]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Nicho / Categoria</label>
                    <input
                      name="lead_niche"
                      placeholder="Ex: Restaurantes"
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-[#a3e635]"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-[#a3e635] hover:bg-[#bbf7d0] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <span>Adicionar Lead</span>
                    </button>
                  </div>
                </form>
                <div className="flex justify-end items-center gap-2 pt-3 border-t border-gray-900 mt-2">
                  <button
                    onClick={() => setShowSettingsPane(null)}
                    className="px-4 py-1.5 bg-gray-900 hover:bg-gray-805 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white font-bold text-[10px] rounded-lg cursor-pointer transition-all active:scale-95 font-sans"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => handleSaveConfig('maps_scraper')}
                    className="px-4 py-1.5 bg-[#a3e635] hover:bg-[#bbf7d0] text-black font-extrabold text-[10px] rounded-lg cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 font-sans"
                  >
                    {savingStatus['maps_scraper'] === 'saving' ? (
                      <span>Salvando...</span>
                    ) : savingStatus['maps_scraper'] === 'saved' ? (
                      <span className="flex items-center gap-1">✓ Salvo com sucesso!</span>
                    ) : (
                      <span>Salvar Configurações</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Check integration block */}
            {!isModuleActive('maps_scraper') ? (
              <UpsellOverlay 
                moduleTitle="Maps Scraper & Leads Machine"
                moduleCost={97}
                moduleDesc="Este módulo permite que você extraia até 500 leads qualificados por dia diretamente do Google Maps da sua região com filtros de nota e reputação, além de telefone e website."
                onActivate={() => activateModule('maps_scraper', 97)}
              />
            ) : (
              <div className="space-y-6">
                {/* Search controller panel */}
                <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm shadow-xl shadow-black/40 hover:border-gray-800 transition-all duration-300">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-[#a3e635]" />
                    <span>Parâmetros de Varredura Geográfica</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5 font-bold">Nicho / Categoria Comercial</label>
                      <select
                        value={scraperCategory}
                        onChange={(e) => {
                          setScraperCategory(e.target.value);
                          if(e.target.value !== 'custom') setScraperCustomCategory('');
                        }}
                        disabled={scraperStatus === 'scraping'}
                        className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none"
                      >
                        <option value="dentista">Dentistas / Clínicas Odontológicas</option>
                        <option value="academia">Academias / CT / Crossfit</option>
                        <option value="restaurante">Hamburguerias / Restaurantes / Bares</option>
                        <option value="padaria">Padarias / Confeitarias</option>
                        <option value="custom">Outro nicho personalizado...</option>
                      </select>
                    </div>

                    {scraperCategory === 'custom' && (
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5 font-bold">Digite o Nicho</label>
                        <input 
                          type="text"
                          required
                          placeholder="Ex: Pet Shop, Clínica Estética"
                          value={scraperCustomCategory}
                          onChange={(e) => setScraperCustomCategory(e.target.value)}
                          disabled={scraperStatus === 'scraping'}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-[#a3e635]"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5 font-bold">Localidade / Cidade</label>
                      <input 
                        type="text"
                        required
                        disabled={scraperStatus === 'scraping'}
                        defaultValue="São Paulo, SP"
                        className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-[#a3e635]"
                      />
                    </div>
                  </div>

                  {/* Extraction triggering */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-gray-900 pt-5">
                    {scraperStatus === 'idle' ? (
                      <button
                        onClick={startScrapeLeads}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#a3e635] hover:bg-[#84cc16] text-[#030712] rounded-xl font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <MapPin className="w-4 h-4 text-[#030712]" />
                        <span>Começar Varredura no Mapa</span>
                      </button>
                    ) : scraperStatus === 'scraping' ? (
                      <div className="w-full">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-gray-400 font-mono animate-pulse">Varredura em andamento: {scraperProgress}% completado</span>
                          <span className="text-[10px] font-mono text-[#a3e635]">{extractedCount} encontrados</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden mb-3">
                          <div 
                            className="h-full bg-gradient-to-r from-[#a3e635] to-green-400 transition-all duration-300"
                            style={{ width: `${scraperProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-between">
                        <div className="flex items-center gap-2 text-green-400 text-xs">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span>Varredura concluída! {extractedCount} leads adicionados ao funil.</span>
                        </div>

                        <button
                          onClick={resetScrapeStateAfterShow}
                          className="w-full sm:w-auto px-4 py-2 bg-gray-900 hover:bg-gray-850 hover:text-white border border-gray-800 text-gray-400 transition-all font-bold text-xs rounded-xl"
                        >
                          Limpar Scraper
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Scraper Output live compiler terms logs */}
                  {scraperLogs.length > 0 && (
                    <div className="mt-4 p-4 rounded-xl bg-black border border-gray-900 font-mono text-[9px] sm:text-[10px] text-gray-400 space-y-1.5 h-28 overflow-y-auto max-h-[120px]">
                      {scraperLogs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span className="text-gray-600 font-bold font-mono">[{idx+1}]</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scraped Leads Interactive Datatable representing CRM integration */}
                <div className="p-6 rounded-2xl bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm shadow-xl shadow-black/40 hover:border-gray-800 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Funil Comercial / Leads Cadastrados</h3>
                    <span className="text-[10px] font-mono text-gray-500">{activeLeads.length} contatos ativos</span>
                  </div>

                  <div className="overflow-x-auto text-left">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-900 text-gray-500 text-[10px] font-mono uppercase">
                          <th className="py-2.5 px-3 font-bold">Empresa / Contato</th>
                          <th className="py-2.5 px-3 font-bold">Telefone</th>
                          <th className="py-2.5 px-3 font-bold">Reputação Google</th>
                          <th className="py-2.5 px-3 font-bold">Status do CRM</th>
                          <th className="py-2.5 px-3 font-bold text-center w-[160px]">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-900/40 text-xs text-left">
                        {activeLeads.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500 font-light font-sans">Nenhum lead disponível neste workspace. Rode o coletor acima ou envie dados via API!</td>
                          </tr>
                        ) : (
                          activeLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-gray-900/10">
                            <td className="py-3.5 px-3">
                              <span className="font-extrabold text-[#f3f4f6] block">{lead.name}</span>
                              <span className="text-[10px] text-gray-500 block truncate font-light max-w-[220px] mt-0.5">{lead.address}</span>
                            </td>
                            <td className="py-3.5 px-3 font-mono text-[11px] text-gray-300">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-gray-600" />
                                <span>{lead.phone}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-gray-300 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">{lead.rating}</span>
                                <div className="flex text-yellow-500 text-[10px]">
                                  <Star className="w-3 h-3 fill-yellow-500" />
                                </div>
                                <span className="text-gray-500">({lead.reviewsCount})</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <select
                                value={lead.status}
                                onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold font-mono uppercase bg-gray-900 border border-gray-800 ${
                                  lead.status === 'Novo' ? 'text-yellow-400' :
                                  lead.status === 'Em Contato' ? 'text-blue-400' :
                                  lead.status === 'Ganho' ? 'text-green-400' : 'text-gray-500'
                                }`}
                              >
                                <option value="Novo">Novo</option>
                                <option value="Em Contato">Em Contato</option>
                                <option value="Ganho">Ganho (Fechado!)</option>
                                <option value="Não Tem Interesse">Descartado</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => sendLeadToChat(lead)}
                                  className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-[#a3e635]/15 hover:text-[#a3e635] text-gray-400 border border-gray-800 hover:border-[#a3e635]/30 transition-all text-[11px] font-bold flex items-center justify-center gap-1"
                                  title="Analisar"
                                >
                                  <Sparkles className="w-3 h-3 text-[#a3e635] fill-[#a3e635]" />
                                  <span>Roteiro</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteDbItem('lead', lead.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-400 rounded hover:bg-gray-900 transition-colors cursor-pointer"
                                  title="Excluir Lead"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                       )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6 / LOCK 2: IA CONSULTORA RAG ACTIVE CONVERSATION */}
        {activeTab === 'ia_consultora' && (
          <div className="h-full flex flex-col space-y-6" id="ai_consultora_tab">
            <div className="border-b border-gray-900 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white font-poppins flex items-center gap-2">
                  <Sparkles className="w-5.5 h-5.5 text-[#a3e635] animate-pulse" />
                  <span>IA Consultora</span>
                </h1>
                <p className="text-xs text-gray-400 font-light mt-0.5">Diagnósticos e insights automáticos com inteligência com tecnologia RAG baseada na sua agência.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettingsPane(prev => prev === 'ia_consultora' ? null : 'ia_consultora')}
                  className="px-3.5 py-1.5 bg-gray-950 hover:bg-gray-905 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border-dashed"
                >
                  <Bolt className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span>Configurar Aba</span>
                </button>

                {isModuleActive('ia_consultora') && (
                  <span className="px-2.5 py-1 rounded bg-[#a3e635]/15 text-[#a3e635] text-[10px] font-extrabold uppercase font-mono border border-[#a3e635]/30">
                    Módulo Integrado
                  </span>
                )}
              </div>
            </div>

            {/* Collapsible settings panel */}
            {showSettingsPane === 'ia_consultora' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gray-950 border border-gray-805 text-left space-y-4 shadow-xl text-xs"
              >
                <div className="border-b border-gray-900 pb-2">
                  <h4 className="text-xs font-mono uppercase font-bold text-[#a3e635]">🔧 Configuração: Copiloto Coprompt (Instruções de IA)</h4>
                  <p className="text-[11px] text-gray-400 font-light mt-0.5 leading-relaxed font-sans">Força comandos de contextualização para modelar o tom e os limites da Consultora de IA de acordo com sua agência.</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-500 font-sans">Instruções Customizadas da Inteligência (System Instruction Override)</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Você é a consultora principal de growth marketing da AgencyOS. Seja sarcástica e extremamente focada em diminuir o CAC do cliente..."
                    value={dbOverrides.customInstructions !== undefined ? dbOverrides.customInstructions : ''}
                    onChange={(e) => saveDbOverrides({ customInstructions: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 focus:border-[#a3e635] text-xs text-white focus:outline-none placeholder:text-gray-650 resize-none font-sans"
                  />
                  <div className="flex justify-between items-center pt-2 border-t border-gray-900 mt-2">
                    <button
                      onClick={() => saveDbOverrides({ customInstructions: '' })}
                      className="px-2 py-1 bg-red-950/20 hover:bg-red-950/25 text-red-400 text-[9px] rounded-lg border border-red-900/40 cursor-pointer font-sans"
                    >
                      Remover Instruções Adicionais
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSettingsPane(null)}
                        className="px-4 py-1.5 bg-gray-900 hover:bg-gray-855 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white font-bold text-[10px] rounded-lg cursor-pointer transition-all active:scale-95 font-sans"
                      >
                        Fechar
                      </button>
                      <button
                        onClick={() => handleSaveConfig('ia_consultora')}
                        className="px-4 py-1.5 bg-[#a3e635] hover:bg-[#bbf7d0] text-black font-extrabold text-[10px] rounded-lg cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 font-sans"
                      >
                        {savingStatus['ia_consultora'] === 'saving' ? (
                          <span>Salvando...</span>
                        ) : savingStatus['ia_consultora'] === 'saved' ? (
                          <span className="flex items-center gap-1">✓ Salvo com sucesso!</span>
                        ) : (
                          <span>Salvar Configurações</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Check integration block */}
            {!isModuleActive('ia_consultora') ? (
              <UpsellOverlay 
                moduleTitle="IA Consultora Inteligente (RAG)"
                moduleCost={97}
                moduleDesc="Este módulo permite ter uma inteligência artificial que lê seu MRR, fluxo de caixa e leads de mapas para responder dúvidas, gerar roteiros de vendas sob medida e dar sugestões táticas automáticas de crescimento para sua agência."
                onActivate={() => activateModule('ia_consultora', 97)}
              />
            ) : (
              <div className="flex-1 bg-gray-950/80 border border-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-black/40 flex flex-col h-[520px] max-h-[520px] overflow-hidden text-left">
                {/* Chat header details */}
                <div className="p-4 border-b border-gray-900 bg-gray-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    <span className="text-xs font-bold text-gray-200">AgencyOS RAG Engine - Online</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">Modelo: gemini-3.5-flash</span>
                    <button
                      onClick={() => {
                        setMessages([
                          {
                            id: 'm1_' + Date.now(),
                            sender: 'assistant',
                            text: 'Olá! Sou a sua **IA Consultora** do AgencyOS. Estou com acesso exclusivo aos seus dados financeiros, CRM de leads e tráfego pago via tecnologia RAG.\n\nComo posso ajudar você a acelerar os resultados da sua agência hoje?',
                            timestamp: new Date()
                          }
                        ]);
                      }}
                      className="px-2 py-1.5 text-[10px] uppercase font-mono text-gray-400 hover:text-red-400 bg-gray-900 hover:bg-gray-850 rounded border border-gray-800 transition-all flex items-center gap-1 cursor-pointer font-bold"
                      title="Limpar Conversa"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                      <span>Limpar Conversa</span>
                    </button>
                  </div>
                </div>

                {/* Chat window viewport */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-950/40">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed text-xs ${
                        msg.sender === 'user'
                          ? 'bg-[#a3e635]/15 border border-[#a3e635]/35 text-[#f3f4f6]'
                          : 'bg-gray-900 border border-gray-850 text-gray-300'
                      }`}>
                        {/* Rendering styled texts segments simply */}
                        <div className="whitespace-pre-wrap font-light text-left select-text">
                          {formatMarkdownText(msg.text)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing bubble loading block */}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-900 border border-gray-850 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef}></div>
                </div>

                {/* Quick actions suggest tags */}
                <div className="p-3 border-t border-gray-900 bg-gray-950 flex flex-wrap gap-2 items-center">
                  <span className="text-[9px] text-gray-600 font-mono uppercase tracking-widest font-bold">Sugestões rápidas</span>

                  <button
                    onClick={() => handleSendMessage(undefined, "Pode analisar meus números de LTV e CAC e me dar um plano de ação comercial?")}
                    className="px-2.5 py-1 text-[10px] rounded-lg bg-gray-900 hover:bg-gray-850 hover:text-white text-gray-400 border border-gray-900"
                  >
                    Análise Faturamento
                  </button>

                  <button
                    onClick={() => handleSendMessage(undefined, "Como posso usar o Maps Scraper para captar mais clientes para minha própria agência?")}
                    className="px-2.5 py-1 text-[10px] rounded-lg bg-gray-900 hover:bg-gray-850 hover:text-white text-gray-400 border border-gray-900"
                  >
                    Tática Captação Maps
                  </button>

                  <button
                    onClick={() => handleSendMessage(undefined, "Escreva um criativo curto de Facebook Ads para o nicho de Dentista Odontologia")}
                    className="px-2.5 py-1 text-[10px] rounded-lg bg-gray-900 hover:bg-gray-850 hover:text-white text-gray-400 border border-gray-900"
                  >
                    Ideias Criativos Tráfego
                  </button>
                </div>

                {/* Submit search form */}
                <form onSubmit={(e) => handleSendMessage(e)} className="p-3 border-t border-gray-900 bg-gray-950 flex items-center gap-2">
                  <input 
                    type="text"
                    disabled={aiLoading}
                    placeholder="Faça uma pergunta sobre finanças, tráfego ou como convencer leads..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-[#a3e635] placeholder:text-gray-600"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading}
                    className="p-2.5 bg-[#a3e635] hover:bg-[#84cc16] disabled:bg-gray-900 text-[#030712] rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Tab Tour Modal Pop-up (One per tab, displayed once, with force-trigger option) */}
      <AnimatePresence>
        {showTour && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-gray-950 border border-gray-900 rounded-3xl p-6 sm:p-8 text-left relative overflow-hidden shadow-2xl"
            >
              {/* Decorative light effect */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#a3e635]/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between mb-4 border-b border-gray-900 pb-3">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 font-bold">Guia de Uso Prático (SaaS Master)</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gray-900 border border-gray-800 text-[#a3e635] font-mono font-medium">Módulo: {activeTab.toUpperCase()}</span>
              </div>

              <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                {tourContent.title}
              </h2>
              
              <p className="text-xs text-gray-400 mt-1 leading-relaxed font-sans font-light">
                {tourContent.desc}
              </p>

              <div className="my-6 space-y-4">
                <h4 className="text-[10px] font-mono uppercase tracking-widest font-bold text-gray-400">Guia de Instruções e Melhores Práticas:</h4>
                <div className="space-y-3">
                  {tourContent.bullets.map((bullet, index) => (
                    <div key={index} className="flex items-start gap-2.5 text-xs text-gray-300">
                      <span className="w-5 h-5 rounded-full bg-[#a3e635]/15 text-[#a3e635] flex items-center justify-center shrink-0 font-mono font-bold text-[10px] mt-0.5">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed font-sans font-light">
                        {formatMarkdownText(bullet)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-gray-900 pt-5 mt-6">
                <p className="text-[10px] text-gray-600 font-sans font-light">Este pop-up explicativo aparece apenas no seu primeiro acesso.</p>
                <button
                  onClick={dismissTour}
                  className="px-5 py-2.5 bg-[#a3e635] hover:bg-[#84cc16] text-[#030712] font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer font-sans"
                >
                  Começar a Usar Módulo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  // Helper inside scraper to clean view
  function resetScrapeStateAfterShow() {
    resetScraperState();
  }
}

// Format crude text blocks into elegant simulated inline structures
function formatMarkdownText(text: string) {
  // Replace bold markers **word**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((p, idx) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <span key={idx} className="font-extrabold text-white">{p.slice(2, -2)}</span>;
        }
        return p;
      })}
    </>
  );
}

// Custom badges layout for calendar event type
function FlagModuleLabel({ id }: { id: string }) {
  if (id === 'Tráfego') {
    return (
      <span className="flex items-center gap-1 text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
        Tráfego Pago
      </span>
    );
  }
  if (id === 'Financeiro') {
    return (
      <span className="flex items-center gap-1 text-sky-400">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block"></span>
        Contabilidade / ROI
      </span>
    );
  }
  if (id === 'Maps Scraper') {
    return (
      <span className="flex items-center gap-1 text-red-500">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
        Maps Scraper
      </span>
    );
  }
  return <span className="text-gray-400">{id}</span>;
}

// Upsell screen layout for locking locked modules (highly engaging)
function UpsellOverlay({ 
  moduleTitle, 
  moduleCost, 
  moduleDesc, 
  onActivate 
}: { 
  moduleTitle: string; 
  moduleCost: number; 
  moduleDesc: string; 
  onActivate: () => void;
}) {
  return (
    <div className="py-20 px-6 max-w-xl mx-auto rounded-3xl glass-panel text-center border-yellow-500/15 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-5">
        <Lock className="w-5 h-5 stroke-[2]" />
      </div>

      <h3 className="text-white font-extrabold text-lg mb-2">{moduleTitle} Bloqueado</h3>
      <p className="text-gray-400 text-xs font-light max-w-sm mx-auto mb-6 leading-relaxed">
        {moduleDesc}
      </p>

      <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-gray-900 pt-6 w-full">
        <div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block text-left">Valor Adicional</span>
          <span className="text-md font-black text-yellow-500 font-mono">+R$ {moduleCost}/mês</span>
        </div>

        <button
          onClick={onActivate}
          className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl font-bold text-xs tracking-wide transition-all uppercase flex items-center gap-1"
        >
          <span>Instalar Módulo Ativo</span>
          <Plus className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}
