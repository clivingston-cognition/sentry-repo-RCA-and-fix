const request = require("supertest");
const app = require("../src/app");
const { closeDb } = require("../src/db/database");

afterAll(() => {
  closeDb();
});

describe("GET /api/products", () => {
  it("should return list of products", async () => {
    const res = await request(app).get("/api/products");
    expect(res.statusCode).toBe(200);
    expect(res.body.products).toBeDefined();
    expect(res.body.products.length).toBeGreaterThan(0);
  });
});

describe("GET /api/products/:id", () => {
  it("should return a product for valid ID", async () => {
    const res = await request(app).get("/api/products/1");
    expect(res.statusCode).toBe(200);
    expect(res.body.product).toBeDefined();
    expect(res.body.product.name).toBe("Widget A");
  });

  it("should return 404 for non-existent product", async () => {
    const res = await request(app).get("/api/products/9999");
    expect(res.statusCode).toBe(404);
  });
});
