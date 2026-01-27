import { resetPassword } from "@/services/auth.service";
import { resetPasswordSchema } from "@/validators/auth.schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    await resetPassword(parsed.data.token, parsed.data.password);

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Invalid token" },
      { status: 400 },
    );
  }
}
