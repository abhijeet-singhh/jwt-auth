import { setAuthCookies } from "@/lib/cookies";
import prisma from "@/lib/prisma";
import { loginUser } from "@/services/auth.service";
import { loginSchema } from "@/validators/auth.schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // validate input
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    // call auth service
    const { accessToken, refreshToken } = await loginUser({
      email,
      password,
    });

    // set cookies
    await setAuthCookies({
      accessToken,
      refreshToken,
    });

    return NextResponse.json(
      {
        message: "Login successfull",
      },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.message === "Invalid email or password") {
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: 401 },
      );
    }
    console.error("LOGIN ERROR:", error);

    // generic fallback
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
