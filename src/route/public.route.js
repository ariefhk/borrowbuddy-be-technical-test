import express from "express";
import { HelloController } from "../controller/hello.controller.js";

const publicRouter = express.Router();

// HELLO ROUTE
publicRouter.get("/", HelloController.sayHello);

export { publicRouter };
