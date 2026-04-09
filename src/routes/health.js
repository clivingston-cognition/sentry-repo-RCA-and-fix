const express = require("express");
const { getDb } = require("../db/database");

const router = express.Router();

/**
 * GET /api/health
 * Simple health check endpoint.
 */
router.get("/", (_req, res) => {
  try {
    const row = getDb().prepare("SELECT 1 as ok").get();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: row.ok === 1 ? "connected" : "error",
    });
  } catch (err) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: err.message,
    });
  }
});

module.exports = router;
