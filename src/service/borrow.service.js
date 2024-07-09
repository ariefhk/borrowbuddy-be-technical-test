import { db } from "../db/connect.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/check-role.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { UserService } from "./user.service.js";

export class BorrowService {
  static async checkBorrowMustExist(borrowId) {
    if (!borrowId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Borrow ID is required");
    }

    const borrow = await db.borrow.findUnique({
      where: {
        id: borrowId,
      },
    });

    if (!borrow) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Borrow Not Found!");
    }

    return borrow;
  }

  // static async getAll(request) {
  //   const { loggedUserRole, userId } = request;
  //   const filter = {};
  //   checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

  //   if (userId) {
  //     filter.userId = userId;
  //   }

  //   const borrows = await db.borrow.findMany({
  //     orderBy: {
  //       id: "asc",
  //     },
  //     where: filter,
  //     include: {
  //       borrowBook: {
  //         include: {
  //           book: true,
  //         },
  //       },
  //       user: true,
  //     },
  //     select: {
  //       id: true,
  //       borrowDate: true,
  //       returnDate: true,
  //       quantity: true,
  //       penaltyApplied: true,
  //       createdAt: true,
  //     },
  //   });

  //   return borrows.map((borrow) => {
  //     return {
  //       id: borrow.id,
  //       borrowDate: borrow.borrowDate,
  //       returnDate: borrow.returnDate,
  //       penaltyApplied: borrow.penaltyApplied,
  //       createdAt: borrow.createdAt,
  //       user: {
  //         id: borrow.user.id,
  //         code: borrow.user.code,
  //         name: borrow.user.name,
  //       },
  //       borrowedBook: borrow.borrowBook.map((borrowedBood) => {
  //         return {
  //           id: borrowedBood.book.id,
  //           code: borrowedBood.book.code,
  //           title: borrowedBood.book.title,
  //           author: borrowedBood.book.author,
  //         };
  //       }),
  //     };
  //   });
  // }

  static async createBorrow(request) {
    const { loggedUserRole, userId, requestBorrowBook, borrowDate } = request;
    checkAllowedRole(ROLE.IS_MEMBER, loggedUserRole);

    // Check if order date and return date is empty
    if (!borrowDate) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Borrow date is required!");
    }

    // Check if user is existed
    const existedUser = await UserService.checkUserMustExist(userId);

    const existedUserPenalty = await db.penalty.findMany({
      where: {
        userId: existedUser.id,
        endDate: {
          gte: new Date(),
        },
      },
    });

    // Check if user still have penalty
    if (existedUserPenalty?.length > 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User still have penalty, cant rent a book!");
    }

    // Check if user still have borrowed book
    const countExistedBorrowedBook = await db.borrow.count({
      where: {
        userId: existedUser.id,
        returnDate: null,
      },
    });

    // Check if user borrow more than 2 books
    if (countExistedBorrowedBook > 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User still have borrowed book, cant rent a book!");
    }

    // Check if user borrow not empty
    if (!requestBorrowBook || requestBorrowBook?.length === 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Books must not empty to borrow!");
    }

    const borrowedBookIds = requestBorrowBook.map((book) => book.bookId);

    // Check if user borrow more than 2 books
    if (borrowedBookIds.length > 2) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Books must not more than 2!");
    }

    const existedBooks = await db.book.findMany({
      where: {
        stock: {
          gt: 0,
        },
        id: {
          in: borrowedBookIds,
        },
      },
    });

    // Check if book is existed
    if (!existedBooks || existedBooks.length === 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Books not found or out of stock!");
    }

    // count stock for each book if stock is insufficient
    const insufficientBookStock = existedBooks.filter((book) => {
      const borrowedBook = requestBorrowBook.find((b) => b?.bookId === book.id);

      return book.stock < Number(borrowedBook.quantity);
    });

    // Check if book stock is insufficient
    if (insufficientBookStock.length > 0) {
      const insufficientBookStockDetails = insufficientBookStock.map((book) => ({
        id: book.id,
        title: book.title,
      }));
      const insufficientBookStockMessage = insufficientBookStockDetails.map((p) => `${p.title} (ID: ${p.id})`).join(", ");
      throw new APIError(
        API_STATUS_CODE.BAD_REQUEST,
        `Insufficient stock for request borrowed book: ${insufficientBookStockMessage}`
      );
    }

    // Create borrow book process
    const createBorrowBookProcess = await db.$transaction(async (prismaTrans) => {
      try {
        const createBorrow = await prismaTrans.borrow.create({
          data: {
            userId: existedUser.id,
            borrowDate: new Date(borrowDate),
            borrowBook: {
              create: requestBorrowBook.map((book) => {
                return {
                  bookId: book.bookId,
                  quantity: book.quantity,
                };
              }),
            },
          },
          select: {
            id: true,
            borrowDate: true,
            user: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            borrowBook: {
              select: {
                book: {
                  select: {
                    id: true,
                    code: true,
                    title: true,
                  },
                },
              },
            },
          },
        });

        for (const book of existedBooks) {
          // Check if book is available
          const borrowedBook = requestBorrowBook.find((p) => p?.bookId === book.id);

          // Check if book is available
          const quantity = Number(borrowedBook.quantity);

          await prismaTrans.book.update({
            where: {
              id: book.id,
            },
            data: {
              isAvailable: book.stock - quantity > 0,
              stock: {
                decrement: quantity,
              },
            },
          });
        }
        return createBorrow;
      } catch (error) {
        console.error("Error inside transaction create borrow:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed create borrow!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return createBorrowBookProcess.map((borrow) => {
      return {
        id: borrow.id,
        borrowDate: borrow.borrowDate,
        user: {
          id: borrow.user.id,
          code: borrow.user.code,
          name: borrow.user.name,
        },
        borrowedBook: borrow.borrowBook.map((borrowedBood) => {
          return {
            id: borrowedBood.book.id,
            code: borrowedBood.book.code,
            title: borrowedBood.book.title,
          };
        }),
      };
    });
  }

  static async returnBorrow(request) {
    const { loggedUserRole, borrowId, returnDate } = request;
    checkAllowedRole(ROLE.IS_MEMBER, loggedUserRole);

    const existedBorrow = await db.borrow.findFirst({
      where: {
        id: borrowId,
        returnDate: null,
      },
      include: {
        borrowBook: {
          select: {
            bookId: true,
            quantity: true,
          },
        },
      },
    });

    if (!existedBorrow) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Borrow book record Not Found or already returned!");
    }

    const returnBorrowBookProcess = await db.$transaction(async (prismaTrans) => {
      try {
        // Check if borrow date is more than 7 days
        const diffTime = Math.abs(new Date() - new Date(existedBorrow.borrowDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
          // Create penalty for user for 3 days
          const penaltyEndDate = new Date();
          penaltyEndDate.setDate(penaltyEndDate.getDate() + 3);

          await prismaTrans.penalty.create({
            data: {
              userId: existedBorrow.userId,
              endDate: penaltyEndDate,
            },
          });
        }

        // Update borrow book process
        const returnBorrow = await prismaTrans.borrow.update({
          where: {
            id: existedBorrow.id,
          },
          data: {
            penaltyApplied: diffDays > 7,
            returnDate: new Date(returnDate),
          },
          select: {
            id: true,
            borrowDate: true,
            returnDate: true,
            penaltyApplied: true,
            user: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            borrowBook: {
              select: {
                book: {
                  select: {
                    id: true,
                    code: true,
                    title: true,
                  },
                },
              },
            },
          },
        });

        for (const borrowedBook of existedBorrow.borrowBook) {
          await prismaTrans.book.update({
            where: {
              id: borrowedBook.bookId,
            },
            data: {
              stock: {
                increment: borrowedBook.quantity,
              },
            },
          });
        }

        return returnBorrow;
      } catch (error) {
        console.error("Error inside transaction return borrow:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed return borrow!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return {
      id: returnBorrowBookProcess.id,
      borrowDate: returnBorrowBookProcess.borrowDate,
      returnDate: returnBorrowBookProcess.returnDate,
      penaltyApplied: returnBorrowBookProcess.penaltyApplied,
      user: {
        id: returnBorrowBookProcess.user.id,
        code: returnBorrowBookProcess.user.code,
        name: returnBorrowBookProcess.user.name,
      },
      borrowedBook: returnBorrowBookProcess.borrowBook.map((borrowedBood) => {
        return {
          id: borrowedBood.book.id,
          code: borrowedBood.book.code,
          title: borrowedBood.book.title,
        };
      }),
    };
  }
}
