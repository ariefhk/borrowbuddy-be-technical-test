import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";

export class ErrorController {
  static routeNotFound(req, res, next) {
    try {
      return res.status(API_STATUS_CODE.NOT_FOUND).json(ResponseHelper.toJsonError("Route tidak ditemukan!"));
    } catch (error) {
      next(error);
    }
  }
}
