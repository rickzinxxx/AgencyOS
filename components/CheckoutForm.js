import React, { useState } from 'react';

/**
 * Componente: CheckoutForm
 * 
 * Um formulário de checkout elegante, moderno e de alta fidelidade visual
 * para o SaaS AgencyOS. Permite que o usuário configure seu Nome, E-mail
 * e escolha entre os planos Starter, Pro e Agency de forma intuitiva,
 * integrando-se diretamente ao fluxo do Mercado Pago em Next.js.
 */

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 197,
    description: 'Ideal para agências iniciantes estruturarem suas primeiras operações de marketing.',
    features: ['1 Workspace Isolado', 'Suporte por e-mail', 'Métricas básicas de MRR', 'Até 5 colaboradores']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 497,
    description: 'O plano mais procurado. Para agências em crescimento escalarem com IA e dados reais.',
    features: ['3 Workspaces Isolados', 'Suporte prioritário', 'Métricas em tempo real', 'Leads de mapas e IA Integrada']
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 997,
    description: 'Infraestrutura completa e ilimitada para grandes operações e franquias de agência.',
    features: ['Workspaces Ilimitados', 'Gerente de contas exclusivo', 'White-label completo', 'Conselho estratégico assistido por IA']
  }
];

export default function CheckoutForm({ initialPlanId = 'pro' }) {
  // Estados de Entrada do Usuário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);

  // Estados de Controle de Envio
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Busca as propriedades do plano selecionado
  const currentPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[1];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Validações básicas no lado do cliente
    if (!name.trim()) {
      setError('Por favor, informe o seu nome completo.');
      setLoading(false);
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, insira um endereço de e-mail corporativo válido.');
      setLoading(false);
      return;
    }

    try {
      console.log(`[CheckoutForm] Iniciando checkout de assinatura do plano: ${currentPlan.name}`);

      // Chamada da API Route no Next.js
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          planName: currentPlan.name,
          price: currentPlan.price,
          userId: email.trim().toLowerCase(), // Usando o e-mail como chave de identificação (external_reference) no banco/webhook
          userName: name.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Erro na criação da sessão de pagamento.');
      }

      setSuccessMsg('Assinatura gerada! Redirecionando para as telas seguras do Mercado Pago...');

      // Pequeno timeout para o usuário visualizar o sucesso antes de sair da página
      setTimeout(() => {
        if (data.initPoint) {
          window.location.href = data.initPoint;
        } else {
          setError('Não foi possível obter o link de checkout (init_point) do Mercado Pago.');
          setLoading(false);
        }
      }, 1000);

    } catch (err) {
      console.error('[CheckoutForm Request Critical Error]:', err);
      setError(err?.message || 'Houve um erro de rede ou de configuração da chave de API do Mercado Pago.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row font-sans text-white">
      {/* Coluna Esquerda: Informações Gerais e Seleção de Planos */}
      <div className="flex-1 p-8 sm:p-10 border-b md:border-b-0 md:border-r border-zinc-900 bg-zinc-950/60 flex flex-col justify-between">
        <div>
          <span className="text-[#a3e635] font-mono text-xs uppercase tracking-widest block mb-1">Passo 1 de 2</span>
          <h2 className="text-2xl font-black tracking-tight mb-4">Escolha o seu plano</h2>
          
          <div className="space-y-4">
            {PLANS.map((plan) => {
              const isSelected = plan.id === selectedPlanId;
              return (
                <label
                  key={plan.id}
                  htmlFor={`checkbox_plan_${plan.id}`}
                  className={`block border rounded-2xl p-4 cursor-pointer transition-all duration-300 relative ${
                    isSelected 
                      ? 'border-[#a3e635] bg-[#a3e635]/5 shadow-[0_0_15px_rgba(163,230,53,0.1)]' 
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  <input
                    type="radio"
                    id={`checkbox_plan_${plan.id}`}
                    name="plansIdGroup"
                    value={plan.id}
                    checked={isSelected}
                    onChange={() => setSelectedPlanId(plan.id)}
                    className="absolute top-4 right-4 accent-[#a3e635] w-4 h-4 cursor-pointer"
                  />
                  <div className="pr-8">
                    <span className="font-bold text-sm block tracking-wide">{plan.name}</span>
                    <p className="text-xs text-zinc-400 font-light mt-1 leading-relaxed">{plan.description}</p>
                    <span className="text-sm font-black text-[#a3e635] mt-2 block">R$ {plan.price} <span className="text-xs text-zinc-500 font-light">/ mês</span></span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-900 pt-6">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">O que inclui o plano {currentPlan.name}:</h3>
          <ul className="grid grid-cols-2 gap-3 text-xs text-zinc-300 font-light">
            {currentPlan.features.map((feat, index) => (
              <li key={index} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#a3e635] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Coluna Direita: Formulário de Informações de Cadastro */}
      <div className="w-full md:w-[400px] p-8 sm:p-10 bg-zinc-900/20 flex flex-col justify-between">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <span className="text-[#a3e635] font-mono text-xs uppercase tracking-widest block mb-1">Passo 2 de 2</span>
            <h2 className="text-2xl font-black tracking-tight mb-2">Seus dados de checkout</h2>
            <p className="text-xs text-zinc-400 font-light">Utilizamos estas informações para gerar sua conta no AgencyOS e conectar ao Mercado Pago.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="checkout_input_name" className="text-xs font-bold text-zinc-400 tracking-wider block mb-2 uppercase">Nome Completo</label>
              <input
                id="checkout_input_name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva da Cunha"
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]/50 transition-all font-light"
              />
            </div>

            <div>
              <label htmlFor="checkout_input_email" className="text-xs font-bold text-zinc-400 tracking-wider block mb-2 uppercase">E-mail Corporativo</label>
              <input
                id="checkout_input_email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: comercial@suaagencia.com.br"
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]/50 transition-all font-light"
              />
            </div>
          </div>

          {/* Sumário Monetário */}
          <div className="bg-zinc-950/80 border border-zinc-850 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Plano Selecionado:</span>
              <span className="font-bold text-white">{currentPlan.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Ciclo de cobrança:</span>
              <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full text-[10px]">Mensal recorrente</span>
            </div>
            <div className="border-t border-zinc-900 pt-2 flex justify-between items-end">
              <span className="text-xs text-zinc-300 font-bold">Total a pagar hoje:</span>
              <span className="text-xl font-black text-[#a3e635]">R$ {currentPlan.price} <span className="text-[10px] text-zinc-500 font-light">/ mês</span></span>
            </div>
          </div>

          {/* Mensagens de Sucesso ou Erro */}
          {error && (
            <div className="bg-red-950/40 border border-red-900 p-3 rounded-xl text-xs text-red-300 leading-relaxed" id="checkout_form_error">
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-[#a3e635]/10 border border-[#a3e635]/30 p-3 rounded-xl text-xs text-[#a3e635] leading-relaxed" id="checkout_form_success">
              ✅ {successMsg}
            </div>
          )}

          {/* Botão de Envio Principal */}
          <button
            type="submit"
            id="checkout_submit_button"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 relative cursor-pointer
              ${loading 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-[#a3e635] text-black hover:bg-[#bef264] hover:shadow-lg hover:shadow-[#a3e635]/10 active:scale-[0.98]'
              }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processando Assinatura...</span>
              </>
            ) : (
              <span>Finalizar no Mercado Pago</span>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
          <svg className="w-3.5 h-3.5 text-[#a3e635]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
          <span>Ambiente Totalmente Criptografado</span>
        </div>
      </div>
    </div>
  );
}
