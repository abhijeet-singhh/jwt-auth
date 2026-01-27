import { sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/services/auth.service";
import { emailSchema } from "@/validators/auth.schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = emailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
        },
        { status: 400 },
      );
    }

    const result = await createPasswordResetToken(parsed.data.email);

    if (result) {
      await sendPasswordResetEmail(result.email, result.token);
    }

    return NextResponse.json(
      { message: "If the email exists, a reset link has been sent" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
