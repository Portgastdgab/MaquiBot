function buildLeadUpdate(input = {}) {
  const update = {};

  if (typeof input.name === "string") {
    update.name = input.name.trim() || null;
  }

  if (typeof input.initialVariant === "string") {
    update.initialVariant = input.initialVariant.trim().toUpperCase();
  }

  if (typeof input.followUpSent === "boolean") {
    update.followUpSent = input.followUpSent;
  }

  if (typeof input.status === "string") {
    update.status = input.status;
  }

  if (typeof input.state === "string") {
    update.state = input.state;
  }

  if (typeof input.status === "string" && typeof input.state !== "string") {
    update.state = input.status;
  }

  if (typeof input.stage === "string") {
    update.stage = input.stage;
  }

  if (typeof input.conversationStage === "string") {
    update.conversationStage = input.conversationStage;
  }

  if (Object.prototype.hasOwnProperty.call(input, "conversationStage") && input.conversationStage === null) {
    update.conversationStage = null;
  }

  if (typeof input.score === "number") {
    update.score = input.score;
  }

  if (typeof input.category === "string") {
    update.category = input.category;
  }

  if (typeof input.stageAttempts === "number") {
    update.stageAttempts = input.stageAttempts;
  }

  if (typeof input.vehicleInterest === "string") {
    update.vehicleInterest = input.vehicleInterest.trim() || null;
  }

  if (Object.prototype.hasOwnProperty.call(input, "vehicleInterest") && input.vehicleInterest === null) {
    update.vehicleInterest = null;
  }

  if (typeof input.purchaseTiming === "string") {
    update.purchaseTiming = input.purchaseTiming.trim() || null;
  }

  if (Object.prototype.hasOwnProperty.call(input, "purchaseTiming") && input.purchaseTiming === null) {
    update.purchaseTiming = null;
  }

  if (typeof input.hasInitialCapital === "boolean") {
    update.hasInitialCapital = input.hasInitialCapital;
  }

  if (Object.prototype.hasOwnProperty.call(input, "hasInitialCapital") && input.hasInitialCapital === null) {
    update.hasInitialCapital = null;
  }

  if (typeof input.city === "string") {
    update.city = input.city.trim() || null;
  }

  if (Object.prototype.hasOwnProperty.call(input, "city") && input.city === null) {
    update.city = null;
  }

  return update;
}

module.exports = {
  buildLeadUpdate
};
