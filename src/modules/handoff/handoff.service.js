const { LEAD_STAGES } = require("../lead/lead.constants");

function shouldHandoff(lead) {
  return lead.stage === LEAD_STAGES.HANDOFF;
}

module.exports = {
  shouldHandoff
};
