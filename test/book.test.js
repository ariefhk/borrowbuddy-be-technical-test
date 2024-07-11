import supertest from "supertest";
import { web } from "../src/application/web.js";
import {
  createAdminTestUser,
  createTestUser,
  removeAdminTestUser,
  removeTestUser,
  createTestBook,
  getTestBook,
  removeTestBook,
} from "./test-util.js";
import { bookPrefix } from "../src/route/prefix.route.js";
// import { loginWithSupertest } from "./user.js";
import { loginWithSupertest } from "./test-util.js";

const bookUrl = bookPrefix;
const bookIdUrl = (idBook) => `${bookPrefix}/${idBook}`;

describe("POST /api/books", function () {
  beforeEach(async () => {
    await createAdminTestUser();
  });

  afterEach(async () => {
    await removeTestBook();
    await removeAdminTestUser();
  });

  it("should create book", async () => {
    const token = await loginWithSupertest("admin");
    const result = await supertest(web)
      .post(bookUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        code: "BOOK-1",
        title: "test title",
        author: "test author",
        stock: 1,
        isAvailable: true,
      });

    expect(result.status).toBe(201);
    expect(result.body.data).toBeDefined();
  });

  it("should reject if request is invalid", async () => {
    const token = await loginWithSupertest("admin");
    const result = await supertest(web)
      .post(bookUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        code: "",
        title: "",
        author: "",
        stock: "",
        isAvailable: "",
      });

    expect(result.status).toBe(400);
    expect(result.body.message).toBeDefined();
  });

  it("should reject if book already created", async () => {
    const token = await loginWithSupertest("admin");
    let result = await supertest(web)
      .post(bookUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        code: "BOOK-1",
        title: "test title",
        author: "test author",
        stock: 1,
        isAvailable: true,
      });

    expect(result.status).toBe(201);
    expect(result.body.data).toBeDefined();

    result = await supertest(web)
      .post(bookUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        code: "BOOK-1",
        title: "test title",
        author: "test author",
        stock: 1,
        isAvailable: true,
      });

    expect(result.status).toBe(400);
    expect(result.body.message).toBeDefined();
  });
});

describe("PUT /api/books/:bookId", function () {
  beforeEach(async () => {
    await createTestBook();
    await createAdminTestUser();
    await createTestUser();
  });

  afterEach(async () => {
    await removeTestBook();
    await removeAdminTestUser();
    await removeTestUser();
  });

  it("should update book", async () => {
    const token = await loginWithSupertest("admin");
    const existedBook = await getTestBook();

    const result = await supertest(web)
      .put(bookIdUrl(Number(existedBook.id)))
      .set("Authorization", "Bearer " + token)
      .send({
        title: "Buku New Upadte",
        author: "Arif",
      });

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });

  it("should reject update book if book not found", async () => {
    const token = await loginWithSupertest("admin");

    const result = await supertest(web)
      .put(bookIdUrl(Number(100)))
      .set("Authorization", "Bearer " + token)
      .send({
        title: "test title updated",
      });

    expect(result.status).toBe(404);
    expect(result.body.message).toBeDefined();
  });

  it("should reject update book if not admin", async () => {
    const tokenMember = await loginWithSupertest("member");
    const existedBook = await getTestBook();
    let result = await supertest(web)
      .put(bookIdUrl(existedBook.id))
      .set("Authorization", "Bearer " + tokenMember)
      .send({
        title: "test title updated",
      });

    expect(result.status).toBe(403);
    expect(result.body.message).toBeDefined();
  });
});

describe("DELETE /api/books/:bookId", function () {
  beforeEach(async () => {
    await createTestBook();
    await createAdminTestUser();
    await createTestUser();
  });

  afterEach(async () => {
    await removeTestBook();
    await removeAdminTestUser();
    await removeTestUser();
  });

  it("should soft delete book", async () => {
    const token = await loginWithSupertest("admin");
    const existedBook = await getTestBook();

    const result = await supertest(web)
      .delete(bookIdUrl(Number(existedBook.id)))
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(200);
    expect(result.body.message).toBeDefined();
  });

  it("should reject soft delete book if book not found", async () => {
    const token = await loginWithSupertest("admin");
    const result = await supertest(web)
      .delete(bookIdUrl(Number(100)))
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(404);
    expect(result.body.message).toBeDefined();
  });

  it("should reject soft delete book if not admin", async () => {
    const token = await loginWithSupertest("member");
    const existedBook = await getTestBook();

    const result = await supertest(web)
      .delete(bookIdUrl(Number(existedBook.id)))
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(403);
    expect(result.body.message).toBeDefined();
  });
});

describe("PUT /api/books/:bookId/recover", function () {
  beforeEach(async () => {
    await createTestBook();
    await createAdminTestUser();
    await createTestUser();
  });

  afterEach(async () => {
    await removeTestBook();
    await removeAdminTestUser();
    await removeTestUser();
  });

  it("should soft recover book", async () => {
    const token = await loginWithSupertest("admin");
    const existedBook = await getTestBook();
    await supertest(web)
      .delete(bookIdUrl(Number(existedBook.id)))
      .set("Authorization", "Bearer " + token);
    const result = await supertest(web)
      .put(bookIdUrl(Number(existedBook.id)) + "/recover")
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(200);
    expect(result.body.message).toBeDefined();
  });

  it("should reject recover book if book not found or already recover", async () => {
    const token = await loginWithSupertest("admin");
    const existedBook = await getTestBook();
    await supertest(web)
      .delete(bookIdUrl(Number(existedBook.id)))
      .set("Authorization", "Bearer " + token);
    const result = await supertest(web)
      .put(bookIdUrl(Number(100)) + "/recover")
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(404);
    expect(result.body.message).toBeDefined();
  });

  it("should reject recover book if not admin", async () => {
    const token = await loginWithSupertest("admin");
    const tokenMember = await loginWithSupertest("member");
    const existedBook = await getTestBook();
    await supertest(web)
      .delete(bookIdUrl(Number(existedBook.id)))
      .set("Authorization", "Bearer " + token);
    const result = await supertest(web)
      .put(bookIdUrl(Number(existedBook.id)) + "/recover")
      .set("Authorization", "Bearer " + tokenMember);

    expect(result.status).toBe(403);
    expect(result.body.message).toBeDefined();
  });
});

describe("GET /api/books", function () {
  beforeEach(async () => {
    await createTestBook();
  });

  afterEach(async () => {
    await removeTestBook();
  });

  it("should get all book", async () => {
    const result = await supertest(web).get(bookUrl);

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });

  it("should get all book and search by name", async () => {
    const result = await supertest(web).get(bookUrl + "?name=test");

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });
});

describe("GET /api/books/:bookId", function () {
  beforeEach(async () => {
    await createTestBook();
  });

  afterEach(async () => {
    await removeTestBook();
  });

  it("should get book by id", async () => {
    const existedBook = await getTestBook();
    const result = await supertest(web).get(bookIdUrl(Number(existedBook.id)));

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });

  it("should reject get book by id if not found!", async () => {
    const result = await supertest(web).get(bookIdUrl(100));

    expect(result.status).toBe(404);
    expect(result.body.message).toBeDefined();
  });
});
