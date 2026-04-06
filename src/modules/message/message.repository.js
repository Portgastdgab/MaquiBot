const db = require("../../config/firestore");
const { nowDate } = require("../../utils/time");

const MESSAGES_COLLECTION = "messages";
const MESSAGE_DIRECTIONS = {
  INBOUND: "inbound",
  OUTBOUND: "outbound"
};

async function getMessageBySid(messageSid) {
  if (!messageSid) {
    return null;
  }

  // Firestore single-field indexes are enabled by default, so this lookup is efficient.
  const snapshot = await db.collection(MESSAGES_COLLECTION).where("messageSid", "==", messageSid).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  };
}

async function saveMessage({ leadPhone, direction, body, messageSid = null, timestamp = nowDate() }) {
  if (!Object.values(MESSAGE_DIRECTIONS).includes(direction)) {
    throw new Error(`Invalid message direction: ${direction}`);
  }

  const doc = {
    leadPhone,
    direction,
    body,
    messageSid,
    timestamp,
    createdAt: timestamp
  };

  const ref = await db.collection(MESSAGES_COLLECTION).add(doc);
  return {
    id: ref.id,
    ...doc
  };
}

async function saveInboundMessage({ leadPhone, body, messageSid = null, timestamp = nowDate() }) {
  return saveMessage({
    leadPhone,
    direction: MESSAGE_DIRECTIONS.INBOUND,
    body,
    messageSid,
    timestamp
  });
}

async function saveOutboundMessage({ leadPhone, body, messageSid = null, timestamp = nowDate() }) {
  return saveMessage({
    leadPhone,
    direction: MESSAGE_DIRECTIONS.OUTBOUND,
    body,
    messageSid,
    timestamp
  });
}

module.exports = {
  getMessageBySid,
  saveMessage,
  saveInboundMessage,
  saveOutboundMessage,
  MESSAGE_DIRECTIONS
};
