import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/db/prisma";
import { env } from "@/config/env";
import { AppError } from "@/middleware/errorHandler";

const SALT_ROUNDS = 10;

interface AuthResult {
  token: string;
  user: { id: string; email: string; name: string };
}

export async function signup(email: string, password: string, name: string): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  const token = signToken(user.id);
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken(user.id);
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

function signToken(userId: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as any);
}
