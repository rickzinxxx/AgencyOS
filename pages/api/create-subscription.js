/**
 * Next.js API Route: /pages/api/create-subscription.js
 * 
 * Endpoint blindado de alta integrabilidade para iniciar fluxos de assinatura recorrente (Preapproval) mensal 
 * vinculados ao perfil do usuário no AgencyOS.
 */

import { MercadoPagoConfig, Preapproval } from 'mercadopago';

export default async function handler(req, res) {
  // Forçar cabeçalho de tipo de conteúdo JSON para evitar qualquer conversão para HTML pelo servidor
  res.setHeader('Content-Type', 'application/json');

  // Permitir apenas requisições POST para proteção de segurança de dados
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} não suportado.` });
  }

  try {
    const email = req.body?.email || req.body?.userEmail;
    let planName = req.body?.planName;
    let price = req.body?.price;
    const userId = req.body?.userId;

    if (req.body?.planId) {
      const planId = req.body.planId.toLowerCase();
      if (planId === 'starter') {
        planName = 'Starter';
        price = 197;
      } else if (planId === 'pro') {
        planName = 'Pro';
        price = 497;
      } else if (planId === 'agency') {
        planName = 'Agency';
        price = 997;
      } else {
        planName = 'Pro';
        price = 497;
      }
    }

    // Validações de entrada robustas
    if (!email) {
      return res.status(400).json({ 
        error: 'O e-mail do usuário é obrigatório para emitir e vincular a assinatura.' 
      });
    }

    if (!planName || !price) {
      planName = 'Pro';
      price = 497;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ error: 'O valor da assinatura deve ser um número maior que zero.' });
    }

    // Obter credencial do Mercado Pago de forma robusta
    const accessToken = process.env.MP_ACCESS_TOKEN || 'TEST-6856707676393488-052522-1bbd2ebc8f0d1e301b0b87a13bbcd35c-3152233934';

    if (!accessToken) {
      return res.status(500).json({ error: 'Chave de API do Mercado Pago (MP_ACCESS_TOKEN) não configurada no servidor.' });
    }

    // Inicializar o SDK do Mercado Pago
    const mpClient = new MercadoPagoConfig({
      accessToken: accessToken,
      options: {
        timeout: 10000, // Timeout de segurança de 10s
      }
    });

    const preapproval = new Preapproval(mpClient);

    // Corpo de requisição otimizado para assinaturas mensais recorrentes
    const subscriptionBody = {
      payer_email: email.trim().toLowerCase(),
      reason: `Assinatura AgencyOS - Plano ${planName}`,
      // O external_reference é a chave de ouro da integração.
      // Sincronize enviando o ID interno do usuário ou o e-mail para garantir a conciliação comercial no webhook!
      external_reference: userId || email.trim().toLowerCase(),
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: numericPrice,
        currency_id: 'BRL',
      },
      // Callback de retorno ao finalizar o fluxo no Sandbox/Produção do Mercado Pago
      back_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://agency-os-sigma-eight.vercel.app'}/dashboard`,
      status: 'pending' // Estado pendente até ser autorizado pelo fluxo de pagamento
    };

    console.log('[MercadoPago] Payload enviado para Preapproval:', JSON.stringify(subscriptionBody, null, 2));

    // Executa a criação no Mercado Pago
    const response = await preapproval.create({ body: subscriptionBody });

    if (response && response.id) {
      console.log(`[MercadoPago] Assinatura gerada com sucesso! ID: ${response.id}`);
      return res.status(200).json({
        success: true,
        subscriptionId: response.id,
        // O init_point é a URL do checkout que o usuário acessará para concluir a assinatura
        initPoint: response.init_point || `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${response.id}`,
        init_point: response.init_point || `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${response.id}`,
        status: response.status
      });
    } else {
      throw new Error('A resposta do Mercado Pago não possui um ID de assinatura válido.');
    }

  } catch (error) {
    console.error('[MercadoPago API Route Error]:', error);
    
    // Em caso de QUALQUER erro estrutural ou de gateway, retorna JSON formatado com código 500
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro interno no servidor ao processar o plano de assinatura.'
    });
  }
}

