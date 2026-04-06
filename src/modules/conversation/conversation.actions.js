const { LEAD_STAGES, LEAD_STATUSES } = require("../lead/lead.constants");
const { getInitialMessage, getVariant, getFinancingProcessSpeech } = require("./speech/base");
const { CONVERSATION_STAGES } = require("./conversation.stages");

const ACTIONS = Object.freeze({
  ASK_NAME: "ASK_NAME",
  SAVE_NAME: "SAVE_NAME",
  START_CONVERSATION_FLOW: "START_CONVERSATION_FLOW",
  ADVANCE_STAGE: "ADVANCE_STAGE",
  REPEAT_STAGE: "REPEAT_STAGE",
  HANDLE_OBJECTION: "HANDLE_OBJECTION",
  QUALIFY_LEAD: "QUALIFY_LEAD",
  PUSH_APPOINTMENT: "PUSH_APPOINTMENT",
  HANDOFF: "HANDOFF"
});

const OBJECTION_PLACEHOLDERS = Object.freeze({
  INFO_ONLY: "Entendido. Te explico de forma breve para que tengas claridad.",
  NO_INITIAL: "Entiendo tu situacion. Podemos revisar alternativas segun tu perfil.",
  PRICE: "Gracias por comentarlo. Revisemos opciones para ajustarlo mejor.",
  EXPLORING: "Perfecto, comparar opciones es parte del proceso.",
  DEFAULT: "Entiendo tu punto."
});

const STAGE_QUESTIONS = Object.freeze({
  [CONVERSATION_STAGES.ASK_VEHICLE]: "¿Que modelo estas buscando?",
  [CONVERSATION_STAGES.ASK_TIMING]: "¿Para cuando lo necesitas aproximadamente?",
  [CONVERSATION_STAGES.ASK_INITIAL_CAPITAL]: "¿Cuentas con capital inicial o estas evaluando opciones?",
  [CONVERSATION_STAGES.ASK_CITY]: "¿Te encuentras en Arequipa u otra ciudad?",
  [CONVERSATION_STAGES.CLOSE_MEETING]:
    "Podemos agendar una visita para explicarte todo mejor. ¿Te queda mejor hoy en la tarde o manana?"
});

const STAGE_REPROMPTS = Object.freeze({
  reprompt_vehicle: "Para avanzar, dime por favor el modelo exacto que estas buscando.",
  reprompt_timing: "Perfecto. ¿Para cuando necesitas la unidad aproximadamente?",
  reprompt_initial_capital: "Para orientarte mejor, ¿cuentas con capital inicial o estas evaluando opciones?",
  reprompt_city: "Confirmame por favor tu ciudad actual, ¿estas en Arequipa u otra ciudad?",
  reprompt_close_meeting: "Podemos cerrar coordinando ahora. ¿Te queda mejor hoy en la tarde o manana?"
});

function normalizeLeadValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isAqpCity(city) {
  return /(arequipa|aqp)/i.test(normalizeLeadValue(city));
}

function createConversationActions({ businessName, scheduleLink, initialVariant }) {
  return {
    handoff() {
      return {
        action: ACTIONS.HANDOFF,
        reply: "Perfecto, te voy a derivar con un asesor humano para continuar.",
        nextStage: LEAD_STAGES.HANDOFF,
        status: LEAD_STATUSES.QUALIFIED,
        state: LEAD_STATUSES.QUALIFIED
      };
    },
    askName() {
      return {
        action: ACTIONS.ASK_NAME,
        reply: initialVariant ? getVariant(initialVariant) : getInitialMessage(),
        nextStage: LEAD_STAGES.COLLECT_NAME,
        status: LEAD_STATUSES.CONTACTED,
        state: LEAD_STATUSES.CONTACTED
      };
    },
    askValidName() {
      return {
        action: ACTIONS.ASK_NAME,
        reply: "Gracias. Para continuar, compárteme tu nombre por favor.",
        nextStage: LEAD_STAGES.COLLECT_NAME,
        status: LEAD_STATUSES.WAITING_RESPONSE,
        state: LEAD_STATUSES.WAITING_RESPONSE
      };
    },
    confirmNameAndQualify(name) {
      return {
        action: ACTIONS.SAVE_NAME,
        reply: `Encantado, ${name}. Para ayudarte mejor, ¿que modelo estas buscando exactamente?`,
        nextStage: LEAD_STAGES.QUALIFICATION,
        status: LEAD_STATUSES.CONTACTED,
        state: LEAD_STATUSES.CONTACTED,
        extractedName: name
      };
    },
    shareSchedule() {
      return {
        action: ACTIONS.PUSH_APPOINTMENT,
        reply: `Excelente, este es el enlace para agendar tu visita: ${scheduleLink}`,
        nextStage: LEAD_STAGES.APPOINTMENT,
        status: LEAD_STATUSES.QUALIFIED,
        state: LEAD_STATUSES.QUALIFIED
      };
    },
    shareGeneralInfo() {
      return {
        action: ACTIONS.QUALIFY_LEAD,
        reply: getFinancingProcessSpeech(),
        nextStage: LEAD_STAGES.QUALIFICATION,
        status: LEAD_STATUSES.CONTACTED,
        state: LEAD_STATUSES.CONTACTED
      };
    },
    sharePricingInfo() {
      return {
        action: ACTIONS.QUALIFY_LEAD,
        reply: "Las cuotas varian segun evaluacion y plan elegido. Si quieres, te ayudo a perfilarlo y agendamos visita para darte una propuesta precisa.",
        nextStage: LEAD_STAGES.QUALIFICATION,
        status: LEAD_STATUSES.CONTACTED,
        state: LEAD_STATUSES.CONTACTED
      };
    },
    keepQualifying() {
      return {
        action: ACTIONS.QUALIFY_LEAD,
        reply: "Te puedo orientar con requisitos y el siguiente paso. Si te parece, agendamos tu visita a oficina para avanzar hoy.",
        nextStage: LEAD_STAGES.QUALIFICATION,
        status: LEAD_STATUSES.CONTACTED,
        state: LEAD_STATUSES.CONTACTED
      };
    },
    getStageQuestion(conversationStage, lead = {}) {
      const vehicleInterest = normalizeLeadValue(lead.vehicleInterest);
      const purchaseTiming = normalizeLeadValue(lead.purchaseTiming);
      const city = normalizeLeadValue(lead.city);

      if (conversationStage === CONVERSATION_STAGES.ASK_TIMING && vehicleInterest) {
        return `Perfecto, para la ${vehicleInterest} que estas buscando, ¿para cuando te gustaria tenerla?`;
      }

      if (conversationStage === CONVERSATION_STAGES.ASK_INITIAL_CAPITAL && vehicleInterest) {
        return `Buenisimo. Para la ${vehicleInterest}, ¿cuentas con capital inicial o aun estas evaluando opciones?`;
      }

      if (conversationStage === CONVERSATION_STAGES.ASK_CITY && vehicleInterest) {
        return `Perfecto. Para avanzar con la ${vehicleInterest}, ¿te encuentras en Arequipa u otra ciudad?`;
      }

      if (conversationStage === CONVERSATION_STAGES.CLOSE_MEETING) {
        if (isAqpCity(city)) {
          if (vehicleInterest && purchaseTiming) {
            return `Para la ${vehicleInterest} que buscas, y como la necesitas ${purchaseTiming}, lo ideal es verlo presencial. ¿Te queda mejor hoy en la tarde o manana?`;
          }

          if (vehicleInterest) {
            return `Para la ${vehicleInterest} que estas buscando, te explicamos todo mejor en oficina. ¿Te queda mejor hoy en la tarde o manana?`;
          }

          return "Podemos agendar una visita para explicarte todo mejor. ¿Te queda mejor hoy en la tarde o manana?";
        }

        if (vehicleInterest) {
          return `Para la ${vehicleInterest} te envio una proforma por WhatsApp con cuota, inicial y plazos. Si estas de acuerdo, coordinamos presencial o firma virtual. ¿Te parece bien si te la comparto hoy?`;
        }

        return "Te puedo enviar una proforma por WhatsApp con cuota, inicial y plazos. Si estas de acuerdo, coordinamos presencial o firma virtual. ¿Te parece bien si te la comparto hoy?";
      }

      return STAGE_QUESTIONS[conversationStage] || STAGE_QUESTIONS[CONVERSATION_STAGES.ASK_VEHICLE];
    },
    getStageReprompt(fallbackKey, conversationStage) {
      return (
        STAGE_REPROMPTS[fallbackKey] ||
        STAGE_QUESTIONS[conversationStage] ||
        STAGE_QUESTIONS[CONVERSATION_STAGES.ASK_VEHICLE]
      );
    },
    getObjectionReply(type) {
      return OBJECTION_PLACEHOLDERS[type] || OBJECTION_PLACEHOLDERS.DEFAULT;
    },
    fallback(stage) {
      return {
        action: ACTIONS.QUALIFY_LEAD,
        reply: "Estoy para ayudarte. ¿Quieres que agendemos tu visita a oficina para continuar con tu evaluación?",
        nextStage: stage,
        status: LEAD_STATUSES.CONTACTED,
        state: LEAD_STATUSES.CONTACTED
      };
    }
  };
}

module.exports = {
  ACTIONS,
  STAGE_QUESTIONS,
  STAGE_REPROMPTS,
  OBJECTION_PLACEHOLDERS,
  createConversationActions
};