import { clearAuthCookies } from "@/lib/cookies";
import { logoutUser } from "@/services/auth.service";
import { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // read refresh token from cookies
    const cookieStore = cookies() as unknown as ResponseCookies;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    // revoke refresh token in db if exists
    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    // clear cookies
    clearAuthCookies();

    // return response
    return NextResponse.json(
      {
        message: "Logged out successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("LOGOUT ERROR:", error);

    // even on error clear cookies to force logout
    clearAuthCookies();

    return NextResponse.json(
      {
        message: "Logged out",
      },
      { status: 200 },
    );
  }
}
