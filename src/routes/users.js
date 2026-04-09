const express = require("express");
const { getDb } = require("../db/database");

const router = express.Router();

/**
 * GET /api/users
 * List all users.
 */
router.get("/", (_req, res) => {
  const users = getDb().prepare("SELECT * FROM users ORDER BY id").all();
  res.json({ users });
});

/**
 * GET /api/users/:id
 * Get a single user by ID. Returns 404 if the user does not exist.
 */
router.get("/:id", (req, res) => {
  const user = getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const displayName = user.name.toUpperCase();

  res.json({
    user: {
      ...user,
      displayName,
    },
  });
});

/**
 * POST /api/users
 * Create a new user.
 */
router.post("/", (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }

  const result = getDb()
    .prepare("INSERT INTO users (name, email) VALUES (?, ?)")
    .run(name, email);

  res.status(201).json({
    user: { id: result.lastInsertRowid, name, email },
  });
});

module.exports = router;
