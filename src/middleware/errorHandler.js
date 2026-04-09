/**
 * Global Express error handler.
 *
 * Catches errors thrown in route handlers, logs them, and sends a
 * structured JSON response. Sentry's `setupExpressErrorHandler` runs
 * before this, so errors are already captured by Sentry.
 */
function errorHandler(err, _req, res, _next) {
  console.error("--------- UNHANDLED ERROR ---------");
  console.error(`Timestamp : ${new Date().toISOString()}`);
  console.error(`Message   : ${err.message}`);
  console.error(`Stack     : ${err.stack}`);
  console.error("-----------------------------------");

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: {
      message: err.message,
      type: err.constructor.name,
      // Only include stack in non-production for debugging
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
