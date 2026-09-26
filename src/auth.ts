import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { isAllowedEmail } from "@/lib/domain";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Email-провайдер требует адаптер для хранения VerificationToken и User,
  // но сами сессии входа ведём через JWT — так модель Session в схеме
  // (зарезервированная под Auth.js) остаётся служебной и не конфликтует
  // с бизнес-моделью SkillSession.
  session: { strategy: "jwt" },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/register",
    verifyRequest: "/check-email",
  },
  callbacks: {
    // Второй рубеж защиты после /api/register: даже если кто-то дёрнет
    // встроенный эндпоинт Auth.js напрямую, домен и согласие всё равно проверяются.
    async signIn({ user }) {
      if (!user.email || !isAllowedEmail(user.email)) return false;

      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      if (!dbUser) return false;
      if (dbUser.isBlocked) return false;
      if (!dbUser.consentAt) return false;

      return true;
    },
    async jwt({ token }) {
      if (token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.isBlocked = dbUser.isBlocked;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "STUDENT" | "ADMIN";
        session.user.isBlocked = token.isBlocked as boolean;
      }
      return session;
    },
  },
});
