export interface AgencyModule {
  id: string;
  name: string;
  description: string;
  price: number;
  isIncluded: boolean;
  iconName: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  reviewsCount: number;
  status: 'Novo' | 'Em Contato' | 'Ganho' | 'Não Tem Interesse';
  website?: string;
  workspaceId?: string;
}

export interface FinancialEntry {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  date: string;
  paymentMethod?: 'pix' | 'credito' | 'debito' | 'boleto';
  workspaceId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  module: string;
  color: string;
  workspaceId?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}
