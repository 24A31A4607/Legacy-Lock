import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { ILegacyRepository } from './storage/repository.js';
import { User } from '../types/index.js';

const SESSION_SECRET = process.env.SESSION_SECRET || 'legacylock-prototype-secret-salt-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function generateSessionToken(userId: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `${userId}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  const token = Buffer.from(`${payload}:${signature}`).toString('base64');
  return token;
}

export function verifySessionToken(token: string): { userId: string } | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const parts = raw.split(':');
    if (parts.length !== 3) return null;
    const [userId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (Date.now() > expiresAt) return null;

    const payload = `${userId}:${expiresAtStr}`;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    if (expectedSig !== signature) return null;

    return { userId };
  } catch {
    return null;
  }
}

export function createAuthMiddleware(repository: ILegacyRepository) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.headers.cookie) {
      const match = req.headers.cookie.match(/legacylock_session=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const verification = verifySessionToken(token);
    if (!verification) {
      res.status(401).json({ error: 'Session expired or invalid' });
      return;
    }

    const user = await repository.getUserById(verification.userId);
    if (!user) {
      res.status(401).json({ error: 'User account not found' });
      return;
    }

    req.user = user;
    next();
  };
}

export function createOptionalAuthMiddleware(repository: ILegacyRepository) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.headers.cookie) {
      const match = req.headers.cookie.match(/legacylock_session=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (token) {
      const verification = verifySessionToken(token);
      if (verification) {
        const user = await repository.getUserById(verification.userId);
        if (user) {
          req.user = user;
        }
      }
    }

    next();
  };
}
