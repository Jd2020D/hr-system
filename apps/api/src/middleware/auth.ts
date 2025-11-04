import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth';
import { AuthenticatedRequest, Role } from '../types';
import { AppError } from '../utils/error';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'Forbidden: Insufficient permissions'));
    }

    next();
  };
};

// Middleware to check if user owns resource or is admin/hr
export const authorizeResource = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(401, 'Not authenticated'));
  }

  // Admin and HR can access anything
  if (['ADMIN', 'HR'].includes(req.user.role)) {
    return next();
  }

  // Manager can access their team's resources
  if (req.user.role === 'MANAGER') {
    // Will need to implement team check in controllers
    return next();
  }

  // Employee can only access their own resources
  if (req.user.employeeId) {
    return next();
  }

  next(new AppError(403, 'Forbidden'));
};

