import { db } from "../connect.js";
import { createBcryptPassword } from "../../helper/hashing.helper.js";
import { UserService } from "../../service/user.service.js";

async function main() {
  await db.user.create({
    data: {
      name: "admin",
      email: "admin@gmail.com",
      role: "ADMIN",
      code: await UserService.generateUserCode(),
      password: await createBcryptPassword("rahasia"),
    },
  });

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
