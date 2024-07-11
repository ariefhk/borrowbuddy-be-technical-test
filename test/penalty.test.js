import supertest from "supertest";
import { web } from "../src/application/web.js";
import {
  createManyTestBooks,
  deleteManyTestBooks,
  createManyTestUsers,
  getSpecificTestBook,
  getSpecificTestUser,
  deleteManyTestUsers,
  deleteAllBorrow,
  createAdminTestUser,
  removeAdminTestUser,
  createManyPenaltyTest,
  deleteManyTestPenalties,
  getSpecificPenaltyTest,
} from "./test-util.js";
import { penaltyPrefix } from "../src/route/prefix.route.js";

import { loginWithSupertest } from "./test-util.js";

const penaltyUrl = penaltyPrefix;
const penaltyIdUrl = (idPenalty) => `$penaltytyUrl}/${idPenalty}`;

describe("GET /api/penalties", function () {
  beforeEach(async () => {
    await createAdminTestUser();
    await createManyPenaltyTest();
  });

  afterEach(async () => {
    await removeAdminTestUser();
    await deleteManyTestPenalties();
  });

  it("should get penalties", async () => {
    const tokenAdmin = await loginWithSupertest("admin");

    const result = await supertest(web)
      .get(penaltyUrl)
      .set("Authorization", "Bearer " + tokenAdmin);

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });

  it("should get penalties by username", async () => {
    const tokenAdmin = await loginWithSupertest("admin");
    const result = await supertest(web)
      .get(penaltyUrl + "?username=test")
      .set("Authorization", "Bearer " + tokenAdmin);

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });
});

describe("GET /api/penalties/users/:userId", function () {
  beforeEach(async () => {
    await createAdminTestUser();
    await createManyPenaltyTest();
  });

  afterEach(async () => {
    await removeAdminTestUser();
    await deleteManyTestPenalties();
  });

  it("should get user penalty", async () => {
    const tokenAdmin = await loginWithSupertest("admin");
    const existedUser = await getSpecificTestUser("test1@gmail.com");

    const result = await supertest(web)
      .get(penaltyUrl + "/users/" + existedUser.id)
      .set("Authorization", "Bearer " + tokenAdmin);

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });

  it("should reject user get other user penalty", async () => {
    const tokenMember = await loginWithSupertest("member", {
      email: "test1@gmail.com",
      password: "rahasia",
    });
    const existedUser = await getSpecificTestUser("test2@gmail.com");
    const result = await supertest(web)
      .get(penaltyUrl + "/users/" + existedUser.id)
      .set("Authorization", "Bearer " + tokenMember);

    expect(result.status).toBe(403);
    expect(result.body.message).toBeDefined();
  });
});

describe("GET /api/penalties/users/current", function () {
  beforeEach(async () => {
    await createAdminTestUser();
    await createManyPenaltyTest();
  });

  afterEach(async () => {
    await removeAdminTestUser();
    await deleteManyTestPenalties();
  });

  it("should get current user penalty", async () => {
    const tokenMember = await loginWithSupertest("member", {
      email: "test1@gmail.com",
      password: "rahasia",
    });
    const result = await supertest(web)
      .get(penaltyUrl + "/users/current")
      .set("Authorization", "Bearer " + tokenMember);

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });
});

describe("PUT /api/penalties/:penaltyId", function () {
  beforeEach(async () => {
    await createAdminTestUser();
    await createManyPenaltyTest();
  });

  afterEach(async () => {
    await removeAdminTestUser();
    await deleteManyTestPenalties();
  });

  it("should update user penalty", async () => {
    const tokenAdmin = await loginWithSupertest("admin");
    const existedUserPenalty = await getSpecificPenaltyTest("test1@gmail.com");
    const result = await supertest(web)
      .put("/api/penalties/" + existedUserPenalty.id)
      .set("Authorization", "Bearer " + tokenAdmin)
      .send({
        startDate: "",
        endDate: "",
      });

    console.log({
      existedUserPenalty: existedUserPenalty,
      result: result.body,
    });

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });

  it("should reject update user penalty if penaltyId not found", async () => {
    const tokenAdmin = await loginWithSupertest("admin");

    const result = await supertest(web)
      .put("/api/penalties/" + 100)
      .set("Authorization", "Bearer " + tokenAdmin)
      .send({
        startDate: "",
        endDate: "",
      });

    expect(result.status).toBe(404);
    expect(result.body.message).toBeDefined();
  });
});

describe("DELETE /api/penalties/:penaltyId", function () {
  beforeEach(async () => {
    await createAdminTestUser();
    await createManyPenaltyTest();
  });

  afterEach(async () => {
    await removeAdminTestUser();
    await deleteManyTestPenalties();
  });

  it("should delete user penalty", async () => {
    const tokenAdmin = await loginWithSupertest("admin");
    const existedUserPenalty = await getSpecificPenaltyTest("test1@gmail.com");
    const result = await supertest(web)
      .delete("/api/penalties/" + existedUserPenalty.id)
      .set("Authorization", "Bearer " + tokenAdmin);

    expect(result.status).toBe(200);
    expect(result.body.message).toBeDefined();
  });

  it("should reject delete user penalty if penaltyId not found", async () => {
    const tokenAdmin = await loginWithSupertest("admin");

    const result = await supertest(web)
      .delete("/api/penalties/" + 100)
      .set("Authorization", "Bearer " + tokenAdmin);

    expect(result.status).toBe(404);
    expect(result.body.message).toBeDefined();
  });
});
