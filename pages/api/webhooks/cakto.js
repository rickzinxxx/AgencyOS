import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = fs.existsSync(CONFIG_PATH) ? JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) : {};

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log("[Firebase Admin / Next.js] successfully initialized from Service Account Cert.");
    } else if (projectId) {
      admin.initializeApp({
        projectId: projectId
      });
      console.log("[Firebase Admin / Next.js] successfully initialized with Local Project ID:", projectId);
    } else {
      admin.initializeApp();
      console.log("[Firebase Admin / Next.js] successfully initialized via default container credentials.");
    }
  } catch (error) {
    console.error("[Firebase Admin / Next.js] Setup error:", error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, eventType, status, productName, product_name, product, email, customer, payer_email } = req.body || {};
    
    // Support all potential webhook formats from Cakto
    const activeEvent = event || eventType || status;
    const activeEmail = email || customer?.email || payer_email;
    const activeProduct = productName || product_name || product?.name || product;

    if (!activeEmail) {
      console.warn("[Cakto Webhook Warning] E-mail not found in payload:", req.body);
      return res.status(200).json({ received: true, warning: 'No email found' });
    }

    // Determine the user's plan based on product name content
    let detectedPlan = 'pro';
    if (activeProduct) {
      const prodLower = String(activeProduct).toLowerCase();
      if (prodLower.includes('starter')) {
        detectedPlan = 'starter';
      } else if (prodLower.includes('pro')) {
        detectedPlan = 'pro';
      } else if (prodLower.includes('agency')) {
        detectedPlan = 'agency';
      }
    }

    const emailKey = String(activeEmail).trim().toLowerCase();
    
    // Check if firebase admin is initialized
    if (!admin.apps.length) {
      console.warn("[Cakto Webhook SDK Error] Firebase Admin not initialized. Skipping DB write but returning 200.");
      return res.status(200).json({ received: true, error: 'DB not initialized' });
    }

    const db = admin.firestore();
    const usersRef = db.collection('users');

    // Events grouping
    const successEvents = ['order.approved', 'subscription.created', 'subscription.renewed'];
    const cancelEvents = ['subscription.canceled'];

    // 1. Query users collection by email field
    const snapshot = await usersRef.where('email', '==', emailKey).get();

    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.forEach(doc => {
        if (successEvents.includes(activeEvent)) {
          batch.update(doc.ref, {
            status: 'active',
            plan: detectedPlan,
            updatedAt: new Date().toISOString()
          });
        } else if (cancelEvents.includes(activeEvent)) {
          batch.update(doc.ref, {
            status: 'inactive',
            updatedAt: new Date().toISOString()
          });
        }
      });
      await batch.commit();
      console.log(`[Cakto Webhook Success] Updated ${snapshot.size} users with email ${emailKey} to plan: ${detectedPlan}, status: active/inactive`);
    } else {
      // 2. Fallback: Lookup draft document by email exact ID
      const docRef = usersRef.doc(emailKey);
      const userDoc = await docRef.get();

      if (userDoc.exists) {
        if (successEvents.includes(activeEvent)) {
          await docRef.update({
            status: 'active',
            plan: detectedPlan,
            updatedAt: new Date().toISOString()
          });
        } else if (cancelEvents.includes(activeEvent)) {
          await docRef.update({
            status: 'inactive',
            updatedAt: new Date().toISOString()
          });
        }
        console.log(`[Cakto Webhook Success] Updated document ID user ${emailKey}`);
      } else {
        // 3. Fallback: Create new user document
        if (successEvents.includes(activeEvent)) {
          await docRef.set({
            email: emailKey,
            name: emailKey.split('@')[0],
            status: 'active',
            plan: detectedPlan,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          console.log(`[Cakto Webhook Success] Created new user document associated with ${emailKey}`);
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (err) {
    console.error("[Cakto Webhook Error] Failed to process webhook request:", err);
    return res.status(200).json({ success: false, error: err.message });
  }
}
