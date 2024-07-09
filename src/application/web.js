import cors from "cors";
import express from "express";
import { ErrorController } from "../controller/error.controller.js";
import { privateRouter } from "../route/private.route.js";
import { publicRouter } from "../route/public.route.js";
import { errorMiddleware } from "../middleware/error.middeware.js";

export const web = express();

web.use(cors());
web.use(express.urlencoded({ extended: true }));
web.use(express.json());
web.use(publicRouter);
web.use(privateRouter);
web.get("*", ErrorController.routeNotFound);
web.use(errorMiddleware);
