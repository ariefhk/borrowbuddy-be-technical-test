import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { UserService } from "../service/user.service.js";

export class UserController {
  static async getAll(req, res, next) {
    try {
      const getAllUserRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.query?.name ? String(req.query.name) : null,
      };

      const result = await UserService.getAll(getAllUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get all User!", result));
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req, res, next) {
    try {
      const getUserById = {
        loggedUserRole: req?.loggedUser?.role,
        userId: req?.params?.userId ? Number(req.params.userId) : null,
      };
      console.log(getUserById);

      const result = await UserService.getUserById(getUserById);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get User By Id!", result));
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req, res, next) {
    try {
      const loggedUser = req?.loggedUser;

      const getCurrentUserRequest = {
        id: loggedUser?.id,
        code: loggedUser?.code,
        name: loggedUser?.name,
        role: loggedUser?.role,
        email: loggedUser?.email,
      };

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get current User!", getCurrentUserRequest));
    } catch (error) {
      next(error);
    }
  }

  static async recoverUser(req, res, next) {
    try {
      const recoverUserRequest = {
        loggedUserRole: req?.loggedUser?.role,
        userId: req?.params?.userId ? Number(req.params.userId) : null,
      };

      const result = await UserService.recoverUser(recoverUserRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Recover User!", result));
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const loginUserRequest = {
        email: req?.body?.email,
        password: req?.body?.password,
      };

      const result = await UserService.login(loginUserRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success login User!", result));
    } catch (error) {
      next(error);
    }
  }

  static async register(req, res, next) {
    try {
      const registerUserRequest = {
        name: req?.body?.name,
        email: req?.body?.email,
        role: "MEMBER",
        password: req?.body?.password,
      };

      const result = await UserService.register(registerUserRequest);
      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success register User!", result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updateUserRequest = {
        loggedUserRole: req?.loggedUser?.role,
        userId: req?.params?.userId ? Number(req.params.userId) : null,
        name: req?.body?.name,
        email: req?.body?.email,
        password: req?.body?.password,
      };

      const result = await UserService.update(updateUserRequest);
      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success update User!", result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deleteUserRequest = {
        loggedUserRole: req?.loggedUser?.role,
        userId: req?.params?.userId ? Number(req.params.userId) : null,
      };

      await UserService.delete(deleteUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete User!"));
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const logoutUserRequest = {
        userId: req?.loggedUser?.id ? Number(req.loggedUser.id) : null,
      };

      await UserService.logout(logoutUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success logout User!"));
    } catch (error) {
      next(error);
    }
  }
}
