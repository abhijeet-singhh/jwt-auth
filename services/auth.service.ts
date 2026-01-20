// --------------
// Types
// --------------

import { hashPassword, hashToken, verifyPassword } from "@/lib/hash";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/jwt";
import prisma from "@/lib/prisma";

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

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create User
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });

  return user;
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

  if (!user) throw new Error("Invalid email or password");

  // Compare password
  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) throw new Error("Invalid email or password");

  // Issue tokens
  const accessToken = signAccessToken({
    userId: user.id,
  });

  const refreshToken = signRefreshToken({
    userId: user.id,
  });

  // Store hashed refresh token
  const hashedRefreshToken = hashToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashedRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
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

  await prisma.refreshToken.create({
    data: {
      tokenHash: newHashedToken,
      userId: payload.userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
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
