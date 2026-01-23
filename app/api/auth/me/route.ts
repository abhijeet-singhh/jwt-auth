import { verifyAccessToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // read access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    // verify access token
    const payload = verifyAccessToken(accessToken);

    // fetch usesr
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      NextResponse.json(
        {
          message: "User not found",
        },
        { status: 404 },
      );
    }

    // return user
    return NextResponse.json(
      {
        user,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("ME ROUTE ERROR:", error);

    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }
}
