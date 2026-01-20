import { NextResponse } from "next/server";

interface SetAuthCookiesProps {
  accessToken: string;
  refreshToken: string;
}

const isProduction = process.env.NODE_ENV === "production";

export function setAuthCookies({
  accessToken,
  refreshToken,
}: SetAuthCookiesProps) {
  const response = NextResponse.next();

  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 minutes
  });

  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}

export function clearAuthCookies() {
  const response = NextResponse.next();

  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
