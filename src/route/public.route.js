import express from "express";
import { HelloController } from "../controller/hello.controller.js";
import { UserController } from "../controller/user.controller.js";
import { authPrefix, bookPrefix } from "./prefix.route.js";
import { BookController } from "../controller/book.controller.js";
import { rateLimiterMiddleware } from "../middleware/limiter.middleware.js";
import swaggerUiExpress from "swagger-ui-express";
import fs from "fs";
import path from "path";

// Path to openapi.json file
const openapiPath = path.resolve("docs", "openapi.json");
const openapiSpec = JSON.parse(fs.readFileSync(openapiPath, "utf8"));

const publicRouter = express.Router();

// HELLO ROUTE
publicRouter.get("/api", rateLimiterMiddleware, HelloController.sayHello);

// DOCS ROUTE
publicRouter.use("/api/docs", swaggerUiExpress.serve, swaggerUiExpress.setup(openapiSpec));

// AUTH ROUTE
publicRouter.post(authPrefix + "/register", rateLimiterMiddleware, UserController.register);
publicRouter.post(authPrefix + "/login", rateLimiterMiddleware, UserController.login);

// BOOK ROUTE
publicRouter.get(bookPrefix + "/:bookId", rateLimiterMiddleware, BookController.getBookById);
publicRouter.get(bookPrefix, rateLimiterMiddleware, BookController.getAllBook);

export { publicRouter };
