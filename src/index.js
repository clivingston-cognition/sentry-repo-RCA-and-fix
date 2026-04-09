const Sentry = require("@sentry/node");
const app = require("./app");

// ---------------------------------------------------------------------------
// Sentry Initialization
// IMPORTANT: Sentry.init() must be called before any other require/import
// that might generate errors. In a real app this would be at the very top.
// ---------------------------------------------------------------------------
Sentry.init({
  dsn: process.env.SENTRY_DSN || "",
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  // Attach server name so Sentry shows which host triggered the error
  serverName: process.env.HOSTNAME || "sentry-rca-demo",
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Sentry RCA Demo API listening on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`   Sentry DSN  : ${process.env.SENTRY_DSN ? "configured" : "NOT SET (errors won't be reported)"}`);
  console.log(`\n   Trigger bugs:`);
  console.log(`     curl http://localhost:${PORT}/api/users/9999`);
  console.log(`     curl -X POST http://localhost:${PORT}/api/orders -H 'Content-Type: application/json' -d '{"userId":1,"items":[{"productId":1,"quantity":"two"}]}'`);
  console.log(`     curl http://localhost:${PORT}/api/orders/process-queue`);
});
