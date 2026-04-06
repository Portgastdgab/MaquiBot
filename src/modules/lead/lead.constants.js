const LEAD_STAGES = {
  NEW: "NEW",
  COLLECT_NAME: "COLLECT_NAME",
  QUALIFICATION: "QUALIFICATION",
  APPOINTMENT: "APPOINTMENT",
  HANDOFF: "HANDOFF"
};

const LEAD_STATUSES = Object.freeze({
  NEW: "new",
  CONTACTED: "contacted",
  WAITING_RESPONSE: "waiting_response",
  QUALIFIED: "qualified"
});

module.exports = {
  LEAD_STAGES,
  LEAD_STATUSES
};