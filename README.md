# Integração de Assinaturas Mercado Pago v3 — AgencyOS (Produção) 🚀

Este guia técnico detalha a arquitetura de alta integrabilidade, segurança e o processo de implantação da integração de assinaturas recorrentes (*Preapproval*) com o SDK do Mercado Pago no seu SaaS **AgencyOS** hospedado na Vercel.

---

## 🛠️ Configuração de Variáveis de Ambiente na Vercel

Para colocar a integração em produção de forma segura e fazer com que o servidor leia as credenciais de forma limpa via `process.env`, você deve configurar as seguintes variáveis de ambiente no painel estratégico da Vercel:

### Passo a Passo no Console da Vercel:
1. Acesse o seu painel na **Vercel** e selecione o projeto do **AgencyOS**.
2. Vá na aba **`Settings` (Configurações)** na parte superior.
3. No menu lateral esquerdo, clique em **`Environment Variables` (Variáveis de Ambiente)**.
4. Adicione as seguintes chaves:

| Nome da Variável (Key) | Valor Sugerido (Value) | Visibilidade / Tipo | Descrição Corporal |
| :--- | :--- | :--- | :--- |
| **`MP_ACCESS_TOKEN`** | `APP_USR-68567076763...` | Secreto (Decrypted) | Seu token de acesso oficial do Mercado Pago. Use credenciais com o prefixo `TEST-` para homologação/sandbox ou `APP_USR-` para vendas reais. |
| **`MP_WEBHOOK_SECRET`** | `c9911b08f1304afa881dd20f2a14fe8ec8135f85ce85964f87c0de3f7a608574` | Secreto (Decrypted) | O segredo único da webhook correspondente gerado no painel de desenvolvedor do Mercado Pago para verificação do cabeçalho de assinatura `X-Signature`. |
| **`NEXT_PUBLIC_APP_URL`** | `https://agency-os-sigma-eight.vercel.app` | Pública (Client-Side) | URL canônica de produção para redirecionamento inteligente e montagem de callbacks de transações concluídas. |

*Nota: Não inclua aspas (`'`) ao salvar os valores das chaves no console da Vercel.*

---

## 🔒 Arquitetura Blindada (Anti-Crash JSON)

A API Route `/pages/api/create-subscription.js` foi reestruturada de acordo com as melhores práticas de Engenharia de Confiabilidade:
* **Garantia de JSON:** Foi injetado o cabeçalho `res.setHeader('Content-Type', 'application/json')` no início de toda execução, garantindo que o parser do navegador do cliente receba o protocolo correto.
* **Isolamento de Erro (Try-Catch Extremo):** Qualquer falha de autenticação do token do Mercado Pago, erro de conectividade de rede ou ausência de variáveis do `process.env` é interceptada instantaneamente. Em vez de crashar e provocar uma renderização padrão de páginas HTML (que causaria o erro de parsing `Unexpected token 'T'`), a API responde de forma transparente com **`status(500)`** e um arquivo de dados JSON legível contendo a propriedade `error`.

---

## 📱 Componente `CheckoutForm.js` Resiliente

O formulário de assinatura em `/components/CheckoutForm.js` consome essa API de modo imune a travamentos e bloqueios:
1. **Verificação de Tipo de Mídia:** Antes de analisar o corpo da resposta com `.json()`, o frontend inspeciona o cabeçalho `Content-Type`. Se receber HTML por falha no deploy ou no servidor da nuvem, ele recupera o conteúdo como string e dispara um erro humanizado instantâneo.
2. **Notificação Não-Bloqueante:** Os erros interceptados em chamadas de API são jogados diretamente em uma caixa vermelha contextualizada no layout e um alerta amigável de navegador via `alert()`, garantindo que a aplicação permaneça ativa e prestando excelente experiência de depuração do usuário de forma assíncrona.

---

## ⚙️ Exemplo de Consumo no Código Fonte

Todas as leituras de variáveis de ambiente do SDK v3 seguem a interface recomendada da comunidade de desenvolvedores:

```javascript
import { MercadoPagoConfig, Preapproval } from 'mercadopago';

// Instanciação segura pelo process.env
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 10000 }
});
```

Este ecossistema profissional reduz a incidência de falhas críticas de infraestrutura a zero e viabiliza um fluxo sustentável de transações financeiras para a plataforma de forma performática e blindada.
