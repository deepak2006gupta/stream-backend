import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";

vi.mock("../src/utils/FileUpload.js", async () => {
  const pathModule = await import("node:path");

  return {
    uploadToCloudinary: vi.fn(async (filePath) => {
      if (!filePath) {
        return null;
      }

      return {
        url: `https://mock-cloudinary.local/${pathModule.basename(filePath)}`,
      };
    }),
    deleteLocalFile: vi.fn(),
  };
});

import { app } from "../src/app.js";
import { User } from "../src/models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongoServer;

beforeAll(async () => {
  process.env.ACCESS_TOKEN_SECRET = "test-access-secret";
  process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
  process.env.ACCESS_TOKEN_EXPIRY = "15m";
  process.env.REFRESH_TOKEN_EXPIRY = "7d";

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("User auth routes", () => {
  it("registers, logs in, refreshes token, resets password, and logs out", async () => {
    const avatarFixturePath = path.resolve(__dirname, "fixtures", "avatar.jpg");

    const registerResponse = await request(app)
      .post("/api/v1/users/register")
      .field("username", "deepak")
      .field("email", "deepak@example.com")
      .field("fullname", "Deepak Gupta")
      .field("password", "pass1234")
      .attach("avatar", avatarFixturePath);

    expect(registerResponse.status).toBe(201);

    const loginResponse = await request(app).post("/api/v1/users/login").send({
      email: "deepak@example.com",
      password: "pass1234",
    });

    expect(loginResponse.status).toBe(200);

    const setCookieHeaders = loginResponse.headers["set-cookie"] ?? [];
    const accessTokenCookie = setCookieHeaders.find((cookie) => cookie.startsWith("accessToken="));
    const refreshTokenCookie = setCookieHeaders.find((cookie) => cookie.startsWith("refreshToken="));

    expect(accessTokenCookie).toBeTruthy();
    expect(refreshTokenCookie).toBeTruthy();

    const refreshResponse = await request(app)
      .post("/api/v1/users/refresh-token")
      .set("Cookie", [refreshTokenCookie]);

    expect(refreshResponse.status).toBe(200);

    const resetResponse = await request(app)
      .post("/api/v1/users/reset-password")
      .set("Cookie", [accessTokenCookie])
      .send({ password: "newPass1234" });

    expect(resetResponse.status).toBe(200);

    const logoutResponse = await request(app)
      .post("/api/v1/users/logout")
      .set("Cookie", [accessTokenCookie]);

    expect(logoutResponse.status).toBe(200);

    const reloginResponse = await request(app).post("/api/v1/users/login").send({
      email: "deepak@example.com",
      password: "newPass1234",
    });

    expect(reloginResponse.status).toBe(200);
  });
});
