import bcrypt from 'bcryptjs';
import { config } from '../../../config';
import { ValidationError } from '../../../shared/errors';

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }
  return bcrypt.hash(password, config.bcrypt.saltRounds);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  return Boolean(password && password.length >= 8);
}