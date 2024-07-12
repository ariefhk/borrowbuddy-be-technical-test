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

  static async validateBorrowBook(request) {
    const { userId, books } = request;

    // Check if userId and books is empty
    if (!userId || !Array.isArray(books) || books.length === 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Invalid request format. userId and request books array are required.");
    }

    if (books.length > 2) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User can only borrow maximum 2 books!");
    }

    // Check if user is existed
    const existedUser = await UserService.checkUserMustExist(userId);

    // Check if user still have penalty
    const existedUserPenalty = await db.penalty.findMany({
      where: {
        userId: existedUser.id,
        endDate: {
          gte: new Date(),
        },
      },
    });

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

    // check of request borrow book contain bookId
    for (const book of books) {
      if (!book.bookId) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Each book entry must contain a bookId.");
      }
    }

    // check if other user borrow the book
    for (const book of books) {
      const bookId = book.bookId;

      const activeBorrow = await db.borrow.findFirst({
        where: {
          returnDate: null,
          borrowBook: {
            every: {
              book: {
                id: bookId,
                deletedAt: null,
              },
            },
          },
        },
        include: {
          borrowBook: {
            include: {
              book: true,
            },
          },
        },
      });

      if (activeBorrow) {
        throw new APIError(
          API_STATUS_CODE.BAD_REQUEST,
          `Book ${activeBorrow.borrowBook.find((b) => b.id === bookId)?.book?.title} is already borrowed by other user.`
        );
      }
    }

    return {
      userId: existedUser.id,
      books,
    };
  }

  static async getUserBorrowById(request) {
    const { loggedUserRole, userId, isAdmin = false } = request;

    if (isAdmin) {
      checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);
    } else {
      checkAllowedRole(ROLE.IS_MEMBER, loggedUserRole);
    }

    const existedUser = await UserService.checkUserMustExist(userId);

    const borrows = await db.borrow.findMany({
      orderBy: {
        id: "asc",
      },
      where: {
        userId: existedUser.id,
      },
      select: {
        id: true,
        borrowDate: true,
        returnDate: true,
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
                author: true,
              },
            },
          },
        },
        penaltyApplied: true,
        createdAt: true,
      },
    });

    return borrows.map((borrow) => {
      return {
        id: borrow.id,
        borrowDate: borrow.borrowDate,
        returnDate: borrow.returnDate,
        penaltyApplied: borrow.penaltyApplied,

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
            author: borrowedBood.book.author,
          };
        }),
        createdAt: borrow.createdAt,
      };
    });
  }

  static async getAll(request) {
    const { loggedUserRole } = request;
    const filter = {};
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const borrows = await db.borrow.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        borrowDate: true,
        returnDate: true,
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
                author: true,
              },
            },
          },
        },
        penaltyApplied: true,
        createdAt: true,
      },
    });

    return borrows.map((borrow) => {
      return {
        id: borrow.id,
        borrowDate: borrow.borrowDate,
        returnDate: borrow.returnDate,
        penaltyApplied: borrow.penaltyApplied,

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
            author: borrowedBood.book.author,
          };
        }),
        createdAt: borrow.createdAt,
      };
    });
  }

  static async createBorrow(request) {
    const { loggedUserRole, userId, requestBorrowBook, borrowDate } = request;
    checkAllowedRole(ROLE.IS_MEMBER, loggedUserRole);

    if (!borrowDate) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Borrow date is required!");
    }

    const { userId: existedUserId, books: existedRequestBorrowBook } = await this.validateBorrowBook({
      userId,
      books: requestBorrowBook,
    });

    // Create borrow book process
    const createBorrowBookProcess = await db.$transaction(async (prismaTrans) => {
      try {
        const createBorrow = await prismaTrans.borrow.create({
          data: {
            userId: existedUserId,
            borrowDate: new Date(borrowDate),
            borrowBook: {
              create: existedRequestBorrowBook.map((book) => {
                return {
                  bookId: book.bookId,
                  quantity: 1,
                };
              }),
            },
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
            createdAt: true,
          },
        });

        for (const book of existedRequestBorrowBook) {
          await prismaTrans.book.update({
            where: {
              id: book.bookId,
            },
            data: {
              isAvailable: false,
              stock: {
                decrement: 1,
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

    return {
      id: createBorrowBookProcess.id,
      borrowDate: createBorrowBookProcess.borrowDate,
      returnDate: createBorrowBookProcess.returnDate,
      user: {
        id: createBorrowBookProcess.user.id,
        code: createBorrowBookProcess.user.code,
        name: createBorrowBookProcess.user.name,
      },
      borrowedBook: createBorrowBookProcess.borrowBook.map((borrowedBood) => {
        return {
          id: borrowedBood.book.id,
          code: borrowedBood.book.code,
          title: borrowedBood.book.title,
        };
      }),
      createdAt: createBorrowBookProcess.createdAt,
    };
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
        const diffTime = Math.abs(new Date(returnDate) - new Date(existedBorrow.borrowDate));
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
            createdAt: true,
          },
        });

        // Return stock for each book
        for (const borrowedBook of existedBorrow.borrowBook) {
          await prismaTrans.book.update({
            where: {
              id: borrowedBook.bookId,
            },
            data: {
              isAvailable: true,
              stock: {
                increment: 1,
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

  static async deleteBorrow(request) {
    const { loggedUserRole, borrowId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedBorrow = await db.borrow.findFirst({
      where: {
        id: borrowId,
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

    await db.$transaction(async (prismaTrans) => {
      try {
        // Return stock for each book if borrow book not returned
        if (!existedBorrow.returnDate) {
          for (const borrowedBook of existedBorrow.borrowBook) {
            await prismaTrans.book.update({
              where: {
                id: borrowedBook.bookId,
              },
              data: {
                isAvailable: true,
                stock: {
                  increment: 1,
                },
              },
            });
          }
        }

        // Delete borrow book process
        await prismaTrans.borrowBook.deleteMany({
          where: {
            borrowId: existedBorrow.id,
          },
        });

        // Update borrow book process
        const deleteBorrow = await prismaTrans.borrow.delete({
          where: {
            id: existedBorrow.id,
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

        return deleteBorrow;
      } catch (error) {
        console.error("Error inside transaction delete borrow:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed delete borrow!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return true;
  }
}
