import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// Extend the built-in types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log("=== SignIn Callback ===");
      console.log("User:", user);
      console.log("Account:", account);
      console.log("Profile:", profile);
      console.log("=====================");
      return true;
    },
    async jwt({ token, user, account }) {
      console.log("=== JWT Callback ===");
      console.log("Token:", token);
      console.log("User:", user);
      console.log("Account:", account);
      console.log("==================");

      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          userId: user.id,
        };
      }
      return token;
    },
    async session({ session, token, user }) {
      console.log("=== Session Callback ===");
      console.log("Session:", session);
      console.log("Token:", token);
      console.log("User:", user);
      console.log("=====================");

      if (session?.user) {
        session.user.id = token.userId;
        session.accessToken = token.accessToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("=== Redirect Callback ===");
      console.log("URL:", url);
      console.log("Base URL:", baseUrl);
      console.log("=====================");

      // Make sure to handle all possible redirect scenarios
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  debug: true,
  pages: {
    signIn: "/",
    error: "/login",
  },
  logger: {
    error(code, ...message) {
      console.error("NextAuth Error:", code, message);
    },
    warn(code, ...message) {
      console.warn("NextAuth Warning:", code, message);
    },
    debug(code, ...message) {
      console.log("NextAuth Debug:", code, message);
    },
  },
});

export { handler as GET, handler as POST }; 