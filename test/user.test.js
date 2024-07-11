import supertest from "supertest";
import { web } from "../src/application/web.js";
import { createAdminTestUser, createTestUser, getTestUser, removeAdminTestUser, removeTestUser } from "./test-util.js";
import { createBcryptPassword } from "../src/helper/hashing.helper.js";
import { UserService } from "../src/service/user.service.js";
import { authPrefix, userPrefix } from "../src/route/prefix.route.js";

const loginUrl = authPrefix + `/login`;
const registerUrl = authPrefix + `/register`;
const meUrl = authPrefix + `/me`;
const logoutUrl = authPrefix + `/logout`;
const usersUrl = userPrefix;
const userByIdUrl = (userId) => userPrefix + `/${userId}`;

import { loginWithSupertest } from "./test-util.js";

describe("POST /api/auth/register", function () {
  afterEach(async () => {
    await removeTestUser();
  });

  it("should register new user", async () => {
    const result = await supertest(web)
      .post(registerUrl)
      .send({
        code: await UserService.generateUserCode(),
        name: "test",
        email: "test@gmail.com",
        password: await createBcryptPassword("rahasia"),
      });

    expect(result.status).toBe(201);
    expect(result.body.data.name).toBe("test");
    expect(result.body.data.email).toBe("test@gmail.com");
  });

  it("should reject if request is invalid", async () => {
    const result = await supertest(web).post(registerUrl).send({
      code: "",
      name: "",
      email: "",
      password: "",
    });

    expect(result.status).toBe(400);
    expect(result.body.message).toBeDefined();
  });

  it("should reject if user already registered", async () => {
    let result = await supertest(web)
      .post(registerUrl)
      .send({
        code: await UserService.generateUserCode(),
        name: "test",
        email: "test@gmail.com",
        password: await createBcryptPassword("rahasia"),
      });

    expect(result.status).toBe(201);
    expect(result.body.data.name).toBe("test");
    expect(result.body.data.email).toBe("test@gmail.com");

    result = await supertest(web)
      .post(registerUrl)
      .send({
        code: await UserService.generateUserCode(),
        name: "test",
        email: "test@gmail.com",
        password: await createBcryptPassword("rahasia"),
      });

    expect(result.status).toBe(400);
    expect(result.body.message).toBeDefined();
  });
});

describe("POST /api/auth/login", function () {
  beforeEach(async () => {
    await createTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
  });

  it("should login", async () => {
    const result = await supertest(web).post(loginUrl).send({
      email: "test@gmail.com",
      password: "rahasia",
    });

    expect(result.status).toBe(200);
    expect(result.body.data.token).toBeDefined();
  });

  it("should reject login if request is invalid", async () => {
    const result = await supertest(web).post(loginUrl).send({
      email: "",
      password: "",
    });

    expect(result.status).toBe(400);
    expect(result.body.message).toBeDefined();
  });

  it("should reject login if password is wrong", async () => {
    const result = await supertest(web).post(loginUrl).send({
      email: "test@gmail.com",
      password: "salah",
    });

    expect(result.status).toBe(400);
    expect(result.body.message).toBeDefined();
  });

  it("should reject login if email not found", async () => {
    const result = await supertest(web).post(loginUrl).send({
      email: "test_baru@gmail.com",
      password: "salah",
    });

    expect(result.status).toBe(404);
    expect(result.body.message).toBeDefined();
  });
});

describe("GET /api/auth/me", function () {
  beforeEach(async () => {
    await createTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
  });

  it("should check current user", async () => {
    const token = await loginWithSupertest();
    const result = await supertest(web)
      .get(meUrl)
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(200);
    expect(result.body.data.name).toBeDefined();
  });

  it("should reject check current user if not login", async () => {
    const result = await supertest(web).get(meUrl);

    expect(result.status).toBe(401);
    expect(result.body.message).toBeDefined();
  });
});

describe("DELETE /api/auth/logout", function () {
  beforeEach(async () => {
    await createTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
  });

  it("should logout user", async () => {
    const token = await loginWithSupertest();
    const result = await supertest(web)
      .delete(logoutUrl)
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(200);
    expect(result.body.message).toBeDefined();
  });

  it("should reject check current user if not login", async () => {
    const result = await supertest(web).delete(logoutUrl);

    expect(result.status).toBe(401);
    expect(result.body.message).toBeDefined();
  });
});

describe("GET /api/users", function () {
  beforeEach(async () => {
    await createTestUser();
    await createAdminTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
    await removeAdminTestUser();
  });

  it("should get all user", async () => {
    const token = await loginWithSupertest("admin");
    const result = await supertest(web)
      .get(usersUrl)
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });

  it("should get all user and search by name", async () => {
    const token = await loginWithSupertest("admin");
    const result = await supertest(web)
      .get(usersUrl + "?name=test")
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });

  it("should reject get all user if not admin", async () => {
    const token = await loginWithSupertest("member");
    const result = await supertest(web)
      .get(usersUrl)
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(403);
    expect(result.body.message).toBeDefined();
  });
});

describe("GET /api/users/:userId", function () {
  beforeEach(async () => {
    await createTestUser();
    await createAdminTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
    await removeAdminTestUser();
  });

  it("should get user by id", async () => {
    const token = await loginWithSupertest("admin");
    const existedUser = await getTestUser();
    const result = await supertest(web)
      .get(userByIdUrl(existedUser.id))
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });

  it("should reject get user by id because user not found!", async () => {
    const token = await loginWithSupertest("admin");
    const result = await supertest(web)
      .get(userByIdUrl(100))
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(404);
    expect(result.body.message).toBeDefined();
  });

  it("should reject get user by id if not admin", async () => {
    const token = await loginWithSupertest("member");
    const existedUser = await getTestUser();
    const result = await supertest(web)
      .get(userByIdUrl(existedUser.id))
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(403);
    expect(result.body.message).toBeDefined();
  });
});

describe("PUT /api/users/:userId", function () {
  beforeEach(async () => {
    await createTestUser();
    await createAdminTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
    await removeAdminTestUser();
  });

  it("should update user", async () => {
    const token = await loginWithSupertest("admin");
    const existedUser = await getTestUser();
    const result = await supertest(web)
      .put(userByIdUrl(existedUser.id))
      .set("Authorization", "Bearer " + token)
      .send({
        name: "test baru",
      });

    expect(result.status).toBe(201);
    expect(result.body.data).toBeDefined();
  });

  it("should reject update user because user not found!", async () => {
    const token = await loginWithSupertest("admin");
    const result = await supertest(web)
      .put(userByIdUrl(100))
      .set("Authorization", "Bearer " + token)
      .send({
        name: "test baru",
      });

    expect(result.status).toBe(404);
    expect(result.body.message).toBeDefined();
  });
});

describe("DELETE /api/users/:userId", function () {
  beforeEach(async () => {
    await createTestUser();
    await createAdminTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
    await removeAdminTestUser();
  });

  it("should delete user", async () => {
    const token = await loginWithSupertest("admin");
    const existedUser = await getTestUser();
    const result = await supertest(web)
      .delete(userByIdUrl(existedUser.id))
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(200);
    expect(result.body.message).toBeDefined();
  });

  it("should reject update user because user not found!", async () => {
    const token = await loginWithSupertest("admin");
    const result = await supertest(web)
      .delete(userByIdUrl(100))
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(404);
    expect(result.body.message).toBeDefined();
  });

  it("should reject delete user if not admin", async () => {
    const token = await loginWithSupertest("member");
    const existedUser = await getTestUser();
    const result = await supertest(web)
      .delete(userByIdUrl(existedUser.id))
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(403);
    expect(result.body.message).toBeDefined();
  });
});

describe("PUT /api/users/:userId/recover", function () {
  beforeEach(async () => {
    await createTestUser();
    await createAdminTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
    await removeAdminTestUser();
  });

  it("should recover user from soft delete", async () => {
    const token = await loginWithSupertest("admin");
    const existedUser = await getTestUser();
    await supertest(web)
      .delete(userByIdUrl(existedUser.id))
      .set("Authorization", "Bearer " + token);

    const result = await supertest(web)
      .put(userByIdUrl(existedUser.id) + "/recover")
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(200);
    expect(result.body.message).toBeDefined();
  });

  it("should reject recover user if user not found!", async () => {
    const token = await loginWithSupertest("admin");
    const existedUser = await getTestUser();
    await supertest(web)
      .delete(userByIdUrl(existedUser.id))
      .set("Authorization", "Bearer " + token);
    const result = await supertest(web)
      .put(userByIdUrl(100) + "/recover")
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(404);
    expect(result.body.message).toBeDefined();
  });

  it("should reject delete user if not admin", async () => {
    const tokenAdmin = await loginWithSupertest("admin");
    const tokenMember = await loginWithSupertest("member");
    const existedUser = await getTestUser();

    await supertest(web)
      .delete(userByIdUrl(existedUser.id))
      .set("Authorization", "Bearer " + tokenAdmin);
    const result = await supertest(web)
      .put(userByIdUrl(existedUser.id) + "/recover")
      .set("Authorization", "Bearer " + tokenMember);

    expect(result.status).toBe(401);
    expect(result.body.message).toBeDefined();
  });
});
