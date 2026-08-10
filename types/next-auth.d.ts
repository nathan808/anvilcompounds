import "next-auth";
import "next-auth/jwt";

// Augments NextAuth's session/token shape with the fields lib/authOptions.ts
// attaches in its jwt/session callbacks — wcCustomerId + wpJwt are what let
// every existing /api/account/* route (which validates via lib/verifyJwt.ts
// against the WP JWT Auth plugin) keep working unchanged regardless of
// which provider the customer actually signed in with.
declare module "next-auth" {
  interface Session {
    user: {
      email: string;
      firstName: string;
      lastName: string;
      wcCustomerId: number;
      wpJwt: string;
      // True right after a brand-new Google sign-in (or an existing WC
      // customer found with no anvil_birthday on file) — no WP JWT exists
      // yet until DOB + RUO ack are captured via /api/auth/complete-profile.
      needsCompletion: boolean;
    };
  }

  interface User {
    wcCustomerId?: number;
    firstName?: string;
    lastName?: string;
    wpJwt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    wcCustomerId?: number;
    firstName?: string;
    lastName?: string;
    wpJwt?: string;
    needsCompletion?: boolean;
  }
}
