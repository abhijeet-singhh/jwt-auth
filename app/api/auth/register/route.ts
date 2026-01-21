import { registerUser } from "@/services/auth.service";
import { registerSchema } from "@/validators/auth.schema";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const user = await registerUser(parsed.data);

    return NextResponse.json(
      {
        message: "User registered successfully",
        user,
      },
      { status: 201 },
    );
  } catch (error: any) {
    if (error.message === "User with this email already exists") {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.log("REGISTER ERROR:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
