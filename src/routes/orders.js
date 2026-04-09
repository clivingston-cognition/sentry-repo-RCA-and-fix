const express = require("express");
const { getDb } = require("../db/database");

const router = express.Router();

/**
 * GET /api/orders
 * List all orders with their items.
 */
router.get("/", (_req, res) => {
  const orders = getDb()
    .prepare(
      `SELECT o.*, u.name as user_name
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ORDER BY o.id DESC`
    )
    .all();
  res.json({ orders });
});

/**
 * POST /api/orders
 * Create a new order.
 *
 * 🐛 BUG: The `quantity` field from the request body is used directly in
 *    arithmetic (`quantity * product.price`) without validating that it is
 *    a number. When a client sends `"quantity": "two"`, the multiplication
 *    produces NaN, which is then inserted into the database.
 *
 *    This causes a TypeError / data-integrity issue that Sentry will capture.
 */
router.post("/", (req, res) => {
  const { userId, items } = req.body;

  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ error: "userId and items[] are required" });
  }

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Start a transaction
  const createOrder = db.transaction(() => {
    let orderTotal = 0;

    const orderResult = db
      .prepare("INSERT INTO orders (user_id, total, status) VALUES (?, 0, 'pending')")
      .run(userId);
    const orderId = orderResult.lastInsertRowid;

    for (const item of items) {
      const product = db
        .prepare("SELECT * FROM products WHERE id = ?")
        .get(item.productId);

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      // BUG: no type validation on quantity — string * number = NaN
      const lineTotal = item.quantity * product.price;

      db.prepare(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)"
      ).run(orderId, product.id, Number(item.quantity) || 0, product.price);

      orderTotal += lineTotal;
    }

    // BUG: orderTotal is NaN if any lineTotal was NaN, but this update
    // silently stores 0 instead of NaN due to SQLite coercion
    db.prepare("UPDATE orders SET total = ? WHERE id = ?").run(
      orderTotal || 0,
      orderId
    );

    // Validation check that should catch NaN but is implemented incorrectly
    if (orderTotal < 0) {
      throw new Error("Order total cannot be negative");
    }

    return { orderId, total: orderTotal };
  });

  const result = createOrder();

  // BUG: NaN fails this check silently — NaN is not > 0 and not < 0
  if (isNaN(result.total)) {
    throw new TypeError(
      `Order total calculation failed: expected a number but got NaN. ` +
      `Check that all item quantities are numeric values. ` +
      `Received items: ${JSON.stringify(items)}`
    );
  }

  res.status(201).json({
    order: {
      id: result.orderId,
      userId,
      total: result.total,
      status: "pending",
    },
  });
});

/**
 * GET /api/orders/process-queue
 * Process pending orders in the background queue.
 *
 * 🐛 BUG: Uses an async callback inside `.forEach()` without proper
 *    error handling. The `processOrder` function rejects for orders with
 *    certain conditions, but the rejection is never caught because
 *    `.forEach()` doesn't await the async callback.
 *
 *    This causes an UnhandledPromiseRejection that Sentry will capture.
 */
router.get("/process-queue", async (_req, res, next) => {
  try {
    const pendingOrders = getDb()
      .prepare("SELECT * FROM orders WHERE status = 'pending'")
      .all();

    if (pendingOrders.length === 0) {
      return res.json({ message: "No pending orders to process", processed: 0 });
    }

    const processOrder = async (order) => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (order.total === 0 || isNaN(order.total)) {
        throw new Error(
          `Failed to process order ${order.id}: invalid total (${order.total}). ` +
          `Order may have been created with invalid item quantities.`
        );
      }

      getDb()
        .prepare("UPDATE orders SET status = 'processed' WHERE id = ?")
        .run(order.id);
    };

    const results = await Promise.allSettled(
      pendingOrders.map((order) => processOrder(order))
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected");

    if (failed.length > 0) {
      const errors = failed.map((r) => r.reason.message);
      return res.status(207).json({
        message: `Processed ${succeeded} of ${pendingOrders.length} orders; ${failed.length} failed`,
        processed: succeeded,
        failed: failed.length,
        errors,
      });
    }

    res.json({
      message: `Successfully processed ${succeeded} orders`,
      processed: succeeded,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
