const env = require("../../config/env");
const { decideNextStep: engineDecideNextStep } = require("./conversation.engine");
const { executeAction: executorExecuteAction, evaluateConversation } = require("./conversation.executor");

function decideNextStep({ lead, message }) {
  return engineDecideNextStep({
    lead,
    message
  });
}

async function executeAction(actionResult, context) {
  return executorExecuteAction(actionResult, {
    ...context,
    businessName: env.businessName,
    scheduleLink: env.scheduleLink
  });
}

function evaluateLead(lead, actionExecutionResult) {
  return evaluateConversation(lead, {
    extractedName: actionExecutionResult.extractedName,
    intent: actionExecutionResult.data.intent
  });
}

async function runConversationTurn({ lead, message, context }) {
  const actionResult = decideNextStep({
    lead,
    message
  });

  const actionExecutionResult = await executeAction(actionResult, context);
  const scoring = evaluateLead(actionExecutionResult.lead, actionExecutionResult);

  return {
    actionResult,
    actionExecutionResult,
    scoring
  };
}

module.exports = {
  decideNextStep,
  executeAction,
  evaluateLead,
  runConversationTurn
};
