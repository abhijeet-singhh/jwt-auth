import { clearAuthCookies, setAuthCookies } from "@/lib/cookies";
import { refreshSession } from "@/services/auth.service";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // read refresh token from cookies
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          message: "Refresh token missing",
        },
        { status: 401 },
      );
    }

    // refresh session (rotate tokens)
    const { accessToken, refreshToken: newRefreshToken } =
      await refreshSession(refreshToken);

    // set new cookies
    await setAuthCookies({
      accessToken,
      refreshToken: newRefreshToken,
    });

    // return response
    return NextResponse.json(
      {
        message: "Session refreshed",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("REFRESH ERROR:", error);

    // on any refresh failure -> force logout
    await clearAuthCookies();

    return NextResponse.json(
      {
        message: "Invalid or expired refresh token",
      },
      { status: 401 },
    );
  }
}
