import "dotenv/config";
import * as jose from "jose";
import { API_STATUS_CODE } from "./status-code.helper.js";
import { APIError } from "../error/api.error.js";

export const makeJwt = async (data, expired = "") => {
  const secretEncode = new TextEncoder().encode(process.env.JWT_SECRET_TOKEN);
  const alg = "HS256";
  let jwt;

  if (!expired) {
    jwt = await new jose.SignJWT(data).setProtectedHeader({ alg }).setIssuedAt().sign(secretEncode);
  } else {
    jwt = await new jose.SignJWT(data).setProtectedHeader({ alg }).setIssuedAt().setExpirationTime(expired).sign(secretEncode);
  }

  return jwt;
};

export const decodeJwt = async (jwt) => {
  try {
    if (jwt) {
      const secretEncode = new TextEncoder().encode(process.env.JWT_SECRET_TOKEN);
      const { payload } = await jose.jwtVerify(jwt, secretEncode);

      return payload;
    }
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      throw new APIError(API_STATUS_CODE.UNAUTHORIZED, "Unthorized Access Token!");
    }
    throw error;
  }
};
