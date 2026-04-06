const db = require("../../config/firestore");
const { nowDate } = require("../../utils/time");
const { LEAD_STAGES, LEAD_STATUSES } = require("./lead.constants");

const LEADS_COLLECTION = "leads";

function isValidLeadStatus(status) {
  return Object.values(LEAD_STATUSES).includes(status);
}

function isValidLeadState(state) {
  return Object.values(LEAD_STATUSES).includes(state);
}

async function getLeadByPhone(phone) {
  const doc = await db.collection(LEADS_COLLECTION).doc(phone).get();
  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  const patch = {};
  const repairTimestamp = nowDate();

  if (data.id !== phone) {
    patch.id = phone;
  }

  if (data.phone !== phone) {
    patch.phone = phone;
  }

  if (!isValidLeadStatus(data.status)) {
    patch.status = LEAD_STATUSES.NEW;
  }

  const effectiveStatus = patch.status || data.status || LEAD_STATUSES.NEW;

  if (!isValidLeadState(data.state)) {
    patch.state = effectiveStatus;
  }

  if (!Object.prototype.hasOwnProperty.call(data, "initialVariant")) {
    patch.initialVariant = null;
  }

  if (typeof data.followUpSent !== "boolean") {
    patch.followUpSent = false;
  }

  if (!data.createdAt) {
    patch.createdAt = repairTimestamp;
  }

  if (!data.lastMessageAt) {
    patch.lastMessageAt = data.createdAt || patch.createdAt || repairTimestamp;
  }

  if (Object.keys(patch).length > 0) {
    patch.updatedAt = repairTimestamp;
    await db.collection(LEADS_COLLECTION).doc(phone).update(patch);

    return {
      ...data,
      ...patch,
      id: phone
    };
  }

  return {
    ...data,
    id: phone
  };
}

async function createLead(phone) {
  const timestamp = nowDate();
  const lead = {
    id: phone,
    phone,
    name: null,
    initialVariant: null,
    followUpSent: false,
    status: LEAD_STATUSES.NEW,
    state: LEAD_STATUSES.NEW,
    stage: LEAD_STAGES.NEW,
    score: 0,
    category: "low",
    createdAt: timestamp,
    updatedAt: timestamp,
    lastMessageAt: timestamp
  };

  await db.collection(LEADS_COLLECTION).doc(phone).set(lead);
  return lead;
}

async function updateLead(phone, payload) {
  const timestamp = nowDate();
  const updatedLead = {
    ...payload,
    updatedAt: payload.updatedAt || timestamp
  };

  await db.collection(LEADS_COLLECTION).doc(phone).update(updatedLead);

  return getLeadByPhone(phone);
}

async function touchLeadMessageTimestamp(phone, when = nowDate()) {
  await db.collection(LEADS_COLLECTION).doc(phone).update({
    lastMessageAt: when,
    updatedAt: when
  });

  return getLeadByPhone(phone);
}

module.exports = {
  getLeadByPhone,
  createLead,
  updateLead,
  touchLeadMessageTimestamp
};
