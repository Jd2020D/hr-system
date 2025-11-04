import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types';

export const generateTokens = (payload: Omit<JwtPayload, 'i'>): { accessToken: string; refreshToken: string } => {
  if (!env.JWT_SECRET || env.JWT_SECRET === '' || !env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET === '') {
    throw new Error('JWT secrets are not configured');
  }

  // Type assertion to handle StringValue type from jsonwebtoken
  const signOptions = {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions;

  const refreshSignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions;

  const accessToken = jwt.sign(payload, env.JWT_SECRET, signOptions);
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshSignOptions);

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  if (!env.JWT_SECRET || env.JWT_SECRET === '') {
    throw new Error('JWT secret is not configured');
  }
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  if (!env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET === '') {
    throw new Error('JWT refresh secret is not configured');
  }
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};

