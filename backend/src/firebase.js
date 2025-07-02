import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

// Verify the project ID matches
if (serviceAccount.project_id !== "meet-pro-d9458") {
  throw new Error("Service account project ID doesn't match Firebase project");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      ...serviceAccount,
      private_key: serviceAccount.private_key.replace(/\\n/g, "\n"),
    }),
    databaseURL: "https://meet-pro-d9458.firebaseio.com",
  });
}

const db = admin.firestore();

export { admin, db };
