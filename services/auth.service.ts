import { sendVerificationEmail } from "@/lib/email";
import { hashPassword, hashToken, verifyPassword } from "@/lib/hash";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import crypto from "crypto";

// --------------
// Types
// --------------

interface RegisterUserInputProps {
  username: string;
  email: string;
  password: string;
}

interface LoginUserInputProps {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// --------------
// Register User
// --------------

export async function registerUser(input: RegisterUserInputProps) {
  const { username, email, password } = input;
  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  // redundant check, can be removed to reduce latency (already handled below - P2002)
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  try {
    // Create User
    const user = await prisma.user.create({
      data: {
        username,
        email: normalizedEmail,
        passwordHash: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    // create verification email
    const verificationToken = await createEmailVerificationToken(user.id);

    // send verification email
    await sendVerificationEmail(user.email, verificationToken);

    return user;
  } catch (error) {
    // Catch Prisma unique constraint errors for concurrency safety
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        throw new Error("User with this email already exists");
    }
  }
  throw new Error("Failed to register user");
}

// --------------
// Login User
// --------------

export async function loginUser(
  input: LoginUserInputProps,
): Promise<AuthTokens> {
  const { email, password } = input;

  // Find User
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error("INVALID_CREDENTIALS");

  if (!user.isEmailVerified) throw new Error("EMAIL_NOT_VERIFIED");

  // Compare password
  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) throw new Error("INVALID_CREDENTIALS");

  // Issue tokens
  const accessToken = signAccessToken({
    userId: user.id,
  });

  const refreshToken = signRefreshToken({
    userId: user.id,
  });

  // Store hashed refresh token
  const hashedRefreshToken = hashToken(refreshToken);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.create({
      data: {
        tokenHash: hashedRefreshToken,
        userId: user.id,
        expiresAt,
      },
    });
  });

  return {
    accessToken,
    refreshToken,
  };
}

// --------------
// Refresh Session
// --------------

export async function refreshSession(
  refreshToken: string,
): Promise<AuthTokens> {
  //Verify refresh token JWT
  const payload = verifyRefreshToken(refreshToken);

  // Hash incoming token
  const hashedToken = hashToken(refreshToken);

  // Find stored refresh token
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashedToken },
  });

  if (!storedToken) throw new Error("Invalid refresh token");

  // Rotate tokens (delete old)
  await prisma.refreshToken.delete({
    where: { tokenHash: hashedToken },
  });

  // Issue new token
  const newAccessToken = signAccessToken({
    userId: payload.userId,
  });

  const newRefreshToken = signRefreshToken({
    userId: payload.userId,
  });

  // Store new refresh token
  const newHashedToken = hashToken(newRefreshToken);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash: newHashedToken,
      userId: payload.userId,
      expiresAt,
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

// --------------
// Logout User
// --------------

export async function logoutUser(refreshToken: string): Promise<void> {
  const hashedToken = hashToken(refreshToken);

  await prisma.refreshToken.deleteMany({
    where: { tokenHash: hashedToken },
  });
}

// --------------------
// Email Verification
// --------------------

export async function createEmailVerificationToken(userId: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

  await prisma.emailVerificationToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return rawToken;
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record) throw new Error("Invalid verification token");
  if (record.expiresAt < new Date())
    throw new Error("Verification token expired");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { isEmailVerified: true },
    }),

    prisma.emailVerificationToken.delete({
      where: { tokenHash },
    }),
  ]);
}
