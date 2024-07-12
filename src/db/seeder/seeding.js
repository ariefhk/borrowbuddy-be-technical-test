import { db } from "../connect.js";
import { createBcryptPassword } from "../../helper/hashing.helper.js";
import { UserService } from "../../service/user.service.js";

const createAdminSeed = async () => {
  return await db.user.create({
    data: {
      name: "admin",
      email: "admin@gmail.com",
      role: "ADMIN",
      code: await UserService.generateUserCode(),
      password: await createBcryptPassword("rahasia"),
    },
  });
};

const createManyBookSeed = async () => {
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

async function main() {
  await createAdminSeed();

  await createManyBookSeed();
  console.log("Seed data success!");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
