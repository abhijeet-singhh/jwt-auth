export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;

  console.log(`Send verification email to ${email}: ${verifyUrl}`);

  //TODO: integrate real email service
}
