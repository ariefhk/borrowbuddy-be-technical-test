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
} from "./test-util.js";
import { borrowPrefix } from "../src/route/prefix.route.js";

import { loginWithSupertest } from "./test-util.js";

const borrowUrl = borrowPrefix;
const borrowIdUrl = (idBorrow) => `${borrowPrefix}/${idBorrow}`;

describe("POST /api/borrows", function () {
  beforeEach(async () => {
    await createManyTestBooks();
    await createManyTestUsers();
  });

  afterEach(async () => {
    await deleteAllBorrow();
    await deleteManyTestBooks();
    await deleteManyTestUsers();
  });

  it("should create borrow", async () => {
    const token = await loginWithSupertest("member", {
      email: "test1@gmail.com",
      password: "rahasia",
    });
    // const existedUser = await getSpecificTestUser("test1@gmail.com");
    const existedBook = await getSpecificTestBook("BOOK-1");
    const result = await supertest(web)
      .post(borrowUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        borrowDate: "2024-07-11",
        requestBorrowBook: [
          {
            bookId: existedBook.id,
          },
        ],
      });

    expect(result.status).toBe(201);
    expect(result.body.data).toBeDefined();
  });

  it("should reject if book borrow more than 2 book", async () => {
    const token = await loginWithSupertest("member", {
      email: "test1@gmail.com",
      password: "rahasia",
    });
    const existedUser = await getSpecificTestUser("test1@gmail.com");
    const existedBook1 = await getSpecificTestBook("BOOK-1");
    const existedBook2 = await getSpecificTestBook("BOOK-2");
    const existedBook3 = await getSpecificTestBook("BOOK-3");
    const result = await supertest(web)
      .post(borrowUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        borrowDate: "2024-07-11",
        requestBorrowBook: [
          {
            bookId: existedBook1.id,
          },
          {
            bookId: existedBook2.id,
          },
          {
            bookId: existedBook3.id,
          },
        ],
      });

    expect(result.status).toBe(400);
    expect(result.body.message).toBeDefined();
  });

  it("should reject if the book already borrow by other", async () => {
    const token = await loginWithSupertest("member", {
      email: "test1@gmail.com",
      password: "rahasia",
    });
    const token2 = await loginWithSupertest("member", {
      email: "test2@gmail.com",
      password: "rahasia",
    });
    const existedUser1 = await getSpecificTestUser("test1@gmail.com");
    const existedUser2 = await getSpecificTestUser("test2@gmail.com");
    const existedBook = await getSpecificTestBook("BOOK-1");
    await supertest(web)
      .post(borrowUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        borrowDate: "2024-07-11",
        requestBorrowBook: [
          {
            bookId: existedBook.id,
          },
        ],
      });

    const result = await supertest(web)
      .post(borrowUrl)
      .set("Authorization", "Bearer " + token2)
      .send({
        userId: existedUser2.id,
        borrowDate: "2024-07-11",
        requestBorrowBook: [
          {
            bookId: existedBook.id,
          },
        ],
      });

    expect(result.status).toBe(400);
    expect(result.body.message).toBeDefined();
  });

  it("should reject if user being penalized", async () => {
    const token = await loginWithSupertest("member", {
      email: "test1@gmail.com",
      password: "rahasia",
    });

    const existedUser1 = await getSpecificTestUser("test1@gmail.com");
    const existedBook = await getSpecificTestBook("BOOK-1");
    const existedBorrow = await supertest(web)
      .post(borrowUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        borrowDate: "2024-07-11",
        requestBorrowBook: [
          {
            bookId: existedBook.id,
          },
        ],
      });

    // return book for being penalized
    const test = await supertest(web)
      .put(borrowIdUrl(existedBorrow.body.data.id) + "/return")
      .set("Authorization", "Bearer " + token)
      .send({
        returnDate: "2024-07-25",
      });

    const result = await supertest(web)
      .post(borrowUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        borrowDate: "2024-07-26",
        requestBorrowBook: [
          {
            bookId: existedBook.id,
          },
        ],
      });

    expect(result.status).toBe(400);
    expect(result.body.message).toBeDefined();
  });
});

describe("PUT /api/borrows/:borrowId/return", function () {
  beforeEach(async () => {
    await createManyTestBooks();
    await createManyTestUsers();
  });

  afterEach(async () => {
    await deleteAllBorrow();
    await deleteManyTestBooks();
    await deleteManyTestUsers();
  });

  it("should return borrow", async () => {
    const token = await loginWithSupertest("member", {
      email: "test1@gmail.com",
      password: "rahasia",
    });
    const existedUser = await getSpecificTestUser("test1@gmail.com");
    const existedBook = await getSpecificTestBook("BOOK-1");
    const existedBorrow = await supertest(web)
      .post(borrowUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        borrowDate: "2024-07-11",
        requestBorrowBook: [
          {
            bookId: existedBook.id,
          },
        ],
      });

    const result = await supertest(web)
      .put(borrowIdUrl(existedBorrow.body.data.id) + "/return")
      .set("Authorization", "Bearer " + token)
      .send({
        returnDate: "2024-07-13",
      });

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });

  it("should return borrow but make user penalized cant borrow for 3 day", async () => {
    const token = await loginWithSupertest("member", {
      email: "test1@gmail.com",
      password: "rahasia",
    });

    const existedUser1 = await getSpecificTestUser("test1@gmail.com");
    const existedBook = await getSpecificTestBook("BOOK-1");
    const existedBorrow = await supertest(web)
      .post(borrowUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        borrowDate: "2024-07-11",
        requestBorrowBook: [
          {
            bookId: existedBook.id,
          },
        ],
      });

    // return book for being penalized
    await supertest(web)
      .put(borrowIdUrl(existedBorrow.body.data.id) + "/return")
      .set("Authorization", "Bearer " + token)
      .send({
        returnDate: "2024-07-25",
      });

    const result = await supertest(web)
      .post(borrowUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        borrowDate: "2024-07-26",
        requestBorrowBook: [
          {
            bookId: existedBook.id,
          },
        ],
      });

    expect(result.status).toBe(400);
    expect(result.body.message).toBeDefined();
  });

  it("should reject if borrow id not found", async () => {
    const token = await loginWithSupertest("member", {
      email: "test1@gmail.com",
      password: "rahasia",
    });
    const result = await supertest(web)
      .put(borrowIdUrl(100) + "/return")
      .set("Authorization", "Bearer " + token)
      .send({
        returnDate: "2024-07-13",
      });

    expect(result.status).toBe(404);
    expect(result.body.message).toBeDefined();
  });
});

describe("DELETE /api/borrows/:borrowId", function () {
  beforeEach(async () => {
    await createManyTestBooks();
    await createManyTestUsers();
    await createAdminTestUser();
  });

  afterEach(async () => {
    await deleteAllBorrow();
    await deleteManyTestBooks();
    await deleteManyTestUsers();
    await removeAdminTestUser();
  });

  it("should delete borrow", async () => {
    const tokenAdmin = await loginWithSupertest("admin");
    const token = await loginWithSupertest("member", {
      email: "test1@gmail.com",
      password: "rahasia",
    });
    const existedUser = await getSpecificTestUser("test1@gmail.com");
    const existedBook = await getSpecificTestBook("BOOK-1");
    const existedBorrow = await supertest(web)
      .post(borrowUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        borrowDate: "2024-07-11",
        requestBorrowBook: [
          {
            bookId: existedBook.id,
          },
        ],
      });

    const result = await supertest(web)
      .delete(borrowIdUrl(existedBorrow.body.data.id))
      .set("Authorization", "Bearer " + tokenAdmin);

    console.log(result.body);

    expect(result.status).toBe(200);
    expect(result.body.message).toBeDefined();
  });

  it("should reject delete borrom if borrowId not found", async () => {
    const tokenAdmin = await loginWithSupertest("admin");
    const result = await supertest(web)
      .delete(borrowIdUrl(100))
      .set("Authorization", "Bearer " + tokenAdmin);

    expect(result.status).toBe(404);
    expect(result.body.message).toBeDefined();
  });
});

describe("GET /api/borrows", function () {
  beforeEach(async () => {
    await createManyTestBooks();
    await createManyTestUsers();
    await createAdminTestUser();
  });

  afterEach(async () => {
    await deleteAllBorrow();
    await deleteManyTestBooks();
    await deleteManyTestUsers();
    await removeAdminTestUser();
  });

  it("should get all user borrow", async () => {
    const tokenAdmin = await loginWithSupertest("admin");
    const token = await loginWithSupertest("member", {
      email: "test1@gmail.com",
      password: "rahasia",
    });
    const existedUser = await getSpecificTestUser("test1@gmail.com");
    const existedBook = await getSpecificTestBook("BOOK-1");
    const existedBook2 = await getSpecificTestBook("BOOK-2");
    await supertest(web)
      .post(borrowUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        userId: existedUser.id,
        borrowDate: "2024-07-11",
        requestBorrowBook: [
          {
            bookId: existedBook.id,
          },
          {
            bookId: existedBook2.id,
          },
        ],
      });

    const result = await supertest(web)
      .get(borrowUrl)
      .set("Authorization", "Bearer " + tokenAdmin);

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });
});

describe("GET /api/borrows/:userId", function () {
  beforeEach(async () => {
    await createManyTestBooks();
    await createManyTestUsers();
    await createAdminTestUser();
  });

  afterEach(async () => {
    await deleteAllBorrow();
    await deleteManyTestBooks();
    await deleteManyTestUsers();
    await removeAdminTestUser();
  });

  it("should get user specific borrow", async () => {
    const tokenAdmin = await loginWithSupertest("admin");
    const token = await loginWithSupertest("member", {
      email: "test1@gmail.com",
      password: "rahasia",
    });
    const existedUser = await getSpecificTestUser("test1@gmail.com");
    const existedBook = await getSpecificTestBook("BOOK-1");
    const existedBook2 = await getSpecificTestBook("BOOK-2");
    await supertest(web)
      .post(borrowUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        userId: existedUser.id,
        borrowDate: "2024-07-11",
        requestBorrowBook: [
          {
            bookId: existedBook.id,
          },
          {
            bookId: existedBook2.id,
          },
        ],
      });

    const result = await supertest(web)
      .get(borrowUrl + "/" + existedUser.id)
      .set("Authorization", "Bearer " + tokenAdmin);

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });
});

describe("GET /api/borrows/current", function () {
  beforeEach(async () => {
    await createManyTestBooks();
    await createManyTestUsers();
    await createAdminTestUser();
  });

  afterEach(async () => {
    await deleteAllBorrow();
    await deleteManyTestBooks();
    await deleteManyTestUsers();
    await removeAdminTestUser();
  });

  it("should get current user borrow", async () => {
    const token = await loginWithSupertest("member", {
      email: "test1@gmail.com",
      password: "rahasia",
    });
    const existedUser = await getSpecificTestUser("test1@gmail.com");
    const existedBook = await getSpecificTestBook("BOOK-1");
    const existedBook2 = await getSpecificTestBook("BOOK-2");
    await supertest(web)
      .post(borrowUrl)
      .set("Authorization", "Bearer " + token)
      .send({
        userId: existedUser.id,
        borrowDate: "2024-07-11",
        requestBorrowBook: [
          {
            bookId: existedBook.id,
          },
          {
            bookId: existedBook2.id,
          },
        ],
      });

    const result = await supertest(web)
      .get(borrowUrl + "/current")
      .set("Authorization", "Bearer " + token);

    expect(result.status).toBe(200);
    expect(result.body.data).toBeDefined();
  });
});
