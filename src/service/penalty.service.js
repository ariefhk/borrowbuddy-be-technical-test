import { db } from "../db/connect.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole, checkAllowedRoleWithoutThrowError } from "../helper/check-role.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { UserService } from "./user.service.js";

export class PenaltyService {
  static async checkPenaltyMustExist(penaltyId) {
    if (!penaltyId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Penalty id is required");
    }

    const existedPenalty = await db.penalty.findUnique({
      where: {
        id: penaltyId,
      },
    });

    if (!existedPenalty) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Penalty not found");
    }

    return existedPenalty;
  }

  static async getPenaltyList(request) {
    const { loggedUserRole, username } = request;
    const filter = {};
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    if (username) {
      filter.user = {
        name: {
          contains: username,
          mode: "insensitive",
        },
      };
    }

    const penaltyList = await db.penalty.findMany({
      where: filter,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        user: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
          },
        },
      },
    });

    return penaltyList;
  }

  static async getPenaltyByUserId(request) {
    const { loggedUserRole, loggedUserId, userId } = request;

    const existedUser = await UserService.checkUserMustExist(userId);

    if (ROLE.IS_MEMBER.includes(loggedUserRole) && loggedUserId !== existedUser.id) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You are not allowed to view this user's penalty");
    }

    const penaltyList = await db.penalty.findMany({
      where: {
        user: {
          id: existedUser.id,
        },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        user: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
          },
        },
      },
    });

    return penaltyList;
  }

  static async updatePenalty(request) {
    const { loggedUserRole, penaltyId, startDate, endDate } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedPenalty = await this.checkPenaltyMustExist(penaltyId);

    if (startDate && endDate) {
      // Check start date must be less than end date
      if (new Date(startDate) > new Date(endDate)) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Start date must be less than end date");
      }
    } else if (startDate && !endDate) {
      // Check start date must be greater or same than the old start date
      if (new Date(startDate) <= new Date(existedPenalty.startDate)) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Start date must be greater than the old start date");
      }
      // Check start date must be less than end date
      if (new Date(startDate) > new Date(existedPenalty.endDate)) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Start date must be less than end date");
      }
    } else if (!startDate && endDate) {
      // Check end date must be less than the old start date
      if (new Date(endDate) < new Date(existedPenalty.startDate)) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "End date must be greater than startDate");
      }
    }

    const updatedPenalty = await db.penalty.update({
      where: {
        id: existedPenalty.id,
      },
      data: {
        startDate: startDate ? new Date(startDate) : existedPenalty.startDate,
        endDate: endDate ? new Date(endDate) : existedPenalty.endDate,
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        user: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
          },
        },
        createdAt: true,
      },
    });

    return updatedPenalty;
  }

  static async deletePenalty(request) {
    const { loggedUserRole, penaltyId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedPenalty = await this.checkPenaltyMustExist(penaltyId);

    await db.penalty.delete({
      where: {
        id: existedPenalty.id,
      },
    });

    return true;
  }
}
