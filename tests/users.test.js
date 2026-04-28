const request = require("supertest");
const app = require("../src/app");
const { closeDb } = require("../src/db/database");

afterAll(() => {
  closeDb();
});

describe("GET /api/users", () => {
  it("should return list of users", async () => {
    const res = await request(app).get("/api/users");
    expect(res.statusCode).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
  });
});

describe("GET /api/users/:id", () => {
  it("should return a user when given a valid ID", async () => {
    const res = await request(app).get("/api/users/1");
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.displayName).toBeDefined();
  });

  it("should return 404 for a non-existent user ID", async () => {
    const res = await request(app).get("/api/users/9999");
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  it("should return 404 for a non-numeric user ID", async () => {
    const res = await request(app).get("/api/users/abc");
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("User not found");
  });
});

describe("POST /api/users", () => {
  it("should create a new user", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Test User", email: `test-${Date.now()}@example.com` });
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBeDefined();
  });

  it("should return 400 if name or email is missing", async () => {
    const res = await request(app).post("/api/users").send({ name: "Only Name" });
    expect(res.statusCode).toBe(400);
  });
});
