const { logEvent } = require("../../utils/logger");
const { normalizeWhatsappPhone } = require("../../utils/phone");
const { nowDate } = require("../../utils/time");
const { resolveLeadForMessageRouting, saveLeadUpdates, touchLeadMessageTimestamp } = require("../lead/lead.service");
const { buildLeadUpdate } = require("../lead/lead.schema");
const { runConversationTurn } = require("../conversation/conversation.service");
const { getRandomVariant } = require("../conversation/speech/base");
const { getMessageBySid, saveInboundMessage, saveOutboundMessage } = require("./message.repository");
const { sendWhatsappMessage } = require("../../services/twilio.service");
const env = require("../../config/env");
const { LEAD_STATUSES } = require("../lead/lead.constants");

async function processIncomingMessage(payload) {
  const phone = normalizeWhatsappPhone(payload.from);
  const text = payload.body || "";

  if (!phone) {
    throw new Error("Phone is required to process incoming message");
  }

  if (payload.messageSid) {
    const existingMessage = await getMessageBySid(payload.messageSid);
    if (existingMessage) {
      logEvent("MESSAGE_DUPLICATE_IGNORED", {
        messageSid: payload.messageSid,
        phone
      });
      return {
        duplicate: true
      };
    }
  }

  const routedLead = await resolveLeadForMessageRouting(phone);
  let lead = routedLead.lead;
  const isNewLead = routedLead.isNew;

  if (!lead.initialVariant) {
    const assignedVariant = getRandomVariant();
    lead = await saveLeadUpdates(
      phone,
      buildLeadUpdate({
        initialVariant: assignedVariant
      })
    );

    logEvent("LEAD_INITIAL_VARIANT_ASSIGNED", {
      phone,
      initialVariant: assignedVariant
    });
  }

  const isFirstUserMessage = isNewLead || lead.state === LEAD_STATUSES.NEW;

  logEvent("MESSAGE_ROUTED", {
    phone,
    leadType: isNewLead ? "new" : "existing",
    isFirstUserMessage
  });

  const inboundTimestamp = nowDate();

  await saveInboundMessage({
    leadPhone: phone,
    body: text,
    messageSid: payload.messageSid || null,
    timestamp: inboundTimestamp
  });

  await saveLeadUpdates(
    phone,
    buildLeadUpdate({
      followUpSent: false
    })
  );

  await touchLeadMessageTimestamp(phone, inboundTimestamp);
  logEvent("LEAD_TIMESTAMP_UPDATED", {
    phone,
    lastMessageAt: inboundTimestamp
  });

  const sendReply = async (replyText) => {
    const outbound = await sendWhatsappMessage(phone, replyText);
    const outboundTimestamp = nowDate();

    await saveOutboundMessage({
      leadPhone: phone,
      body: replyText,
      messageSid: outbound.sid,
      timestamp: outboundTimestamp
    });

    await touchLeadMessageTimestamp(phone, outboundTimestamp);
    logEvent("LEAD_TIMESTAMP_UPDATED", {
      phone,
      lastMessageAt: outboundTimestamp
    });

    return outbound;
  };

  const { actionExecutionResult, scoring } = await runConversationTurn({
    lead,
    message: text,
    context: {
      lead,
      phone,
      isFirstUserMessage,
      businessName: env.businessName,
      scheduleLink: env.scheduleLink,
      leadService: {
        saveLeadUpdates: async (updates) => saveLeadUpdates(phone, buildLeadUpdate(updates))
      },
      messageService: {
        sendReply
      }
    }
  });

  const updatedLead = await saveLeadUpdates(
    phone,
    buildLeadUpdate({
      score: scoring.score,
      category: scoring.category
    })
  );

  logEvent("MESSAGE_PROCESSED", {
    phone,
    action: actionExecutionResult.action,
    stage: updatedLead.stage,
    category: updatedLead.category
  });

  return {
    lead: updatedLead,
    reply: actionExecutionResult.reply
  };
}

module.exports = {
  processIncomingMessage
};
