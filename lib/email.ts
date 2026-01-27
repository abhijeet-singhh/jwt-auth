export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;

  console.log(`Send verification email to ${email}: ${verifyUrl}`);

  //TODO: integrate real email service
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.APP_URL}/api/auth/reset-password?token=${token}`;

  console.log(`Send password reset email to ${email}: ${resetUrl}`);

  //TODO: integrate real email service
}
