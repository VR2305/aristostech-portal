import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDB();

        try {
          const user = await User.findOne({ email: credentials.email });
          if (user) {
            const isPasswordCorrect = await bcrypt.compare(
              credentials.password,
              user.password
            );
            if (isPasswordCorrect) {
              return user;
            }
          }
        } catch (err) {
          throw new Error(err);
        }
      },
    }),
  ],
  // --- ADD THIS CALLBACKS SECTION ---
  callbacks: {
    async jwt({ token, user }) {
      // 1. When user first logs in, add role & other fields to the token
      if (user) {
        token.role = user.role;
        token.id = user._id;
        token.phone = user.mobile; // Passing mobile from DB to token
      }
      return token;
    },
    async session({ session, token }) {
      // 2. Pass those token fields to the client-side session
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.phone = token.phone;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };