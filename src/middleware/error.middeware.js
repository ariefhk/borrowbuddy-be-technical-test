import { Prisma } from "@prisma/client";
import { APIError } from "../error/api.error.js";
import { logger } from "../application/logging.js";
import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";

export const errorMiddleware = async (error, req, res, next) => {
  if (error instanceof APIError) {
    logger.error(`ERROR_STATUS: ${error.status}, API_ERROR: ${error.message}`);
    return res.status(error.status).json(ResponseHelper.toJsonError(error.message)).end();
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(`ERROR_STATUS: 500, PRISMA_CLIENT_KNOWN_ERROR: ${error.message}`);
    return res.status(API_STATUS_CODE.SERVER_ERROR).json(ResponseHelper.toJsonError(error.message)).end();
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    logger.error(`ERROR_STATUS: 500, PRISMA_CLIENT_UNKNOWN_ERROR: ${error.message}`);
    return res.status(API_STATUS_CODE.SERVER_ERROR).json(ResponseHelper.toJsonError(error.message)).end();
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    logger.error(`ERROR_STATUS: 500, PRISMA_INITIALIZATION_ERROR: ${error.message}`);
    return res.status(API_STATUS_CODE.SERVER_ERROR).json(ResponseHelper.toJsonError(error.message)).end();
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    logger.error(`ERROR_STATUS: 500, PRISMA_VALIDATION_ERROR: ${error.message}`);
    return res.status(API_STATUS_CODE.SERVER_ERROR).json(ResponseHelper.toJsonError(error.message)).end();
  } else if (error instanceof Error) {
    logger.error(`ERROR_STATUS: 500, SERVER_ERROR: ${error.message}`);
    return res.status(API_STATUS_CODE.SERVER_ERROR).json(ResponseHelper.toJsonError(error.message)).end();
  }
};
