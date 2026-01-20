import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthJwtPayload } from "@/types/auth";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

// ----------------------
// Sign tokens
// ----------------------

export const signAccessToken = (payload: AuthJwtPayload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });

export const signRefreshToken = (payload: AuthJwtPayload) =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });

// ----------------------
// Verify tokens
// ----------------------

export const verifyAccessToken = (token: string): AuthJwtPayload => {
  const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload;

  if (!decoded || typeof decoded !== "object" || !decoded.userId) {
    throw new Error("Invalid access token");
  }

  return { userId: decoded.userId as string };
};

export const verifyRefreshToken = (token: string): AuthJwtPayload => {
  const decoded = jwt.verify(token, REFRESH_SECRET) as JwtPayload;

  if (!decoded || typeof decoded !== "object" || !decoded.userId) {
    throw new Error("Invalid refresh token");
  }

  return { userId: decoded.userId as string };
};
