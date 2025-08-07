// middleware/authenticate.ts
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { decode } from "node:punycode";
import { decodeJWT, verifyJWT } from "./utils/authUtils.ts";
import { verify } from "node:crypto";
import { ActorModel, AuthModel } from "./db/schema.ts";


export interface AuthenticatedRequest extends Request {
  user: { id: Types.ObjectId, name: string }
}

export function noop(req: Request, res: Response, next: NextFunction) {
  next();
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  if (!req.headers.authorization) {
    return res.status(401).json({ succes: false, message: "No token provided" })
  }
  const token = req.headers.authorization?.split(" ")[1]
  await verifyJWT(token)

  const payload = await decodeJWT(token)
  const auth = await AuthModel.findOne(
    { googleId: payload.sub }
  )
  if (!auth) {
    return res.status(401).json({ succes: false, message: "No auth found for provided token" })
  }
  const actor = await ActorModel.findById(auth?.actorRef._id);
  if (!actor) {
    return res.status(401).json({ succes: false, message: "No actor found for provided token" })
  }

  (req as AuthenticatedRequest).user = { id: new Types.ObjectId(actor._id), name: actor.name }
  next();
}

  // const authHeader = req.headers.authorization;
  // if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //   return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
  // }

  // const token = authHeader.split(' ')[1];
  // try {
  //   const payload = jwt.verify(token, JWT_SECRET) as { id: string };
  //   (req as AuthenticatedRequest).user = { id: new Types.ObjectId(payload.id) };
  //   next();
  // } catch (err) {
  //   return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid or expired token' });
  // }