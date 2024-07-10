import express from "express";
import { HelloController } from "../controller/hello.controller.js";
import { authPrefix } from "./prefix.route.js";
import { UserController } from "../controller/user.controller.js";

const publicRouter = express.Router();

// HELLO ROUTE
publicRouter.get("/api", HelloController.sayHello);

// AUTH ROUTE
publicRouter.post(authPrefix + "/register", UserController.register);
publicRouter.post(authPrefix + "/login", UserController.login);

export { publicRouter };
