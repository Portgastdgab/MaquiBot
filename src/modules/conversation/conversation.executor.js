const { classifyLead } = require("../scoring/scoring.service");
const { ACTIONS, createConversationActions } = require("./conversation.actions");
const { LEAD_STATUSES, LEAD_STAGES } = require("../lead/lead.constants");
const { CONVERSATION_STAGES } = require("./conversation.stages");
const { logEvent } = require("../../utils/logger");
const { logConversationStageReached } = require("./conversation.metrics");

function normalizeText(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function toLowerNormalized(value = "") {
  return normalizeText(value).toLowerCase();
}

function parseInitialCapital(rawMessage = "") {
  const normalized = toLowerNormalized(rawMessage);

  if (!normalized) {
    return null;
  }

  const positive = /(si|sí|tengo|cuento|ahorrad|inicial)/i;
  const negative = /(no|aun|aún|evaluando|todavia|todavía)/i;

  if (positive.test(normalized) && !negative.test(normalized)) {
    return true;
  }

  if (negative.test(normalized)) {
    return false;
  }

  return null;
}

function getCapturedLeadData({ currentStage, currentMessage }) {
  const raw = normalizeText(currentMessage);

  if (!raw) {
    return {
      updates: {},
      capturedField: null,
      capturedValue: null
    };
  }

  switch (currentStage) {
    case CONVERSATION_STAGES.ASK_VEHICLE:
      return {
        updates: {
          vehicleInterest: raw
        },
        capturedField: "vehicleInterest",
        capturedValue: raw
      };
    case CONVERSATION_STAGES.ASK_TIMING: {
      const timing = toLowerNormalized(raw);
      return {
        updates: {
          purchaseTiming: timing
        },
        capturedField: "purchaseTiming",
        capturedValue: timing
      };
    }
    case CONVERSATION_STAGES.ASK_INITIAL_CAPITAL: {
      const parsed = parseInitialCapital(raw);
      return {
        updates: {
          hasInitialCapital: parsed
        },
        capturedField: "hasInitialCapital",
        capturedValue: parsed
      };
    }
    case CONVERSATION_STAGES.ASK_CITY: {
      const city = toLowerNormalized(raw);
      return {
        updates: {
          city
        },
        capturedField: "city",
        capturedValue: city
      };
    }
    default:
      return {
        updates: {},
        capturedField: null,
        capturedValue: null
      };
  }
}

function buildStageLeadContext(baseLead, updates) {
  return {
    ...baseLead,
    ...updates
  };
}

async function executeAction(actionResult, context) {
  const actions = createConversationActions({
    businessName: context.businessName,
    scheduleLink: context.scheduleLink,
    initialVariant: context.lead.initialVariant
  });

  switch (actionResult.action) {
    case ACTIONS.ASK_NAME: {
      const askNameResponse = context.isFirstUserMessage ? actions.askName() : actions.askValidName();
      await context.leadService.saveLeadUpdates({
        stage: askNameResponse.nextStage,
        stageAttempts: 0,
        status: askNameResponse.status,
        state: askNameResponse.state
      });

      await context.messageService.sendReply(askNameResponse.reply);

      const updatedLead = await context.leadService.saveLeadUpdates({
        status: LEAD_STATUSES.WAITING_RESPONSE,
        state: LEAD_STATUSES.WAITING_RESPONSE
      });

      return {
        action: actionResult.action,
        reply: askNameResponse.reply,
        lead: updatedLead,
        data: actionResult.data
      };
    }
    case ACTIONS.SAVE_NAME: {
      const confirmNameResponse = actions.confirmNameAndQualify(actionResult.data.name);
      await context.leadService.saveLeadUpdates({
        name: actionResult.data.name,
        stage: confirmNameResponse.nextStage,
        conversationStage: CONVERSATION_STAGES.ASK_VEHICLE,
        stageAttempts: 0,
        status: confirmNameResponse.status,
        state: confirmNameResponse.state
      });

      await context.messageService.sendReply(confirmNameResponse.reply);

      const updatedLead = await context.leadService.saveLeadUpdates({
        status: LEAD_STATUSES.WAITING_RESPONSE,
        state: LEAD_STATUSES.WAITING_RESPONSE
      });

      return {
        action: actionResult.action,
        reply: confirmNameResponse.reply,
        lead: updatedLead,
        extractedName: actionResult.data.name,
        data: actionResult.data
      };
    }
    case ACTIONS.START_CONVERSATION_FLOW: {
      const nextStage = actionResult.data.nextStage || CONVERSATION_STAGES.ASK_VEHICLE;
      const stageQuestion = actions.getStageQuestion(nextStage, context.lead);

      await context.leadService.saveLeadUpdates({
        conversationStage: nextStage,
        stage: LEAD_STAGES.QUALIFICATION,
        stageAttempts: 0,
        status: LEAD_STATUSES.CONTACTED,
        state: LEAD_STATUSES.CONTACTED
      });

      logConversationStageReached({
        phone: context.phone,
        stage: nextStage
      });

      await context.messageService.sendReply(stageQuestion);

      const updatedLead = await context.leadService.saveLeadUpdates({
        status: LEAD_STATUSES.WAITING_RESPONSE,
        state: LEAD_STATUSES.WAITING_RESPONSE
      });

      return {
        action: actionResult.action,
        reply: stageQuestion,
        lead: updatedLead,
        data: actionResult.data
      };
    }
    case ACTIONS.ADVANCE_STAGE: {
      const currentStage =
        actionResult.data.currentStage || actionResult.data.stage || context.lead.conversationStage || CONVERSATION_STAGES.ASK_VEHICLE;
      const nextStage = actionResult.data.nextStage || context.lead.conversationStage || CONVERSATION_STAGES.ASK_VEHICLE;
      const { updates, capturedField, capturedValue } = getCapturedLeadData({
        currentStage,
        currentMessage: context.currentMessage
      });
      const stageLeadContext = buildStageLeadContext(context.lead, updates);
      const stageQuestion = actions.getStageQuestion(nextStage, stageLeadContext);

      await context.leadService.saveLeadUpdates({
        ...updates,
        conversationStage: nextStage,
        stage: nextStage === CONVERSATION_STAGES.CLOSE_MEETING ? LEAD_STAGES.APPOINTMENT : LEAD_STAGES.QUALIFICATION,
        stageAttempts: 0,
        status: LEAD_STATUSES.CONTACTED,
        state: LEAD_STATUSES.CONTACTED
      });

      logConversationStageReached({
        phone: context.phone,
        stage: nextStage
      });

      if (capturedField) {
        logEvent("LEAD_DATA_CAPTURED", {
          phone: context.phone,
          capturedField,
          value: capturedValue
        });
      }

      await context.messageService.sendReply(stageQuestion);

      const updatedLead = await context.leadService.saveLeadUpdates({
        status: LEAD_STATUSES.WAITING_RESPONSE,
        state: LEAD_STATUSES.WAITING_RESPONSE
      });

      return {
        action: actionResult.action,
        reply: stageQuestion,
        lead: updatedLead,
        data: actionResult.data
      };
    }
    case ACTIONS.REPEAT_STAGE: {
      const currentStage = actionResult.data.stage || context.lead.conversationStage || CONVERSATION_STAGES.ASK_VEHICLE;
      const nextStage = actionResult.data.nextStage || currentStage;
      const currentAttempts = Number(context.lead.stageAttempts || 0);
      const newAttempts = currentAttempts + 1;
      const shouldForceAdvance = newAttempts > 2;

      if (shouldForceAdvance) {
        const forcedQuestion = actions.getStageQuestion(nextStage, context.lead);

        await context.leadService.saveLeadUpdates({
          conversationStage: nextStage,
          stage: nextStage === CONVERSATION_STAGES.CLOSE_MEETING ? LEAD_STAGES.APPOINTMENT : LEAD_STAGES.QUALIFICATION,
          stageAttempts: 0,
          status: LEAD_STATUSES.CONTACTED,
          state: LEAD_STATUSES.CONTACTED
        });

        logConversationStageReached({
          phone: context.phone,
          stage: nextStage
        });

        await context.messageService.sendReply(forcedQuestion);

        const updatedLead = await context.leadService.saveLeadUpdates({
          status: LEAD_STATUSES.WAITING_RESPONSE,
          state: LEAD_STATUSES.WAITING_RESPONSE
        });

        return {
          action: ACTIONS.ADVANCE_STAGE,
          reply: forcedQuestion,
          lead: updatedLead,
          data: {
            ...actionResult.data,
            forcedAdvance: true,
            previousAttempts: newAttempts
          }
        };
      }

      const reprompt = actions.getStageReprompt(actionResult.data.fallback, currentStage);

      await context.leadService.saveLeadUpdates({
        conversationStage: currentStage,
        stage: currentStage === CONVERSATION_STAGES.CLOSE_MEETING ? LEAD_STAGES.APPOINTMENT : LEAD_STAGES.QUALIFICATION,
        stageAttempts: newAttempts,
        status: LEAD_STATUSES.CONTACTED,
        state: LEAD_STATUSES.CONTACTED
      });

      await context.messageService.sendReply(reprompt);

      const updatedLead = await context.leadService.saveLeadUpdates({
        status: LEAD_STATUSES.WAITING_RESPONSE,
        state: LEAD_STATUSES.WAITING_RESPONSE
      });

      return {
        action: actionResult.action,
        reply: reprompt,
        lead: updatedLead,
        data: actionResult.data
      };
    }
    case ACTIONS.HANDLE_OBJECTION: {
      const currentStage = actionResult.data.stage || context.lead.conversationStage || CONVERSATION_STAGES.ASK_VEHICLE;
      const objectionReply = actions.getObjectionReply(actionResult.data.type);
      const stageQuestion = actions.getStageQuestion(currentStage, context.lead);
      const reply = `${objectionReply} ${stageQuestion}`;

      await context.leadService.saveLeadUpdates({
        conversationStage: currentStage,
        stage: currentStage === CONVERSATION_STAGES.CLOSE_MEETING ? LEAD_STAGES.APPOINTMENT : LEAD_STAGES.QUALIFICATION,
        status: LEAD_STATUSES.CONTACTED,
        state: LEAD_STATUSES.CONTACTED
      });

      await context.messageService.sendReply(reply);

      const updatedLead = await context.leadService.saveLeadUpdates({
        status: LEAD_STATUSES.WAITING_RESPONSE,
        state: LEAD_STATUSES.WAITING_RESPONSE
      });

      return {
        action: actionResult.action,
        reply,
        lead: updatedLead,
        data: actionResult.data
      };
    }
    case ACTIONS.QUALIFY_LEAD: {
      let qualifyLeadResponse = actions.keepQualifying();

      if (actionResult.data.intent.wantsAppointment) {
        qualifyLeadResponse = actions.shareSchedule();
      } else if (actionResult.data.intent.asksPrice) {
        qualifyLeadResponse = actions.sharePricingInfo();
      } else if (actionResult.data.intent.wantsInfo) {
        qualifyLeadResponse = actions.shareGeneralInfo();
      }

      await context.leadService.saveLeadUpdates({
        stage: qualifyLeadResponse.nextStage,
        status: qualifyLeadResponse.status,
        state: qualifyLeadResponse.state
      });

      await context.messageService.sendReply(qualifyLeadResponse.reply);

      const updatedLead = await context.leadService.saveLeadUpdates({
        status: LEAD_STATUSES.WAITING_RESPONSE,
        state: LEAD_STATUSES.WAITING_RESPONSE
      });

      return {
        action: actionResult.action,
        reply: qualifyLeadResponse.reply,
        lead: updatedLead,
        data: actionResult.data
      };
    }
    case ACTIONS.HANDOFF: {
      const handoffResponse = actions.handoff();
      await context.leadService.saveLeadUpdates({
        stage: handoffResponse.nextStage,
        status: handoffResponse.status,
        state: handoffResponse.state
      });

      await context.messageService.sendReply(handoffResponse.reply);

      const updatedLead = await context.leadService.saveLeadUpdates({
        status: LEAD_STATUSES.WAITING_RESPONSE,
        state: LEAD_STATUSES.WAITING_RESPONSE
      });

      return {
        action: actionResult.action,
        reply: handoffResponse.reply,
        lead: updatedLead,
        data: actionResult.data
      };
    }
    default: {
      const fallbackResponse = actions.fallback(context.lead.stage);
      await context.messageService.sendReply(fallbackResponse.reply);

      const updatedLead = await context.leadService.saveLeadUpdates({
        status: LEAD_STATUSES.WAITING_RESPONSE,
        state: LEAD_STATUSES.WAITING_RESPONSE
      });

      return {
        action: actionResult.action,
        reply: fallbackResponse.reply,
        lead: updatedLead,
        data: actionResult.data
      };
    }
  }
}

function evaluateConversation(lead, decision) {
  return classifyLead({
    hasName: Boolean(lead.name || decision.extractedName),
    wantsInfo: decision.intent.wantsInfo,
    asksPrice: decision.intent.asksPrice,
    wantsAppointment: decision.intent.wantsAppointment
  });
}

module.exports = {
  executeAction,
  evaluateConversation
};