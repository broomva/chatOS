import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";

export type AuthConfig = BetterAuthOptions;

export function createAuth(config: AuthConfig) {
  return betterAuth(config);
}

export type Auth = ReturnType<typeof createAuth>;

export { betterAuth };
