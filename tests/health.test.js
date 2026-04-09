const request = require("supertest");
const app = require("../src/app");
const { closeDb } = require("../src/db/database");

afterAll(() => {
  closeDb();
});

describe("GET /api/health", () => {
  it("should return healthy status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.database).toBe("connected");
  });
});
