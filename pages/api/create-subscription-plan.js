/**
 * Next.js API Route: /pages/api/create-subscription-plan.js
 * 
 * Este endpoint cria planos de assinatura recorrente (PreapprovalPlan) no Mercado Pago.
 * É integrado ao SDK oficial "mercadopago" de forma resiliente e segura.
 */

import { MercadoPagoConfig, PreapprovalPlan } from 'mercadopago';

// Inicializando o Mercado Pago com o Access Token enviado pelo usuário
// Nota: Em ambiente real, recomendas-se usar process.env.MERCADOPAGO_ACCESS_TOKEN
const ACCESS_TOKEN = 'TEST-6856707676393488-052522-1bbd2ebc8f0d1e301b0b87a13bbcd35c-3152233934';

const client = new MercadoPagoConfig({
  accessToken: ACCESS_TOKEN,
  // Opções adicionais de resiliência e tempo limite de requisição
  options: {
    timeout: 10000, // 10s timeout
  }
});

export default async function handler(req, res) {
  // Garantir que a requisição seja apenas do método POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      error: `Método ${req.method} não suportado. Utilize POST.`
    });
  }

  try {
    const { planName, price } = req.body;

    // Validação básica de entradas
    if (!planName) {
      return res.status(400).json({ error: 'O nome do plano (planName) é obrigatório.' });
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ error: 'O valor do plano (price) deve ser um número maior que zero.' });
    }

    // Criar instância do agregador PreapprovalPlan
    const planClient = new PreapprovalPlan(client);

    // Mapeamento dos valores de cada plano para conformidade com o Mercado Pago
    // config de cobrança: Frequência Mensal (1 mês) em Reais (BRL)
    const planBody = {
      reason: `Assinatura AgencyOS - Plano ${planName}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: numericPrice,
        currency_id: 'BRL',
      },
      back_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://agencyos.com.br'}/subscription/callback`,
    };

    // Chamando a API do Mercado Pago usando a classe e o SDK oficial
    const response = await planClient.create({ body: planBody });

    // Verificar se obtivemos o ID com sucesso na resposta
    if (response && response.id) {
      console.log(`[MercadoPago] Plano criado com sucesso! ID: ${response.id}`);
      return res.status(201).json({
        success: true,
        planId: response.id,
        reason: response.reason,
        init_point: response.init_point || null, // URL do Checkout do Plano se retornado
        details: response
      });
    } else {
      throw new Error('O SDK do Mercado Pago não retornou um ID de plano válido.');
    }

  } catch (error) {
    console.error('[MercadoPago Error] Erro ao criar o plano de assinatura:', error);

    // Tratamento de erros detalhado do Mercado Pago
    const statusCode = error.status || 500;
    const errorMessage = error.message || 'Erro desconhecido ao processar a requisição no Mercado Pago.';
    const errorDetails = error.cause || error.errors || null;

    return res.status(statusCode).json({
      error: 'Falha ao criar o plano de assinatura no Mercado Pago.',
      message: errorMessage,
      details: errorDetails
    });
  }
}
