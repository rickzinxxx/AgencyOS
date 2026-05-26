/**
 * Firebase Cloud Function in Node.js
 * Name: webhookUniversal
 * This script receives store webhooks and registers sales under /users/{userId}/vendas/ in Firestore
 */

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize application
admin.initializeApp();

exports.webhookUniversal = onRequest({ cors: true }, async (req, res) => {
  // 1. Only allow POST requests for webhook payloads
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Utilize o método POST." });
  }

  // 2. Extract userId from query parameters
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: "Parâmetro 'userId' (e-mail) ausente no query search da URL." });
  }

  try {
    const db = admin.firestore();

    // 3. Verify user exists in the Firestore database
    const userRef = db.collection("users").doc(userId.toLowerCase());
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({
        error: `Usuário '${userId}' não cadastrado no Firestore. Acesse o sistema primeiro para provisionar a conta.`
      });
    }

    // 4. Extract and normalize sale details from the generic payload
    const payload = req.body || {};

    let amount = 0;
    if (typeof payload.amount === "number") {
      amount = payload.amount;
    } else if (typeof payload.value === "number") {
      amount = payload.value;
    } else if (payload.amount) {
      amount = parseFloat(payload.amount);
    } else if (payload.total) {
      amount = parseFloat(payload.total);
    } else if (payload.price) {
      amount = parseFloat(payload.price);
    } else if (payload.total_price) {
      amount = parseFloat(payload.total_price);
    }

    // Default amount fallback for trial webhooks (such as Stripe / Shopify test queries)
    if (isNaN(amount) || amount <= 0) {
      amount = 150.00;
    }

    let customer = "Cliente Externo";
    if (payload.customer_name) {
      customer = payload.customer_name;
    } else if (payload.customer && payload.customer.name) {
      customer = payload.customer.name;
    } else if (payload.billing && payload.billing.first_name) {
      customer = `${payload.billing.first_name} ${payload.billing.last_name || ""}`.trim();
    } else if (payload.email) {
      customer = payload.email;
    }

    // 5. Construct sale record matching standard structure
    const vendaRecord = {
      amount: Number(amount),
      customer: customer,
      date: new Date().toISOString(),
      type: "receita",
      payload: payload,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 6. Write record to the user's vendas subcollection
    const vendaRef = await userRef.collection("vendas").add(vendaRecord);

    return res.status(200).json({
      success: true,
      message: "Venda gravada via Webhook com sucesso!",
      vendaId: vendaRef.id,
      venda: {
        amount: vendaRecord.amount,
        customer: vendaRecord.customer,
        date: vendaRecord.date
      }
    });

  } catch (error) {
    console.error("Erro processando webhookUniversal:", error);
    return res.status(500).json({
      error: "Erro no servidor ao registrar a venda no Firestore.",
      details: error.message
    });
  }
});
