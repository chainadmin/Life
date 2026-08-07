import { NextFunction, Request, Response } from 'express'; import jwt from 'jsonwebtoken';
export type AuthRequest = Request & { userId?: string };
export function auth(req: AuthRequest, res: Response, next: NextFunction) { const token = req.headers.authorization?.replace('Bearer ', ''); if (!token) { res.status(401).json({ error: 'Please sign in.' }); return; } try { req.userId = (jwt.verify(token, process.env.JWT_SECRET || 'development-only') as { userId: string }).userId; next(); } catch { res.status(401).json({ error: 'Your session has expired. Please sign in again.' }); } }
