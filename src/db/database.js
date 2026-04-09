const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH =
  process.env.NODE_ENV === "test"
    ? ":memory:"
    : path.join(__dirname, "../../data/app.db");

let db;

/**
 * Returns (and lazily creates) the singleton database connection.
 */
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

/**
 * Create tables and seed sample data.
 */
function initDb() {
  const conn = getDb();

  conn.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      price       REAL    NOT NULL,
      stock       INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      total       REAL    NOT NULL DEFAULT 0,
      status      TEXT    NOT NULL DEFAULT 'pending',
      created_at  TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id    INTEGER NOT NULL,
      product_id  INTEGER NOT NULL,
      quantity    INTEGER NOT NULL,
      unit_price  REAL    NOT NULL,
      FOREIGN KEY (order_id)   REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Seed data (only if tables are empty)
  const userCount = conn.prepare("SELECT COUNT(*) as cnt FROM users").get().cnt;
  if (userCount === 0) {
    const insertUser = conn.prepare(
      "INSERT INTO users (name, email) VALUES (?, ?)"
    );
    insertUser.run("Alice Johnson", "alice@example.com");
    insertUser.run("Bob Smith", "bob@example.com");
    insertUser.run("Charlie Davis", "charlie@example.com");

    const insertProduct = conn.prepare(
      "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)"
    );
    insertProduct.run("Widget A", 29.99, 100);
    insertProduct.run("Widget B", 49.99, 50);
    insertProduct.run("Widget C", 9.99, 200);
    insertProduct.run("Premium Widget", 199.99, 10);

    console.log("Database seeded with sample data.");
  }
}

/**
 * Close the database connection (useful for tests).
 */
function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, initDb, closeDb };
