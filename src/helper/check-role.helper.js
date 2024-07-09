import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "./status-code.helper.js";

export const ROLE = {
  IS_ADMIN: ["ADMIN"],
  IS_ALL_ROLE: ["ADMIN", "CUSTOMER"],
};

export const checkAllowedRole = (roles, role) => {
  if (!role) {
    throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont insert the role!");
  }

  if (!roles) {
    throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont insert roles to lookup!");
  }

  const isAllowed = roles.includes(role);

  if (!isAllowed) {
    throw new APIError(API_STATUS_CODE.FORBIDDEN, "Unauthorized, Forbidden Access!");
  }

  return true;
};
