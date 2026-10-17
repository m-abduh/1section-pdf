import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";

describe("app", () => {
  const app = createApp();

  it("responds to the health check", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });

  it("returns 404 for unknown routes", async () => {
    const response = await request(app).get("/api/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("does not serve the old public uploads path", async () => {
    const response = await request(app).get("/uploads/some-file.pdf");
    expect(response.status).toBe(404);
  });
});
