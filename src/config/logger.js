const { logEvent } = require("../utils/logger");

function info(message, payload = {}) {
  logEvent("LOG_INFO", {
    message,
    ...payload
  });
}

function warn(message, payload = {}) {
  logEvent("LOG_WARN", {
    message,
    ...payload
  });
}

function error(message, payload = {}) {
  logEvent("LOG_ERROR", {
    message,
    ...payload
  });
}

module.exports = {
  info,
  warn,
  error
};
