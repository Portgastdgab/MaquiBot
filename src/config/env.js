const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name, defaultValue) {
  return process.env[name] || defaultValue;
}

function optionalNumber(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return defaultValue;
  }

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

function optionalBoolean(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return defaultValue;
  }

  const normalized = String(raw).trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }

  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }

  return defaultValue;
}

function normalizePrivateKey(rawKey) {
  return rawKey
    .replace(/^"|"$/g, "")
    .replace(/^'|'$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .trim();
}

const twilioMockEnabled = optionalBoolean("TWILIO_MOCK_ENABLED", false);

const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  port: Number(optional("PORT", 3000)),
  businessName: optional("BUSINESS_NAME", "MaquiBot"),
  scheduleLink: optional("SCHEDULE_LINK", "https://example.com/agendar"),
  firebaseServiceAccountPath: optional("FIREBASE_SERVICE_ACCOUNT_PATH", ""),
  followup: {
    enabled: optionalBoolean("FOLLOWUP_ENABLED", true),
    intervalMs: optionalNumber("FOLLOWUP_INTERVAL_MS", 60 * 1000),
    initialDelayMs: optionalNumber("FOLLOWUP_INITIAL_DELAY_MS", 5 * 1000),
    minWaitMinutes: optionalNumber("FOLLOWUP_MIN_WAIT_MINUTES", 10),
    maxWaitMinutes: optionalNumber("FOLLOWUP_MAX_WAIT_MINUTES", 20)
  },
  twilio: {
    mockEnabled: twilioMockEnabled,
    accountSid: twilioMockEnabled ? optional("TWILIO_ACCOUNT_SID", "") : required("TWILIO_ACCOUNT_SID"),
    authToken: twilioMockEnabled ? optional("TWILIO_AUTH_TOKEN", "") : required("TWILIO_AUTH_TOKEN"),
    whatsappNumber: required("TWILIO_WHATSAPP_NUMBER")
  },
  firebase: {
    projectId: optional("FIREBASE_PROJECT_ID", ""),
    clientEmail: optional("FIREBASE_CLIENT_EMAIL", ""),
    privateKey: optional("FIREBASE_PRIVATE_KEY", "") ? normalizePrivateKey(optional("FIREBASE_PRIVATE_KEY", "")) : ""
  }
};

if (!env.firebaseServiceAccountPath) {
  if (!env.firebase.projectId || !env.firebase.clientEmail || !env.firebase.privateKey) {
    throw new Error(
      "Firebase credentials missing. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY"
    );
  }
}

module.exports = env;
