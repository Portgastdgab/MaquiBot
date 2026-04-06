const { runFollowupFlow } = require("../src/modules/followup/followup.service");

async function run() {
  const result = await runFollowupFlow();
  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error("Follow-up run failed", {
    message: error.message,
    code: error.code || null
  });
  process.exit(1);
});
