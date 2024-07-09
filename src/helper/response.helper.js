import { logger } from "../application/logging.js";

export class ResponseHelper {
  static toJson(message, data) {
    logger.info(message);
    if (!data) {
      return {
        message,
      };
    }
    return {
      message,
      data,
    };
  }

  static toJsonError(message, errors) {
    if (!errors) {
      return {
        message,
      };
    }
    return {
      message,
      errors,
    };
  }
}
