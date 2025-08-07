import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "./env.ts";
import { Auth } from "../db/schema.ts";
import { decodeJwt } from "jose/jwt/decode";

const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export async function verifyJWT(token: string): Promise<void> {
  await jwtVerify(token, JWKS, {
    audience: env("CLIENT_ID"),
    issuer: "https://accounts.google.com",
  });
}

export async function decodeJWT(token: string) {
  return await decodeJwt(token);
}
