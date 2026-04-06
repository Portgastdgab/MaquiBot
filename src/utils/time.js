function nowDate() {
  return new Date();
}

function nowIso() {
  return nowDate().toISOString();
}

module.exports = {
  nowDate,
  nowIso
};
