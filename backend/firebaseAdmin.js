import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let app;

if (!admin.apps.length) {
  if (process.env.FB_PROJECT_ID && process.env.FB_CLIENT_EMAIL && process.env.FB_PRIVATE_KEY) {
    // Local dev (using .env)
    let privateKey = process.env.FB_PRIVATE_KEY;
    if (privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FB_PROJECT_ID,
        clientEmail: process.env.FB_CLIENT_EMAIL,
        privateKey,
      }),
      storageBucket: process.env.FB_STORAGE_BUCKET || "hireshield-app-e9bbd.appspot.com",
    });

    console.log("Firebase initialized with .env credentials");
  } else {
    // Firebase Cloud Functions → use default service account
    app = admin.initializeApp();

    console.log("Firebase initialized with default service account");
  }
}

const db = admin.firestore();

export { admin, db };
