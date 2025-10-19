import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app, server } from "../../server";

// Note that for a real-world application, tests should run against a separate test database.
const prisma = new PrismaClient();

describe("Auth Endpoints", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "@test.com",
        },
      },
    });
    await prisma.$disconnect();

    server.close();
  });

  it("should return 409 Conflict when registering with a duplicate email", async () => {
    const testUser = {
      email: "duplicate@test.com",
      password: "password123",
    };

    await request(app).post("/api/auth/register").send(testUser);

    const response = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(response.status).toBe(409);
    expect(response.body.message).toEqual(
      "User with this email already exists."
    );
  });
});
