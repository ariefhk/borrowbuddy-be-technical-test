import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { BookService } from "../service/book.service.js";

export class BookController {
  static async getAllBook(req, res, next) {
    try {
      const getAllBookRequest = {
        loggedUserRole: req?.loggedUser?.role,
        title: req?.query?.title ? String(req.query.title) : null,
      };

      const result = await BookService.getAllBook(getAllBookRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get all Book!", result));
    } catch (error) {
      next(error);
    }
  }

  static async getBookById(req, res, next) {
    try {
      const getBookById = {
        loggedUserRole: req?.loggedUser?.role,
        bookId: req?.params?.bookId ? Number(req.params.bookId) : null,
      };

      const result = await BookService.getBookById(getBookById);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get Book By Id!", result));
    } catch (error) {
      next(error);
    }
  }

  static async createBook(req, res, next) {
    try {
      const createBook = {
        loggedUserRole: req?.loggedUser?.role,
        title: req?.body?.title,
        author: req?.body?.author,
        code: req?.body?.code,
      };

      const result = await BookService.create(createBook);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success Create Book!", result));
    } catch (error) {
      next(error);
    }
  }
  static async updateBook(req, res, next) {
    try {
      const createBook = {
        loggedUserRole: req?.loggedUser?.role,
        bookId: req?.params?.bookId ? Number(req.params.bookId) : null,
        title: req?.body?.title,
        author: req?.body?.author,
        code: req?.body?.code,
      };

      const result = await BookService.update(createBook);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Update Book!", result));
    } catch (error) {
      next(error);
    }
  }

  static async recoverBook(req, res, next) {
    try {
      const recoverBook = {
        loggedUserRole: req?.loggedUser?.role,
        bookId: req?.params?.bookId ? Number(req.params.bookId) : null,
      };

      const result = await BookService.recover(recoverBook);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Recover Book!", result));
    } catch (error) {
      next(error);
    }
  }

  static async deleteBook(req, res, next) {
    try {
      const deleteBook = {
        loggedUserRole: req?.loggedUser?.role,
        bookId: req?.params?.bookId ? Number(req.params.bookId) : null,
      };

      await BookService.delete(deleteBook);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Delete Book!"));
    } catch (error) {
      next(error);
    }
  }
}
