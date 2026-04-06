const express = require("express");
const routes = require("./routes");
const logger = require("./config/logger");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(routes);

app.use((err, _req, res, _next) => {
  logger.error("Unhandled application error", {
    message: err.message
  });

  res.status(500).json({
    error: "Internal server error"
  });
});

module.exports = app;
