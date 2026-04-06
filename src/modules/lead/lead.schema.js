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

  if (typeof input.score === "number") {
    update.score = input.score;
  }

  if (typeof input.category === "string") {
    update.category = input.category;
  }

  return update;
}

module.exports = {
  buildLeadUpdate
};
