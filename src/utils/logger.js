function logEvent(event, payload = {}) {
  const record = {
    event,
    timestamp: new Date().toISOString(),
    ...payload
  };

  console.log(JSON.stringify(record));
}

module.exports = {
  logEvent
};
