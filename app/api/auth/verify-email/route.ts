import { verifyEmailToken } from "@/services/auth.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          message: "Token missing",
        },
        { status: 400 },
      );
    }

    await verifyEmailToken(token);

    return NextResponse.json(
      {
        message: "Email verified successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || "Invalid token",
      },
      { status: 400 },
    );
  }
}
