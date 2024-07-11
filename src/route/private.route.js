import express from "express";
import { userPrefix, authPrefix, bookPrefix, borrowPrefix, penaltyPrefix } from "./prefix.route.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { UserController } from "../controller/user.controller.js";
import { BookController } from "../controller/book.controller.js";
import { BorrowController } from "../controller/borrow.controller.js";
import { PenaltyController } from "../controller/penalty.controller.js";

const privateRouter = express.Router();

// AUTH ROUTE
privateRouter.delete(authPrefix + "/logout", authMiddleware, UserController.logout);
privateRouter.get(authPrefix + "/me", authMiddleware, UserController.getCurrentUser);

// USER ROUTE
privateRouter.put(userPrefix + "/:userId/recover", authMiddleware, UserController.recoverUser);
privateRouter.get(userPrefix + "/:userId", authMiddleware, UserController.getUserById);
privateRouter.put(userPrefix + "/:userId", authMiddleware, UserController.update);
privateRouter.delete(userPrefix + "/:userId", authMiddleware, UserController.delete);
privateRouter.get(userPrefix, authMiddleware, UserController.getAll);

// BOOK ROUTE
privateRouter.put(bookPrefix + "/:bookId/recover", authMiddleware, BookController.recoverBook);
privateRouter.put(bookPrefix + "/:bookId", authMiddleware, BookController.updateBook);
privateRouter.delete(bookPrefix + "/:bookId", authMiddleware, BookController.deleteBook);
privateRouter.post(bookPrefix, authMiddleware, BookController.createBook);

// BORROW ROUTE
privateRouter.get(borrowPrefix + "/current", authMiddleware, BorrowController.getCurrentUserBorrow);
privateRouter.put(borrowPrefix + "/:borrowId/return", authMiddleware, BorrowController.returnBorrowBook);
privateRouter.delete(borrowPrefix + "/:borrowId", authMiddleware, BorrowController.deleteUserBorrow);
privateRouter.get(borrowPrefix + "/:userId", authMiddleware, BorrowController.getUserBorrowById);
privateRouter.get(borrowPrefix, authMiddleware, BorrowController.getAllBorrow);
privateRouter.post(borrowPrefix, authMiddleware, BorrowController.createBorrowBook);

// PENALTY ROUTE
privateRouter.get(penaltyPrefix + "/users/current", authMiddleware, PenaltyController.getPenaltyCurrentUser);
privateRouter.get(penaltyPrefix + "/users/:userId", authMiddleware, PenaltyController.getPenaltyByUserId);
privateRouter.put(penaltyPrefix + "/:penaltyId", authMiddleware, PenaltyController.updatePenalty);
privateRouter.delete(penaltyPrefix + "/:penaltyId", authMiddleware, PenaltyController.deletePenalty);
privateRouter.get(penaltyPrefix, authMiddleware, PenaltyController.getPenaltyList);

export { privateRouter };
