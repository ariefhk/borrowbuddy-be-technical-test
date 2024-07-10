import express from "express";
import { userPrefix, authPrefix, bookPrefix, borrowPrefix } from "./prefix.route.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { UserController } from "../controller/user.controller.js";
import { BookController } from "../controller/book.controller.js";
import { BorrowController } from "../controller/borrow.controller.js";

const privateRouter = express.Router();

// AUTH ROUTE
privateRouter.get(authPrefix + "/logout", authMiddleware, UserController.logout);

// USER ROUTE
privateRouter.get(userPrefix + "/current", authMiddleware, UserController.getCurrentUser);
privateRouter.get(userPrefix + "/:userId", authMiddleware, UserController.getUserById);
privateRouter.put(userPrefix + "/:userId/recover", authMiddleware, UserController.recoverUser);
privateRouter.put(userPrefix + "/:userId", authMiddleware, UserController.update);
privateRouter.delete(userPrefix + "/:userId", authMiddleware, UserController.delete);
privateRouter.get(userPrefix, authMiddleware, UserController.getAll);

// BOOK ROUTE
privateRouter.get(bookPrefix + "/:bookId", authMiddleware, BookController.getBookById);
privateRouter.put(bookPrefix + "/:bookId/recover", authMiddleware, BookController.recoverBook);
privateRouter.put(bookPrefix + "/:bookId", authMiddleware, BookController.updateBook);
privateRouter.delete(bookPrefix + "/:bookId", authMiddleware, BookController.deleteBook);
privateRouter.get(bookPrefix, authMiddleware, BookController.getAllBook);
privateRouter.post(bookPrefix, authMiddleware, BookController.createBook);

// BORROW ROUTE
privateRouter.get(borrowPrefix + "/current", authMiddleware, BorrowController.getCurrentUserBorrow);
privateRouter.put(borrowPrefix + "/:borrowId/return", authMiddleware, BorrowController.returnBorrowBook);
privateRouter.delete(borrowPrefix + "/:borrowId", authMiddleware, BorrowController.deleteUserBorrow);
privateRouter.get(borrowPrefix + "/:userId", authMiddleware, BorrowController.getUserBorrowById);
privateRouter.get(borrowPrefix, authMiddleware, BorrowController.getAllBorrow);
privateRouter.post(borrowPrefix, authMiddleware, BorrowController.createBorrowBook);

export { privateRouter };
