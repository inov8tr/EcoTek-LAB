const fallbackSecret = process.env.NODE_ENV === "production" ? undefined : "development-secret";

// Prefer AUTH_SECRET (NextAuth v5 default), then NEXTAUTH_SECRET for backwards compatibility.
export const AUTH_SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? fallbackSecret;
