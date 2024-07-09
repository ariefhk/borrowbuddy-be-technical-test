import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";

export class HelloController {
  static async sayHello(req, res, next) {
    try {
      res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Hello from API!"));
    } catch (error) {
      next(error);
    }
  }
}
