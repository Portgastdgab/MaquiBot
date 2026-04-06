const db = require("../../config/firestore");
const { nowDate } = require("../../utils/time");
const { logEvent } = require("../../utils/logger");
const { LEAD_STATUSES } = require("../lead/lead.constants");
const { saveOutboundMessage } = require("../message/message.repository");
const { sendWhatsappMessage } = require("../../services/twilio.service");

const FOLLOWUP_MESSAGE = "Hola 👋 te escribí hace un momento por tu consulta, ¿sigues evaluando opciones?";

function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  return new Date(value);
}

function elapsedMinutes(from, to) {
  return (to.getTime() - from.getTime()) / 60000;
}

async function runFollowupFlow({ minWaitMinutes = 10, maxWaitMinutes = 20, now = nowDate() } = {}) {
  const snapshot = await db.collection("leads").where("state", "==", LEAD_STATUSES.WAITING_RESPONSE).get();

  let processed = 0;
  let sent = 0;

  for (const doc of snapshot.docs) {
    processed += 1;

    const lead = doc.data();
    const phone = lead.phone || doc.id;

    if (lead.followUpSent) {
      continue;
    }

    const lastMessageAt = toDate(lead.lastMessageAt);
    if (!lastMessageAt) {
      continue;
    }

    const waited = elapsedMinutes(lastMessageAt, now);
    if (waited < minWaitMinutes || waited > maxWaitMinutes) {
      continue;
    }

    const outbound = await sendWhatsappMessage(phone, FOLLOWUP_MESSAGE);
    const outboundTimestamp = nowDate();

    await saveOutboundMessage({
      leadPhone: phone,
      body: FOLLOWUP_MESSAGE,
      messageSid: outbound.sid,
      timestamp: outboundTimestamp
    });

    await db.collection("leads").doc(doc.id).update({
      followUpSent: true,
      updatedAt: outboundTimestamp,
      lastMessageAt: outboundTimestamp
    });

    logEvent("FOLLOWUP_SENT", {
      phone,
      messageSid: outbound.sid,
      waitedMinutes: waited
    });

    sent += 1;
  }

  logEvent("FOLLOWUP_FLOW_FINISHED", {
    processed,
    sent,
    minWaitMinutes,
    maxWaitMinutes
  });

  return {
    processed,
    sent
  };
}

function startFollowupScheduler({
  intervalMs = 60 * 1000,
  initialDelayMs = 5 * 1000,
  minWaitMinutes = 10,
  maxWaitMinutes = 20
} = {}) {
  let inProgress = false;

  const runTick = async () => {
    if (inProgress) {
      logEvent("FOLLOWUP_SCHEDULER_SKIP", {
        reason: "tick_still_running"
      });
      return;
    }

    inProgress = true;
    try {
      await runFollowupFlow({
        minWaitMinutes,
        maxWaitMinutes
      });
    } catch (error) {
      logEvent("FOLLOWUP_SCHEDULER_ERROR", {
        message: error.message,
        code: error.code || null
      });
    } finally {
      inProgress = false;
    }
  };

  const firstRunTimeoutId = setTimeout(() => {
    void runTick();
  }, initialDelayMs);

  const intervalId = setInterval(() => {
    void runTick();
  }, intervalMs);

  logEvent("FOLLOWUP_SCHEDULER_STARTED", {
    intervalMs,
    initialDelayMs,
    minWaitMinutes,
    maxWaitMinutes
  });

  return function stopFollowupScheduler() {
    clearTimeout(firstRunTimeoutId);
    clearInterval(intervalId);
    logEvent("FOLLOWUP_SCHEDULER_STOPPED");
  };
}

module.exports = {
  runFollowupFlow,
  startFollowupScheduler,
  FOLLOWUP_MESSAGE
};
