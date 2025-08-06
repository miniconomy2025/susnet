import { jwtVerify, createRemoteJWKSet } from "jose";
import { env } from "./env.ts";
import { Auth } from "../db/schema.ts";
import { decodeJwt } from "jose/jwt/decode";

const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export async function verifyJWT(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWKS, {
      audience: env('CLIENT_ID'),
      issuer: "https://accounts.google.com",
    })
    return true

  } catch (e) {
    console.error(e)
  }
  return false
}

export async function decodeJWT(token: string) {
  return await decodeJwt(token);
}