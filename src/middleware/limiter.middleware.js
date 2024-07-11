import { rateLimit } from "express-rate-limit";
import { ResponseHelper } from "../helper/response.helper.js";

export const rateLimiterMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers,
  handler: (req, res, next, options) => res.status(options.statusCode).json(ResponseHelper.toJsonError("Too many Request!")),
});
