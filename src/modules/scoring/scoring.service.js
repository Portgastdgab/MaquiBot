function classifyLead({ hasName, wantsInfo, asksPrice, wantsAppointment }) {
  let score = 0;

  if (hasName) score += 20;
  if (wantsInfo) score += 20;
  if (asksPrice) score += 20;
  if (wantsAppointment) score += 40;

  let category = "low";
  if (score >= 70) {
    category = "high";
  } else if (score >= 40) {
    category = "medium";
  }

  return {
    score,
    category
  };
}

module.exports = {
  classifyLead
};
