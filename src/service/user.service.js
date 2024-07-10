import { db } from "../db/connect.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/check-role.helper.js";
import { compareBcryptPassword, createBcryptPassword } from "../helper/hashing.helper.js";
import { decodeJwt, makeJwt } from "../helper/jwt.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";

export class UserService {
  static async getHighestUserId() {
    const highestUser = await db.user.findFirst({
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
      },
    });
    return highestUser ? highestUser.id : 0; // Return 0 if no user exists
  }

  static async generateUserCode(prefix = "M") {
    // get the last user id from the database
    const userHighestId = await this.getHighestUserId();

    // Pad with zeros to ensure at least 3 digits
    const formattedNumber = String(userHighestId).padStart(3, "0");
    return `${prefix}${formattedNumber}`;
  }

  static async checkUserMustExist(userId) {
    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User ID is required");
    }

    const user = await db.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User Not Found!");
    }

    return user;
  }

  static async checkUserToken(token) {
    // Check if token is existed
    const existedToken = await db.user.findFirst({
      where: {
        token: token,
      },
    });

    if (!existedToken) {
      throw new APIError(API_STATUS_CODE.UNAUTHORIZED, "Unauthorized!");
    }
    // Check if token is expired
    const decodedUser = await decodeJwt(token);

    // Check if user is existed by user id
    const existedUser = await this.checkUserMustExist(decodedUser.id);

    return {
      id: existedUser.id,
      code: existedUser.code,
      name: existedUser.name,
      email: existedUser.email,
      role: existedUser.role,
      createdAt: existedUser.createdAt,
    };
  }

  static async getAll(request) {
    const { loggedUserRole, name } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const filter = {
      role: "MEMBER",
    };

    if (name) {
      filter.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    const users = await db.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      where: filter,
      select: {
        id: true,
        code: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        deletedAt: true,
        borrow: {
          select: {
            id: true, // Include the id of borrow to ensure structure
            _count: {
              select: {
                borrowBook: true,
              },
            },
          },
        },
      },
    });

    return users.map((user) => {
      return {
        id: user.id,
        code: user.code,
        name: user.name,
        email: user.email,
        isDeleted: user.deletedAt ? true : false,
        role: user.role,
        borrowedBooksCount: user.borrow.reduce((acc, borrow) => acc + borrow._count.borrowBook, 0),
        createdAt: user.createdAt,
      };
    });
  }

  static async getUserById(request) {
    const { loggedUserRole, userId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const user = await db.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        id: true,
        code: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        deletedAt: true,
        borrow: {
          select: {
            id: true, // Include the id of borrow to ensure structure
            _count: {
              select: {
                borrowBook: true,
              },
            },
            borrowBook: {
              select: {
                book: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User Not Found!");
    }

    return {
      id: user.id,
      code: user.code,
      name: user.name,
      email: user.email,
      isDeleted: user.deletedAt ? true : false,
      role: user.role,
      createdAt: user.createdAt,
      borrowedBooksCount: user.borrow.reduce((acc, borrow) => acc + borrow._count.borrowBook, 0),
      borrowedBooks: user.borrow.flatMap((borrow) => borrow.borrowBook.map((borrowBook) => borrowBook.book)),
      createdAt: user.createdAt,
    };
  }

  static async register(request) {
    const { name, email, role, password } = request;

    if (!name || !email || !role || !password) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Name, Email, Role, and Password fields are required!");
    }

    let registerUser;

    // Check if user email already registered but deleted
    const existingUserDelete = await db.user.findFirst({
      where: {
        email,
        deletedAt: {
          not: null,
        },
      },
    });

    // If user email already registered but deleted, then update the user
    if (existingUserDelete) {
      registerUser = await db.user.update({
        where: {
          id: existingUserDelete.id,
        },
        data: {
          name: name || existingUserDelete.name,
          email: existingUserDelete.email,
          role: role || existingUserDelete.role,
          password: password ? await createBcryptPassword(password) : existingUserDelete.password,
          deletedAt: null,
        },
      });

      return {
        id: registerUser.id,
        code: registerUser.code,
        name: registerUser.name,
        email: registerUser.email,
        role: registerUser.role,
      };
    }

    // Check if user email already used
    const countUser = await db.user.count({
      where: {
        email,
      },
    });

    if (countUser > 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email already exists!");
    }

    // make user unique code
    const userCode = await this.generateUserCode();

    // make user hashed password
    const hashedPassword = await createBcryptPassword(password);

    registerUser = await db.user.create({
      data: {
        name,
        email,
        role,
        code: userCode,
        password: hashedPassword,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        code: true,
      },
    });

    return {
      id: registerUser.id,
      code: registerUser.code,
      name: registerUser.name,
      email: registerUser.email,
      role: registerUser.role,
    };
  }

  static async recoverUser(request) {
    const { userId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User Id field is required!");
    }
    const existingUserDelete = await db.user.findFirst({
      where: {
        id: userId,
        deletedAt: {
          not: null,
        },
      },
    });

    if (!existingUserDelete) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User Not Found or still activated!");
    }

    // If user email already registered but deleted, then update the user
    const updatedUser = await db.user.update({
      where: {
        id: existingUserDelete.id,
      },
      data: {
        deletedAt: null,
      },
    });

    return {
      id: updatedUser.id,
      code: updatedUser.code,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    };
  }

  static async login(request) {
    const { email, password } = request;

    if (!email || !password) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email and Password fields are required!");
    }

    const existedUser = await db.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (!existedUser) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User Not Found!");
    }

    const isPasswordMatch = await compareBcryptPassword(password, existedUser.password);

    if (!isPasswordMatch) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email or Password is wrong!");
    }

    const token = await makeJwt(
      {
        id: existedUser.id,
      },
      "7d"
    );

    await db.user.update({
      where: {
        id: existedUser.id,
      },
      data: {
        token,
      },
    });

    return {
      id: existedUser.id,
      code: existedUser.code,
      name: existedUser.name,
      email: existedUser.email,
      role: existedUser.role,
      token,
    };
  }

  static async update(request) {
    const { userId, name, email, password, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    const existedUser = await this.checkUserMustExist(userId);

    // Check if user is allowed to update email
    if (email) {
      const countUser = await db.user.count({
        where: {
          email,
          id: {
            not: existedUser.id,
          },
        },
      });

      if (countUser > 0) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email already exists!");
      }
    }

    const updatedUser = await db.user.update({
      where: {
        id: existedUser.id,
      },
      data: {
        name: name || existedUser.name,
        email: email || existedUser.email,
        password: password ? await createBcryptPassword(password) : existedUser.password,
      },
    });

    return {
      id: updatedUser.id,
      code: updatedUser.code,
      name: updatedUser.name,
      email: updatedUser.email,
    };
  }

  static async delete(request) {
    const { userId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // Check if user is allowed to delete
    const existedUser = await this.checkUserMustExist(userId);

    await db.user.update({
      where: {
        id: existedUser.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return true;
  }

  static async logout(request) {
    const { userId } = request;

    // Check if user is allowed to delete
    const existedUser = await this.checkUserMustExist(userId);

    await db.user.update({
      where: {
        id: existedUser.id,
      },
      data: {
        token: null,
      },
    });

    return true;
  }
}
