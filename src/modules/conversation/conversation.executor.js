const { classifyLead } = require("../scoring/scoring.service");
const { ACTIONS, createConversationActions } = require("./conversation.actions");
const { LEAD_STATUSES } = require("../lead/lead.constants");

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