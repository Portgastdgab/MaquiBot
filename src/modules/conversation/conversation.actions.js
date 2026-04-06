const { LEAD_STAGES, LEAD_STATUSES } = require("../lead/lead.constants");
const { getInitialMessage, getVariant, getFinancingProcessSpeech } = require("./speech/base");

const ACTIONS = Object.freeze({
  ASK_NAME: "ASK_NAME",
  SAVE_NAME: "SAVE_NAME",
  QUALIFY_LEAD: "QUALIFY_LEAD",
  PUSH_APPOINTMENT: "PUSH_APPOINTMENT",
  HANDOFF: "HANDOFF"
});

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
        reply: `Encantado, ${name}. ¿Qué te interesa conocer primero: cuotas, requisitos o el proceso para agendar visita a oficina?`,
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
  createConversationActions
};