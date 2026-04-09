const express = require("express");
const { getDb } = require("../db/database");

const router = express.Router();

/**
 * GET /api/products
 * List all products.
 */
router.get("/", (_req, res) => {
  const products = getDb()
    .prepare("SELECT * FROM products ORDER BY id")
    .all();
  res.json({ products });
});

/**
 * GET /api/products/:id
 * Get a single product by ID.
 */
router.get("/:id", (req, res) => {
  const product = getDb()
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(req.params.id);

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json({ product });
});

module.exports = router;
