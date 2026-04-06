const { CONVERSATION_STAGES } = require("./conversation.stages");

function normalizeText(message = "") {
  return String(message || "").trim().toLowerCase();
}

function isGreeting(message = "") {
  const text = normalizeText(message);

  return /^(hola|hello|buenas|buenos dias|buen día|buen dia|que tal|qué tal)$/i.test(text);
}

function isShortAnswer(message = "") {
  const text = normalizeText(message);

  return ["ok", "si", "sí", "no", "dale", "ya", "listo", "claro"].includes(text);
}

function isAmbiguous(message = "") {
  const text = normalizeText(message);
  if (!text) {
    return true;
  }

  if (isShortAnswer(text)) {
    return true;
  }

  return text.length < 3;
}

function hasMeaningfulAnswer(message = "") {
  const text = normalizeText(message);
  if (!text) {
    return false;
  }

  if (isGreeting(text) || isAmbiguous(text)) {
    return false;
  }

  return true;
}

function hasInitialCapitalSignal(message = "") {
  const text = normalizeText(message);

  return /(si|sí|tengo|cuento|ahorrad|inicial|no|aun|aún|evaluando|todavia|todavía)/i.test(text);
}

function hasCityAnswer(message = "") {
  const text = normalizeText(message);

  if (isGreeting(text) || isAmbiguous(text)) {
    return false;
  }

  return text.length > 1;
}

const STAGE_CONFIG = Object.freeze({
  [CONVERSATION_STAGES.ASK_VEHICLE]: Object.freeze({
    validate: hasMeaningfulAnswer,
    next: CONVERSATION_STAGES.ASK_TIMING,
    fallback: "reprompt_vehicle"
  }),
  [CONVERSATION_STAGES.ASK_TIMING]: Object.freeze({
    validate: hasMeaningfulAnswer,
    next: CONVERSATION_STAGES.ASK_INITIAL_CAPITAL,
    fallback: "reprompt_timing"
  }),
  [CONVERSATION_STAGES.ASK_INITIAL_CAPITAL]: Object.freeze({
    validate: (message) => {
      const text = normalizeText(message);
      if (isGreeting(text)) {
        return false;
      }

      if (hasInitialCapitalSignal(text)) {
        return true;
      }

      return !isAmbiguous(text);
    },
    next: CONVERSATION_STAGES.ASK_CITY,
    fallback: "reprompt_initial_capital"
  }),
  [CONVERSATION_STAGES.ASK_CITY]: Object.freeze({
    validate: hasCityAnswer,
    next: CONVERSATION_STAGES.CLOSE_MEETING,
    fallback: "reprompt_city"
  }),
  [CONVERSATION_STAGES.CLOSE_MEETING]: Object.freeze({
    validate: hasMeaningfulAnswer,
    next: CONVERSATION_STAGES.CLOSE_MEETING,
    fallback: "reprompt_close_meeting"
  })
});

module.exports = {
  STAGE_CONFIG,
  isGreeting,
  isShortAnswer,
  isAmbiguous
};