import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { BorrowService } from "../service/borrow.service.js";

export class BorrowController {
  static async getAllBorrow(req, res, next) {
    try {
      const getAllBorrowRequest = {
        loggedUserRole: req?.loggedUser?.role,
      };

      const result = await BorrowService.getAll(getAllBorrowRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get all Borrow!", result));
    } catch (error) {
      next(error);
    }
  }

  static async getUserBorrowById(req, res, next) {
    try {
      const getUserBorrowByIdRequest = {
        loggedUserRole: req?.loggedUser?.role,
        userId: req?.params?.userId ? Number(req.params.userId) : null,
        isAdmin: true,
      };

      const result = await BorrowService.getUserBorrowById(getUserBorrowByIdRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get user Borrow!", result));
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUserBorrow(req, res, next) {
    try {
      const getCurrentUserBorrow = {
        loggedUserRole: req?.loggedUser?.role,
        userId: req?.loggedUser?.id ? Number(req.loggedUser.id) : null,
      };

      const result = await BorrowService.getUserBorrowById(getCurrentUserBorrow);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get current user Borrow!", result));
    } catch (error) {
      next(error);
    }
  }

  static async createBorrowBook(req, res, next) {
    try {
      const createBorrow = {
        loggedUserRole: req?.loggedUser?.role,
        userId: req?.loggedUser?.id ? Number(req.loggedUser.id) : null,
        requestBorrowBook: req?.body?.requestBorrowBook,
        borrowDate: req?.body?.borrowDate,
      };

      const result = await BorrowService.createBorrow(createBorrow);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create Borrow!", result));
    } catch (error) {
      next(error);
    }
  }

  static async returnBorrowBook(req, res, next) {
    try {
      const returnBorrowReqesut = {
        loggedUserRole: req?.loggedUser?.role,
        borrowId: req?.params?.borrowId ? Number(req.params.borrowId) : null,
        returnDate: req?.body?.returnDate,
      };

      const result = await BorrowService.returnBorrow(returnBorrowReqesut);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success return Borrow!", result));
    } catch (error) {
      next(error);
    }
  }

  static async deleteUserBorrow(req, res, next) {
    try {
      const deleteUserBorrowRequest = {
        loggedUserRole: req?.loggedUser?.role,
        borrowId: req?.params?.borrowId ? Number(req.params.borrowId) : null,
      };

      await BorrowService.deleteBorrow(deleteUserBorrowRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete Borrow!"));
    } catch (error) {
      next(error);
    }
  }
}
