import { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

interface SetAuthCookiesProps {
  accessToken: string;
  refreshToken: string;
}

const isProduction = process.env.NODE_ENV === "production";

export function setAuthCookies({
  accessToken,
  refreshToken,
}: SetAuthCookiesProps) {
  const cookieStore = cookies() as unknown as ResponseCookies;

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 minutes
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearAuthCookies() {
  const cookieStore = cookies() as unknown as ResponseCookies;

  cookieStore.set("access_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  cookieStore.set("refresh_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
