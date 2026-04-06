const { logEvent } = require("../../utils/logger");

function logConversationStageReached({ phone, stage }) {
  logEvent("CONVERSATION_STAGE_REACHED", {
    phone,
    stage,
    timestamp: new Date().toISOString()
  });
}

// Prepared hook for future scheduler/follow-up job integration.
function logConversationDropped({ phone, stage, reason = "no_response_timeout_pending" }) {
  logEvent("CONVERSATION_DROPPED", {
    phone,
    stage,
    reason,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  logConversationStageReached,
  logConversationDropped
};
