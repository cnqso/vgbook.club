import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface UserTokenPayload {
  userId: number;
  clubId: number;
  username: string;
  isOwner: boolean;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return bcrypt.compareSync(password, hashedPassword);
}

export function generateToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserTokenPayload | null {
  try {
    console.log('Verifying token:', token.substring(0, 20) + '...', 'JWT_SECRET available:', !!JWT_SECRET);
    const result = jwt.verify(token, JWT_SECRET) as UserTokenPayload;
    console.log('Token verification successful for user:', result.username);
    return result;
  } catch (error) {
    console.log('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export function hashClubPasscode(passcode: string): string {
  return bcrypt.hashSync(passcode, 10);
}

export function verifyClubPasscode(passcode: string, hashedPasscode: string): boolean {
  return bcrypt.compareSync(passcode, hashedPasscode);
}
