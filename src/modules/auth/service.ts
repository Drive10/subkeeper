import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../shared/utils/database';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';
import { ValidationError, UnauthorizedError, NotFoundError, ConflictError } from '../../shared/errors';
import { hashPassword, comparePasswords, validateEmail } from './utils/password';
import type { RegisterInput, LoginInput } from './validations';

interface TokenPayload {
  userId: string;
  email: string;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
}

function generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string } {
  const accessOptions: SignOptions = { expiresIn: '15m' };
  const refreshOptions: SignOptions = { expiresIn: '7d' };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, accessOptions);
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, refreshOptions);

  return { accessToken, refreshToken };
}

async function saveRefreshToken(userId: string, token: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      id: uuidv4(),
      userId,
      token,
      expiresAt,
    },
  });
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const { email, password } = input;

  if (!validateEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
    },
  });

  const tokens = generateTokens({ userId: user.id, email: user.email });
  await saveRefreshToken(user.id, tokens.refreshToken);

  logger.info(`User registered: ${user.id}`);

  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
    },
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isValidPassword = await comparePasswords(password, user.passwordHash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokens = generateTokens({ userId: user.id, email: user.email });
  await saveRefreshToken(user.id, tokens.refreshToken);

  logger.info(`User logged in: ${user.id}`);

  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
    },
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.accessSecret,
      { expiresIn: '15m' }
    );

    return { accessToken };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    throw error;
  }
}

export async function logout(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  } else {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
  logger.info(`User logged out: ${userId}`);
}

export async function getUserById(userId: string): Promise<{ id: string; email: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}