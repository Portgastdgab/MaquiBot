const leadRepository = require("./lead.repository");
const { logEvent } = require("../../utils/logger");

async function getOrCreateLead(phone) {
  const existingLead = await leadRepository.getLeadByPhone(phone);
  if (existingLead) {
    logEvent("LEAD_FETCHED", {
      phone,
      stage: existingLead.stage,
      status: existingLead.status
    });
    return existingLead;
  }

  const createdLead = await leadRepository.createLead(phone);
  logEvent("LEAD_CREATED", {
    phone,
    stage: createdLead.stage,
    status: createdLead.status
  });

  return createdLead;
}

async function resolveLeadForMessageRouting(phone) {
  const existingLead = await leadRepository.getLeadByPhone(phone);
  if (existingLead) {
    logEvent("LEAD_ROUTED_EXISTING", {
      phone,
      stage: existingLead.stage,
      status: existingLead.status
    });

    return {
      lead: existingLead,
      isNew: false
    };
  }

  const createdLead = await leadRepository.createLead(phone);
  logEvent("LEAD_ROUTED_NEW", {
    phone,
    stage: createdLead.stage,
    status: createdLead.status
  });

  return {
    lead: createdLead,
    isNew: true
  };
}

async function saveLeadUpdates(phone, updates) {
  const updatedLead = await leadRepository.updateLead(phone, updates);
  logEvent("LEAD_UPDATED", {
    phone,
    stage: updatedLead.stage,
    status: updatedLead.status
  });

  return updatedLead;
}

async function touchLeadMessageTimestamp(phone, when) {
  const updatedLead = await leadRepository.touchLeadMessageTimestamp(phone, when);
  logEvent("LEAD_TIMESTAMP_TOUCHED", {
    phone,
    lastMessageAt: updatedLead.lastMessageAt
  });

  return updatedLead;
}

module.exports = {
  getOrCreateLead,
  resolveLeadForMessageRouting,
  saveLeadUpdates,
  touchLeadMessageTimestamp
};
