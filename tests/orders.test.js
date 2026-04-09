const request = require("supertest");
const app = require("../src/app");
const { closeDb } = require("../src/db/database");

afterAll(() => {
  closeDb();
});

describe("GET /api/orders", () => {
  it("should return list of orders", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.statusCode).toBe(200);
    expect(res.body.orders).toBeDefined();
    expect(Array.isArray(res.body.orders)).toBe(true);
  });
});

describe("POST /api/orders", () => {
  it("should return 400 if body is invalid", async () => {
    const res = await request(app).post("/api/orders").send({});
    expect(res.statusCode).toBe(400);
  });

  it("should return 404 if user does not exist", async () => {
    const res = await request(app).post("/api/orders").send({
      userId: 9999,
      items: [{ productId: 1, quantity: 1 }],
    });
    expect(res.statusCode).toBe(404);
  });

  it("should create an order with valid numeric quantity", async () => {
    const res = await request(app).post("/api/orders").send({
      userId: 1,
      items: [{ productId: 1, quantity: 2 }],
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.total).toBe(59.98);
  });

  it("should return 500 with TypeError for non-numeric quantity", async () => {
    const res = await request(app).post("/api/orders").send({
      userId: 1,
      items: [{ productId: 1, quantity: "two" }],
    });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.type).toBe("TypeError");
    expect(res.body.error.message).toMatch(/Invalid quantity/);
  });
});
