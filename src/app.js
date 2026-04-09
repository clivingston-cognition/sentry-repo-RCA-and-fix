const express = require("express");
const Sentry = require("@sentry/node");

const healthRoutes = require("./routes/health");
const userRoutes = require("./routes/users");
const orderRoutes = require("./routes/orders");
const productRoutes = require("./routes/products");
const errorHandler = require("./middleware/errorHandler");
const { initDb } = require("./db/database");

// Initialize the database on startup
initDb();

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api/health", healthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);

// ---------------------------------------------------------------------------
// Sentry error handler — must be AFTER routes but BEFORE custom error handler
// ---------------------------------------------------------------------------
Sentry.setupExpressErrorHandler(app);

// Custom error handler (sends JSON responses)
app.use(errorHandler);

module.exports = app;
