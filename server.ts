import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";

dotenv.config();

const DB_PATH = path.join(process.cwd(), "workspaces-db.json");
const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = fs.existsSync(CONFIG_PATH) ? JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) : {};

// Helper to read database
function readDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (!parsed.emails) parsed.emails = [];
      return parsed;
    }
  } catch (e) {
    console.error("Error reading JSON db:", e);
  }
  return { 
    owners: [], 
    workspaces: [], 
    transactions: [], 
    leads: [], 
    events: [], 
    apiLogs: [], 
    customOverrides: {},
    emails: []
  };
}

// Helper to write database
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing JSON db:", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // Initialize Gemini Client
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Gemini GenAI client successfully initialized server-side.");
    } catch (e) {
      console.error("Error setting up GoogleGenAI client:", e);
    }
  }

  // 1. AUTHENTICATION ENDPOINTS
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name, agencyName, planId, selectedAddons } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "E-mail, senha e nome são obrigatórios para cadastro." });
    }

    const db = readDb();
    const existing = db.owners.find((o: any) => o.email.toLowerCase() === email.toLowerCase());
    
    if (existing) {
      return res.status(400).json({ error: "Já existe um proprietário cadastrado com este e-mail." });
    }

    const newOwner = {
      email: email.toLowerCase(),
      passwordHash: password, // simple store for demo purposes
      name,
      agencyName: agencyName || "Minha Agência Digital",
      planId: planId || "starter",
      selectedAddons: selectedAddons || ["financeiro", "fluxo_caixa", "agenda", "calculadora_roi"]
    };

    db.owners.push(newOwner);

    // Bootstrap standard workplaces immediately for user registration to make setup fully plug-and-play
    const ws1Id = "ws_" + Math.random().toString(36).substring(2, 9);
    const ws2Id = "ws_" + Math.random().toString(36).substring(2, 9);
    
    const ws1 = {
      id: ws1Id,
      ownerEmail: email.toLowerCase(),
      name: "Workspace Agência Principal",
      apiKey: "aos_live_" + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12),
      plan: planId
    };

    const ws2 = {
      id: ws2Id,
      ownerEmail: email.toLowerCase(),
      name: "SaaS Cliente Local",
      apiKey: "aos_live_" + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12),
      plan: planId
    };

    db.workspaces.push(ws1, ws2);

    // Core default data bootstrapping
    db.transactions.push({
      id: "tx_init_" + Date.now(),
      workspaceId: ws1Id,
      description: "Mensalidade Setup Inicial Clientes",
      amount: 4500.0,
      type: "receita",
      category: "Consultoria e CRM",
      date: new Date().toISOString().split("T")[0]
    });

    db.leads.push({
      id: "lead_init_" + Date.now(),
      workspaceId: ws1Id,
      name: "Clínica Sorella Integrada",
      phone: "(11) 98311-2244",
      address: "Av. Brigadeiro, 120 - SP",
      category: "Dentista",
      rating: 4.5,
      reviewsCount: 15,
      status: "Novo"
    });

    // Default KPI Overrides
    db.customOverrides[ws1Id] = {
      mrr: 4500,
      arr: 54000,
      ltv: 12500,
      cac: 475,
      churnRate: 2.8
    };

    db.customOverrides[ws2Id] = {
      mrr: 2500,
      arr: 30000,
      ltv: 6400,
      cac: 210,
      churnRate: 5.1
    };

    writeDb(db);
    res.json({ success: true, user: newOwner, defaultWorkspaceId: ws1Id });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const db = readDb();
    const user = db.owners.find(
      (o: any) => o.email.toLowerCase() === email.toLowerCase() && o.passwordHash === password
    );

    if (!user) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    // Find their default active workspace starting ID
    const userWorkspaces = db.workspaces.filter((w: any) => w.ownerEmail === email.toLowerCase());
    const defaultWorkspaceId = userWorkspaces.length > 0 ? userWorkspaces[0].id : null;

    res.json({ success: true, user, defaultWorkspaceId });
  });

  // 2. WORKSPACES MULTI-TENANCY MANAGEMENT
  app.get("/api/workspaces", (req, res) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "E-mail do proprietário é necessário." });
    }

    const db = readDb();
    const list = db.workspaces.filter((w: any) => w.ownerEmail === (email as string).toLowerCase());
    res.json({ workspaces: list });
  });

  app.post("/api/workspaces/create", (req, res) => {
    const { email, name, planId } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "Nome do Workspace e e-mail do proprietário são obrigatórios." });
    }

    const db = readDb();
    const userWorkspaces = db.workspaces.filter((w: any) => w.ownerEmail === email.toLowerCase());
    
    // Check limits depending on plan
    const user = db.owners.find((o: any) => o.email.toLowerCase() === email.toLowerCase());
    const plan = user?.planId || planId || "starter";
    let maxWorkspaces = 1;
    if (plan === 'pro') maxWorkspaces = 3;
    if (plan === 'agency') maxWorkspaces = 100;

    if (userWorkspaces.length >= maxWorkspaces) {
      return res.status(400).json({ 
        error: `Seu plano atual (${plan.toUpperCase()}) permite gerenciar no máximo ${maxWorkspaces} workspaces isoladas. Faça o upgrade!` 
      });
    }

    const newWsId = "ws_dyn_" + Date.now();
    const generatedKey = "aos_live_" + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);

    const newWs = {
      id: newWsId,
      ownerEmail: email.toLowerCase(),
      name: name,
      apiKey: generatedKey,
      plan: plan
    };

    db.workspaces.push(newWs);

    // Bootstrap default config overrides
    db.customOverrides[newWsId] = {
      mrr: 0,
      arr: 0,
      ltv: 12500,
      cac: 450,
      churnRate: 3.0
    };

    writeDb(db);
    res.json({ success: true, workspace: newWs });
  });

  app.post("/api/workspaces/delete", (req, res) => {
    const { email, workspaceId } = req.body;
    if (!email || !workspaceId) {
      return res.status(400).json({ error: "E-mail e workspaceId associados são necessários." });
    }

    const db = readDb();
    const wsIndex = db.workspaces.findIndex(
      (w: any) => w.id === workspaceId && w.ownerEmail === email.toLowerCase()
    );

    if (wsIndex === -1) {
      return res.status(404).json({ error: "Workspace não encontrado ou sem permissão de exclusão." });
    }

    // Delete workspace itself
    db.workspaces.splice(wsIndex, 1);

    // Cascaded deletion of all associated transactions, leads, meetings and logs from workspace ID!
    db.transactions = db.transactions.filter((t: any) => t.workspaceId !== workspaceId);
    db.leads = db.leads.filter((l: any) => l.workspaceId !== workspaceId);
    db.events = db.events.filter((e: any) => e.workspaceId !== workspaceId);
    db.apiLogs = db.apiLogs.filter((log: any) => log.workspaceId !== workspaceId);
    
    if (db.customOverrides[workspaceId]) {
      delete db.customOverrides[workspaceId];
    }

    writeDb(db);
    res.json({ success: true, message: "Workspace e todos os dados associados deletados com sucesso!" });
  });

  // 3. ISOLATED WORKSPACE ACTIONS / OVERRIDES Loading
  app.get("/api/workspaces/data", (req, res) => {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId é obrigatório." });
    }

    const db = readDb();
    const activeTransactions = db.transactions.filter((t: any) => t.workspaceId === workspaceId);
    const activeLeads = db.leads.filter((l: any) => l.workspaceId === workspaceId);
    const activeEvents = db.events.filter((e: any) => e.workspaceId === workspaceId);
    const activeLogs = db.apiLogs.filter((log: any) => log.workspaceId === workspaceId);
    const defaultOverrides = {
      mrr: 18500,
      arr: 222000,
      ltv: 15000,
      cac: 380,
      churnRate: 2.8,
      customInstructions: '',
      trafficFbCpc: 0.42,
      trafficFbCtr: 2.1,
      trafficFbSpend: 6200,
      trafficGoogleCpc: 0.51,
      trafficGoogleCtr: 4.8,
      trafficGoogleSpend: 8400
    };

    const overrides = {
      ...defaultOverrides,
      ...(db.customOverrides[workspaceId as string] || {})
    };

    res.json({
      transactions: activeTransactions,
      leads: activeLeads,
      events: activeEvents,
      logs: activeLogs,
      overrides: overrides
    });
  });

  // MANUAL CUSTOM TRANSITIONS / OVERRIDES - For manual overrides configuration inside ALL tabs!
  app.post("/api/workspaces/edit-overrides", (req, res) => {
    const { workspaceId, overrides } = req.body;
    if (!workspaceId || !overrides) {
      return res.status(400).json({ error: "workspaceId e parâmetros de overrides são necessários." });
    }

    const db = readDb();
    const defaultOverrides = {
      mrr: 18500,
      arr: 222000,
      ltv: 15000,
      cac: 380,
      churnRate: 2.8,
      customInstructions: '',
      trafficFbCpc: 0.42,
      trafficFbCtr: 2.1,
      trafficFbSpend: 6200,
      trafficGoogleCpc: 0.51,
      trafficGoogleCtr: 4.8,
      trafficGoogleSpend: 8400
    };

    const current = db.customOverrides[workspaceId] || defaultOverrides;

    db.customOverrides[workspaceId] = {
      ...current,
      ...overrides
    };

    writeDb(db);
    res.json({ success: true, overrides: db.customOverrides[workspaceId] });
  });

  // ELEMENT LEVEL CRUD ENDPOINTS (For manual override edit on every single tab)
  app.post("/api/workspaces/item/add", (req, res) => {
    const { workspaceId, type, item } = req.body; // type can be 'transactions' | 'leads' | 'events'
    if (!workspaceId || !type || !item) {
      return res.status(400).json({ error: "workspaceId, tipo e conteúdo do item são obrigatórios." });
    }

    const db = readDb();
    const id = "dyn_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5);
    const newItem = { id, workspaceId, ...item };

    if (type === "transactions" || type === "transaction") {
      db.transactions.unshift(newItem);
    } else if (type === "leads" || type === "lead") {
      db.leads.unshift(newItem);
    } else if (type === "events" || type === "event") {
      db.events.push(newItem);
    } else {
      return res.status(400).json({ error: "Tipo de item inválido." });
    }

    writeDb(db);
    res.json({ success: true, item: newItem });
  });

  app.post("/api/workspaces/item/delete", (req, res) => {
    const { workspaceId, type, id } = req.body;
    if (!workspaceId || !type || !id) {
      return res.status(400).json({ error: "workspaceId, tipo de tabela e ID são obrigatórios." });
    }

    const db = readDb();
    if (type === "transactions" || type === "transaction") {
      db.transactions = db.transactions.filter((t: any) => !(t.id === id && t.workspaceId === workspaceId));
    } else if (type === "leads" || type === "lead") {
      db.leads = db.leads.filter((l: any) => !(l.id === id && l.workspaceId === workspaceId));
    } else if (type === "events" || type === "event") {
      db.events = db.events.filter((e: any) => !(e.id === id && e.workspaceId === workspaceId));
    } else {
      return res.status(400).json({ error: "Tipo de item inválido." });
    }

    writeDb(db);
    res.json({ success: true, deletedId: id });
  });

  app.post("/api/workspaces/item/edit", (req, res) => {
    const { workspaceId, type, id, updatedFields } = req.body;
    if (!workspaceId || !type || !id || !updatedFields) {
      return res.status(400).json({ error: "Parâmetros para atualização estão incompletos." });
    }

    const db = readDb();
    let targetList = [];
    if (type === "transactions" || type === "transaction") targetList = db.transactions;
    else if (type === "leads" || type === "lead") targetList = db.leads;
    else if (type === "events" || type === "event") targetList = db.events;
    else return res.status(400).json({ error: "Tabela especificada é inválida." });

    const entityIndex = targetList.findIndex((item: any) => item.id === id && item.workspaceId === workspaceId);
    if (entityIndex === -1) {
      return res.status(404).json({ error: "Item alvo não encontrado ou sem permissão" });
    }

    // Merge Fields
    targetList[entityIndex] = { ...targetList[entityIndex], ...updatedFields };
    writeDb(db);

    res.json({ success: true, item: targetList[entityIndex] });
  });

  // Real Webhook receiver for the sandbox preview environment
  app.post("/api/webhookUniversal", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "O parâmetro 'userId' é obrigatório na URL query." });
    }

    try {
      const dbObj = readDb();
      // Ensure user exists as an owner in our backend DB
      const userExistsInDb = dbObj.owners.some(
        (o: any) => o.email.toLowerCase() === userId.toLowerCase()
      );

      if (!userExistsInDb) {
        return res.status(404).json({ error: `Usuário com ID (e-mail) '${userId}' não cadastrado no AgencyOS.` });
      }

      // Read payload
      const payload = req.body || {};

      let amount = 0;
      if (typeof payload.amount === 'number') amount = payload.amount;
      else if (typeof payload.value === 'number') amount = payload.value;
      else if (payload.amount) amount = parseFloat(payload.amount);
      else if (payload.total) amount = parseFloat(payload.total);
      else if (payload.price) amount = parseFloat(payload.price);
      else if (payload.total_price) amount = parseFloat(payload.total_price);

      if (isNaN(amount) || amount <= 0) {
        amount = 150.0; // standard testing fallback
      }

      let customer = "Cliente Externo";
      if (payload.customer_name) customer = payload.customer_name;
      else if (payload.customer && payload.customer.name) customer = payload.customer.name;
      else if (payload.billing && payload.billing.first_name) {
        customer = `${payload.billing.first_name} ${payload.billing.last_name || ""}`.trim();
      } else if (payload.email) customer = payload.email;

      // Initialize Firestore on-the-fly
      const fireApp = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(fireApp);

      // Save user to Firestore if they don't already exist
      const userDocRef = doc(firestoreDb, "users", userId.toLowerCase());
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        const owner = dbObj.owners.find((o: any) => o.email.toLowerCase() === userId.toLowerCase());
        await setDoc(userDocRef, {
          email: userId.toLowerCase(),
          name: owner?.name || "Proprietário AgencyOS",
          createdAt: new Date().toISOString()
        });
      }

      // Add document to 'vendas' subcollection
      const vendasColRef = collection(firestoreDb, "users", userId.toLowerCase(), "vendas");
      const docRef = await addDoc(vendasColRef, {
        amount: amount,
        customer: customer,
        date: new Date().toISOString(),
        type: "receita",
        payload: payload
      });

      // Log to system logs list so they see webhooks in action!
      const activeWorkspace = dbObj.workspaces.find((w: any) => w.ownerEmail === userId.toLowerCase());
      if (activeWorkspace) {
        dbObj.apiLogs.unshift({
          id: "log_" + Date.now(),
          workspaceId: activeWorkspace.id,
          method: "POST",
          endpoint: `/api/webhookUniversal?userId=${userId.toLowerCase()}`,
          status: 200,
          timestamp: new Date().toLocaleTimeString(),
          responseSize: `${JSON.stringify(payload).length} Bytes`,
          ip: req.ip || "127.0.0.1"
        });
        writeDb(dbObj);
      }

      return res.status(200).json({
        success: true,
        message: "Webhook recebido e venda gravada com sucesso no Firestore!",
        vendaId: docRef.id,
        savedData: { amount, customer }
      });
    } catch (err: any) {
      console.error("Erro processando /api/webhookUniversal:", err);
      return res.status(500).json({ error: "Erro ao salvar no Firestore via Webhook.", details: err.message });
    }
  });


  // 4. PUBLIC API GATEWAY (REAL Live Endpoint / Webhooks from stripe, forms, calendars etc.)
  app.post("/api/v1/sync", async (req, res) => {
    const db = readDb();

    // API key can be passed on header, query search parameters, JSON fields, or default gracefully to testing workspace
    let apiKeyRaw = req.headers["x-api-key"] || req.query.apiKey || req.body.apiKey || req.body.api_key || req.body.chave_api;
    let ws = db.workspaces.find((w: any) => w.apiKey === apiKeyRaw);
    
    if (!ws) {
      // Graceful fallback for testing: route to first workspace if key is missing/invalid
      ws = db.workspaces[0];
      if (!ws) {
        return res.status(401).json({ error: "Nenhum workspace cadastrado no sistema ainda." });
      }
      console.log(`[Webhook Auto-Redirect] Chave de API inválida ou ausente. Direcionando para o Workspace: "${ws.name}"`);
    }

    const workspaceId = ws.id;
    const { event, evento, amount, valor, customer_name, cliente, nome_cliente, plan_description, produto, descricao_venda, category, categoria, name, nome, phone, address, niche, website, title, date, time, mensagem, text } = req.body;

    const timestamp = new Date().toISOString();
    let logSummary = "";
    let insertedResult: any = null;

    // Smart detection of conversion events or sale amounts
    let value = 0;
    let isSale = false;

    // Detect amount check
    const rawVal = amount !== undefined ? amount : (valor !== undefined ? valor : req.body.venda);
    if (rawVal !== undefined) {
      if (typeof rawVal === 'number') {
        value = rawVal;
      } else if (typeof rawVal === 'string') {
        const cleaned = rawVal.replace('R$', '').replace(/\s/g, '').replace('.', '').replace(',', '.');
        value = parseFloat(cleaned) || 0;
      }
      if (value > 0) isSale = true;
    }

    // Detect textual triggers like [ei agencyos] houve uma venda de R$ 250,00
    const rawMsg = mensagem || text || req.body.message || '';
    if (rawMsg) {
      isSale = true;
      const numMatch = rawMsg.match(/venda\s+de\s+([0-9.,]+)/i) || rawMsg.match(/([0-9.,]+)/);
      if (numMatch) {
        const cleaned = numMatch[1].replace(/\./g, '').replace(',', '.');
        value = parseFloat(cleaned) || value || 150.00;
      } else {
        value = value || 150.00;
      }
    }

    // Verify if explicitly designated sales event
    const eventName = (event || evento || "").toLowerCase();
    if (eventName.includes("venda") || eventName.includes("sale") || eventName.includes("compra") || eventName.includes("pay") || eventName.includes("stripe")) {
      isSale = true;
      if (value === 0) value = 1499.00; 
    }

    // Process Sales Conversions
    if (isSale) {
      const clientName = customer_name || cliente || nome_cliente || name || nome || "Cliente Loja Virtual";
      const productDesc = plan_description || produto || descricao_venda || "Venda Loja Integrada";
      const transactionDesc = `[Loja Integrada Webhook] Venda de ${clientName} - ${productDesc}`;
      const finalValue = Math.abs(value);

      // Determine Payment Method (pix, credito, debito, boleto)
      let paymentMethod: 'pix' | 'credito' | 'debito' | 'boleto' = 'pix';
      const rawMethod = (req.body.metodo || req.body.metodo_pagamento || req.body.payment_method || req.body.gateway || req.body.paymentMethod || '').toLowerCase();
      if (rawMethod.includes('pix')) {
        paymentMethod = 'pix';
      } else if (rawMethod.includes('credito') || rawMethod.includes('credit') || rawMethod.includes('cartao')) {
        paymentMethod = 'credito';
      } else if (rawMethod.includes('debito') || rawMethod.includes('debit')) {
        paymentMethod = 'debito';
      } else if (rawMethod.includes('boleto') || rawMethod.includes('bol')) {
        paymentMethod = 'boleto';
      } else {
        // Deterministic fallback based on values
        const sumChar = (ws.id + clientName + finalValue).split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
        const methods: ('pix' | 'credito' | 'debito' | 'boleto')[] = ['pix', 'credito', 'boleto', 'debito'];
        paymentMethod = methods[sumChar % 4];
      }

      const txId = "api_g_tx_" + Date.now();
      const newTx = {
        id: txId,
        workspaceId,
        description: transactionDesc,
        amount: finalValue,
        type: "receita",
        category: category || categoria || "Gestão de Tráfego",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: paymentMethod
      };

      db.transactions.unshift(newTx);
      logSummary = `[✓ Venda API] Nova receita de R$ ${finalValue.toLocaleString("pt-BR")} via ${paymentMethod.toUpperCase()} (${clientName})`;
      insertedResult = newTx;

      // TRIGGER AUTOMATED AI INTEL & EMAIL NOTIFICATION
      let aiMessage = `A inteligência artificial integrada do AgencyOS analisou esta transação. Esta nova venda por ${paymentMethod.toUpperCase()} fortalece sua liquidez no ponto de equilíbrio do caixa. Recomendamos direcionar parte do faturamento para campanhas de retargeting!`;
      
      if (ai) {
        try {
          const aiResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Você é a IA Consultora de Vendas do AgencyOS. Analise em uma frase curta, estratégica e motivacional esta nova venda que acabou de acontecer via webhook:
            - Cliente: ${clientName}
            - Valor: R$ ${finalValue.toFixed(2)}
            - Método de Pagamento: ${paymentMethod.toUpperCase()}
            - Produto/Descrição: ${productDesc}
            Insira dados estatísticos plausíveis e conclua com um conselho inteligente para o proprietário.`
          });
          if (aiResponse.text) {
            aiMessage = aiResponse.text.trim();
          }
        } catch (err) {
          console.error("Gemini context error inside webhook:", err);
        }
      }

      // Check recipient address
      const recipientEmail = ws.ownerEmail || "rickmarketing81@gmail.com";

      // HTML Email Styling
      const htmlEmail = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f3f4f6; padding: 40px 30px; border-radius: 20px; border: 1px solid #1f2937; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <div style="border-bottom: 1px solid #1f2937; padding-bottom: 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 28px;">🔔</span>
              <h2 style="margin: 0; font-size: 20px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px;">AgencyOS Live</h2>
            </div>
            <span style="font-size: 10px; font-family: monospace; background-color: #1f2937; color: #a3e635; padding: 4px 8px; border-radius: 8px; font-weight: bold; text-transform: uppercase;">Realtime Webhook</span>
          </div>

          <p style="font-size: 14px; color: #9ca3af; margin-bottom: 20px; line-height: 1.6;">Olá, <strong>Dono da Agência</strong>! A sua loja/sistema de checkout acaba de notificar um novo evento de pagamento bem sucedido.</p>

          <div style="background-color: #090d16; padding: 24px; border-radius: 16px; border: 1px solid #111827; margin-bottom: 24px;">
            <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 11px; text-transform: uppercase; color: #a3e635; font-family: monospace; letter-spacing: 1px; font-weight: bold;">Detalhamento Financeiro</h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse; line-height: 1.8;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Cliente:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #f3f4f6;">${clientName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Produto/Serviço:</td>
                <td style="padding: 6px 0; text-align: right; color: #d1d5db;">${productDesc}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Canal de Pagamento:</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #a3e635; font-weight: bold; text-transform: uppercase;">${paymentMethod}</td>
              </tr>
              <tr style="border-top: 1px solid #1f2937;">
                <td style="padding: 12px 0 0 0; font-weight: bold; color: #ffffff;">Montante Recebido:</td>
                <td style="padding: 12px 0 0 0; text-align: right; font-size: 16px; font-weight: 800; color: #a3e635; font-family: monospace;">R$ ${finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: rgba(163,230,53,0.06); border-left: 4px solid #a3e635; padding: 18px; border-radius: 0 16px 16px 0; margin-bottom: 24px;">
            <h4 style="margin-top: 0; margin-bottom: 8px; font-size: 11px; text-transform: uppercase; color: #a3e635; font-family: monospace; letter-spacing: 0.5px;">Organização Inteligente IA 🤖</h4>
            <p style="margin: 0; font-size: 13px; color: #e5e7eb; line-height: 1.6; font-style: italic;">"${aiMessage}"</p>
          </div>

          <div style="border-top: 1px solid #1f2937; padding-top: 20px; text-align: center; font-size: 11px; color: #4b5563; font-family: monospace;">
            Esta mensagem foi enviada de forma automática pelo AgencyOS.<br />
            Monitoramento de Ingressos Ativo • Categoria: ${category || categoria || "Gestão de Tráfego"}
          </div>
        </div>
      `;

      // Dispatch Email (Real SMTP or simulation fallback)
      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT) || 587;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const from = process.env.SMTP_FROM || '"AgencyOS Notification" <no-reply@agencyos.com>';
      
      let deliveryMethod = 'simulado-logged';

      if (host && user && pass) {
        try {
          const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass }
          });
          await transporter.sendMail({
            from,
            to: recipientEmail,
            subject: `[AgencyOS] 🔔 Nova Venda de R$ ${finalValue.toLocaleString("pt-BR")} Confirmada!`,
            html: htmlEmail
          });
          deliveryMethod = 'smtp';
          console.log(`[✓ Webhook Email Real] E-mail enviado com sucesso via SMTP para ${recipientEmail}`);
        } catch (err) {
          console.error("[✕ Webhook Email Real Error] Falha de SMTP ao enviar e-mail real, usando simulado:", err);
        }
      } else {
        console.log(`[✎ Webhook Email Simulado] SMTP não configurado. Simulação registrada para o usuário: ${recipientEmail}`);
      }

      // Record in logs & persistent workspaces emails array
      const emailRecord = {
        id: "em_" + Date.now(),
        workspaceId,
        to: recipientEmail,
        subject: `[AgencyOS] 🔔 Nova Venda de R$ ${finalValue.toLocaleString("pt-BR")} Confirmada!`,
        html: htmlEmail,
        aiMessage,
        deliveryMethod,
        timestamp: new Date().toISOString(),
        customer: clientName,
        amount: finalValue
      };
      
      if (!db.emails) db.emails = [];
      db.emails.unshift(emailRecord);
    }
    // Process lead conversion forms
    else if (event === "lead_form" || event === "lead_captured" || name || nome) {
      const newLead = {
        id: "api_g_l_" + Date.now(),
        workspaceId,
        name: name || nome || "Novo Contato Web",
        phone: phone || "(11) 90000-0000",
        address: address || "Capturado via Webhook Externo",
        category: niche || category || categoria || "Academia",
        rating: 4.5,
        reviewsCount: 1,
        status: "Novo",
        website: website || "web.com"
      };

      db.leads.unshift(newLead);
      logSummary = `[✓ Sucesso] Sincronizado novo lead do formulário de CRM: "${newLead.name}" no funil.`;
      insertedResult = newLead;
    }
    // Process calendly meetings booking
    else if (event === "call_calendly" || event === "meeting_scheduled" || title) {
      const newEv = {
        id: "api_g_ev_" + Date.now(),
        workspaceId,
        title: title || "Consultoria Integrada agendada via API",
        date: date || new Date().toISOString().split("T")[0],
        time: time || "15:00",
        module: "CRM",
        color: "#eab308"
      };

      db.events.push(newEv);
      logSummary = `[✓ Sucesso] Novo compromisso de agenda mapeado: "${newEv.title}" às ${newEv.time}`;
      insertedResult = newEv;
    }
    // Custom fallback logging
    else {
      logSummary = `[Atividade] Recebido payload desconhecido na API: processado como webhook passivo.`;
    }

    // Insert to gateway console logs
    db.apiLogs.unshift({
      timestamp,
      workspaceId,
      method: "POST",
      payload: JSON.stringify(req.body),
      summary: logSummary
    });

    writeDb(db);

    res.json({
      success: true,
      message: "Payload processado com sucesso em tempo real no AgencyOS!",
      summary: logSummary,
      activeWorkspace: ws.name,
      inserted: insertedResult
    });
  });

  // Load gateway logs
  app.get("/api/workspaces/logs", (req, res) => {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId é necessário." });
    }
    const db = readDb();
    const logs = db.apiLogs.filter((log: any) => log.workspaceId === workspaceId);
    res.json({ logs });
  });

  // Load sent notification emails
  app.get("/api/workspaces/emails", (req, res) => {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId é necessário." });
    }
    const db = readDb();
    const list = (db.emails || []).filter((email: any) => email.workspaceId === workspaceId);
    res.json({ emails: list });
  });


  // GPT CO-PILOT CHAT INTERACTIVE AI
  app.post("/api/chat", async (req, res) => {
    const { prompt, history, metrics } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "O campo 'prompt' é obrigatório." });
    }

    const systemInstruction = `Você é a IA Consultora do AgencyOS de Techify, uma inteligência artificial especialista em gestão, growth hacking, tráfego pago, funis de vendas, estruturação de propostas comerciais e saúde financeira de agências de marketing digital. 
Os KPIs atuais da agência do usuário são:
- MRR (Faturamento Recorrente Mensal): R$ ${metrics?.mrr || '15.000'}
- ARR: R$ ${metrics?.arr || '180.000'}
- LTV (Tempo de vida do cliente): R$ ${metrics?.ltv || '12.000'}
- CAC (Custo de Aquisição de Cliente): R$ ${metrics?.cac || '450'}
- LTV/CAC Ratio: ${(metrics?.ltv && metrics?.cac) ? (metrics.ltv / metrics.cac).toFixed(2) : '26.6'}x
- Churn Rate: ${metrics?.churnRate || '3'}%
- Saldo em Caixa: R$ ${metrics?.cashBalance || '4.500'}

Módulos contratados/ativos: ${metrics?.modules ? metrics.modules.join(", ") : "Financeiro, Fluxo de Caixa, Calendário, Calculadora ROI, Tráfego Pago, Maps Scraper, IA Consultora."}

Instruções importantes:
1. Responda em Português brasileiro de forma persuasiva, extremamente profissional, clara, acionável e inspiradora.
2. Forneça insights inteligentes com base nesses números e ferramentas. Por exemplo, sugira otimizar o CAC se ele for alto em relação ao LTV, ou melhorar a retenção se o Churn estiver acima de 4%. Enfatize o uso dos leads gerados pelo Maps Scraper em funis de cold mail/cold calling!
3. Formate suas respostas usando Markdown elegante com espaçamento de parágrafos confortáveis, listas, e termos importantes em negrito.
4. Mantenha as respostas focadas no mercado de agências de marketing e nichos de negócios locais.`;

    if (ai) {
      try {
        const contents = [];
        
        if (history && Array.isArray(history)) {
          for (const msg of history) {
            contents.push({
              role: msg.sender === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }]
            });
          }
        }
        
        contents.push({
          role: 'user',
          parts: [{ text: prompt }]
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        });

        const textOutput = response.text || "Peço desculpas, não consegui processar essa resposta.";
        return res.json({ text: textOutput, mode: "real_gemini" });
      } catch (error: any) {
        console.error("Gemini runtime error, falling back to simulated analysis:", error);
      }
    }

    // High fidelity simulate advisor if key is not configured or fails
    setTimeout(() => {
      let responseText = "";
      const lowerPrompt = prompt.toLowerCase();
      
      if (lowerPrompt.includes("mrr") || lowerPrompt.includes("financeiro") || lowerPrompt.includes("caixa") || lowerPrompt.includes("faturamento") || lowerPrompt.includes("lucro")) {
        responseText = `Analisando a saúde financeira da sua agência com base nos KPIs e no **Fluxo de Caixa**:

1. **LTV/CAC Excelente (${((metrics?.ltv || 12000) / (metrics?.cac || 450)).toFixed(1)}x)**: Seu custo de aquisição é baixo para o valor de retorno do cliente. Isso indica que a agência possui grande margem operacional e pode investir em anúncios de prospecção com agressividade!
2. **Churn Rate de ${metrics?.churnRate || '2.8'}%**: Está saudável (excelente para o mercado, que gira em torno de 4.5%). Isso certifica que a retenção está em conformidade.
3. **Reserva Recomendada de Caixa**: Seu MRR recorrente é R$ **${(metrics?.mrr || 15000).toLocaleString("pt-BR")}**. Recomendamos fixar um caixa de reserva equivalente a 3 meses de custos operacionais fixos para transições sem fricção.

**Conselho Estratégico**: Suba o valor do seu onboarding ou mude o contrato para incluir uma taxa de performance sobre as vendas geradas nos anúncios locais, alavancando suas margens em até 35% nos próximos fechamentos.`;
      } else if (lowerPrompt.includes("leads") || lowerPrompt.includes("maps scraper") || lowerPrompt.includes("extrair") || lowerPrompt.includes("prospecção") || lowerPrompt.includes("vendas")) {
        responseText = `Impulsionador comercial ativado! O módulo **Maps Scraper** capta leads locais prontos para fechar marketing. Aqui está a tática perfeita de Outbound Prospecting:

### 1. Seleção com Alta Intenção
Ao baixar leads (restaurantes, dentistas ou advocacias), filtre aqueles com **avaliacão menor que 4.3**. Eles já sabem que precisam de ajuda urgente para otimizar o Google Meu Negócio, tráfego geolocalizado e SEO local.

### 2. O Roteiro de Conexão Rápida (Script WhatsApp / Fone)
- **Ponto de Entrada**: *"Olá doutor(a) [Nome], vi que vocês têm bastante tempo de história, mas o perfil do Google de vocês está sem responder as últimas avaliações de pacientes. Isso derruba seu posicionamento em até 3 bairros ao redor..."*
- **Entregar Valor Grátis**: *"Criei um mapa estratégico visual de como vocês podem atrair 15 novos agendamentos por semana se ajustarmos 3 pontos específicos. Posso te enviar por aqui no WhatsApp?"*
- **Call to Action**: *"Terça-feira às 14h ou quarta às 10h seria melhor para conversarmos visualmente por 10 minutos?"*

Se precisar, me diga qual o nicho específico do lead que acabamos de captar e eu redijo o diagnóstico customizado ideal!`;
      } else {
        responseText = `Olá! Sou a sua **IA Consultora oficial integrada ao AgencyOS**. 

Estou sincronizada com as suas Finanças, Leads cadastrados, Agendamentos e Integrações em tempo real. Vejo que seu MRR consolidado está em **R$ ${(metrics?.mrr || 15000).toLocaleString("pt-BR")}** e você possui **${metrics?.modules ? metrics.modules.length : 7} módulos de expansão ativos**.

Como posso te assessorar estrategicamente hoje?
- *"Pode simular uma campanha de anúncios locais no Facebook Ads?"*
- *"Como estruturo uma proposta vendedora de R$ 2.500/mês para Dentistas?"*
- *"Planeje minhas despesas fixas para equilibrar meu saldo em caixa."*`;
      }

      res.json({ text: responseText, mode: "simulation_ai" });
    }, 1200);
  });

  // Serve Vite app in dev mode, or static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production statics files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
