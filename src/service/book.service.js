import { db } from "../db/connect.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/check-role.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";

export class BookService {
  static async checkBookMustExist(bookId) {
    if (!bookId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Book ID is required");
    }

    const book = await db.book.findUnique({
      where: {
        id: bookId,
      },
    });

    if (!book) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Book Not Found!");
    }

    return book;
  }

  static async getAll(request) {
    const { loggedUserRole, title } = request;
    const filter = {};
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    if (title) {
      filter.title = {
        contains: title,
        mode: "insensitive",
      };
    }

    const countAvailableBooks = await db.book.count({
      where: {
        isAvailable: true,
      },
    });

    const books = await db.book.findMany({
      orderBy: {
        title: "asc",
      },
      where: filter,
      select: {
        id: true,
        title: true,
        author: true,
        code: true,
        isAvailable: true,
        stock: true,
        createdAt: true,
      },
    });

    return {
      available_book: countAvailableBooks,
      books,
    };
  }

  static async getOne(request) {
    const { loggedUserRole, bookId } = request;
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    const book = await this.checkBookMustExist(bookId);

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      code: book.code,
      stock: book.stock,
      isAvailable: book.isAvailable,
      createdAt: book.createdAt,
    };
  }

  static async create(request) {
    const { loggedUserRole, title, author, code, stock } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    if (!title || !author || !code || !stock) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Title, Author, Code, and Stock are required!");
    }

    const existedBookWithSameCode = await db.book.findFirst({
      where: {
        code,
      },
    });

    if (existedBookWithSameCode) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Code of Book already exists!");
    }

    const book = await db.book.create({
      data: {
        title,
        author,
        stock,
        code,
        isAvailable: stock > 0,
      },

      select: {
        id: true,
        title: true,
        author: true,
        code: true,
        stock: true,
        isAvailable: true,
        createdAt: true,
      },
    });

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      code: book.code,
      stock: book.stock,
      isAvailable: book.isAvailable,
      createdAt: book.createdAt,
    };
  }

  static async update(request) {
    const { loggedUserRole, bookId, title, isAvailable, author, code, stock } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedBook = await this.checkBookMustExist(bookId);

    if (code) {
      const existedBookWithSameCode = await db.book.findFirst({
        where: {
          code,
          NOT: {
            id: existedBook.id,
          },
        },
      });

      if (existedBookWithSameCode) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Code of Book already exists!");
      }
    }

    let updatedIsAvailable;
    if (!isAvailable) {
      updatedIsAvailable = stock > 0 ? true : existedBook.isAvailable;
    } else {
      updatedIsAvailable = typeof isAvailable === "boolean" ? isAvailable : existedBook.isAvailable;
    }

    const updatedBook = await db.book.update({
      where: {
        id: existedBook.id,
      },
      data: {
        title: title || existedBook.title,
        code: code || existedBook.code,
        author: author || existedBook.author,
        isAvailable: updatedIsAvailable,
      },
      select: {
        id: true,
        title: true,
        author: true,
        code: true,
        stock: true,
        isAvailable: true,
        createdAt: true,
      },
    });

    return {
      id: updatedBook.id,
      title: updatedBook.title,
      author: updatedBook.author,
      code: updatedBook.code,
      stock: updatedBook.stock,
      isAvailable: updatedBook.isAvailable,
      createdAt: updatedBook.createdAt,
    };
  }

  static async delete(request) {
    const { loggedUserRole, bookId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedBook = await this.checkBookMustExist(bookId);

    await db.book.delete({
      where: {
        id: existedBook.id,
      },
    });

    return true;
  }
}
