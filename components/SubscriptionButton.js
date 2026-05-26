import React, { useState } from 'react';

/**
 * Componente: SubscriptionButton
 * 
 * Botão interativo otimizado para assinar planos do AgencyOS recorrentes no Mercado Pago.
 * 
 * Propriedades (Props):
 * - planName: String ('Starter', 'Pro', 'Agency')
 * - price: Number (197, 497, 997)
 * - userEmail: String (e-mail do assinante para pré-preenchimento no checkout)
 * - userId: String (ID exclusivo no seu banco local para atrelar ao external_reference)
 * - className: String (Estilos Tailwind CSS adicionais se necessário)
 */
export default function SubscriptionButton({ 
  planName = 'Pro', 
  price = 497, 
  userEmail = '', 
  userId = '',
  className = ''
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      // Faz a requisição para a rota de API local de seu Next.js
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail || 'comercial@agencyos.com',
          planName: planName,
          price: price,
          userId: userId || 'user_demo_123',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Falha ao processar checkout de pagamento.');
      }

      // Redireciona o usuário para o Checkout Seguro do Mercado Pago (Subscription Portal)
      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        throw new Error('Nenhum link de pagamento (initPoint) retornado da API.');
      }

    } catch (err) {
      console.error('[Checkout Button Error]:', err);
      setError(err.message || 'Houve um erro desconhecido ao abrir o checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        id={`btn_mp_subscribe_${planName.toLowerCase()}`}
        onClick={handleSubscribe}
        disabled={loading}
        className={`w-full py-3.5 px-6 rounded-xl font-bold font-sans tracking-wide text-sm transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2 cursor-pointer border
          ${loading 
            ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed' 
            : 'bg-[#a3e635] text-black border-[#a3e635] hover:bg-[#bef264] hover:shadow-lg hover:shadow-[#a3e635]/20 focus:outline-none focus:ring-2 focus:ring-[#a3e635]/50 active:scale-[0.98]'
          } ${className}`}
      >
        {loading ? (
          <>
            <svg 
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-zinc-500" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
              id="svg_spinner"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
              />
            </svg>
            <span>Processando Assinatura...</span>
          </>
        ) : (
          <span>Assinar Plano {planName}</span>
        )}
      </button>

      {/* Visualização amigável de erro caso ocorra qualquer limitação de conexão */}
      {error && (
        <p className="text-red-400 mt-2.5 text-xs text-center font-sans" id="checkout_error_text">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
