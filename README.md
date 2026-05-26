# Integração Mercado Pago Recorrente — AgencyOS 🚀

Este guia detalha a arquitetura completa e as configurações de produção necessárias para implantar a integração de assinaturas recorrentes com o Mercado Pago no seu SaaS **AgencyOS** hospedado na Vercel.

---

## 🛠️ Variáveis de Ambiente na Vercel (Environment Variables)

Para garantir o funcionamento seguro de ponta a ponta, insira as seguintes chaves no console administrativo do seu projeto na **Vercel** (`Settings > Environment Variables`):

| Nome da Variável | Tipo | Descrição / Valor sugerido |
| :--- | :--- | :--- |
| `MP_ACCESS_TOKEN` | Secreta (Decrypted) | O seu Access Token de acesso à API do Mercado Pago. Em Sandbox use `TEST-...` e em produção use `APP_USR-...`. |
| `MP_WEBHOOK_SECRET` | Secreta (Decrypted) | Sua assinatura secreta obtida no Painel do Desenvolvedor do Mercado Pago sob configurações de Webhook para validar o header de assinatura `X-Signature`. |
| `NEXT_PUBLIC_APP_URL` | Pública (Client-Side) | URL canônica do seu deployment de produção (ex: `https://agency-os-sigma-eight.vercel.app`). É utilizada para estruturar os callbacks após pagamentos. |

> **⚠️ Atenção de Produção:** Evite manter segredos de chaves criptográficas diretamente nos arquivos de código fonte. O SDK foi programado e as rotas preparadas para lerem automaticamente esses dados de forma isolada e segura utilizando `process.env`.

---

## 🔒 Arquitetura de Segurança do Webhook (`X-Signature` HMAC-SHA256)

Adicionamos uma camada robusta de proteção criptográfica ao receber avisos por fluxo de notificação IPN ou Webhooks. Isso evita o ataque conhecido como de "Replay" ou bypasses de infraestrutura por terceiros maliciosos:

1. **Assinatura do Payload:** O Mercado Pago gera uma assinatura criptográfica unindo as informações da requisição (`ts` e hash `v1` sob o header `x-signature`).
2. **Cálculo HMAC local:** O método `verifyMercadoPagoSignature` lê o segredo de ambiente `MP_WEBHOOK_SECRET`, reconstrói a string do manifesto de dados e as compara usando o algoritmo `sha256`.
3. **Resiliência de Resposta:** Se a assinatura falhar, retornamos `401 Unauthorized` bloqueando chamadas falsas. Se o segredo de produção não for fornecido, a execução continuará normalmente no modo de Sandbox para facilitar testes locais iniciais.

---

## 💾 Guia de Mapeamento do Banco de Dados no Webhook

Dentro do arquivo `/pages/api/webhook.js`, preparamos a estrutura pronta para você carregar seu ORM favorito (Prisma, Mongoose, Sequelize ou Firestore) para realizar as atualizações de plano:

### Ativação do Plano do Usuário (Status: `authorized`)

```javascript
// Localizado em /pages/api/webhook.js - Linha ~135
if (status === 'authorized') {
  // 1. O external_reference contém o e-mail ou UUID que você enviou no setup:
  const identifier = externalReference || userEmail;
  
  // 2. Execute sua query SQL para salvar no bando de dados:
  await db.user.update({
    where: { email: identifier },
    data: {
      planStatus: "active",
      planId: planId, // ex: pre_plan_starter, pre_plan_pro
      updatedAt: new Date()
    }
  });
}
```

### Suspensão de Plano por Inadimplência ou Cancelamento (Status: `cancelled`)

```javascript
// Localizado em /pages/api/webhook.js - Linha ~150
if (status === 'cancelled' || status === 'paused') {
  const identifier = externalReference || userEmail;
  
  await db.user.update({
    where: { email: identifier },
    data: {
      planStatus: "cancelled", // Desbloquear ou suspender recursos do SaaS
      updatedAt: new Date()
    }
  });
}
```

---

## 🧪 Roteiro de Testes em Ambiente Sandbox

Para simular pagamentos reais e percursos de assinaturas inteiros:

1. Acesse o **Mercado Pago > Seu Painel de Desenvolvedor**.
2. Vá em **Contas de Teste** e crie dois usuários fictícios: um vendedor (seller) e um comprador (buyer). Use o e-mail do comprador de testes no botão frontend.
3. Configure o link do Webhook apontando para `https://agency-os-sigma-eight.vercel.app/api/webhook` habilitando exclusivamente os escopos:
   - `subscription_preapproval` (assinaturas recorrentes)
   - `payment` (faturamento/notificações de parcelas individuais correspondentes)
4. Use cartões de testes disponibilizados pelo Mercado Pago para simular autorizações bem-sucedidas ou cartões rejeitados por fundos insuficientes para testar a robustez do tratamento de erro do seu SaaS comercial.
