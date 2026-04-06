const express = require("express");
const webhookRoutes = require("../modules/webhook/webhook.routes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

router.use("/webhook", webhookRoutes);

module.exports = router;
