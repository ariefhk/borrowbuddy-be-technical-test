import { db } from "../db/connect.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole, checkAllowedRoleWithoutThrowError } from "../helper/check-role.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";

export class BookService {
  static async checkBookMustExist(bookId) {
    if (!bookId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Book ID is required");
    }

    const book = await db.book.findFirst({
      where: {
        id: bookId,
        deletedAt: null,
      },
    });

    if (!book) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Book Not Found!");
    }

    return book;
  }

  static async countAvailableBooks() {
    const countAvailableBooks = await db.book.count({
      where: {
        isAvailable: true,
        deletedAt: null,
      },
    });

    return countAvailableBooks;
  }

  static async getAllBook(request) {
    const { loggedUserRole, title } = request;
    const filter = {};
    const selectedData = { id: true, title: true, author: true, code: true, stock: true, isAvailable: true, createdAt: true };

    if (checkAllowedRoleWithoutThrowError(ROLE.IS_ADMIN, loggedUserRole)) {
      // if admin, show deleted status
      selectedData.deletedAt = true;
    } else {
      // if not admin, only show active book
      filter.deletedAt = null;
    }

    if (title) {
      filter.title = {
        contains: title,
        mode: "insensitive",
      };
    }

    const books = await db.book.findMany({
      orderBy: {
        title: "asc",
      },
      where: filter,
      select: selectedData,
    });

    return {
      available_book: await this.countAvailableBooks(),
      books,
    };
  }

  static async getBookById(request) {
    const { loggedUserRole, bookId } = request;
    let book;

    if (checkAllowedRoleWithoutThrowError(ROLE.IS_ADMIN, loggedUserRole)) {
      // if admin, show deleted status
      book = await db.book.findFirst({
        where: {
          id: bookId,
        },
        select: {
          id: true,
          title: true,
          author: true,
          code: true,
          stock: true,
          isAvailable: true,
          createdAt: true,
          deletedAt: true,
        },
      });
    } else {
      // if member or not logged in, only show active book
      book = await db.book.findFirst({
        where: {
          id: bookId,
          deletedAt: null,
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
    }

    if (!book) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Book Not Found!");
    }

    return book;
  }

  static async create(request) {
    const { loggedUserRole, title, author, code } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    if (!title || !author || !code) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Title, Author, and Code  are required!");
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
        stock: 1,
        code,
        isAvailable: true,
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

    return book;
  }

  static async update(request) {
    const { loggedUserRole, bookId, title, author, code } = request;
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

    const updatedBook = await db.book.update({
      where: {
        id: existedBook.id,
      },
      data: {
        title: title || existedBook.title,
        code: code || existedBook.code,
        author: author || existedBook.author,
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

    return updatedBook;
  }

  static async recover(request) {
    const { loggedUserRole, bookId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedDeletedBook = await db.book.findFirst({
      where: {
        id: bookId,
        deletedAt: {
          not: null,
        },
      },
    });

    if (!existedDeletedBook) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Book Not Found or already recover!");
    }

    const recoverBook = await db.book.update({
      where: {
        id: existedDeletedBook.id,
      },
      data: {
        deletedAt: null,
        isAvailable: true,
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

    return recoverBook;
  }

  static async delete(request) {
    const { loggedUserRole, bookId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedBook = await this.checkBookMustExist(bookId);

    const countBookBorrowed = await db.borrow.count({
      where: {
        returnDate: null,
        borrowBook: {
          every: {
            bookId: existedBook.id,
          },
        },
      },
    });

    if (countBookBorrowed > 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Book is still borrowed by member!");
    }

    await db.book.update({
      where: {
        id: existedBook.id,
      },
      data: {
        isAvailable: false,
        deletedAt: new Date(),
      },
    });

    return true;
  }
}
