const { LEAD_STAGES } = require("../lead/lead.constants");
const { ACTIONS } = require("./conversation.actions");

function looksLikeName(text = "") {
  const value = String(text).trim();

  if (!value) {
    return false;
  }

  if (value.length < 2 || value.length > 60) {
    return false;
  }

  return /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(value);
}

function isLikelyName(text = "") {
  const value = String(text).trim().toLowerCase();
  if (!value) {
    return false;
  }

  const blockedWords = new Set([
    "hola",
    "buenas",
    "buenos dias",
    "buen día",
    "buen dia",
    "ok",
    "gracias",
    "info",
    "informacion",
    "información",
    "precio",
    "cuota",
    "cuotas"
  ]);

  return !blockedWords.has(value);
}

function normalizeCandidate(candidate = "") {
  return String(candidate)
    .replace(/[.,!?;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNameFromMessage(text = "") {
  const raw = String(text).trim();
  if (!raw) {
    return null;
  }

  const normalized = normalizeCandidate(raw);
  const lower = normalized.toLowerCase();

  const prefixes = [
    "mi nombre es ",
    "me llamo ",
    "soy ",
    "yo soy "
  ];

  for (const prefix of prefixes) {
    if (!lower.startsWith(prefix)) {
      continue;
    }

    const value = normalized.slice(prefix.length).trim();
    if (looksLikeName(value) && isLikelyName(value)) {
      return value;
    }
  }

  if (looksLikeName(normalized) && isLikelyName(normalized)) {
    return normalized;
  }

  return null;
}

function hasValidLeadName(name) {
  if (typeof name !== "string") {
    return false;
  }

  const normalized = normalizeCandidate(name);
  return Boolean(normalized) && looksLikeName(normalized) && isLikelyName(normalized);
}

function detectIntent(messageText = "") {
  const text = String(messageText).toLowerCase();

  return {
    wantsInfo: /(info|informacion|información|detalle|detalles)/i.test(text),
    asksPrice: /(precio|cuota|cuotas|costo|coste)/i.test(text),
    wantsAppointment: /(agendar|cita|visitar|oficina|reunion|reunión)/i.test(text),
    wantsHuman: /(asesor|humano|persona|llamar)/i.test(text)
  };
}

function decideNextStep({ lead, message }) {
  const cleanMessage = String(message || "").trim();
  const intent = detectIntent(cleanMessage);
  const extractedName = extractNameFromMessage(cleanMessage);
  const leadHasValidName = hasValidLeadName(lead.name);

  if (lead.stage === LEAD_STAGES.COLLECT_NAME && extractedName) {
    return {
      action: ACTIONS.SAVE_NAME,
      data: {
        name: extractedName,
        intent
      }
    };
  }

  if (!leadHasValidName && extractedName) {
    return {
      action: ACTIONS.SAVE_NAME,
      data: {
        name: extractedName,
        intent
      }
    };
  }

  if (!leadHasValidName) {
    return {
      action: ACTIONS.ASK_NAME,
      data: {
        intent,
        isValidName: Boolean(extractedName)
      }
    };
  }

  if (lead.stage === LEAD_STAGES.QUALIFICATION) {
    return {
      action: ACTIONS.QUALIFY_LEAD,
      data: {
        intent
      }
    };
  }

  if (intent.wantsHuman) {
    return {
      action: ACTIONS.HANDOFF,
      data: {
        intent
      }
    };
  }

  return {
    action: ACTIONS.QUALIFY_LEAD,
    data: {
      intent
    }
  };
}

module.exports = {
  detectIntent,
  extractNameFromMessage,
  hasValidLeadName,
  decideNextStep
};