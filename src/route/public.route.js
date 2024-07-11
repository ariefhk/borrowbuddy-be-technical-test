import express from "express";
import { HelloController } from "../controller/hello.controller.js";
import { UserController } from "../controller/user.controller.js";
import { authPrefix, bookPrefix } from "./prefix.route.js";
import { BookController } from "../controller/book.controller.js";
import { rateLimiterMiddleware } from "../middleware/limiter.middleware.js";

const publicRouter = express.Router();

// HELLO ROUTE
publicRouter.get("/api", rateLimiterMiddleware, HelloController.sayHello);

// AUTH ROUTE
publicRouter.post(authPrefix + "/register", rateLimiterMiddleware, UserController.register);
publicRouter.post(authPrefix + "/login", rateLimiterMiddleware, UserController.login);

// BOOK ROUTE
publicRouter.get(bookPrefix + "/:bookId", rateLimiterMiddleware, BookController.getBookById);
publicRouter.get(bookPrefix, rateLimiterMiddleware, BookController.getAllBook);

export { publicRouter };
