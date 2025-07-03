import * as dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

console.log("Loaded env:", {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKeyFirstChars: process.env.FIREBASE_PRIVATE_KEY?.slice(0, 30),
  privateKeyIncludesNewlines: process.env.FIREBASE_PRIVATE_KEY?.includes("\\n"),
});

const db = admin.firestore();

export { admin, db };
