import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { PenaltyService } from "../service/penalty.service.js";

export class PenaltyController {
  static async getPenaltyList(req, res, next) {
    try {
      const getPenaltyListRequest = {
        loggedUserRole: req?.loggedUser?.role,
        username: req?.query?.username,
      };

      const result = await PenaltyService.getPenaltyList(getPenaltyListRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get all penalty users !", result));
    } catch (error) {
      next(error);
    }
  }

  static async getPenaltyByUserId(req, res, next) {
    try {
      const getPenaltyByUserIdRequest = {
        loggedUserRole: req?.loggedUser?.role,
        loggedUserId: req?.loggedUser?.id ? Number(req?.loggedUser?.id) : null,
        userId: req?.params?.userId ? Number(req?.params?.userId) : null,
      };

      const result = await PenaltyService.getPenaltyByUserId(getPenaltyByUserIdRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get penalty user !", result));
    } catch (error) {
      next(error);
    }
  }

  static async getPenaltyCurrentUser(req, res, next) {
    try {
      const getPenaltyCurrentUserRequest = {
        loggedUserRole: req?.loggedUser?.role,
        loggedUserId: req?.loggedUser?.id ? Number(req?.loggedUser?.id) : null,
        userId: req?.loggedUser?.id ? Number(req?.loggedUser?.id) : null,
      };

      const result = await PenaltyService.getPenaltyByUserId(getPenaltyCurrentUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get penalty current user !", result));
    } catch (error) {
      next(error);
    }
  }

  static async updatePenalty(req, res, next) {
    try {
      const updatePenaltyUserRequest = {
        loggedUserRole: req?.loggedUser?.role,
        penaltyId: req?.params?.penaltyId ? Number(req?.params?.penaltyId) : null,
        startDate: req?.body?.startDate,
        endDate: req?.body?.endDate,
      };
      const result = await PenaltyService.updatePenalty(updatePenaltyUserRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success update penalty !", result));
    } catch (error) {
      next(error);
    }
  }

  static async deletePenalty(req, res, next) {
    try {
      const deletePenaltyUserRequest = {
        loggedUserRole: req?.loggedUser?.role,
        penaltyId: req?.params?.penaltyId ? Number(req?.params?.penaltyId) : null,
      };
      await PenaltyService.deletePenalty(deletePenaltyUserRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete Penalty!"));
    } catch (error) {
      next(error);
    }
  }
}
