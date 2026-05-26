/**
 * /lib/mercadopago.js
 * 
 * Configuração centralizada do SDK oficial do Mercado Pago para o AgencyOS.
 * Carrega dinamicamente o Access Token de Produção ou Teste a partir das
 * variáveis de ambiente configuradas na Vercel.
 */

import { MercadoPagoConfig } from 'mercadopago';

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'TEST-6856707676393488-052522-1bbd2ebc8f0d1e301b0b87a13bbcd35c-3152233934';

if (!process.env.MP_ACCESS_TOKEN) {
  console.warn(
    '[MercadoPago Warning] MP_ACCESS_TOKEN não está definido. Utilizando credencial temporária sandbox para testes.'
  );
}

// Inicializa o cliente do Mercado Pago
export const mpClient = new MercadoPagoConfig({
  accessToken: ACCESS_TOKEN,
  options: {
    timeout: 10000, // Timeout de segurança de 10s para chamadas ao gateway
  }
});
