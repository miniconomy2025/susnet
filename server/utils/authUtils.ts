import { jwtVerify, createRemoteJWKSet } from "jose";
import { env } from "./env.ts";

const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export async function decodeGoogleToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      audience: env('CLIENT_ID'),
      issuer: "https://accounts.google.com",
    })
    
  } catch (e) {
    console.error(e)
  }
}

async function createAccount(params:type) {
  
}