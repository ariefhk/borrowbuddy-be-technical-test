import { db } from "../db/connect.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/check-role.helper.js";
import { compareBcryptPassword, createBcryptPassword } from "../helper/hashing.helper.js";
import { makeJwt } from "../helper/jwt.helper.js";
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

    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User Not Found!");
    }

    return user;
  }

  static async getAll(request) {
    const { loggedUserRole, isPenalty, name } = request;

    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);
    const filter = {};

    if (isPenalty) {
      filter.penaltyEndDate = {
        not: null,
      };
    }

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
        penaltyEndDate: true,
      },
    });

    return users;
  }

  static async register(request) {
    const { name, email, role, password } = request;

    if (!name || !email || !role || !password) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Name, Email, Role, and Password fields are required!");
    }

    // Check if user email already registered
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

    const user = await db.user.create({
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
      id: user.id,
      code: user.code,
      name: user.name,
      email: user.email,
      role: user.role,
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
    const { userId, name, email, role, penaltyEndDate, password } = request;

    // Check if user is allowed to update
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
        role: role || existedUser.role,
        penaltyEndDate: penaltyEndDate || existedUser.penaltyEndDate,
        password: password ? await createBcryptPassword(password) : existedUser.password,
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

  static async delete(request) {
    const { userId, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // Check if user is allowed to delete
    const existedUser = await this.checkUserMustExist(userId);

    await db.user.delete({
      where: {
        id: existedUser.id,
      },
    });

    return true;
  }
}
