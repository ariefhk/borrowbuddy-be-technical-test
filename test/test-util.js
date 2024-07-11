import { db } from "../src/db/connect.js";
import { web } from "../src/application/web.js";
import { createBcryptPassword } from "../src/helper/hashing.helper.js";
import { UserService } from "../src/service/user.service.js";
import supertest from "supertest";
import { authPrefix } from "../src/route/prefix.route.js";

const loginUrl = authPrefix + `/login`;
export const loginWithSupertest = async (role = "member", custom = {}) => {
  let loginResult;

  const mockMemberUserTest = {
    email: "test@gmail.com",
    password: "rahasia",
  };

  const mockAdminUserTest = {
    email: "adminTes@gmail.com",
    password: "rahasia",
  };

  if (custom.email && custom.password) {
    loginResult = await supertest(web).post(loginUrl).send({
      email: custom.email,
      password: custom.password,
    });
  } else {
    loginResult = await supertest(web)
      .post(loginUrl)
      .send({
        email: role === "member" ? mockMemberUserTest.email : mockAdminUserTest.email,
        password: role === "member" ? mockMemberUserTest.password : mockAdminUserTest.password,
      });
  }

  return loginResult.body.data.token;
};

export const createTestUser = async () => {
  return await db.user.create({
    data: {
      code: await UserService.generateUserCode(),
      name: "test",
      email: "test@gmail.com",
      password: await createBcryptPassword("rahasia"),
    },
  });
};

export const createManyTestUsers = async () => {
  for (let i = 0; i < 5; i++) {
    await db.user.create({
      data: {
        code: await UserService.generateUserCode(),
        name: "test" + i,
        email: "test" + i + "@gmail.com",
        password: await createBcryptPassword("rahasia"),
      },
    });
  }
};

export const deleteManyTestUsers = async () => {
  return db.user.deleteMany();
};

export const deleteAllBorrow = async () => {
  await db.penalty.deleteMany();
  await db.borrowBook.deleteMany();
  return db.borrow.deleteMany();
};

export const getSpecificTestUser = async (email) => {
  return db.user.findFirst({
    where: {
      email: email,
    },
  });
};

export const getTestUser = async () => {
  return db.user.findFirst({
    where: {
      email: "test@gmail.com",
    },
  });
};

export const removeTestUser = async () => {
  return db.user.deleteMany({
    where: {
      email: "test@gmail.com",
    },
  });
};

export const createAdminTestUser = async () => {
  return await db.user.create({
    data: {
      code: await UserService.generateUserCode(),
      name: "adminTest",
      email: "adminTes@gmail.com",
      role: "ADMIN",
      password: await createBcryptPassword("rahasia"),
    },
  });
};

export const getAdminTestUser = async () => {
  return db.user.findFirst({
    where: {
      email: "adminTes@gmail.com",
    },
  });
};

export const removeAdminTestUser = async () => {
  return db.user.deleteMany({
    where: {
      email: "adminTes@gmail.com",
    },
  });
};

export const createTestBook = async () => {
  return db.book.create({
    data: {
      code: "BOOK-1",
      title: "test title",
      author: "test author",
      stock: 1,
      isAvailable: true,
    },
  });
};

export const createManyTestBooks = async () => {
  for (let i = 0; i < 5; i++) {
    await db.book.create({
      data: {
        code: "BOOK-" + i,
        title: "test title" + i,
        author: "test author" + i,
        stock: 1,
        isAvailable: true,
      },
    });
  }
};

export const getSpecificTestBook = async (code) => {
  return db.book.findFirst({
    where: {
      code: code,
    },
  });
};

export const deleteManyTestBooks = async () => {
  return db.book.deleteMany({
    where: {
      code: {
        startsWith: "BOOK-",
      },
    },
  });
};

export const getTestBook = async () => {
  return db.book.findFirst({
    where: {
      code: "BOOK-1",
    },
  });
};

export const removeTestBook = async () => {
  return db.book.deleteMany({
    where: {
      code: "BOOK-1",
    },
  });
};

export const createManyPenaltyTest = async () => {
  for (let i = 0; i < 5; i++) {
    const user = await db.user.create({
      data: {
        code: await UserService.generateUserCode(),
        name: "test" + i,
        email: "test" + i + "@gmail.com",
        password: await createBcryptPassword("rahasia"),
      },
    });
    await db.penalty.create({
      data: {
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 3)),
        userId: user.id,
      },
    });
  }
};

export const getSpecificPenaltyTest = async (email) => {
  const user = await db.user.findFirst({
    where: {
      email: email,
    },
  });

  return db.penalty.findFirst({
    where: {
      userId: user.id,
    },
  });
};

export const deleteManyTestPenalties = async () => {
  await db.penalty.deleteMany();
  await db.user.deleteMany();
};
