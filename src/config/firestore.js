const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const env = require("./env");

function resolveServiceAccount() {
  const fromEnvPath = env.firebaseServiceAccountPath
    ? path.resolve(process.cwd(), env.firebaseServiceAccountPath)
    : null;
  const defaultPath = path.resolve(process.cwd(), "serviceAccountKey.json");

  const candidatePath = fromEnvPath && fs.existsSync(fromEnvPath) ? fromEnvPath : defaultPath;

  if (fs.existsSync(candidatePath)) {
    const raw = fs.readFileSync(candidatePath, "utf8");
    return JSON.parse(raw);
  }

  return {
    projectId: env.firebase.projectId,
    clientEmail: env.firebase.clientEmail,
    privateKey: env.firebase.privateKey
  };
}

if (!admin.apps.length) {
  const serviceAccount = resolveServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

module.exports = db;
